"""
Asrama (Dormitory) Model
"""
from sqlalchemy import Column, String, Integer, Enum as SQLEnum, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum

from app.database import Base


class AsramaStatusEnum(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"


class Asrama(Base):
    __tablename__ = "asramas"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    kode_asrama = Column(String(10), unique=True, nullable=False, index=True)
    nama_asrama = Column(String(100), nullable=False)
    kapasitas = Column(Integer, nullable=False, default=0)
    penanggung_jawab = Column(String(100), nullable=True)
    deskripsi = Column(Text, nullable=True)
    status = Column(SQLEnum(AsramaStatusEnum), default=AsramaStatusEnum.ACTIVE, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    kamars = relationship("Kamar", back_populates="asrama", cascade="all, delete-orphan")
    santris = relationship("Santri", back_populates="asrama")
    
    def __repr__(self):
        return f"<Asrama(kode='{self.kode_asrama}', nama='{self.nama_asrama}')>"
    
    @property
    def jumlah_kamar(self):
        """Get total rooms in this asrama"""
        return len(self.kamars) if self.kamars else 0
    
    @property
    def jumlah_santri(self):
        """Get total santri in this asrama"""
        return len(self.santris) if self.santris else 0
