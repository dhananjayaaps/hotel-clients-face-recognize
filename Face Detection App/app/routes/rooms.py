from fastapi import APIRouter, Depends, HTTPException
from app.models import Room
from app.schemas import RoomCreate, RoomResponse
from app.db import get_database
from app.utils.security import get_current_user
from bson import ObjectId

router = APIRouter()

# @router.get("/", response_model=list[RoomResponse])
# async def get_available_rooms():
#     db = get_database()
#     rooms = []
#     async for room in db["rooms"].find({"status": "available"}):
#         rooms.append(RoomResponse(id=str(room["_id"]), **room))
#     return rooms

@router.get("/", response_model=list[RoomResponse])
async def get_available_rooms():
    rooms = [
        RoomResponse(
            id="1",
            room_number=101,
            room_type="Deluxe",
            price_per_night=50,
            capacity=2,
            amenities=["TV", "AC"],
            status="available",
            image_url="https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg"
        ),
        RoomResponse(
            id="2",
            room_number=102,
            room_type="Standard",
            price_per_night=30,
            capacity=2,
            amenities=["TV"],
            status="available",
            image_url="https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg"
        ),
        RoomResponse(
            id="3",
            room_number=103,
            room_type="Suite",
            price_per_night=80,
            capacity=4,
            amenities=["TV", "AC", "Safe"],
            status="available",
            image_url="https://images.pexels.com/photos/237371/pexels-photo-237371.jpeg"
        )
    ]
    return rooms

@router.post("/", response_model=RoomResponse)
async def create_room(room: RoomCreate, current_user: dict = Depends(get_current_user)):
    # Only admin can create rooms
    # if current_user.get("role") != "admin":
    #     raise HTTPException(status_code=403, detail="Forbidden")
    
    db = get_database()
    room_data = Room(**room.dict())
    result = await db["rooms"].insert_one(room_data.dict(by_alias=True, exclude={"id"}))
    new_room = await db["rooms"].find_one({"_id": result.inserted_id})
    return RoomResponse(id=str(new_room["_id"]), **new_room)

@router.get("/{room_id}", response_model=RoomResponse)
async def get_room(room_id: str):
    # Hardcoded sample rooms
    sample_rooms = {
        "1": RoomResponse(
            id="1",
            room_number=101,
            room_type="Deluxe",
            price_per_night=50,
            capacity=2,
            amenities=["TV", "AC"],
            status="available",
            image_url="https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg"
        ),
        "2": RoomResponse(
            id="2",
            room_number=102,
            room_type="Standard",
            price_per_night=30,
            capacity=2,
            amenities=["TV"],
            status="available",
            image_url="https://example.com/room2.jpg"
        ),
        "3": RoomResponse(
            id="3",
            room_number=103,
            room_type="Suite",
            price_per_night=80,
            capacity=4,
            amenities=["TV", "AC", "Safe"],
            status="available",
            image_url="https://example.com/room3.jpg"
        ),
    }

    room = sample_rooms.get(room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    return room