from fastapi import APIRouter, Depends, HTTPException
from app.models import Room
from app.schemas import RoomCreate, RoomResponse
from app.db import get_database
from app.utils.security import get_current_user
from bson import ObjectId

router = APIRouter()

@router.get("/", response_model=list[RoomResponse])
async def get_available_rooms():
    db = get_database()
    rooms = []
    async for room in db["rooms"].find({"status": "available"}):
        rooms.append(RoomResponse(id=str(room["_id"]), **room))
    return rooms

@router.post("/", response_model=RoomResponse)
async def create_room(room: RoomCreate, current_user: dict = Depends(get_current_user)):
    # Only admin can create rooms
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Forbidden")
    
    db = get_database()
    room_data = Room(**room.dict())
    result = await db["rooms"].insert_one(room_data.dict(by_alias=True, exclude={"id"}))
    new_room = await db["rooms"].find_one({"_id": result.inserted_id})
    return RoomResponse(id=str(new_room["_id"]), **new_room)

@router.get("/{room_id}", response_model=RoomResponse)
async def get_room(room_id: str):
    db = get_database()
    room = await db["rooms"].find_one({"_id": ObjectId(room_id)})
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    return RoomResponse(id=str(room["_id"]), **room)