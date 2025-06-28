from fastapi import APIRouter, Depends, HTTPException
from app.models import Reservation
from app.schemas import ReservationCreate, ReservationResponse, RoomResponse
from app.db import get_database
from app.utils.security import get_current_user
from bson import ObjectId
from datetime import datetime

router = APIRouter()

@router.get("/guest/{guest_id}", response_model=list[ReservationResponse])
async def get_guest_reservations(guest_id: str):
    db = get_database()
    reservations = []
    async for res in db["reservations"].find({"guest_id": ObjectId(guest_id)}):
        room = await db["rooms"].find_one({"_id": res["room_id"]})
        if room:
            room_resp = RoomResponse(
                id=str(room["_id"]),
                room_number=room["room_number"],
                room_type=room["room_type"],
                price_per_night=room["price_per_night"],
                status=room["status"],
                capacity=room["capacity"],
                amenities=room.get("amenities", []),
                image_url=room.get("image_url")
            )
            reservations.append(ReservationResponse(
                id=str(res["_id"]),
                room=room_resp,
                check_in_date=res["check_in_date"],
                check_out_date=res["check_out_date"],
                total_amount=res["total_amount"],
                status=res["status"]
            ))
    return reservations

@router.post("/", response_model=ReservationResponse)
async def create_reservation(reservation: ReservationCreate, current_user: dict = Depends(get_current_user)):
    db = get_database()
    
    # Check room availability
    room = await db["rooms"].find_one({"_id": ObjectId(reservation.room_id)})
    if not room or room["status"] != "available":
        raise HTTPException(status_code=400, detail="Room not available")
    
    # Create reservation
    reservation_data = Reservation(
        room_id=ObjectId(reservation.room_id),
        guest_id=ObjectId(current_user["_id"]),
        check_in_date=reservation.check_in_date,
        check_out_date=reservation.check_out_date,
        total_amount=reservation.total_amount,
        status="confirmed"
    )
    
    # Update room status
    await db["rooms"].update_one(
        {"_id": ObjectId(reservation.room_id)},
        {"$set": {"status": "booked"}}
    )
    
    result = await db["reservations"].insert_one(reservation_data.dict(by_alias=True, exclude={"id"}))
    new_res = await db["reservations"].find_one({"_id": result.inserted_id})
    
    # Get room for response
    room = await db["rooms"].find_one({"_id": ObjectId(reservation.room_id)})
    room_resp = RoomResponse(
        id=str(room["_id"]),
        room_number=room["room_number"],
        room_type=room["room_type"],
        price_per_night=room["price_per_night"],
        status=room["status"],
        capacity=room["capacity"],
        amenities=room.get("amenities", []),
        image_url=room.get("image_url")
    )
    
    return ReservationResponse(
        id=str(new_res["_id"]),
        room=room_resp,
        check_in_date=new_res["check_in_date"],
        check_out_date=new_res["check_out_date"],
        total_amount=new_res["total_amount"],
        status=new_res["status"]
    )