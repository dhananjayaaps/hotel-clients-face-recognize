from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from bson import ObjectId

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

    @classmethod
    def __modify_schema__(cls, field_schema):
        field_schema.update(type="string")

class Room(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id")
    room_number: str
    room_type: str
    price_per_night: float
    status: str = "available"
    capacity: int = 2
    amenities: list[str] = []
    image_url: Optional[str] = None

    class Config:
        json_encoders = {ObjectId: str}
        populate_by_name = True

class Reservation(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id")
    room_id: PyObjectId
    guest_id: PyObjectId
    check_in_date: datetime
    check_out_date: datetime
    status: str = "confirmed"  # confirmed, checked-in, checked-out, cancelled

    class Config:
        json_encoders = {ObjectId: str}
        populate_by_name = True

class User(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id")
    full_name: str
    email: str
    hashed_password: str
    role: str = "user"  # user or admin

    class Config:
        json_encoders = {ObjectId: str}
        populate_by_name = True