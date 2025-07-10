import os
import cv2
import face_recognition
import numpy as np
from app.config import settings
import os
import pickle
from pathlib import Path

def load_known_faces():
    """Load known faces from encodings directory"""
    known_encs = []
    known_names = []
    
    for filename in os.listdir(settings.FACE_ENCODINGS_DIR):
        if filename.endswith('.pkl'):
            try:
                with open(os.path.join(settings.FACE_ENCODINGS_DIR, filename), 'rb') as f:
                    data = pickle.load(f)
                    known_encs.append(data['encoding'])
                    known_names.append(data['name'])
            except Exception as e:
                print(f"Error loading encoding file {filename}: {e}")
                continue
                
    return known_encs, known_names

def process_frame(
    frame, 
    known_encodings, 
    known_names, 
    frame_scale: float,
    detection_method: str,
    recognition_threshold: float
):
    small = cv2.resize(frame, (0, 0), fx=frame_scale, fy=frame_scale)
    rgb_small = cv2.cvtColor(small, cv2.COLOR_BGR2RGB)
    
    locs_small = face_recognition.face_locations(rgb_small, model=detection_method)
    landmarks_small = face_recognition.face_landmarks(rgb_small, locs_small)
    
    locs, landmarks = [], []
    for (t, r, b, l), lm in zip(locs_small, landmarks_small or []):
        t, r, b, l = [int(v / frame_scale) for v in (t, r, b, l)]
        locs.append((t, r, b, l))
        scaled_lm = {
            k: [(int(x / frame_scale), int(y / frame_scale)) for (x, y) in pts]
            for k, pts in lm.items()
        }
        landmarks.append(scaled_lm)

    encs = face_recognition.face_encodings(frame, known_face_locations=locs)
    names, ears = [], []
    
    for i, enc in enumerate(encs):
        name = "Unknown"
        if known_encodings:
            dists = face_recognition.face_distance(known_encodings, enc)
            idx = np.argmin(dists)
            if dists[idx] < recognition_threshold:
                name = known_names[idx]
        names.append(name)

        ear = None
        if i < len(landmarks) and landmarks[i]:
            lm = landmarks[i]
            if 'left_eye' in lm and 'right_eye' in lm:
                ear_left = eye_aspect_ratio(lm['left_eye'])
                ear_right = eye_aspect_ratio(lm['right_eye'])
                ear = (ear_left + ear_right) / 2.0
        ears.append(ear)
    
    return locs, names, ears

def eye_aspect_ratio(eye):
    A = np.linalg.norm(np.array(eye[1]) - np.array(eye[5]))
    B = np.linalg.norm(np.array(eye[2]) - np.array(eye[4]))
    C = np.linalg.norm(np.array(eye[0]) - np.array(eye[3]))
    return (A + B) / (2.0 * C)

def encode_face(image, detection_method="hog"):
    # Convert image from BGR to RGB (OpenCV uses BGR by default)
    rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    
    # Detect face locations
    boxes = face_recognition.face_locations(rgb, model=detection_method)
    
    # If no faces found, return None
    if not boxes:
        return None
        
    # Get face encodings for the first face found
    encodings = face_recognition.face_encodings(rgb, boxes)
    
    if not encodings:
        return None
        
    return encodings[0]  # Return the first face encoding