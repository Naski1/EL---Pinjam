"""
Category (Book Category) Schemas
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class CategoryBase(BaseModel):
    kode_kategori: str = Field(..., min_length=2, max_length=10)
    nama_kategori: str = Field(..., min_length=2, max_length=100)
    deskripsi: Optional[str] = None


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    kode_kategori: Optional[str] = Field(None, min_length=2, max_length=10)
    nama_kategori: Optional[str] = Field(None, min_length=2, max_length=100)
    deskripsi: Optional[str] = None


class CategoryResponse(CategoryBase):
    id: str
    jumlah_buku: int = 0
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class CategoryListResponse(BaseModel):
    total: int
    items: List[CategoryResponse]
