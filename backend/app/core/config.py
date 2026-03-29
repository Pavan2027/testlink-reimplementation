from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480

    AI_BASE_URL: str = "https://generativelanguage.googleapis.com/v1beta/openai"
    AI_MODEL: str = "gemini-1.5-flash"
    AI_API_KEY: str = ""

    APP_NAME: str = "TestLink Rebuild"
    ENVIRONMENT: str = "development"
    FRONTEND_URL: str = "http://localhost:3000"

    class Config:
        env_file = ".env"


settings = Settings()