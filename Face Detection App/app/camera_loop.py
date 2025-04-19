import cv2
import time
from collections import defaultdict
from app.face_logic import load_known_faces, process_frame
from config import *

def run_camera():
    cap = cv2.VideoCapture(0)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)

    encs, names_list = load_known_faces()
    prev_time = time.time()
    close_counts = defaultdict(int)
    last_blink_time = {}

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        current_time = time.time()
        locs, fnames, ears = process_frame(frame, encs, names_list)

        for (t, r, b, l), name, ear in zip(locs, fnames, ears):
            if ear is not None and name != "Unknown":
                if ear < EAR_THRESHOLD:
                    close_counts[name] += 1
                else:
                    if close_counts[name] >= CONSEC_FRAMES:
                        last_blink_time[name] = current_time
                    close_counts[name] = 0

            status = "Live" if name in last_blink_time and (current_time - last_blink_time[name]) <= BLINK_VALIDITY_TIME else "Not Live"
            label = f"{name} ({status})"
            cv2.rectangle(frame, (l, t), (r, b), (0, 255, 0), 2)
            cv2.putText(frame, label, (l, b - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)

        if SHOW_FPS:
            fps = 1 / (current_time - prev_time)
            prev_time = current_time
            cv2.putText(frame, f"FPS: {fps:.1f}", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)

        cv2.imshow("Face Recognition + Liveness", frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()
