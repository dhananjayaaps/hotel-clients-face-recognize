from fastapi import APIRouter, HTTPException, status, Depends
from app.schemas import UserCreate, Token, UserResponse
from app.models import User
from app.utils.security import get_password_hash, create_access_token, verify_password
from datetime import timedelta
from app.db import get_database
from pydantic import BaseModel

router = APIRouter()

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/register", response_model=UserResponse)
async def register(user: UserCreate):
    db = get_database()
    existing_user = await db["users"].find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user.password)
    user_data = User(
        full_name=user.full_name,
        email=user.email,
        hashed_password=hashed_password
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
    
    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": user["email"]}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}