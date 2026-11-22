"""
Borrowing Router - Complete Transaction System
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc
from typing import Optional, Any
from datetime import date, timedelta

from app.database import get_db
from app.models.borrowing import Borrowing, Renewal, FinePayment, BorrowingStatusEnum, ConditionEnum, PaymentTypeEnum
from app.models.santri import Santri, SantriStatusEnum
from app.models.book import Book, BookStatusEnum
from app.models.petugas import Petugas
from app.models.settings import Setting
from app.schemas.borrowing import (
    BorrowingCreate, BorrowingReturn, BorrowingResponse, BorrowingListResponse,
    RenewalCreate, RenewalResponse,
    FinePaymentCreate, FinePaymentResponse
)
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api/borrowings", tags=["Borrowings"])


def get_setting_value(db: Session, key: str, default: Any) -> Any:
    """Get setting value from database with type inference"""
    setting = db.query(Setting).filter(Setting.key == key).first()
    if setting:
        try:
            if isinstance(default, int):
                return int(float(setting.value)) # Handle '2.0' as int 2
            elif isinstance(default, float):
                return float(setting.value)
            return setting.value
        except:
            return default
    return default


def calculate_fine(days_overdue: int, fine_per_day: int) -> int:
    """Calculate fine based on days overdue"""
    if days_overdue <= 0:
        return 0
    return days_overdue * fine_per_day


# === BORROWING ENDPOINTS ===

@router.get("", response_model=BorrowingListResponse)
def list_borrowings(
    page: int = 1,
    limit: int = 10,
    search: Optional[str] = None,
    status: Optional[str] = None,
    santri_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user)
):
    """List borrowings with pagination and filters"""
    query = db.query(Borrowing).join(Santri).join(Book)
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Santri.nama_lengkap.ilike(search_term),
                Santri.nis.ilike(search_term),
                Book.judul.ilike(search_term),
                Book.kode_buku.ilike(search_term)
            )
        )
    
    if status:
        if status == 'lost':
            # Filter for lost items (either status is lost OR condition is lost)
            query = query.filter(
                or_(
                    Borrowing.status == BorrowingStatusEnum.LOST,
                    Borrowing.condition_return == ConditionEnum.LOST
                )
            )
        else:
            query = query.filter(Borrowing.status == status)
        
    if santri_id:
        query = query.filter(Borrowing.santri_id == santri_id)
        
    # Sort by date desc
    query = query.order_by(desc(Borrowing.updated_at))
    
    total = query.count()
    items = query.offset((page - 1) * limit).limit(limit).all()
    
    return {
        "items": items,
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit
    }


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_borrowing(
    data: BorrowingCreate,
    db: Session = Depends(get_db),
    current_user: Petugas = Depends(get_current_user)
):
    """Create new borrowing (checkout books)"""
    # Validate santri
    santri = db.query(Santri).filter(Santri.id == data.santri_id).first()
    if not santri:
        raise HTTPException(status_code=404, detail="Santri tidak ditemukan")
    
    if santri.status != SantriStatusEnum.ACTIVE:
        raise HTTPException(status_code=400, detail="Santri tidak aktif")
    
    # Get settings
    max_borrow = get_setting_value(db, "maksimal_buku", 3)
    loan_duration = get_setting_value(db, "durasi_pinjam", 7)
    
    # Check current borrowings count
    current_borrowings = db.query(Borrowing).filter(
        Borrowing.santri_id == data.santri_id,
        Borrowing.status == BorrowingStatusEnum.BORROWED
    ).count()
    
    if current_borrowings + len(data.book_ids) > max_borrow:
        raise HTTPException(
            status_code=400, 
            detail=f"Santri hanya dapat meminjam maksimal {max_borrow} buku. Saat ini sudah meminjam {current_borrowings} buku."
        )
    
    # Check if santri has overdue books
    has_overdue = db.query(Borrowing).filter(
        Borrowing.santri_id == data.santri_id,
        Borrowing.status == BorrowingStatusEnum.BORROWED,
        Borrowing.due_date < date.today()
    ).count() > 0
    
    if has_overdue:
        raise HTTPException(
            status_code=400, 
            detail="Santri memiliki buku yang terlambat dikembalikan. Harap kembalikan terlebih dahulu."
        )
    
    # Check if santri has unpaid fines
    unpaid_fines = db.query(Borrowing).filter(
        Borrowing.santri_id == data.santri_id,
        Borrowing.fine_amount > 0,
        Borrowing.fine_paid == False
    ).count() > 0
    
    if unpaid_fines:
        raise HTTPException(
            status_code=400, 
            detail="Santri memiliki denda yang belum dibayar."
        )
    
    # Calculate due date
    due_date = data.due_date if data.due_date else date.today() + timedelta(days=loan_duration)
    
    # Process each book
    created_borrowings = []
    
    for book_id in data.book_ids:
        # Validate book
        book = db.query(Book).filter(Book.id == book_id).first()
        if not book:
            raise HTTPException(status_code=404, detail=f"Buku dengan ID {book_id} tidak ditemukan")
        
        if book.status != BookStatusEnum.AVAILABLE:
            raise HTTPException(status_code=400, detail=f"Buku '{book.judul}' tidak tersedia")
        
        if book.stok_tersedia <= 0:
            raise HTTPException(status_code=400, detail=f"Stok buku '{book.judul}' habis")
        
        # Check if santri already borrowing this book
        already_borrowing = db.query(Borrowing).filter(
            Borrowing.santri_id == data.santri_id,
            Borrowing.book_id == book_id,
            Borrowing.status == BorrowingStatusEnum.BORROWED
        ).first()
        
        if already_borrowing:
            raise HTTPException(status_code=400, detail=f"Santri sudah meminjam buku '{book.judul}'")
        
        # Create borrowing record
        borrowing = Borrowing(
            santri_id=data.santri_id,
            book_id=book_id,
            petugas_id=current_user.id,
            borrow_date=date.today(),
            due_date=due_date,
            status=BorrowingStatusEnum.BORROWED
        )
        
        # DECREASE BOOK STOCK
        book.stok_tersedia -= 1
        
        # Auto-update status if out of stock
        if book.stok_tersedia == 0:
            book.status = BookStatusEnum.UNAVAILABLE
        
        db.add(borrowing)
        created_borrowings.append({
            "book_judul": book.judul,
            "book_kode": book.kode_buku,
            "due_date": str(due_date)
        })
    
    db.commit()
    
    return {
        "message": f"Berhasil meminjam {len(created_borrowings)} buku",
        "borrowings": created_borrowings,
        "santri_nama": santri.nama_lengkap,
        "due_date": str(due_date)
    }


@router.get("/{borrowing_id}", response_model=BorrowingResponse)
async def get_borrowing(
    borrowing_id: str,
    db: Session = Depends(get_db),
    current_user: Petugas = Depends(get_current_user)
):
    """Get borrowing detail"""
    borrowing = db.query(Borrowing).filter(Borrowing.id == borrowing_id).first()
    if not borrowing:
        raise HTTPException(status_code=404, detail="Data peminjaman tidak ditemukan")
    
    return BorrowingResponse(
        id=borrowing.id,
        santri_id=borrowing.santri_id,
        book_id=borrowing.book_id,
        petugas_id=borrowing.petugas_id,
        santri={
            "id": borrowing.santri.id,
            "nis": borrowing.santri.nis,
            "nama_lengkap": borrowing.santri.nama_lengkap,
            "asrama_nama": borrowing.santri.asrama.nama_asrama if borrowing.santri.asrama else None,
            "kamar_nama": borrowing.santri.kamar.nama_kamar if borrowing.santri.kamar else None,
        } if borrowing.santri else None,
        book={
            "id": borrowing.book.id,
            "kode_buku": borrowing.book.kode_buku,
            "judul": borrowing.book.judul,
            "penulis": borrowing.book.penulis,
        } if borrowing.book else None,
        borrow_date=borrowing.borrow_date,
        due_date=borrowing.due_date,
        return_date=borrowing.return_date,
        status=borrowing.status,
        fine_amount=borrowing.fine_amount,
        fine_paid=borrowing.fine_paid,
        condition_return=borrowing.condition_return,
        notes=borrowing.notes,
        renewal_count=borrowing.renewal_count,
        days_remaining=borrowing.days_remaining,
        days_overdue=borrowing.days_overdue,
        is_overdue=borrowing.is_overdue,
        created_at=borrowing.created_at,
        updated_at=borrowing.updated_at,
    )


@router.post("/{borrowing_id}/return")
async def return_book(
    borrowing_id: str,
    data: BorrowingReturn,
    db: Session = Depends(get_db),
    current_user: Petugas = Depends(get_current_user)
):
    """Return a borrowed book"""
    borrowing = db.query(Borrowing).filter(Borrowing.id == borrowing_id).first()
    if not borrowing:
        raise HTTPException(status_code=404, detail="Data peminjaman tidak ditemukan")
    
    if borrowing.status == BorrowingStatusEnum.RETURNED:
        raise HTTPException(status_code=400, detail="Buku sudah dikembalikan")
    
    # Get fine per day setting
    denda_per_hari = get_setting_value(db, "denda_per_hari", 1000)
    
    # Calculate fine if overdue
    days_overdue = 0
    fine_amount = 0
    
    if borrowing.due_date < date.today():
        days_overdue = (date.today() - borrowing.due_date).days
        fine_amount = calculate_fine(days_overdue, denda_per_hari)
    
    # Additional fine for damaged/lost condition
    book = db.query(Book).filter(Book.id == borrowing.book_id).first()
    default_book_price = 50000  # Default book price if not set (Rp 50.000)
    
    if data.condition == ConditionEnum.DAMAGED:
        # Add book price * multiplier as damage fee
        damage_multiplier = get_setting_value(db, "denda_rusak_multiplier", 0.5)
        book_price = book.harga if book and book.harga else default_book_price
        damage_fine = int(book_price * damage_multiplier)
        fine_amount += damage_fine
    elif data.condition == ConditionEnum.LOST:
        # Add book price * multiplier as lost fee
        lost_multiplier = get_setting_value(db, "denda_hilang_multiplier", 1.5)
        book_price = book.harga if book and book.harga else default_book_price
        lost_fine = int(book_price * lost_multiplier)
        fine_amount += lost_fine
    
    # Update borrowing record
    borrowing.return_date = date.today()
    borrowing.status = BorrowingStatusEnum.RETURNED
    borrowing.condition_return = data.condition
    borrowing.notes = data.notes
    borrowing.fine_amount = fine_amount
    
    # If paying fine immediately
    if fine_amount > 0 and data.pay_fine:
        borrowing.fine_paid = True
        # Create fine payment record
        payment = FinePayment(
            borrowing_id=borrowing.id,
            petugas_id=current_user.id,
            amount=fine_amount,
            payment_type=data.payment_type,
            notes=f"Pembayaran denda saat pengembalian"
        )
        db.add(payment)
    
    # RESTORE BOOK STOCK (except if lost)
    if data.condition != ConditionEnum.LOST:
        book = db.query(Book).filter(Book.id == borrowing.book_id).first()
        if book:
            book.stok_tersedia += 1
            # Auto-update status if previously unavailable
            if book.stok_tersedia > 0 and book.status == BookStatusEnum.UNAVAILABLE:
                book.status = BookStatusEnum.AVAILABLE
            # Update book status if damaged
            if data.condition == ConditionEnum.DAMAGED:
                # Only update status if this is the last copy that was damaged
                pass  # Keep as is, just track the return condition
    else:
        # Book is lost, decrease total stock
        book = db.query(Book).filter(Book.id == borrowing.book_id).first()
        if book:
            book.total_stok -= 1
            if book.total_stok == 0:
                book.status = BookStatusEnum.LOST
    
    db.commit()
    
    result = {
        "message": "Buku berhasil dikembalikan",
        "return_date": str(date.today()),
        "condition": data.condition.value,
    }
    
    if fine_amount > 0:
        result["fine_amount"] = fine_amount
        result["fine_paid"] = data.pay_fine
        if days_overdue > 0:
            result["days_overdue"] = days_overdue
    
    return result


@router.post("/{borrowing_id}/renew", response_model=RenewalResponse)
async def renew_borrowing(
    borrowing_id: str,
    data: RenewalCreate,
    db: Session = Depends(get_db),
    current_user: Petugas = Depends(get_current_user)
):
    """Renew/extend borrowing period"""
    borrowing = db.query(Borrowing).filter(Borrowing.id == borrowing_id).first()
    if not borrowing:
        raise HTTPException(status_code=404, detail="Data peminjaman tidak ditemukan")
    
    if borrowing.status != BorrowingStatusEnum.BORROWED:
        raise HTTPException(status_code=400, detail="Hanya peminjaman aktif yang dapat diperpanjang")
    
    # Check max renewals
    maksimal_perpanjangan = get_setting_value(db, "maksimal_perpanjangan", 2)
    if borrowing.renewal_count >= maksimal_perpanjangan:
        raise HTTPException(
            status_code=400, 
            detail=f"Perpanjangan maksimal {maksimal_perpanjangan} kali sudah tercapai"
        )
    
    # Check if overdue
    if borrowing.is_overdue:
        raise HTTPException(
            status_code=400, 
            detail="Tidak dapat memperpanjang peminjaman yang sudah terlambat"
        )
    
    # Create renewal record
    old_due_date = borrowing.due_date
    new_due_date = old_due_date + timedelta(days=data.extend_days)
    
    renewal = Renewal(
        borrowing_id=borrowing.id,
        petugas_id=current_user.id,
        old_due_date=old_due_date,
        new_due_date=new_due_date
    )
    
    # Update borrowing
    borrowing.due_date = new_due_date
    borrowing.renewal_count += 1
    
    db.add(renewal)
    db.commit()
    db.refresh(renewal)
    
    return RenewalResponse(
        id=renewal.id,
        borrowing_id=renewal.borrowing_id,
        old_due_date=renewal.old_due_date,
        new_due_date=renewal.new_due_date,
        created_at=renewal.created_at
    )


# === FINE PAYMENT ENDPOINTS ===

@router.post("/fines/pay", response_model=FinePaymentResponse)
async def pay_fine(
    data: FinePaymentCreate,
    db: Session = Depends(get_db),
    current_user: Petugas = Depends(get_current_user)
):
    """Pay fine for a borrowing"""
    borrowing = db.query(Borrowing).filter(Borrowing.id == data.borrowing_id).first()
    if not borrowing:
        raise HTTPException(status_code=404, detail="Data peminjaman tidak ditemukan")
    
    if borrowing.fine_amount == 0:
        raise HTTPException(status_code=400, detail="Tidak ada denda untuk peminjaman ini")
    
    if borrowing.fine_paid:
        raise HTTPException(status_code=400, detail="Denda sudah dibayar")
    
    # Create payment record
    payment = FinePayment(
        borrowing_id=borrowing.id,
        petugas_id=current_user.id,
        amount=data.amount,
        payment_type=data.payment_type,
        notes=data.notes
    )
    
    # Mark fine as paid if payment covers it
    if data.amount >= borrowing.fine_amount:
        borrowing.fine_paid = True
    
    db.add(payment)
    db.commit()
    db.refresh(payment)
    
    return FinePaymentResponse(
        id=payment.id,
        borrowing_id=payment.borrowing_id,
        amount=payment.amount,
        payment_type=payment.payment_type,
        payment_date=payment.payment_date,
        notes=payment.notes,
        created_at=payment.created_at
    )


# === UTILITY ENDPOINTS ===

@router.get("/santri/{santri_id}/active")
async def get_santri_active_borrowings(
    santri_id: str,
    db: Session = Depends(get_db),
    current_user: Petugas = Depends(get_current_user)
):
    """Get active borrowings for a specific santri"""
    santri = db.query(Santri).filter(Santri.id == santri_id).first()
    if not santri:
        raise HTTPException(status_code=404, detail="Santri tidak ditemukan")
    
    borrowings = db.query(Borrowing).filter(
        Borrowing.santri_id == santri_id,
        Borrowing.status == BorrowingStatusEnum.BORROWED
    ).all()
    
    return {
        "santri": {
            "id": santri.id,
            "nis": santri.nis,
            "nama_lengkap": santri.nama_lengkap
        },
        "active_borrowings": [
            {
                "id": b.id,
                "book_judul": b.book.judul,
                "book_kode": b.book.kode_buku,
                "borrow_date": str(b.borrow_date),
                "due_date": str(b.due_date),
                "days_remaining": b.days_remaining,
                "is_overdue": b.is_overdue,
                "days_overdue": b.days_overdue
            }
            for b in borrowings
        ],
        "total_active": len(borrowings)
    }


@router.delete("/{borrowing_id}")
def delete_borrowing(
    borrowing_id: str,
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_user)
):
    """Delete borrowing record and restore stock if necessary"""
    borrowing = db.query(Borrowing).filter(Borrowing.id == borrowing_id).first()
    if not borrowing:
        raise HTTPException(status_code=404, detail="Data peminjaman tidak ditemukan")
        
    book = db.query(Book).filter(Book.id == borrowing.book_id).first()
    
    # Restore stock logic based on status
    if book:
        if borrowing.status == BorrowingStatusEnum.BORROWED:
            # Active borrowing being deleted -> simply restore stock
            book.stok_tersedia += 1
            if book.stok_tersedia > 0 and book.status == BookStatusEnum.UNAVAILABLE:
                book.status = BookStatusEnum.AVAILABLE
            
        elif borrowing.status == BorrowingStatusEnum.RETURNED:
            # Returned borrowing being deleted
            if borrowing.condition_return == ConditionEnum.LOST:
                # If it was lost, we reduced total_stok. Restore it.
                book.total_stok += 1
                book.stok_tersedia += 1 # It's back available now
                if book.stok_tersedia > 0:
                    book.status = BookStatusEnum.AVAILABLE
            else:
                # If it was returned good/damaged, we already restored stock.
                pass
    
    db.delete(borrowing)
    db.commit()
    
    return {"message": "Data peminjaman berhasil dihapus"}
