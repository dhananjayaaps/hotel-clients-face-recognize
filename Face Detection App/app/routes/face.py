import numpy as np
import cv2
import time
from collections import defaultdict
from fastapi import WebSocket, APIRouter
from app.config import settings
from app.utils.face_utils import load_known_faces, process_frame
from app.db import get_database

router = APIRouter()

@router.websocket("")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    db = get_database()

    known_encs, known_names, known_emails = load_known_faces()
    close_counts = defaultdict(int)
    last_blink_time = {}

    try:
        while True:
            data = await websocket.receive_bytes()
            nparr = np.frombuffer(data, np.uint8)
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

            if frame is None:
                continue  # Skip invalid frame

            locs, fnames, ears, emails = process_frame(
                frame,
                known_encs,
                known_names,
                known_emails,
                settings.frame_scale,
                settings.detection_method,
                settings.recognition_threshold,
            )

            current_time = time.time()
            results = []

            for (t, r, b, l), name, ear, email in zip(locs, fnames, ears, emails):
                status = "Not Live"
                reservations = []

                if ear is not None and name != "Unknown":
                    if ear < settings.ear_threshold:
                        close_counts[name] += 1
                    else:
                        if close_counts[name] >= settings.consec_frames:
                            last_blink_time[name] = current_time
                        close_counts[name] = 0

                    if name in last_blink_time and (current_time - last_blink_time[name]) <= settings.blink_validity_time:
                        status = "Live"

                if email:
                    user = await db["users"].find_one({"email": email})
                    if user:
                        user_id = str(user["_id"])
                        async for res in db["reservations"].find({"user_id": user_id}):
                            reservations.append({
                                "id": str(res["_id"]),
                                "room_id": res["room_id"],
                                "check_in_date": res["check_in_date"].isoformat(),
                                "check_out_date": res["check_out_date"].isoformat(),
                                "status": res.get("status", "active")
                            })
                
                results.append({
                    "name": name,
                    "email": email,
                    "status": status,
                    "bbox": [int(l), int(t), int(r), int(b)],
                    "reservations": reservations
                })

            await websocket.send_json(results)

    except Exception as e:
        print(f"[WebSocket Error]: {e}")
    finally:
        await websocket.close()
