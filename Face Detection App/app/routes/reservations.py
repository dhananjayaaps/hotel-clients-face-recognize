from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from datetime import datetime, timezone
from app.db import get_database
from app.utils.security import get_current_user
from bson import ObjectId
from typing import List

router = APIRouter()

class ReservationCreate(BaseModel):
    room_id: str
    check_in_date: datetime
    check_out_date: datetime

class ReservationResponse(BaseModel):
    id: str
    room_id: str
    check_in_date: datetime
    check_out_date: datetime
    user_id: str

@router.post("/", response_model=ReservationResponse)
async def create_reservation(
    reservation: ReservationCreate,
    current_user: dict = Depends(get_current_user)
):
    db = get_database()
    
    # Validate room_id
    if not ObjectId.is_valid(reservation.room_id):
        raise HTTPException(status_code=400, detail="Invalid room ID")
    
    # Check if room exists
    room = await db["rooms"].find_one({"_id": ObjectId(reservation.room_id)})
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    # Make both datetimes offset-aware or offset-naive consistently
    now = datetime.now(timezone.utc)  # Offset-aware
    check_in = reservation.check_in_date.replace(tzinfo=timezone.utc) if reservation.check_in_date.tzinfo is None else reservation.check_in_date
    check_out = reservation.check_out_date.replace(tzinfo=timezone.utc) if reservation.check_out_date.tzinfo is None else reservation.check_out_date
    
    # Validate dates
    if check_in >= check_out:
        raise HTTPException(status_code=400, detail="Check-out must be after check-in")
    
    if check_in < now:
        raise HTTPException(status_code=400, detail="Check-in date cannot be in the past")
    
    # Check for conflicting reservations (using the timezone-aware dates)
    existing_reservation = await db["reservations"].find_one({
        "room_id": reservation.room_id,
        "$or": [
            {
                "check_in_date": {"$lt": check_out},
                "check_out_date": {"$gt": check_in}
            }
        ]
    })
    
    if existing_reservation:
        raise HTTPException(
            status_code=409,
            detail="Room already booked for these dates"
        )
    
    # Create reservation (store with timezone info)
    reservation_data = {
        "room_id": reservation.room_id,
        "check_in_date": check_in,
        "check_out_date": check_out,
        "user_id": str(current_user["_id"]),
        "created_at": now
    }
    
    result = await db["reservations"].insert_one(reservation_data)
    created_reservation = await db["reservations"].find_one({"_id": result.inserted_id})
    
    return ReservationResponse(
        id=str(created_reservation["_id"]),
        room_id=created_reservation["room_id"],
        check_in_date=created_reservation["check_in_date"],
        check_out_date=created_reservation["check_out_date"],
        user_id=created_reservation["user_id"]
    )

@router.get("/", response_model=List[ReservationResponse])
async def get_user_reservations(current_user: dict = Depends(get_current_user)):
    db = get_database()
    reservations = []
    async for res in db["reservations"].find({"user_id": str(current_user["_id"])}):  # Match the stored string format
        reservations.append(ReservationResponse(
            id=str(res["_id"]),
            room_id=res["room_id"],
            check_in_date=res["check_in_date"],
            check_out_date=res["check_out_date"],
            user_id=res["user_id"]
        ))
    return reservations