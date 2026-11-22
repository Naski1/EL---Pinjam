"""
Petugas (Admin/Staff) Model
"""
from sqlalchemy import Column, String, Enum as SQLEnum, DateTime, Boolean
from datetime import datetime
import uuid
import enum

from app.database import Base


class RoleEnum(str, enum.Enum):
    ADMIN = "admin"


class StatusEnum(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"


class Petugas(Base):
    __tablename__ = "petugas"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    username = Column(String(50), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    nama_lengkap = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=True)
    role = Column(SQLEnum(RoleEnum), default=RoleEnum.ADMIN, nullable=False)
    status = Column(SQLEnum(StatusEnum), default=StatusEnum.ACTIVE, nullable=False)
    last_login = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<Petugas(username='{self.username}', role='{self.role}')>"
