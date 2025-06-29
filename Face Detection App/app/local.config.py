from pydantic import BaseSettings

class Settings(BaseSettings):
    mongo_uri: str = "mongodb://localhost:27017"
    mongo_db_name: str = "hotel_db"
    secret_key: str = "your-secret-key"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # Face recognition settings
    known_faces_dir: str = "known_faces"
    detection_method: str = "hog"
    frame_scale: float = 0.25
    recognition_threshold: float = 0.6
    ear_threshold: float = 0.3
    consec_frames: int = 2
    blink_validity_time: float = 8.0
    show_fps: bool = True
    
    class Config:
        env_file = ".env"

settings = Settings()

KNOWN_FACES_DIR = "known_faces"
DETECTION_METHOD = "hog"
FRAME_SCALE = 0.25
RECOGNITION_THRESHOLD = 0.6
EAR_THRESHOLD = 0.3
CONSEC_FRAMES = 2
BLINK_VALIDITY_TIME = 8.0
SHOW_FPS = True
