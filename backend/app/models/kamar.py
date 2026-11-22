"""
Kamar (Room) Model
"""
from sqlalchemy import Column, String, Integer, Enum as SQLEnum, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum

from app.database import Base


class KamarStatusEnum(str, enum.Enum):
    AVAILABLE = "available"
    FULL = "full"


class Kamar(Base):
    __tablename__ = "kamars"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    asrama_id = Column(String(36), ForeignKey("asramas.id"), nullable=False)
    kode_kamar = Column(String(10), nullable=False, index=True)
    nama_kamar = Column(String(50), nullable=False)
    kapasitas = Column(Integer, nullable=False, default=4)
    jumlah_penghuni = Column(Integer, nullable=False, default=0)
    status = Column(SQLEnum(KamarStatusEnum), default=KamarStatusEnum.AVAILABLE, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    asrama = relationship("Asrama", back_populates="kamars")
    santris = relationship("Santri", back_populates="kamar")
    
    # Unique constraint: kode_kamar must be unique within an asrama
    __table_args__ = (
        # UniqueConstraint('asrama_id', 'kode_kamar', name='unique_kamar_per_asrama'),
    )
    
    def __repr__(self):
        return f"<Kamar(kode='{self.kode_kamar}', nama='{self.nama_kamar}')>"
    
    def update_penghuni_count(self):
        """Update jumlah_penghuni based on actual santris"""
        self.jumlah_penghuni = len([s for s in self.santris if s.status == 'active'])
        self.status = KamarStatusEnum.FULL if self.jumlah_penghuni >= self.kapasitas else KamarStatusEnum.AVAILABLE
