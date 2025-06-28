import os
import cv2
import face_recognition
import numpy as np
from app.config import settings

def load_known_faces(known_faces_dir: str, detection_method: str):
    known_encodings, known_names = [], []
    for person in os.listdir(known_faces_dir):
        pdir = os.path.join(known_faces_dir, person)
        if not os.path.isdir(pdir): 
            continue
            
        for fn in os.listdir(pdir):
            path = os.path.join(pdir, fn)
            try:
                img = face_recognition.load_image_file(path)
                locs = face_recognition.face_locations(img, model=detection_method)
                if not locs:
                    continue
                enc = face_recognition.face_encodings(img, known_face_locations=locs)[0]
                known_encodings.append(enc)
                known_names.append(person)
            except Exception as e:
                print(f"Error processing {path}: {e}")
                continue
    return known_encodings, known_names

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