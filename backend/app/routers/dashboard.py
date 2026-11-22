from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_
from typing import List, Optional
from datetime import date, timedelta, datetime
from app.database import get_db
from app.models.book import Book, BookStatusEnum
from app.models.santri import Santri, SantriStatusEnum
from app.models.asrama import Asrama
from app.models.borrowing import Borrowing, BorrowingStatusEnum
from app.models.category import Category

router = APIRouter(
    prefix="/api/dashboard",
    tags=["Dashboard"],
    responses={404: {"description": "Not found"}},
)

@router.get("/stats")
async def get_dashboard_stats(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    period: str = Query("this_month", description="Filter period preset"),
    db: Session = Depends(get_db)
):
    """
    Get dashboard statistics based on date filter.
    If custom start_date/end_date provided, uses those.
    Otherwise calculates based on 'period'.
    """
    
    # 1. Determine Date Range
    today = date.today()
    if not start_date or not end_date:
        if period == "today":
            start_date = today
            end_date = today
        elif period == "yesterday":
            start_date = today - timedelta(days=1)
            end_date = today - timedelta(days=1)
        elif period == "this_week":
            # Monday as start of week
            start_date = today - timedelta(days=today.weekday())
            end_date = today
        elif period == "last_week":
            # Start of last week
            start_date = today - timedelta(days=today.weekday() + 7)
            end_date = start_date + timedelta(days=6)
        elif period == "this_month":
            start_date = date(today.year, today.month, 1)
            end_date = today
        elif period == "last_month":
            # First day of last month
            last_month_end = date(today.year, today.month, 1) - timedelta(days=1)
            start_date = date(last_month_end.year, last_month_end.month, 1)
            end_date = last_month_end
        elif period == "this_year":
            start_date = date(today.year, 1, 1)
            end_date = today
        elif period == "last_year":
            start_date = date(today.year - 1, 1, 1)
            end_date = date(today.year - 1, 12, 31)
        elif period == "all_time":
            start_date = date(2000, 1, 1) # Arbitrary old date
            end_date = today
        else:
            # Default to this month
            start_date = date(today.year, today.month, 1)
            end_date = today

    # Ensure end_date includes the full day if needed (for datetime comparisons), 
    # but for date fields it's fine.
    
    # 2. Main Stats Cards
    # Total Books (Inventory)
    total_books = db.query(func.sum(Book.total_stok)).scalar() or 0
    
    # Total Santri (Active)
    total_santri = db.query(Santri).filter(Santri.status == SantriStatusEnum.ACTIVE).count()
    
    # Total Dorms
    total_asrama = db.query(Asrama).count()
    
    # Active Borrowings
    active_borrowings = db.query(Borrowing).filter(
        Borrowing.status == BorrowingStatusEnum.BORROWED
    ).count()

    # 3. Chart: Trend Peminjaman (Borrowings in Period)
    # Group by date
    borrowing_trend_query = db.query(
        Borrowing.borrow_date, 
        func.count(Borrowing.id)
    ).filter(
        Borrowing.borrow_date >= start_date,
        Borrowing.borrow_date <= end_date
    ).group_by(Borrowing.borrow_date).all()
    
    # Format for chart (fill missing dates with 0)
    data_map = {str(b_date): count for b_date, count in borrowing_trend_query}
    chart_data = []
    
    # Iterate through all days in range to ensure continuous axis
    current_date = start_date
    while current_date <= end_date:
        date_str = str(current_date)
        chart_data.append({
            "date": date_str,
            "count": data_map.get(date_str, 0)
        })
        current_date += timedelta(days=1)

    # 3b. Top Books (Most Borrowed in Period)
    top_books_query = db.query(
        Book.judul, 
        func.count(Borrowing.id).label('total')
    ).join(Borrowing).filter(
        Borrowing.borrow_date >= start_date,
        Borrowing.borrow_date <= end_date
    ).group_by(Book.id).order_by(desc('total')).limit(5).all()

    top_books = [{"title": title, "count": count} for title, count in top_books_query]
    
    # 4. Donut: Category Distribution (Global)
    category_dist_query = db.query(
        Category.nama_kategori, 
        func.count(Book.id)
    ).join(Book).group_by(Category.id).all()
    
    category_dist = [{"name": name, "count": count} for name, count in category_dist_query]
    
    # 5. Recent Loans (Filtered by Period)
    recent_loans_query = db.query(Borrowing).filter(
        Borrowing.borrow_date >= start_date,
        Borrowing.borrow_date <= end_date
    ).order_by(
        desc(Borrowing.created_at)
    ).limit(5).all()
    
    recent_loans = []
    for loan in recent_loans_query:
        # Determine status display text if needed, or just use enum
        # Fixing potential issue where frontend expects specific status strings if backend enums differ
        status_str = loan.status.value if hasattr(loan.status, 'value') else str(loan.status)
        
        recent_loans.append({
            "santri_nama": loan.siswa.nama_lengkap if loan.siswa else "Unknown",
            "santri_kamar": "-",
            "book_judul": loan.book.judul if loan.book else "Unknown",
            "status": status_str, 
            "date": loan.borrow_date
        })

    # 6. Due In Period (Was Due Today)
    # Filter items due within the selected date range that are still BORROWED (Active/Overdue)
    # If looking at history, this shows what was missed? 
    # Or should it show EVERYTHING due then?
    # Usually dashboard "Due/Jatuh Tempo" implies actionable warnings.
    # So "Status == BORROWED" is correct for "Outstanding".
    
    due_loans_query = db.query(Borrowing).filter(
        Borrowing.status == BorrowingStatusEnum.BORROWED,
        Borrowing.due_date >= start_date,
        Borrowing.due_date <= end_date
    ).order_by(Borrowing.due_date.asc()).limit(5).all()
    
    due_loans = []
    for loan in due_loans_query:
         due_loans.append({
            "santri_nama": loan.siswa.nama_lengkap if loan.siswa else "Unknown",
            "asrama_nama": "-",
            "book_judul": loan.book.judul if loan.book else "Unknown",
            "due_time": "23:59", # Just generic deadline
            "due_date": loan.due_date
        })

    # 7. Borrowing Status Distribution (Active Loans Breakdown)
    # 7. Borrowing Status Distribution (Period-based Performance)
    # Include ALL borrowings in the selected period (created/borrowed in this period)
    # Logic:
    # - RETURNED:
    #   - return_date <= due_date -> On Time
    #   - return_date > due_date -> Overdue (Terlambat)
    # - BORROWED:
    #   - due_date < today -> Overdue
    #   - today <= due_date <= warning_threshold -> Warning
    #   - due_date > warning_threshold -> On Time
    
    period_loans = db.query(Borrowing).filter(
        Borrowing.borrow_date >= start_date,
        Borrowing.borrow_date <= end_date
    ).all()
    
    status_dist = {
        "overdue": 0,
        "warning": 0,
        "on_time": 0
    }
    
    warning_threshold = today + timedelta(days=2)
    
    for loan in period_loans:
        if loan.status == BorrowingStatusEnum.RETURNED:
            # Check actual return performance
            if loan.return_date and loan.return_date > loan.due_date:
                status_dist["overdue"] += 1
            else:
                status_dist["on_time"] += 1
        else:
            # Status is BORROWED (Active)
            if loan.due_date < today:
                status_dist["overdue"] += 1
            elif today <= loan.due_date <= warning_threshold:
                status_dist["warning"] += 1
            else:
                status_dist["on_time"] += 1

    return {
        "stats": {
            "total_books": total_books,
            "total_santri": total_santri,
            "total_asrama": total_asrama,
            "active_borrowings": active_borrowings
        },
        "period_info": {
            "start_date": start_date,
            "end_date": end_date,
            "period": period
        },
        "chart_data": chart_data,
        "top_books": top_books,
        "category_distribution": category_dist,
        "recent_loans": recent_loans,
        "due_today": due_loans, # Maintaining key 'due_today' for minimal frontend impact initially, but better to rename.
                                # Wait, I should rename it if I want to be clean. 
                                # But let's keep the key `due_today` in the JSON response but populate it with `due_loans` list.
                                # Actually, user might be confused if "Due Today" shows old dates.
                                # I will output "due_today" key for compatibility BUT containing filtered data.
        "borrowing_status_distribution": status_dist
    }
