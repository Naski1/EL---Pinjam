"""
Kamar (Room) Schemas
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from app.models.kamar import KamarStatusEnum


class KamarBase(BaseModel):
    asrama_id: str
    kode_kamar: str = Field(..., min_length=1, max_length=10)
    nama_kamar: str = Field(..., min_length=1, max_length=50)
    kapasitas: int = Field(..., ge=1)


class KamarCreate(KamarBase):
    pass


class KamarUpdate(BaseModel):
    asrama_id: Optional[str] = None
    kode_kamar: Optional[str] = Field(None, min_length=1, max_length=10)
    nama_kamar: Optional[str] = Field(None, min_length=1, max_length=50)
    kapasitas: Optional[int] = Field(None, ge=1)
    status: Optional[KamarStatusEnum] = None


class AsramaInfo(BaseModel):
    id: str
    kode_asrama: str
    nama_asrama: str

    class Config:
        from_attributes = True


class KamarResponse(BaseModel):
    id: str
    asrama_id: str
    kode_kamar: str
    nama_kamar: str
    kapasitas: int
    jumlah_penghuni: int
    status: KamarStatusEnum
    asrama: Optional[AsramaInfo] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class KamarListResponse(BaseModel):
    total: int
    items: List[KamarResponse]
