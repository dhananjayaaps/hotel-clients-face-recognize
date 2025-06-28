from datetime import datetime
from pydantic import BaseModel, EmailStr

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: str | None = None

class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    full_name: str
    email: str

class RoomCreate(BaseModel):
    room_number: str
    room_type: str
    price_per_night: float
    capacity: int = 2
    amenities: list[str] = []
    image_url: str | None = None

class RoomResponse(RoomCreate):
    id: str
    status: str

class ReservationCreate(BaseModel):
    room_id: str
    check_in_date: datetime
    check_out_date: datetime
    total_amount: float

class ReservationResponse(BaseModel):
    id: str
    room: RoomResponse
    check_in_date: datetime
    check_out_date: datetime
    total_amount: float
    status: str