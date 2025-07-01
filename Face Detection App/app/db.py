from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings
from motor.motor_asyncio import AsyncIOMotorDatabase
class Database:
    client: AsyncIOMotorClient = None

db = Database()

async def connect_to_mongo():
    # print(f"Connecting to MongoDB at: {settings.mongo_url}")
    db.client = AsyncIOMotorClient(settings.mongo_url)  # Use from settings
    # await db.client.server_info()
    print(f"Connected successfully to {settings.mongo_url}")
    print("Current settings:")
    print(f"URI: {settings.mongo_url}")
    print(f"DB Name: {settings.mongo_db_name}")

async def close_mongo_connection():
    db.client.close()
    print("Closed MongoDB connection")
def get_database() -> AsyncIOMotorDatabase:
    return db.client[settings.mongo_db_name]