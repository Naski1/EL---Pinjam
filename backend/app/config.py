"""
Application Configuration
"""
from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "EL-Pinjam API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    # Database
    DATABASE_URL: str = "sqlite:///./el_pinjam.db"
    
    # JWT Authentication
    SECRET_KEY: str = "el-pinjam-secret-key-change-in-production-2024"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Library Settings (Default Values)
    DEFAULT_LOAN_DURATION_DAYS: int = 7
    MAX_BOOKS_PER_SANTRI: int = 3
    MAX_RENEWALS: int = 2
    FINE_PER_DAY: int = 1000  # Rupiah
    LOST_BOOK_MULTIPLIER: float = 2.0
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
