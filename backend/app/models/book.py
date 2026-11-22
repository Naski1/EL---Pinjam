"""
Book Model
"""
from sqlalchemy import Column, String, Integer, Enum as SQLEnum, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum

from app.database import Base


class BookStatusEnum(str, enum.Enum):
    AVAILABLE = "available"
    UNAVAILABLE = "unavailable"
    DAMAGED = "damaged"
    LOST = "lost"


class Book(Base):
    __tablename__ = "books"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    kode_buku = Column(String(20), unique=True, nullable=False, index=True)
    isbn = Column(String(20), nullable=True, index=True)
    judul = Column(String(255), nullable=False, index=True)
    penulis = Column(String(255), nullable=True)
    penerbit = Column(String(100), nullable=True)
    tahun_terbit = Column(Integer, nullable=True)
    category_id = Column(String(36), ForeignKey("categories.id"), nullable=True)
    lokasi_rak = Column(String(50), nullable=True)
    total_stok = Column(Integer, nullable=False, default=1)
    stok_tersedia = Column(Integer, nullable=False, default=1)
    harga = Column(Integer, nullable=True, default=0)  # For calculating lost book fines
    cover = Column(String(255), nullable=True)
    deskripsi = Column(Text, nullable=True)
    status = Column(SQLEnum(BookStatusEnum), default=BookStatusEnum.AVAILABLE, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    category = relationship("Category", back_populates="books")
    borrowings = relationship("Borrowing", back_populates="book")
    
    def __repr__(self):
        return f"<Book(kode='{self.kode_buku}', judul='{self.judul}')>"
    
    @property
    def is_available(self):
        """Check if book has available stock"""
        return self.stok_tersedia > 0 and self.status == BookStatusEnum.AVAILABLE
    
    def borrow(self):
        """Decrease available stock when borrowed"""
        if self.stok_tersedia > 0:
            self.stok_tersedia -= 1
            return True
        return False
    
    def return_book(self):
        """Increase available stock when returned"""
        if self.stok_tersedia < self.total_stok:
            self.stok_tersedia += 1
            return True
        return False
