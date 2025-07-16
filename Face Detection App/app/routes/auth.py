import os
import uuid
from datetime import datetime, timedelta
from pathlib import Path
from typing import List

import cv2
from fastapi import (
    APIRouter,
    Depends,
    FastAPI,
    File,
    Form,
    HTTPException,
    UploadFile,
    status,
)
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from jose import JWTError, jwt

from app.db import get_database
from app.models import User
from app.schemas import Token, UserCreate, UserResponse
from app.utils.security import (
    create_access_token,
    get_password_hash,
    verify_password,
)
from app.utils.face_utils import encode_face
from app.config import settings

router = APIRouter()

# Configuration
SECRET_KEY = "your-secret-key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 600

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# Upload directory
UPLOAD_DIR = "uploads"
Path(UPLOAD_DIR).mkdir(exist_ok=True)


class LoginRequest(BaseModel):
    email: str
    password: str


import os
import pickle
from pathlib import Path

# Add this to your configuration
FACE_ENCODINGS_DIR = "face_encodings"
Path(FACE_ENCODINGS_DIR).mkdir(exist_ok=True)

@router.post("/register", response_model=UserResponse)
async def register(
    full_name: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    phone: str = Form(""),
    photos: List[UploadFile] = File([]),
):
    db = get_database()

    existing_user = await db["users"].find_one({"email": email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    if not photos:
        raise HTTPException(status_code=400, detail="At least one photo is required for face registration")

    photo_urls = []
    encoding_files = []  # To store paths to encoding files
    
    for photo in photos:
        try:
            # Save the photo
            timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
            ext = photo.filename.split(".")[-1]
            filename = f"{timestamp}_{uuid.uuid4().hex[:8]}.{ext}"
            filepath = os.path.join(UPLOAD_DIR, filename)

            with open(filepath, "wb") as buffer:
                buffer.write(await photo.read())

            photo_urls.append(f"/{UPLOAD_DIR}/{filename}")

            # Generate and save face encoding
            image = cv2.imread(filepath)
            if image is not None:
                encoding = encode_face(image, settings.detection_method)
                if encoding is not None:
                    # Create unique filename for the encoding
                    encoding_filename = f"{email}_{uuid.uuid4().hex[:8]}.pkl"
                    encoding_path = os.path.join(FACE_ENCODINGS_DIR, encoding_filename)
                    
                    # Save the encoding to a file
                    with open(encoding_path, 'wb') as f:
                        pickle.dump({
                            'encoding': encoding,
                            'name': full_name,
                            'email': email,
                            'photo_url': f"/{UPLOAD_DIR}/{filename}"
                        }, f)
                    
                    encoding_files.append(encoding_filename)
                else:
                    print(f"No face detected in photo: {photo.filename}")
            else:
                print(f"Failed to read image: {filepath}")

        except Exception as e:
            print(f"Failed to process photo: {e}")

    if not encoding_files:
        raise HTTPException(
            status_code=400, 
            detail="No faces detected in the provided photos. Please upload clear photos with visible faces."
        )

    hashed_password = get_password_hash(password)

    user_data = User(
        full_name=full_name,
        email=email,
        hashed_password=hashed_password,
        phone=phone,
        photo_urls=photo_urls,
        encoding_files=encoding_files,  # Store paths to encoding files
        role="user",
    )

    result = await db["users"].insert_one(user_data.dict(by_alias=True, exclude={"id"}))
    new_user = await db["users"].find_one({"_id": result.inserted_id})

    return UserResponse(id=str(new_user["_id"]), **new_user)


@router.post("/login", response_model=Token)
async def login(login_data: LoginRequest):
    db = get_database()
    user = await db["users"].find_one({"email": login_data.email})

    if not user or not verify_password(login_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["email"], "role": user.get("role", "user")},
        expires_delta=access_token_expires,
    )

    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/logout")
async def logout():
    return {"message": "Successfully logged out"}


async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    db = get_database()
    user = await db["users"].find_one({"email": email})
    if user is None:
        raise credentials_exception

    user["id"] = str(user["_id"])
    return UserResponse(**user)

@router.get("/me", response_model=UserResponse)
async def read_current_user(current_user: UserResponse = Depends(get_current_user)):
    return current_user
