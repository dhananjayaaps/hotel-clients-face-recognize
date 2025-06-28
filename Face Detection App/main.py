from fastapi import FastAPI
from app.db import connect_to_mongo, close_mongo_connection
from app.routes import auth, rooms, reservations, face
from app.config import settings

app = FastAPI(title="Hotel Management API")

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(rooms.router, prefix="/api/rooms", tags=["Rooms"])
app.include_router(reservations.router, prefix="/api/reservations", tags=["Reservations"])
app.include_router(face.router, prefix="/api/face", tags=["Face Recognition"])

@app.on_event("startup")
async def startup_event():
    await connect_to_mongo()

@app.on_event("shutdown")
async def shutdown_event():
    await close_mongo_connection()

@app.get("/")
def read_root():
    return {"message": "Hotel Management API"}