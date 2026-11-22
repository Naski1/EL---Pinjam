"""
Authentication Router
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from app.database import get_db
from app.models.petugas import Petugas, RoleEnum, StatusEnum
from app.schemas.auth import (
    Token, LoginRequest, RegisterRequest, 
    PetugasResponse, PetugasUpdate, PasswordChange
)
from app.utils.auth import (
    verify_password, get_password_hash, create_access_token,
    get_current_user, get_current_admin
)
from app.config import settings

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """Login and get access token"""
    user = db.query(Petugas).filter(Petugas.username == form_data.username).first()
    
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Username atau password salah",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if user.status != StatusEnum.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akun tidak aktif"
        )
    
    # Update last login
    user.last_login = datetime.utcnow()
    db.commit()
    
    # Create token
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role.value}
    )
    
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/register", response_model=PetugasResponse)
async def register(
    request: RegisterRequest,
    db: Session = Depends(get_db),
    current_user: Petugas = Depends(get_current_admin)
):
    """Register a new user (admin only)"""
    # Check if username exists
    existing = db.query(Petugas).filter(Petugas.username == request.username).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username sudah digunakan"
        )
    
    # Check if email exists
    if request.email:
        existing_email = db.query(Petugas).filter(Petugas.email == request.email).first()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email sudah digunakan"
            )
    
    # Create new user
    new_user = Petugas(
        username=request.username,
        password_hash=get_password_hash(request.password),
        nama_lengkap=request.nama_lengkap,
        email=request.email,
        role=request.role
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user


@router.get("/me", response_model=PetugasResponse)
async def get_me(current_user: Petugas = Depends(get_current_user)):
    """Get current user info"""
    return current_user


@router.put("/me", response_model=PetugasResponse)
async def update_me(
    request: PetugasUpdate,
    db: Session = Depends(get_db),
    current_user: Petugas = Depends(get_current_user)
):
    """Update current user info"""
    update_data = request.model_dump(exclude_unset=True)
    
    # Regular users can only update nama_lengkap and email
    if current_user.role != RoleEnum.ADMIN:
        update_data = {k: v for k, v in update_data.items() if k in ["nama_lengkap", "email"]}
    
    for key, value in update_data.items():
        setattr(current_user, key, value)
    
    db.commit()
    db.refresh(current_user)
    
    return current_user


@router.post("/change-password")
async def change_password(
    request: PasswordChange,
    db: Session = Depends(get_db),
    current_user: Petugas = Depends(get_current_user)
):
    """Change current user's password"""
    if not verify_password(request.old_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password lama salah"
        )
    
    current_user.password_hash = get_password_hash(request.new_password)
    db.commit()
    
    return {"message": "Password berhasil diubah"}


@router.get("/users", response_model=list[PetugasResponse])
async def list_users(
    db: Session = Depends(get_db),
    current_user: Petugas = Depends(get_current_admin)
):
    """List all users (admin only)"""
    users = db.query(Petugas).all()
    return users
