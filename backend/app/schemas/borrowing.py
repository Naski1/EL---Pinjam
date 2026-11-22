"""
Borrowing, Renewal, and Fine Payment Schemas
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, date
from app.models.borrowing import BorrowingStatusEnum, ConditionEnum, PaymentTypeEnum


# === Borrowing Schemas ===

class BorrowingCreate(BaseModel):
    """Admin creates a borrowing directly (status=BORROWED)"""
    siswa_id: str
    book_ids: List[str] = Field(..., min_length=1)
    due_date: Optional[date] = None


class BorrowingRequest(BaseModel):
    """Siswa requests to borrow books (status=PENDING)"""
    book_ids: List[str] = Field(..., min_length=1)
    notes: Optional[str] = None


class BorrowingReturn(BaseModel):
    condition: ConditionEnum = ConditionEnum.GOOD
    notes: Optional[str] = None
    pay_fine: bool = True
    payment_type: PaymentTypeEnum = PaymentTypeEnum.CASH


class SiswaInfo(BaseModel):
    id: str
    nis: str
    nama_lengkap: str
    foto: Optional[str] = None
    sekolah: Optional[str] = None
    kelas: Optional[str] = None

    class Config:
        from_attributes = True


class BookInfo(BaseModel):
    id: str
    kode_buku: str
    judul: str
    penulis: Optional[str] = None

    class Config:
        from_attributes = True


class BorrowingResponse(BaseModel):
    id: str
    siswa_id: str
    book_id: str
    petugas_id: Optional[str] = None
    approved_by: Optional[str] = None
    siswa: Optional[SiswaInfo] = None
    book: Optional[BookInfo] = None
    borrow_date: date
    due_date: Optional[date] = None
    return_date: Optional[date] = None
    status: BorrowingStatusEnum
    fine_amount: int
    fine_paid: bool
    condition_return: Optional[ConditionEnum] = None
    notes: Optional[str] = None
    renewal_count: int
    days_remaining: int = 0
    days_overdue: int = 0
    is_overdue: bool = False
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class BorrowingListResponse(BaseModel):
    total: int
    page: int
    pages: int
    items: List[BorrowingResponse]


# === Renewal Schemas ===

class RenewalCreate(BaseModel):
    borrowing_id: str
    extend_days: int = Field(7, ge=1, le=30)


class RenewalResponse(BaseModel):
    id: str
    borrowing_id: str
    old_due_date: date
    new_due_date: date
    created_at: datetime

    class Config:
        from_attributes = True


# === Fine Payment Schemas ===

class FinePaymentCreate(BaseModel):
    borrowing_id: str
    amount: int = Field(..., ge=0)
    payment_type: PaymentTypeEnum = PaymentTypeEnum.CASH
    notes: Optional[str] = None


class FinePaymentResponse(BaseModel):
    id: str
    borrowing_id: str
    amount: int
    payment_type: PaymentTypeEnum
    payment_date: datetime
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# === Dashboard Schemas ===

class DashboardStats(BaseModel):
    total_borrowings_today: int = 0
    total_returns_today: int = 0
    total_fines_today: int = 0
    active_borrowings: int = 0
    overdue_borrowings: int = 0
    pending_requests: int = 0
    pending_returns: int = 0
    books_due_today: int = 0
    total_books: int = 0
    total_siswa: int = 0


class OverdueAlert(BaseModel):
    borrowing_id: str
    siswa_nis: str
    siswa_nama: str
    book_judul: str
    due_date: date
    days_overdue: int
    fine_amount: int


class DueTodayAlert(BaseModel):
    borrowing_id: str
    siswa_nis: str
    siswa_nama: str
    book_judul: str
    kelas: Optional[str] = None
