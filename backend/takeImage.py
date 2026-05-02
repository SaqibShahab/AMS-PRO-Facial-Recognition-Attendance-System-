import cv2
import os
import urllib.parse
import cloudinary
import cloudinary.uploader
from pymongo import MongoClient
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# --- CLOUD CONFIGURATION ---
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"), 
    api_key=os.getenv("CLOUDINARY_API_KEY"), 
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True
)

db_password = os.getenv("MONGO_PASSWORD")
username = urllib.parse.quote_plus("app")
password = urllib.parse.quote_plus(db_password) 
MONGO_URI = f"mongodb+srv://{username}:{password}@cluster0.avtmm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"

client = MongoClient(MONGO_URI)
db = client["ams_pro_database"]
students_collection = db["students"]

def save_frame(img, enrollment, name, subject, count):
    """Saves face frames locally for training, uploads first frame to Cloudinary, and logs to MongoDB."""
    trainimage_path = "TrainingImage"
    haarcasecade_path = "haarcascade_frontalface_default.xml"
    detector = cv2.CascadeClassifier(haarcasecade_path)
    
    directory = f"{enrollment}_{name}"
    path = os.path.join(trainimage_path, directory)
    os.makedirs(path, exist_ok=True)

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    faces = detector.detectMultiScale(gray, 1.3, 5)
    
    face_saved = False
    img_path = ""
    
    for (x, y, w, h) in faces:
        img_path = os.path.join(path, f"{name}_{enrollment}_{count}.jpg")
        cv2.imwrite(img_path, gray[y:y+h, x:x+w])
        face_saved = True

    # On the very first successful frame, push to Cloudinary and MongoDB
    if count == 1 and face_saved:
        existing_student = students_collection.find_one({"enrollment": str(enrollment), "subject": subject.upper()})
        
        if not existing_student:
            print("Uploading profile photo to Cloudinary...")
            upload_result = cloudinary.uploader.upload(img_path, folder=f"AMS_Profiles/{subject}")
            profile_pic_url = upload_result["secure_url"]
            
            print("Saving to MongoDB...")
            students_collection.insert_one({
                "enrollment": str(enrollment),
                "name": name,
                "subject": subject.upper(),
                "profile_picture": profile_pic_url
            })
            
    return face_saved