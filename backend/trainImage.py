import os
import cv2
import numpy as np
import shutil 
from PIL import Image

def train_model():
    """Trains the LBPH model on the saved images and returns a status message."""
    trainimage_path = "TrainingImage"
    trainimagelabel_path = "TrainingImageLabel"
    os.makedirs(trainimagelabel_path, exist_ok=True)
    
    recognizer = cv2.face.LBPHFaceRecognizer_create()
    detector = cv2.CascadeClassifier("haarcascade_frontalface_default.xml")
    
    faces = []
    Ids = []
    
    # --- THE FIX: Use os.walk to dig into student subfolders ---
    for root, dirs, files in os.walk(trainimage_path):
        for file in files:
            if file.endswith('.jpg'):
                imagePath = os.path.join(root, file)
                pilImage = Image.open(imagePath).convert("L")
                imageNp = np.array(pilImage, "uint8")
                
                # Extract ID from the filename (Format: Name_ID_Count.jpg)
                try:
                    Id = int(file.split("_")[1])
                except ValueError:
                    continue # Skip if filename format is incorrect
                
                extracted_faces = detector.detectMultiScale(imageNp)
                for (x, y, w, h) in extracted_faces:
                    faces.append(imageNp[y:y+h, x:x+w])
                    Ids.append(Id)
                    
    if len(faces) == 0:
        return "No face data found to train! Make sure you enrolled a student first."

    # Train and Save
    recognizer.train(faces, np.array(Ids))
    recognizer.save(f"{trainimagelabel_path}/Trainner.yml")
   
    # Add these lines right before the final return statement:
    shutil.rmtree(trainimage_path) # Deletes the whole folder of heavy raw images
    os.makedirs(trainimage_path)   # Creates a fresh, empty folder for the next student
    return "Model Trained Successfully!"