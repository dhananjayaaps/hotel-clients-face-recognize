from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.db import connect_to_mongo, close_mongo_connection
from app.routes import auth, rooms, reservations, admin, face, images

app = FastAPI(title="Hotel Management API")

# Mount static files directory for serving images
app.mount("/static", StaticFiles(directory="static"), name="static")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(rooms.router, prefix="/api/rooms", tags=["Rooms"])
app.include_router(reservations.router, prefix="/api/reservations", tags=["Reservations"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(face.router, prefix="/ws/face", tags=["Face Recognition"])
app.include_router(images.router, prefix="/api/images", tags=["Images"])

@app.on_event("startup")
async def startup_event():
    await connect_to_mongo()
    print("Connected to MongoDB")

@app.on_event("shutdown")
async def shutdown_event():
    await close_mongo_connection()

@app.get("/")
def read_root():
    return {"message": "Hotel Management API"}