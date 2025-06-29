import os
import uuid
from datetime import datetime, timedelta
from pathlib import Path
from typing import List

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

router = APIRouter()

# Configuration
SECRET_KEY = "your-secret-key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# Upload directory
UPLOAD_DIR = "uploads"
Path(UPLOAD_DIR).mkdir(exist_ok=True)


class LoginRequest(BaseModel):
    email: str
    password: str


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

    photo_urls = []
    for photo in photos:
        try:
            timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
            ext = photo.filename.split(".")[-1]
            filename = f"{timestamp}_{uuid.uuid4().hex[:8]}.{ext}"
            filepath = os.path.join(UPLOAD_DIR, filename)

            with open(filepath, "wb") as buffer:
                buffer.write(await photo.read())

            photo_urls.append(f"/{UPLOAD_DIR}/{filename}")
        except Exception as e:
            print(f"Failed to upload photo: {e}")

    hashed_password = get_password_hash(password)

    user_data = User(
        full_name=full_name,
        email=email,
        hashed_password=hashed_password,
        phone=phone,
        photo_urls=photo_urls,
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
