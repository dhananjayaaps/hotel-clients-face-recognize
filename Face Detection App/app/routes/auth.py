from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordRequestForm
from app.schemas import UserCreate, Token, UserResponse
from app.models import User
from app.utils.security import get_password_hash, create_access_token, verify_password
from datetime import timedelta
from app.db import get_database
from bson import ObjectId

router = APIRouter()

from fastapi import UploadFile, File, Form
from typing import List, Optional

import os
from fastapi import UploadFile, File, Form
from typing import List
from datetime import datetime
from pathlib import Path

# Configure upload directory (create if doesn't exist)
UPLOAD_DIR = "uploads"
Path(UPLOAD_DIR).mkdir(exist_ok=True)

@router.post("/register", response_model=UserResponse)
async def register(
    full_name: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    phone: str = Form(""),
    photos: List[UploadFile] = File([])
):
    db = get_database()

    
    # Check if user exists
    existing_user = await db["users"].find_one({"email": email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Process and save photos
    photo_urls = []
    for photo in photos:
        try:
            # Generate unique filename
            timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
            file_ext = photo.filename.split(".")[-1]
            filename = f"{timestamp}_{uuid.uuid4().hex[:8]}.{file_ext}"
            file_path = os.path.join(UPLOAD_DIR, filename)
            
            # Save file
            with open(file_path, "wb") as buffer:
                buffer.write(await photo.read())
            
            # Store relative URL (you might want to use absolute URLs in production)
            photo_urls.append(f"/{UPLOAD_DIR}/{filename}")
        except Exception as e:
            # Skip failed uploads but continue with registration
            print(f"Failed to upload photo: {e}")
            continue
    
    # Create user
    hashed_password = get_password_hash(password)
    user_data = User(
        full_name=full_name,
        email=email,
        hashed_password=hashed_password,
        phone=phone,
        photo_urls=photo_urls,
        role="user"
    )
    
    result = await db["users"].insert_one(user_data.dict(by_alias=True, exclude={"id"}))
    new_user = await db["users"].find_one({"_id": result.inserted_id})
    return UserResponse(id=str(new_user["_id"]), **new_user)

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    db = get_database()
    user = await db["users"].find_one({"email": form_data.username})
    
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": user["email"], "role": user.get("role", "user")},
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/logout")
async def logout():
    # In a real app, you might invalidate the token here
    return {"message": "Successfully logged out"}