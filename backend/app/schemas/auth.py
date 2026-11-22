"""
Authentication Schemas
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from app.models.petugas import RoleEnum, StatusEnum


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_type: str = "admin"  # "admin" or "siswa"


class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None
    user_type: Optional[str] = None


class LoginRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=4)


class SiswaLoginRequest(BaseModel):
    nis: str = Field(..., min_length=3, max_length=20)
    password: str = Field(..., min_length=4)


class RegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=4)
    nama_lengkap: str = Field(..., min_length=2, max_length=100)
    email: Optional[str] = None
    role: RoleEnum = RoleEnum.ADMIN


class PetugasResponse(BaseModel):
    id: str
    username: str
    nama_lengkap: str
    email: Optional[str] = None
    role: RoleEnum
    status: StatusEnum
    last_login: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class PetugasUpdate(BaseModel):
    nama_lengkap: Optional[str] = Field(None, min_length=2, max_length=100)
    email: Optional[str] = None
    role: Optional[RoleEnum] = None
    status: Optional[StatusEnum] = None


class PasswordChange(BaseModel):
    old_password: str = Field(..., min_length=4)
    new_password: str = Field(..., min_length=4)


class MeResponse(BaseModel):
    """Unified response for /me endpoint"""
    id: str
    username: Optional[str] = None
    nis: Optional[str] = None
    nama_lengkap: str
    email: Optional[str] = None
    role: Optional[str] = None
    user_type: str  # "admin" or "siswa"
    status: str
    last_login: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True
