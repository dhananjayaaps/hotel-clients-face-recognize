from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from datetime import datetime
from app.db import get_database
from app.utils.security import get_current_user
from bson import ObjectId
from fastapi.responses import JSONResponse
from typing import List

router = APIRouter()

class ReservationCreate(BaseModel):
    room_id: str
    check_in_date: str
    check_out_date: str
    user_id: str

class ReservationResponse(BaseModel):
    id: str
    room_id: str
    check_in_date: str
    check_out_date: str
    user_id: str

@router.post("/", response_model=ReservationResponse)
async def create_reservation(reservation: ReservationCreate):
    """
    Create a new reservation
    """
    
    db = get_database()
    
    # Validate room_id
    if not ObjectId.is_valid(reservation.room_id):
        raise HTTPException(status_code=400, detail="Invalid room ID")
    
    # Check if room exists and is available
    room = await db["rooms"].find_one({"_id": ObjectId(reservation.room_id)})
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    if room["status"] != "available":
        raise HTTPException(status_code=400, detail="Room is not available")
    
    # Parse dates
    try:
        check_in = datetime.fromisoformat(reservation.check_in_date.replace('Z', '+00:00'))
        check_out = datetime.fromisoformat(reservation.check_out_date.replace('Z', '+00:00'))
        if check_in >= check_out:
            raise ValueError("Check-out date must be after check-in date")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    # Check for conflicting reservations
    existing_reservation = await db["reservations"].find_one({
        "room_id": reservation.room_id,
        "$or": [
            {"check_in_date": {"$lte": reservation.check_out_date}, "check_out_date": {"$gte": reservation.check_in_date}},
        ]
    })
    if existing_reservation:
        raise HTTPException(status_code=400, detail="Room is already reserved for the selected dates")
    
    # Create reservation
    reservation_data = {
        "room_id": reservation.room_id,
        "check_in_date": reservation.check_in_date,
        "check_out_date": reservation.check_out_date,
        "user_id": reservation.user_id,
        "created_at": datetime.utcnow().isoformat()
    }
    result = await db["reservations"].insert_one(reservation_data)
    
    # Update room status to occupied
    await db["rooms"].update_one(
        {"_id": ObjectId(reservation.room_id)},
        {"$set": {"status": "occupied"}}
    )
    
    # Return created reservation
    created_reservation = await db["reservations"].find_one({"_id": result.inserted_id})
    return ReservationResponse(
        id=str(created_reservation["_id"]),
        room_id=created_reservation["room_id"],
        check_in_date=created_reservation["check_in_date"],
        check_out_date=created_reservation["check_out_date"],
        user_id=created_reservation["user_id"]
    )

@router.get("/", response_model=List[ReservationResponse])
async def get_user_reservations(user_id: str, current_user: dict = Depends(get_current_user)):
    """
    Get all reservations for a specific user
    """
    if current_user.get("id") != user_id:
        raise HTTPException(status_code=403, detail="Unauthorized user")
    
    db = get_database()
    reservations = []
    async for reservation in db["reservations"].find({"user_id": user_id}):
        reservations.append(ReservationResponse(
            id=str(reservation["_id"]),
            room_id=reservation["room_id"],
            check_in_date=reservation["check_in_date"],
            check_out_date=reservation["check_out_date"],
            user_id=reservation["user_id"]
        ))
    return reservations