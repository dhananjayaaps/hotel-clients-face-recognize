import os
import cv2
import face_recognition
import numpy as np
from app.config import settings
import os
import pickle
from pathlib import Path

def load_known_faces():
    """Load known face encodings from .pkl files in the encodings directory."""
    known_encs = []
    known_names = []
    known_emails = []

    for filename in os.listdir(settings.FACE_ENCODINGS_DIR):
        if filename.endswith('.pkl'):
            try:
                with open(os.path.join(settings.FACE_ENCODINGS_DIR, filename), 'rb') as f:
                    data = pickle.load(f)
                    known_encs.append(data['encoding'])
                    known_names.append(data['name'])
                    known_emails.append(data.get('email', filename.replace('.pkl', '')))
            except Exception as e:
                print(f"Error loading {filename}: {e}")
    return known_encs, known_names, known_emails


def eye_aspect_ratio(eye):
    """Compute the eye aspect ratio (EAR) for liveness detection."""
    A = np.linalg.norm(np.array(eye[1]) - np.array(eye[5]))
    B = np.linalg.norm(np.array(eye[2]) - np.array(eye[4]))
    C = np.linalg.norm(np.array(eye[0]) - np.array(eye[3]))
    return (A + B) / (2.0 * C)


def process_frame(frame, known_encodings, known_names, known_emails, frame_scale, detection_method, recognition_threshold):
    """Detect faces, recognize them and compute EAR (eye aspect ratio)."""
    small = cv2.resize(frame, (0, 0), fx=frame_scale, fy=frame_scale)
    rgb_small = cv2.cvtColor(small, cv2.COLOR_BGR2RGB)

    locs_small = face_recognition.face_locations(rgb_small, model=detection_method)
    encs = face_recognition.face_encodings(rgb_small, known_face_locations=locs_small)
    landmarks_small = face_recognition.face_landmarks(rgb_small, locs_small)

    locs, names, emails, ears = [], [], [], []

    for i, (box, enc) in enumerate(zip(locs_small, encs)):
        t, r, b, l = [int(v / frame_scale) for v in box]
        locs.append((t, r, b, l))

        # Default
        name = "Unknown"
        email = None

        if known_encodings:
            dists = face_recognition.face_distance(known_encodings, enc)
            idx = np.argmin(dists)
            if dists[idx] < recognition_threshold:
                name = known_names[idx]
                email = known_emails[idx]

        names.append(name)
        emails.append(email)

        # EAR calculation
        ear = None
        if i < len(landmarks_small):
            lm = landmarks_small[i]
            if 'left_eye' in lm and 'right_eye' in lm:
                ear_left = eye_aspect_ratio(lm['left_eye'])
                ear_right = eye_aspect_ratio(lm['right_eye'])
                ear = (ear_left + ear_right) / 2.0
        ears.append(ear)

    return locs, names, ears, emails


def encode_face(image, detection_method="hog"):
    rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    
    boxes = face_recognition.face_locations(rgb, model=detection_method)
    
    if not boxes:
        return None
        
    encodings = face_recognition.face_encodings(rgb, boxes)
    
    if not encodings:
        return None
        
    return encodings[0]