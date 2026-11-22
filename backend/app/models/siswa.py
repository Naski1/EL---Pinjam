"""
Siswa (Student) Model
"""
from sqlalchemy import Column, String, Integer, Enum as SQLEnum, DateTime, Date, Text
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum

from app.database import Base


class JenisKelaminEnum(str, enum.Enum):
    LAKI_LAKI = "Laki-laki"
    PEREMPUAN = "Perempuan"


class SiswaStatusEnum(str, enum.Enum):
    ACTIVE = "active"
    ALUMNI = "alumni"
    KELUAR = "keluar"


class Siswa(Base):
    __tablename__ = "siswas"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    nis = Column(String(20), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    nama_lengkap = Column(String(100), nullable=False, index=True)
    jenis_kelamin = Column(SQLEnum(JenisKelaminEnum), nullable=False)
    sekolah = Column(String(100), nullable=True)
    kelas = Column(String(20), nullable=True)
    alamat_rumah = Column(Text, nullable=True)
    tanggal_masuk = Column(Date, nullable=True)
    nama_wali = Column(String(100), nullable=True)
    no_hp_wali = Column(String(20), nullable=True)
    foto = Column(String(255), nullable=True)
    status = Column(SQLEnum(SiswaStatusEnum), default=SiswaStatusEnum.ACTIVE, nullable=False)
    last_login = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    borrowings = relationship("Borrowing", back_populates="siswa")
    
    def __repr__(self):
        return f"<Siswa(nis='{self.nis}', nama='{self.nama_lengkap}')>"
    
    @property
    def active_borrowings_count(self):
        """Get count of currently borrowed books"""
        return len([b for b in self.borrowings if b.status in ('borrowed', 'pending', 'pending_return')])
    
    @property
    def has_overdue(self):
        """Check if siswa has any overdue books"""
        return any(b.status == 'overdue' for b in self.borrowings)
    
    @property
    def unpaid_fines(self):
        """Get total unpaid fines"""
        return sum(b.fine_amount for b in self.borrowings if not b.fine_paid and b.fine_amount > 0)
