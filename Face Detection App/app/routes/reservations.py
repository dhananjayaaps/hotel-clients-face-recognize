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
    status: str

class CheckInOutRequest(BaseModel):
    reservation_id: str
    email: str

@router.post("/checkin", response_model=ReservationResponse)
async def check_in(
    request: CheckInOutRequest,
    current_user: dict = Depends(get_current_user)
):
    db = get_database()
    
    # Validate reservation_id
    if not ObjectId.is_valid(request.reservation_id):
        raise HTTPException(status_code=400, detail="Invalid reservation ID")
    
    # Find reservation
    reservation = await db["reservations"].find_one({
        "_id": ObjectId(request.reservation_id)
    })
    
    if not reservation:
        raise HTTPException(status_code=404, detail="Reservation not found")
    
    # Check if already checked in
    if reservation.get("status") == "checked_in":
        raise HTTPException(status_code=400, detail="Already checked in")
    
    # Validate dates - ensure both datetimes are offset-aware
    now = datetime.now(timezone.utc)
    check_in_date = reservation["check_in_date"]
    check_out_date = reservation["check_out_date"]
    
    # Convert stored dates to offset-aware if they're not
    if check_in_date.tzinfo is None:
        check_in_date = check_in_date.replace(tzinfo=timezone.utc)
    if check_out_date.tzinfo is None:
        check_out_date = check_out_date.replace(tzinfo=timezone.utc)
    
    if now < check_in_date:
        raise HTTPException(status_code=400, detail="Check-in date not reached")
    if now > check_out_date:
        raise HTTPException(status_code=400, detail="Reservation has expired")
    
    # Update reservation
    update_result = await db["reservations"].update_one(
        {"_id": ObjectId(request.reservation_id)},
        {"$set": {
            "status": "checked_in",
            "actual_check_in": now
        }}
    )
    
    if update_result.modified_count == 0:
        raise HTTPException(status_code=500, detail="Failed to update reservation")
    
    # Get updated reservation
    updated_reservation = await db["reservations"].find_one({"_id": ObjectId(request.reservation_id)})
    
    return ReservationResponse(
        id=str(updated_reservation["_id"]),
        room_id=updated_reservation["room_id"],
        check_in_date=updated_reservation["check_in_date"],
        check_out_date=updated_reservation["check_out_date"],
        user_id=updated_reservation["user_id"],
        status=updated_reservation["status"]
    )

@router.post("/checkout", response_model=ReservationResponse)
async def check_out(
    request: CheckInOutRequest,
    current_user: dict = Depends(get_current_user)
):
    db = get_database()
    
    # Validate reservation_id
    if not ObjectId.is_valid(request.reservation_id):
        raise HTTPException(status_code=400, detail="Invalid reservation ID")
    
    # Find reservation
    reservation = await db["reservations"].find_one({
        "_id": ObjectId(request.reservation_id)
    })
    
    if not reservation:
        raise HTTPException(status_code=404, detail="Reservation not found")
    
    # Check if already checked out
    if reservation.get("status") == "checked_out":
        raise HTTPException(status_code=400, detail="Already checked out")
    
    # Must be checked in first
    if reservation.get("status") != "checked_in":
        raise HTTPException(status_code=400, detail="Not checked in yet")
    
    # Update reservation
    now = datetime.now(timezone.utc)
    update_result = await db["reservations"].update_one(
        {"_id": ObjectId(request.reservation_id)},
        {"$set": {
            "status": "checked_out",
            "actual_check_out": now
        }}
    )
    
    if update_result.modified_count == 0:
        raise HTTPException(status_code=500, detail="Failed to update reservation")
    
    # Get updated reservation
    updated_reservation = await db["reservations"].find_one({"_id": ObjectId(request.reservation_id)})
    
    return ReservationResponse(
        id=str(updated_reservation["_id"]),
        room_id=updated_reservation["room_id"],
        check_in_date=updated_reservation["check_in_date"],
        check_out_date=updated_reservation["check_out_date"],
        user_id=updated_reservation["user_id"],
        status=updated_reservation["status"]
    )

from fastapi.responses import JSONResponse

@router.post("/", status_code=200)
async def create_reservation(
    reservation: ReservationCreate,
    current_user: dict = Depends(get_current_user)
):
    db = get_database()

    if not ObjectId.is_valid(reservation.room_id):
        raise HTTPException(status_code=400, detail="Invalid room ID")

    room = await db["rooms"].find_one({"_id": ObjectId(reservation.room_id)})
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    now = datetime.now(timezone.utc)
    check_in = reservation.check_in_date.replace(tzinfo=timezone.utc) if reservation.check_in_date.tzinfo is None else reservation.check_in_date
    check_out = reservation.check_out_date.replace(tzinfo=timezone.utc) if reservation.check_out_date.tzinfo is None else reservation.check_out_date

    if check_in >= check_out:
        raise HTTPException(status_code=400, detail="Check-out must be after check-in")
    if check_in < now:
        raise HTTPException(status_code=400, detail="Check-in date cannot be in the past")

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

    reservation_data = {
        "room_id": reservation.room_id,
        "check_in_date": check_in,
        "check_out_date": check_out,
        "user_id": str(current_user["_id"]),
        "created_at": now,
        "status": "active"
    }

    await db["reservations"].insert_one(reservation_data)

    return JSONResponse(status_code=200, content={"message": "Reservation successful"})

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
            user_id=res["user_id"],
            status=res["status"] if "status" in res else "active"
        ))
    return reservations


@router.get("/all", response_model=List[ReservationResponse])
async def get_all_reservations(current_user: dict = Depends(get_current_user)):
    """
    Get all reservations (admin only)
    """
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Forbidden")
    db = get_database()
    
    reservations = []   
    async for res in db["reservations"].find():
        reservations.append(ReservationResponse(
            id=str(res["_id"]),
            room_id=res["room_id"],
            check_in_date=res["check_in_date"],
            check_out_date=res["check_out_date"],
            user_id=res["user_id"],
            status=res["status"] if "status" in res else "active"
        ))
    return reservations
