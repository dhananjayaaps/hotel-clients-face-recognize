from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings
from motor.motor_asyncio import AsyncIOMotorDatabase
class Database:
    client: AsyncIOMotorClient = None # type: ignore

db = Database()

async def connect_to_mongo():
    db.client = AsyncIOMotorClient(settings.mongo_uri)
    print("Connected to MongoDB")

async def close_mongo_connection():
    db.client.close()
    print("Closed MongoDB connection")
def get_database() -> "AsyncIOMotorDatabase":
    return db.client[settings.mongo_db_name]