from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    PROJECT_NAME: str = "AI Interview Platform"
    VERSION: str = "1.0.0"

    DATABASE_URL: str = "sqlite:///./interview_platform.db"

    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:5173"]

    OPENAI_API_KEY: str = ""

    PISTON_URL: str = "http://piston:2000"

    class Config:
        env_file = ".env"


settings = Settings()
