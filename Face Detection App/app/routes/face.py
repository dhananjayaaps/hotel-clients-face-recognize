import numpy as np
import cv2
import time
from collections import defaultdict
from fastapi import WebSocket, APIRouter
from app.config import settings
from app.utils.face_utils import load_known_faces, process_frame, eye_aspect_ratio

router = APIRouter()
known_encs, known_names = [], []

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    global known_encs, known_names
    
    if not known_encs:
        known_encs, known_names = load_known_faces(
            settings.known_faces_dir,
            settings.detection_method
        )
    
    close_counts = defaultdict(int)
    last_blink_time = {}
    
    while True:
        try:
            data = await websocket.receive_bytes()
            nparr = np.frombuffer(data, np.uint8)
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            locs, fnames, ears = process_frame(
                frame, 
                known_encs, 
                known_names,
                settings.frame_scale,
                settings.detection_method,
                settings.recognition_threshold
            )
            
            current_time = time.time()
            results = []
            
            for (t, r, b, l), name, ear in zip(locs, fnames, ears):
                if ear is not None and name != "Unknown":
                    if ear < settings.ear_threshold:
                        close_counts[name] += 1
                    else:
                        if close_counts[name] >= settings.consec_frames:
                            last_blink_time[name] = current_time
                        close_counts[name] = 0

                status = "Live" if name in last_blink_time and (
                    current_time - last_blink_time[name]) <= settings.blink_validity_time else "Not Live"
                
                results.append({
                    "name": name,
                    "status": status,
                    "bbox": [int(l), int(t), int(r), int(b)]
                })
            
            await websocket.send_json(results)
        except Exception as e:
            print(f"[WebSocket Error]: {e}")
            break
    await websocket.close()