import os
import sys
import time
import cv2
import numpy as np
import face_recognition

# (Optional) force UTF‑8 on Windows
if os.name == 'nt':
    sys.stdout.reconfigure(encoding='utf-8')

# Configuration
KNOWN_FACES_DIR       = "known_faces"
DETECTION_METHOD      = "hog"
FRAME_SCALE           = 0.25
RECOGNITION_THRESHOLD = 0.6
SHOW_FPS              = True

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
    print("[OK] Camera initialized successfully")
    return cap

def process_frame(frame, known_encodings, known_names):
    small = cv2.resize(frame, (0,0), fx=FRAME_SCALE, fy=FRAME_SCALE)
    rgb   = cv2.cvtColor(small, cv2.COLOR_BGR2RGB)
    locs  = face_recognition.face_locations(rgb, model=DETECTION_METHOD)
    # scale back up
    locs = [(int(t/FRAME_SCALE), int(r/FRAME_SCALE),
             int(b/FRAME_SCALE), int(l/FRAME_SCALE)) for t,r,b,l in locs]
    encs = face_recognition.face_encodings(frame, known_face_locations=locs)
    names = []
    for e in encs:
        if known_encodings:
            dists = face_recognition.face_distance(known_encodings, e)
            idx   = np.argmin(dists)
            name  = known_names[idx] if dists[idx] < RECOGNITION_THRESHOLD else "Unknown"
        else:
            name = "Unknown"
        names.append(name)
    return locs, names

def main_loop(encs, names):
    cap = init_camera()
    prev = time.time()
    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                print("❌ Frame capture failed")
                break
            locs, fnames = process_frame(frame, encs, names)
            for (t,r,b,l), n in zip(locs, fnames):
                cv2.rectangle(frame, (l,t), (r,b), (0,255,0), 2)
                cv2.putText(frame, n, (l,b-10),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255,255,255), 2)
            if SHOW_FPS:
                now = time.time()
                fps = 1/(now-prev)
                prev = now
                cv2.putText(frame, f"FPS: {fps:.1f}", (10,30),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0,255,0), 2)
            cv2.imshow("Real‑Time Face Recognition", frame)
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
