"""
Category (Book Category) Model
"""
from sqlalchemy import Column, String, Text, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.database import Base


class Category(Base):
    __tablename__ = "categories"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    kode_kategori = Column(String(10), unique=True, nullable=False, index=True)
    nama_kategori = Column(String(100), nullable=False)
    deskripsi = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    books = relationship("Book", back_populates="category")
    
    def __repr__(self):
        return f"<Category(kode='{self.kode_kategori}', nama='{self.nama_kategori}')>"
    
    @property
    def jumlah_buku(self):
        """Get total books in this category"""
        return len(self.books) if self.books else 0
