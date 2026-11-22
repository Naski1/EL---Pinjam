"""
Settings Model - Application Configuration
"""
from sqlalchemy import Column, String, Text, DateTime
from datetime import datetime
import uuid

from app.database import Base


class Setting(Base):
    __tablename__ = "settings"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    key = Column(String(50), unique=True, nullable=False, index=True)
    value = Column(Text, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<Setting(key='{self.key}', value='{self.value}')>"


# Default settings to be inserted on first run
DEFAULT_SETTINGS = [
    {
        "key": "durasi_pinjam",
        "value": "7",
        "description": "Durasi peminjaman default dalam hari"
    },
    {
        "key": "maksimal_buku",
        "value": "3",
        "description": "Maksimal jumlah buku yang dapat dipinjam per santri"
    },
    {
        "key": "maksimal_perpanjangan",
        "value": "2",
        "description": "Maksimal jumlah perpanjangan per peminjaman"
    },
    {
        "key": "denda_per_hari",
        "value": "1000",
        "description": "Nominal denda per hari keterlambatan dalam rupiah"
    },
    {
        "key": "denda_rusak_multiplier",
        "value": "0.5",
        "description": "Pengali harga buku untuk denda buku rusak"
    },
    {
        "key": "denda_hilang_multiplier",
        "value": "2",
        "description": "Pengali harga buku untuk denda buku hilang"
    },
    {
        "key": "nama_perpustakaan",
        "value": "Perpustakaan Pesantren",
        "description": "Nama perpustakaan untuk header dan cetakan"
    },
    {
        "key": "alamat_perpustakaan",
        "value": "",
        "description": "Alamat perpustakaan untuk cetakan"
    }
]
