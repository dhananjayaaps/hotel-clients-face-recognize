import cv2
import face_recognition
from app.utils import eye_aspect_ratio
from config import *

def load_known_faces():
    import os
    known_encodings, known_names = [], []
    for person in os.listdir(KNOWN_FACES_DIR):
        pdir = os.path.join(KNOWN_FACES_DIR, person)
        if not os.path.isdir(pdir): continue
        for fn in os.listdir(pdir):
            path = os.path.join(pdir, fn)
            try:
                img = face_recognition.load_image_file(path)
                locs = face_recognition.face_locations(img, model=DETECTION_METHOD)
                if not locs:
                    continue
                enc = face_recognition.face_encodings(img, known_face_locations=locs)[0]
                known_encodings.append(enc)
                known_names.append(person)
            except:
                continue
    return known_encodings, known_names

def process_frame(frame, known_encodings, known_names):
    small = cv2.resize(frame, (0,0), fx=FRAME_SCALE, fy=FRAME_SCALE)
    rgb_small = cv2.cvtColor(small, cv2.COLOR_BGR2RGB)
    
    locs_small = face_recognition.face_locations(rgb_small, model=DETECTION_METHOD)
    landmarks_small = face_recognition.face_landmarks(rgb_small, locs_small)
    
    locs, landmarks = [], []
    for (t, r, b, l), lm in zip(locs_small, landmarks_small):
        t, r, b, l = [int(v / FRAME_SCALE) for v in (t, r, b, l)]
        locs.append((t, r, b, l))
        scaled_lm = {
            k: [(int(x / FRAME_SCALE), int(y / FRAME_SCALE)) for (x, y) in pts]
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
            if dists[idx] < RECOGNITION_THRESHOLD:
                name = known_names[idx]
        names.append(name)

        ear = None
        if i < len(landmarks):
            lm = landmarks[i]
            if 'left_eye' in lm and 'right_eye' in lm:
                ear_left = eye_aspect_ratio(lm['left_eye'])
                ear_right = eye_aspect_ratio(lm['right_eye'])
                ear = (ear_left + ear_right) / 2.0
        ears.append(ear)
    
    return locs, names, ears
