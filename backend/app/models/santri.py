"""
Santri (Student) Model
"""
from sqlalchemy import Column, String, Integer, Enum as SQLEnum, DateTime, Date, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum

from app.database import Base


class JenisKelaminEnum(str, enum.Enum):
    LAKI_LAKI = "Laki-laki"
    PEREMPUAN = "Perempuan"


class SantriStatusEnum(str, enum.Enum):
    ACTIVE = "active"
    ALUMNI = "alumni"
    KELUAR = "keluar"


class Santri(Base):
    __tablename__ = "santris"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    nis = Column(String(20), unique=True, nullable=False, index=True)
    nama_lengkap = Column(String(100), nullable=False, index=True)
    jenis_kelamin = Column(SQLEnum(JenisKelaminEnum), nullable=False)
    asrama_id = Column(String(36), ForeignKey("asramas.id"), nullable=True)
    kamar_id = Column(String(36), ForeignKey("kamars.id"), nullable=True)
    kelas = Column(String(20), nullable=True)
    tanggal_masuk = Column(Date, nullable=True)
    nama_wali = Column(String(100), nullable=True)
    no_hp_wali = Column(String(20), nullable=True)
    alamat = Column(Text, nullable=True)
    foto = Column(String(255), nullable=True)
    status = Column(SQLEnum(SantriStatusEnum), default=SantriStatusEnum.ACTIVE, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    asrama = relationship("Asrama", back_populates="santris")
    kamar = relationship("Kamar", back_populates="santris")
    
    def __repr__(self):
        return f"<Santri(nis='{self.nis}', nama='{self.nama_lengkap}')>"
    
    @property
    def active_borrowings_count(self):
        """Get count of currently borrowed books"""
        return len([b for b in self.borrowings if b.status == 'borrowed'])
    
    @property
    def has_overdue(self):
        """Check if santri has any overdue books"""
        return any(b.status == 'overdue' for b in self.borrowings)
    
    @property
    def unpaid_fines(self):
        """Get total unpaid fines"""
        return sum(b.fine_amount for b in self.borrowings if not b.fine_paid and b.fine_amount > 0)
