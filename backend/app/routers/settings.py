"""
Settings Router
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.database import get_db
from app.models.settings import Setting
from app.models.petugas import Petugas, RoleEnum
from app.utils.auth import get_current_user
from app.schemas.setting import SettingResponse, SettingBulkUpdate, SettingUpdate

router = APIRouter(
    prefix="/api/settings",
    tags=["settings"],
    responses={404: {"description": "Not found"}},
)


@router.get("", response_model=List[SettingResponse])
def get_settings(
    db: Session = Depends(get_db),
    current_user: Petugas = Depends(get_current_user)
):
    """Get all settings"""
    settings = db.query(Setting).all()
    return settings


@router.put("", response_model=List[SettingResponse])
def update_settings(
    data: SettingBulkUpdate,
    db: Session = Depends(get_db),
    current_user: Petugas = Depends(get_current_user)
):
    """Update multiple settings"""
    # Only admin can update settings? For now, let all logged in users update (or restrict to ADMIN)
    if current_user.role != RoleEnum.ADMIN:
         raise HTTPException(status_code=403, detail="Hanya admin yang dapat mengubah pengaturan")

    updated_settings = []
    
    for item in data.settings:
        setting = db.query(Setting).filter(Setting.key == item.key).first()
        if setting:
            setting.value = item.value
            if item.description:
                setting.description = item.description
            updated_settings.append(setting)
        else:
            # Create if not exists (optional, but good for flexibility)
            new_setting = Setting(
                key=item.key,
                value=item.value,
                description=item.description
            )
            db.add(new_setting)
            updated_settings.append(new_setting)
    
    db.commit()
    
    # Return all settings to ensure UI is in sync
    return db.query(Setting).all()


@router.get("/{key}", response_model=SettingResponse)
def get_setting_by_key(
    key: str,
    db: Session = Depends(get_db),
    current_user: Petugas = Depends(get_current_user)
):
    """Get single setting by key"""
    setting = db.query(Setting).filter(Setting.key == key).first()
    if not setting:
        raise HTTPException(status_code=404, detail=f"Pengaturan '{key}' tidak ditemukan")
    return setting
