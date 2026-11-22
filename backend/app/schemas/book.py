"""
Book Schemas
"""
from pydantic import BaseModel, Field, model_validator
from typing import Optional, List, Any
from datetime import datetime


class BookBase(BaseModel):
    kode_buku: str = Field(..., min_length=2, max_length=20)
    isbn: Optional[str] = Field(None, max_length=20)
    judul: str = Field(..., min_length=1, max_length=255)
    pengarang: Optional[str] = Field(None, max_length=255)
    penerbit: Optional[str] = Field(None, max_length=100)
    tahun_terbit: Optional[int] = Field(None, ge=1800, le=2100)
    category_id: Optional[str] = None
    lokasi_rak: Optional[str] = Field(None, max_length=50)
    total_stok: int = Field(1, ge=0)
    harga: Optional[int] = Field(0, ge=0)
    cover: Optional[str] = None
    deskripsi: Optional[str] = None
    status: str = "available"


class BookCreate(BookBase):
    pass


class BookUpdate(BaseModel):
    kode_buku: Optional[str] = Field(None, min_length=2, max_length=20)
    isbn: Optional[str] = Field(None, max_length=20)
    judul: Optional[str] = Field(None, min_length=1, max_length=255)
    pengarang: Optional[str] = Field(None, max_length=255)
    penerbit: Optional[str] = Field(None, max_length=100)
    tahun_terbit: Optional[int] = Field(None, ge=1800, le=2100)
    category_id: Optional[str] = None
    lokasi_rak: Optional[str] = Field(None, max_length=50)
    total_stok: Optional[int] = Field(None, ge=0)
    harga: Optional[int] = Field(None, ge=0)
    cover: Optional[str] = None
    deskripsi: Optional[str] = None
    status: Optional[str] = None


class CategoryInfo(BaseModel):
    id: str
    kode_kategori: str
    nama_kategori: str

    class Config:
        from_attributes = True


class BookResponse(BaseModel):
    id: str
    kode_buku: str
    isbn: Optional[str] = None
    judul: str
    pengarang: Optional[str] = None
    penerbit: Optional[str] = None
    tahun_terbit: Optional[int] = None
    category_id: Optional[str] = None
    category: Optional[CategoryInfo] = None
    lokasi_rak: Optional[str] = None
    total_stok: int
    stok_tersedia: int
    harga: int = 0
    cover: Optional[str] = None
    deskripsi: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

    @model_validator(mode='before')
    @classmethod
    def map_penulis_to_pengarang(cls, data: Any) -> Any:
        """Map penulis field from model to pengarang for response"""
        if hasattr(data, '__dict__'):
            # SQLAlchemy model object
            obj_dict = {}
            for key in ['id', 'kode_buku', 'isbn', 'judul', 'penulis', 'penerbit', 
                       'tahun_terbit', 'category_id', 'category', 'lokasi_rak',
                       'total_stok', 'stok_tersedia', 'harga', 'cover', 'deskripsi',
                       'status', 'created_at', 'updated_at']:
                if hasattr(data, key):
                    val = getattr(data, key)
                    # Convert enum to value
                    if hasattr(val, 'value'):
                        val = val.value
                    obj_dict[key] = val
            # Map penulis to pengarang
            obj_dict['pengarang'] = obj_dict.pop('penulis', None)
            return obj_dict
        elif isinstance(data, dict):
            # Dict input - map penulis to pengarang
            if 'penulis' in data and 'pengarang' not in data:
                data['pengarang'] = data.pop('penulis')
            # Convert status enum
            if 'status' in data and hasattr(data['status'], 'value'):
                data['status'] = data['status'].value
            return data
        return data


class BookListResponse(BaseModel):
    total: int
    skip: int
    limit: int
    items: List[BookResponse]
