from fastapi import APIRouter, Depends, HTTPException
from app.utils.security import get_current_user
from app.db import get_database
from bson import ObjectId
from datetime import datetime, timedelta

router = APIRouter()

@router.get("/stats")
async def get_system_stats(current_user: dict = Depends(get_current_user)):
    db = get_database()
    
    # Verify admin role
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Forbidden")
    
    # Calculate stats
    stats = {
        "total_guests": await db["users"].count_documents({}),
        "occupied_rooms": await db["rooms"].count_documents({"status": {"$ne": "available"}}),
        "available_rooms": await db["rooms"].count_documents({"status": "available"}),
        "today_check_ins": await db["reservations"].count_documents({
            "check_in_date": {"$lte": datetime.now()},
            "check_out_date": {"$gt": datetime.now()},
            "status": "checked-in"
        }),
        "today_check_outs": await db["reservations"].count_documents({
            "check_out_date": {"$gte": datetime.now(), "$lt": datetime.now() + timedelta(days=1)},
            "status": "checked-in"
        }),
        "monthly_revenue": await calculate_monthly_revenue(db)
    }
    
    return stats

async def calculate_monthly_revenue(db):
    # Calculate revenue for current month
    start_of_month = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    reservations = db["reservations"].find({
        "check_out_date": {"$gte": start_of_month},
        "status": {"$in": ["confirmed", "checked-in", "checked-out"]}
    })
    
    total = 0
    async for res in reservations:
        total += res["total_amount"]
    
    return total