"""
Borrowing, Renewal, and Fine Payment Models
"""
from sqlalchemy import Column, String, Integer, Float, Boolean, Enum as SQLEnum, DateTime, Date, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime, date
import uuid
import enum

from app.database import Base


class BorrowingStatusEnum(str, enum.Enum):
    PENDING = "pending"
    BORROWED = "borrowed"
    PENDING_RETURN = "pending_return"
    RETURNED = "returned"
    OVERDUE = "overdue"
    REJECTED = "rejected"
    LOST = "lost"


class ConditionEnum(str, enum.Enum):
    GOOD = "good"
    DAMAGED = "damaged"
    LOST = "lost"


class PaymentTypeEnum(str, enum.Enum):
    CASH = "cash"
    TRANSFER = "transfer"


class Borrowing(Base):
    __tablename__ = "borrowings"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    siswa_id = Column(String(36), ForeignKey("siswas.id"), nullable=False)
    book_id = Column(String(36), ForeignKey("books.id"), nullable=False)
    petugas_id = Column(String(36), ForeignKey("petugas.id"), nullable=True)  # nullable for pending requests
    approved_by = Column(String(36), ForeignKey("petugas.id"), nullable=True)
    
    borrow_date = Column(Date, nullable=False, default=date.today)
    due_date = Column(Date, nullable=True)  # nullable for pending requests
    return_date = Column(Date, nullable=True)
    
    status = Column(SQLEnum(BorrowingStatusEnum), default=BorrowingStatusEnum.PENDING, nullable=False)
    
    # Fine related
    fine_amount = Column(Integer, nullable=False, default=0)
    fine_paid = Column(Boolean, nullable=False, default=False)
    
    # Return condition
    condition_return = Column(SQLEnum(ConditionEnum), nullable=True)
    notes = Column(Text, nullable=True)
    
    # Renewal count
    renewal_count = Column(Integer, nullable=False, default=0)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    siswa = relationship("Siswa", back_populates="borrowings")
    book = relationship("Book", back_populates="borrowings")
    renewals = relationship("Renewal", back_populates="borrowing", cascade="all, delete-orphan")
    fine_payments = relationship("FinePayment", back_populates="borrowing", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Borrowing(siswa='{self.siswa_id}', book='{self.book_id}', status='{self.status}')>"
    
    @property
    def is_overdue(self):
        """Check if borrowing is overdue"""
        if self.status in (BorrowingStatusEnum.RETURNED, BorrowingStatusEnum.PENDING, BorrowingStatusEnum.REJECTED):
            return False
        if self.due_date is None:
            return False
        return date.today() > self.due_date
    
    @property
    def days_overdue(self):
        """Calculate days overdue"""
        if not self.is_overdue:
            return 0
        return (date.today() - self.due_date).days
    
    @property
    def days_remaining(self):
        """Calculate days until due date"""
        if self.status in (BorrowingStatusEnum.RETURNED, BorrowingStatusEnum.PENDING):
            return 0
        if self.due_date is None:
            return 0
        return (self.due_date - date.today()).days


class Renewal(Base):
    __tablename__ = "renewals"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    borrowing_id = Column(String(36), ForeignKey("borrowings.id"), nullable=False)
    petugas_id = Column(String(36), ForeignKey("petugas.id"), nullable=False)
    old_due_date = Column(Date, nullable=False)
    new_due_date = Column(Date, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    borrowing = relationship("Borrowing", back_populates="renewals")
    
    def __repr__(self):
        return f"<Renewal(borrowing='{self.borrowing_id}', new_due='{self.new_due_date}')>"


class FinePayment(Base):
    __tablename__ = "fine_payments"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    borrowing_id = Column(String(36), ForeignKey("borrowings.id"), nullable=False)
    petugas_id = Column(String(36), ForeignKey("petugas.id"), nullable=False)
    amount = Column(Integer, nullable=False)
    payment_type = Column(SQLEnum(PaymentTypeEnum), default=PaymentTypeEnum.CASH, nullable=False)
    payment_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    borrowing = relationship("Borrowing", back_populates="fine_payments")
    
    def __repr__(self):
        return f"<FinePayment(borrowing='{self.borrowing_id}', amount='{self.amount}')>"
