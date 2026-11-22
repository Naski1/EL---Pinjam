"""
Santri (Student) Schemas
"""
from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Any
from datetime import datetime, date


class SantriBase(BaseModel):
    nis: str = Field(..., min_length=3, max_length=20)
    nama_lengkap: str = Field(..., min_length=2, max_length=100)
    jenis_kelamin: str = Field(..., pattern="^[LP]$")
    asrama_id: Optional[str] = None
    kamar_id: Optional[str] = None
    kelas: Optional[str] = Field(None, max_length=20)
    tanggal_masuk: Optional[date] = None
    nama_wali: Optional[str] = Field(None, max_length=100)
    no_hp_wali: Optional[str] = Field(None, max_length=20)
    alamat: Optional[str] = None
    foto: Optional[str] = None
    status: str = "active"


class SantriCreate(SantriBase):
    pass


class SantriUpdate(BaseModel):
    nis: Optional[str] = Field(None, min_length=3, max_length=20)
    nama_lengkap: Optional[str] = Field(None, min_length=2, max_length=100)
    jenis_kelamin: Optional[str] = Field(None, pattern="^[LP]$")
    asrama_id: Optional[str] = None
    kamar_id: Optional[str] = None
    kelas: Optional[str] = Field(None, max_length=20)
    tanggal_masuk: Optional[date] = None
    nama_wali: Optional[str] = Field(None, max_length=100)
    no_hp_wali: Optional[str] = Field(None, max_length=20)
    alamat: Optional[str] = None
    foto: Optional[str] = None
    status: Optional[str] = None


class AsramaInfo(BaseModel):
    id: str
    kode_asrama: str
    nama_asrama: str

    class Config:
        from_attributes = True


class KamarInfo(BaseModel):
    id: str
    kode_kamar: str
    nama_kamar: str

    class Config:
        from_attributes = True


class SantriResponse(BaseModel):
    id: str
    nis: str
    nama_lengkap: str
    jenis_kelamin: str
    asrama_id: Optional[str] = None
    kamar_id: Optional[str] = None
    kelas: Optional[str] = None
    asrama: Optional[AsramaInfo] = None
    kamar: Optional[KamarInfo] = None
    tanggal_masuk: Optional[date] = None
    nama_wali: Optional[str] = None
    no_hp_wali: Optional[str] = None
    alamat: Optional[str] = None
    foto: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

    @field_validator('jenis_kelamin', mode='before')
    @classmethod
    def convert_jenis_kelamin(cls, v: Any) -> str:
        """Convert enum value to L/P format"""
        if hasattr(v, 'value'):
            v = v.value
        if v in ['Laki-laki', 'LAKI_LAKI']:
            return 'L'
        elif v in ['Perempuan', 'PEREMPUAN']:
            return 'P'
        return str(v) if v else 'L'

    @field_validator('status', mode='before')
    @classmethod
    def convert_status(cls, v: Any) -> str:
        """Convert enum value to string"""
        if hasattr(v, 'value'):
            return v.value
        return str(v) if v else 'active'


class SantriListResponse(BaseModel):
    total: int
    skip: int
    limit: int
    items: List[SantriResponse]
