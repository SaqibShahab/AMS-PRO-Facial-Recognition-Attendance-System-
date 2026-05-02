from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
import numpy as np
import cv2
import os
import urllib.parse
from datetime import datetime
from pymongo import MongoClient
from dotenv import load_dotenv

import automaticAttedance 
import takeImage
import trainImage

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
CORS(app) 

# --- MONGODB CLOUD SETUP ---
db_password = os.getenv("MONGO_PASSWORD")
username = urllib.parse.quote_plus("app")
password = urllib.parse.quote_plus(db_password) 
MONGO_URI = f"mongodb+srv://{username}:{password}@cluster0.avtmm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"

client = MongoClient(MONGO_URI)
db = client["ams_pro_database"]
students_col = db["students"]
subjects_col = db["subjects"]
attendance_col = db["attendance"]

# Ensure training folders exist
for folder in ["TrainingImage", "TrainingImageLabel"]:
    os.makedirs(folder, exist_ok=True)

# Ensure at least one subject exists
if subjects_col.count_documents({}) == 0:
    subjects_col.insert_one({"name": "ENGLISH"})

def decode_image(image_data):
    try:
        if not image_data or ',' not in image_data: return None
        encoded_data = image_data.split(',')[1]
        nparr = np.frombuffer(base64.b64decode(encoded_data), np.uint8)
        return cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    except Exception:
        return None

@app.route('/verify', methods=['POST'])
def verify():
    data = request.json
    if not data.get('subject') or not data.get('image'): return jsonify({"message": "Missing data"}), 400
    img = decode_image(data['image'])
    if img is None: return jsonify({"message": "Invalid image received."}), 400
    result = automaticAttedance.process_web_attendance(img, data['subject'])
    return jsonify({"message": result})

@app.route('/register_frame', methods=['POST'])
def register_frame():
    data = request.json
    img = decode_image(data['image'])
    if img is None: return jsonify({"message": "Invalid image"}), 400
    
    # Strip sneaky spaces from inputs
    clean_enrollment = str(data['enrollment']).strip()
    clean_name = str(data['name']).strip()
    clean_subject = str(data.get('subject', 'N/A')).strip().upper()
    
    face_saved = takeImage.save_frame(img, clean_enrollment, clean_name, clean_subject, data['frameCount'])
    
    if face_saved: return jsonify({"message": "Frame captured!"})
    else: return jsonify({"message": "No face found in frame."}), 400

@app.route('/train', methods=['POST'])
def train():
    result = trainImage.train_model()
    return jsonify({"message": result})

@app.route('/api/subjects', methods=['GET'])
def get_subjects():
    return jsonify([sub["name"] for sub in subjects_col.find()])

@app.route('/api/subjects', methods=['POST'])
def add_subject():
    new_sub = request.json.get('subject', '').strip().upper()
    if not new_sub: return jsonify({"message": "Invalid subject"}), 400
    if subjects_col.find_one({"name": new_sub}): return jsonify({"message": f"{new_sub} already exists!"}), 400
    subjects_col.insert_one({"name": new_sub})
    return jsonify({"message": f"Subject {new_sub} created!"})

@app.route('/api/students/<subject>', methods=['GET'])
def get_students_by_subject(subject):
    students = list(students_col.find({"subject": subject.strip().upper()}))
    formatted_students = [{"Enrollment": str(s["enrollment"]).strip(), "Name": s["name"], "Subject": s["subject"], "ProfilePic": s.get("profile_picture", "")} for s in students]
    return jsonify(formatted_students)

@app.route('/api/attendance/<subject>', methods=['GET'])
def get_attendance(subject):
    date = datetime.now().strftime("%Y-%m-%d")
    records = list(attendance_col.find({"subject": subject.strip().upper(), "date": date}))
    present_ids = [str(r["enrollment"]).strip() for r in records]
    return jsonify(present_ids)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)