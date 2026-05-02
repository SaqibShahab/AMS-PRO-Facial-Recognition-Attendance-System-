import cv2
import os
import urllib.parse
from datetime import datetime
from pymongo import MongoClient
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# --- MONGODB CLOUD SETUP ---
db_password = os.getenv("MONGO_PASSWORD")
username = urllib.parse.quote_plus("app")
password = urllib.parse.quote_plus(db_password) 
MONGO_URI = f"mongodb+srv://{username}:{password}@cluster0.avtmm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"

client = MongoClient(MONGO_URI)
db = client["ams_pro_database"]
students_col = db["students"]
attendance_col = db["attendance"]

def process_web_attendance(img, subject):
    haarcasecade_path = "haarcascade_frontalface_default.xml"
    trainimagelabel_path = "TrainingImageLabel/Trainner.yml"

    if not os.path.exists(trainimagelabel_path): 
        return "Error: AI Model not found. Please train the model first."

    recognizer = cv2.face.LBPHFaceRecognizer_create()
    recognizer.read(trainimagelabel_path)
    faceCascade = cv2.CascadeClassifier(haarcasecade_path)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    faces = faceCascade.detectMultiScale(gray, 1.2, 5)

    if len(faces) == 0: 
        return "No face detected. Please adjust lighting."

    for (x, y, w, h) in faces:
        Id, conf = recognizer.predict(gray[y:y+h, x:x+w])
        
        if conf < 70:
            clean_id = str(Id).strip()
            clean_subject = str(subject).strip().upper()
            
            # Fetch student from MongoDB
            student = students_col.find_one({"enrollment": clean_id, "subject": clean_subject})
            name = student["name"] if student else "Unknown"
                
            date = datetime.now().strftime("%Y-%m-%d")
            time_str = datetime.now().strftime("%H-%M-%S")
            
            # Check for duplicates
            already_marked = attendance_col.find_one({
                "enrollment": clean_id, 
                "subject": clean_subject, 
                "date": date
            })
            
            if already_marked:
                return f"Already Marked: {name} (ID: {clean_id}) is already present today!"
            
            # Log new attendance
            attendance_col.insert_one({
                "enrollment": clean_id,
                "name": name,
                "subject": clean_subject,
                "date": date,
                "time": time_str
            })
                
            return f"Success! {name} marked present."
            
    return "Face not recognized. Please try again."