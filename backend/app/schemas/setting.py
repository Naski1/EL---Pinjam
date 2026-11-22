"""
Settings Schema
"""
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class SettingBase(BaseModel):
    key: str
    value: str
    description: Optional[str] = None


class SettingUpdate(BaseModel):
    value: str


class SettingResponse(SettingBase):
    id: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class SettingBulkUpdate(BaseModel):
    settings: List[SettingBase]
