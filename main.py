import os
import sys
import time
import cv2
import numpy as np
import face_recognition
from collections import defaultdict

# (Optional) force UTF‑8 on Windows
if os.name == 'nt':
    sys.stdout.reconfigure(encoding='utf-8')

# Configuration
KNOWN_FACES_DIR       = "known_faces"
DETECTION_METHOD      = "hog"  # or "cnn" for GPU
FRAME_SCALE           = 0.25   # Scale for faster processing
RECOGNITION_THRESHOLD = 0.6
SHOW_FPS              = True
EAR_THRESHOLD         = 0.21    # Adjust based on testing
CONSEC_FRAMES         = 3       # Frames for blink detection
BLINK_VALIDITY_TIME   = 5.0     # Seconds a blink is considered valid

def eye_aspect_ratio(eye):
    A = np.linalg.norm(np.array(eye[1]) - np.array(eye[5]))
    B = np.linalg.norm(np.array(eye[2]) - np.array(eye[4]))
    C = np.linalg.norm(np.array(eye[0]) - np.array(eye[3]))
    return (A + B) / (2.0 * C)

def load_known_faces():
    known_encodings, known_names = [], []
    print("Loading known faces…")
    for person in os.listdir(KNOWN_FACES_DIR):
        pdir = os.path.join(KNOWN_FACES_DIR, person)
        if not os.path.isdir(pdir): continue
        for fn in os.listdir(pdir):
            path = os.path.join(pdir, fn)
            try:
                img = face_recognition.load_image_file(path)
                locs = face_recognition.face_locations(img, model=DETECTION_METHOD)
                if not locs:
                    print(f"[!] No face in {fn}")
                    continue
                enc = face_recognition.face_encodings(img, known_face_locations=locs)[0]
                known_encodings.append(enc)
                known_names.append(person)
                print(f"[+] Loaded {person}/{fn}")
            except Exception as e:
                print(f"[!] Skipped {fn}: {e}")
    print(f"\n[OK] {len(known_names)} face(s) from {len(set(known_names))} person(s)")
    return known_encodings, known_names

def init_camera(src=0):
    cap = cv2.VideoCapture(src)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
    cap.set(cv2.CAP_PROP_FPS, 30)
    cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
    if not cap.isOpened():
        raise IOError("❌ Cannot open webcam")
    print("[OK] Camera initialized")
    return cap

def process_frame(frame, known_encodings, known_names):
    small = cv2.resize(frame, (0,0), fx=FRAME_SCALE, fy=FRAME_SCALE)
    rgb_small = cv2.cvtColor(small, cv2.COLOR_BGR2RGB)
    
    # Detect faces and landmarks on the downscaled image
    locs_small = face_recognition.face_locations(rgb_small, model=DETECTION_METHOD)
    landmarks_small = face_recognition.face_landmarks(rgb_small, locs_small)
    
    # Scale up face locations and landmarks
    locs, landmarks = [], []
    for (t, r, b, l), lm in zip(locs_small, landmarks_small):
        t = int(t / FRAME_SCALE)
        r = int(r / FRAME_SCALE)
        b = int(b / FRAME_SCALE)
        l = int(l / FRAME_SCALE)
        locs.append((t, r, b, l))
        
        scaled_lm = {}
        for key, points in lm.items():
            scaled_points = [(int(x / FRAME_SCALE), int(y / FRAME_SCALE)) for (x, y) in points]
            scaled_lm[key] = scaled_points
        landmarks.append(scaled_lm)
    
    # Get encodings using original frame and scaled locations
    encs = face_recognition.face_encodings(frame, known_face_locations=locs)
    names, ears = [], []
    
    for i, enc in enumerate(encs):
        # Recognition
        if known_encodings:
            dists = face_recognition.face_distance(known_encodings, enc)
            idx = np.argmin(dists)
            name = known_names[idx] if dists[idx] < RECOGNITION_THRESHOLD else "Unknown"
        else:
            name = "Unknown"
        names.append(name)
        
        # Liveness detection
        ear = None
        if i < len(landmarks):
            lm = landmarks[i]
            if 'left_eye' in lm and 'right_eye' in lm:
                ear_left = eye_aspect_ratio(lm['left_eye'])
                ear_right = eye_aspect_ratio(lm['right_eye'])
                ear = (ear_left + ear_right) / 2.0
        ears.append(ear)
    
    return locs, names, ears

def main_loop(encs, names_list):
    cap = init_camera()
    prev_time = time.time()
    close_counts = defaultdict(int)
    last_blink_time = {}  # Track last blink time per person

    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                print("❌ Frame capture failed")
                break

            current_time = time.time()
            locs, fnames, ears = process_frame(frame, encs, names_list)
            
            for (t, r, b, l), name, ear in zip(locs, fnames, ears):
                # Update blink counters
                if ear is not None and name != "Unknown":
                    if ear < EAR_THRESHOLD:
                        close_counts[name] += 1
                    else:
                        if close_counts[name] >= CONSEC_FRAMES:
                            last_blink_time[name] = current_time  # Record blink time
                        close_counts[name] = 0  # Reset counter

                # Determine liveness status
                if name in last_blink_time and (current_time - last_blink_time[name]) <= BLINK_VALIDITY_TIME:
                    status = "Live"
                else:
                    status = "Not Live"
                
                # Draw bounding box and label
                label = f"{name} ({status})"
                cv2.rectangle(frame, (l, t), (r, b), (0, 255, 0), 2)
                cv2.putText(frame, label, (l, b - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)

            # Show FPS
            if SHOW_FPS:
                fps = 1 / (current_time - prev_time)
                prev_time = current_time
                cv2.putText(frame, f"FPS: {fps:.1f}", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)

            cv2.imshow("Real-Time Face Recognition + Liveness", frame)
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

    except KeyboardInterrupt:
        pass
    finally:
        cap.release()
        cv2.destroyAllWindows()
        print("[OK] Camera released")

if __name__ == "__main__":
    known_encs, known_names = load_known_faces()
    main_loop(known_encs, known_names)