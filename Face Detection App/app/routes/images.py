from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import JSONResponse
from app.utils.security import get_current_user
import os
import uuid
from pathlib import Path

router = APIRouter()

# Directory to store uploaded images
UPLOAD_DIR = "static/uploads"
BACKEND_URL = "http://localhost:8000"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload")
async def upload_image(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    """
    Upload an image and return its URL (admin only)
    """
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Forbidden")

    # Validate file type
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are allowed")

    # Generate unique filename
    file_extension = file.filename.split(".")[-1]
    unique_filename = f"{uuid.uuid4()}.{file_extension}"
    file_path = Path(UPLOAD_DIR) / unique_filename

    # Save the file
    try:
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save image: {str(e)}")

    # Construct URL
    image_url = f"{BACKEND_URL}/{UPLOAD_DIR}/{unique_filename}"
    return JSONResponse(content={"image_url": image_url})