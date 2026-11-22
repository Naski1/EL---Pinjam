"""
Asrama (Dormitory) Schemas
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from app.models.asrama import AsramaStatusEnum


class AsramaBase(BaseModel):
    kode_asrama: str = Field(..., min_length=2, max_length=10)
    nama_asrama: str = Field(..., min_length=2, max_length=100)
    kapasitas: int = Field(..., ge=0)
    penanggung_jawab: Optional[str] = Field(None, max_length=100)
    deskripsi: Optional[str] = None
    status: AsramaStatusEnum = AsramaStatusEnum.ACTIVE


class AsramaCreate(AsramaBase):
    pass


class AsramaUpdate(BaseModel):
    kode_asrama: Optional[str] = Field(None, min_length=2, max_length=10)
    nama_asrama: Optional[str] = Field(None, min_length=2, max_length=100)
    kapasitas: Optional[int] = Field(None, ge=0)
    penanggung_jawab: Optional[str] = Field(None, max_length=100)
    deskripsi: Optional[str] = None
    status: Optional[AsramaStatusEnum] = None


class AsramaResponse(AsramaBase):
    id: str
    jumlah_kamar: int = 0
    jumlah_santri: int = 0
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class AsramaListResponse(BaseModel):
    total: int
    items: List[AsramaResponse]
