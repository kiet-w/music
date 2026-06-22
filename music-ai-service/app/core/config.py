import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    DATABASE_URL = os.getenv("DATABASE_URL", "").split('?')[0] # Using sync driver for dramatiq
    # For async sqlalchemy in FastAPI:
    ASYNC_DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://") if "postgresql://" in DATABASE_URL else DATABASE_URL
    
    REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    SUPABASE_URL = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")
    
    # Validation & Security Limits
    MAX_VIDEO_DURATION_SEC = 3600 # 1 hour
    MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024 # 100 MB

settings = Settings()
