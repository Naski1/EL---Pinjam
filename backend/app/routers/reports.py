"""
Reports API Router
Provides endpoints for generating various reports with filtering and export capabilities.
"""
from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_, or_, case
from datetime import date, timedelta
from typing import Optional, List
import io

from app.database import get_db
from app.models import Borrowing, Siswa, Book, Category, Asrama, Kamar
from app.models.borrowing import BorrowingStatusEnum

# For Excel export
from openpyxl import Workbook
from openpyxl.styles import Font, Alignment, Border, Side, PatternFill
from openpyxl.utils import get_column_letter

# For PDF export
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, cm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

router = APIRouter(
    prefix="/api/reports",
    tags=["Reports"],
    responses={404: {"description": "Not found"}},
)


# ============== HELPER FUNCTIONS ==============

def get_date_range(period: str, start_date: Optional[date] = None, end_date: Optional[date] = None):
    """Get date range based on period or custom dates"""
    today = date.today()
    
    if start_date and end_date:
        return start_date, end_date
    
    if period == "today":
        return today, today
    elif period == "yesterday":
        yesterday = today - timedelta(days=1)
        return yesterday, yesterday
    elif period == "this_week":
        start = today - timedelta(days=today.weekday())
        return start, today
    elif period == "last_week":
        start = today - timedelta(days=today.weekday() + 7)
        end = start + timedelta(days=6)
        return start, end
    elif period == "this_month":
        start = today.replace(day=1)
        return start, today
    elif period == "last_month":
        last_month_end = today.replace(day=1) - timedelta(days=1)
        last_month_start = last_month_end.replace(day=1)
        return last_month_start, last_month_end
    elif period == "this_year":
        start = today.replace(month=1, day=1)
        return start, today
    elif period == "last_year":
        start = today.replace(year=today.year - 1, month=1, day=1)
        end = today.replace(year=today.year - 1, month=12, day=31)
        return start, end
    else:  # all_time
        return date(2000, 1, 1), today


# ============== BORROWING REPORTS ==============

@router.get("/borrowings")
def get_borrowing_report(
    db: Session = Depends(get_db),
    period: str = Query("this_month"),
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    asrama_id: Optional[int] = None,
    santri_id: Optional[int] = None,
    category_id: Optional[int] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
):
    """
    Laporan Peminjaman
    - Filter by date, asrama, santri, category, status
    """
    start, end = get_date_range(period, start_date, end_date)
    
    query = db.query(Borrowing).filter(
        Borrowing.borrow_date >= start,
        Borrowing.borrow_date <= end
    )
    
    # Apply filters
    if santri_id:
        query = query.filter(Borrowing.siswa_id == santri_id)
    
    if category_id:
        query = query.join(Book).filter(Book.category_id == category_id)
    
    if status:
        query = query.filter(Borrowing.status == status)
    
    # Get total count
    total = query.count()
    
    # Get paginated results
    borrowings = query.order_by(desc(Borrowing.borrow_date)).offset(skip).limit(limit).all()
    
    # Format results
    items = []
    for b in borrowings:
        items.append({
            "id": b.id,
            "santri_nis": b.siswa.nis if b.siswa else None,
            "santri_nama": b.siswa.nama_lengkap if b.siswa else "Unknown",
            "asrama": "-",
            "book_kode": b.book.kode_buku if b.book else None,
            "book_judul": b.book.judul if b.book else "Unknown",
            "category": b.book.category.nama_kategori if (b.book and b.book.category) else "-",
            "borrow_date": str(b.borrow_date),
            "due_date": str(b.due_date),
            "return_date": str(b.return_date) if b.return_date else None,
            "status": b.status.value if hasattr(b.status, 'value') else str(b.status),
            "fine_amount": b.fine_amount or 0,
            "is_overdue": b.is_overdue
        })
    
    # Summary stats
    summary = {
        "total_borrowings": total,
        "borrowed": sum(1 for i in items if i["status"] == "BORROWED"),
        "returned": sum(1 for i in items if i["status"] == "RETURNED"),
        "overdue": sum(1 for i in items if i["is_overdue"]),
        "total_fine": sum(i["fine_amount"] for i in items),
        "period": f"{start} - {end}"
    }
    
    return {
        "items": items,
        "total": total,
        "summary": summary
    }


# ============== RETURN REPORTS ==============

@router.get("/returns")
def get_return_report(
    db: Session = Depends(get_db),
    period: str = Query("this_month"),
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    report_type: str = Query("all", description="all, on_time, late"),
    skip: int = 0,
    limit: int = 100
):
    """
    Laporan Pengembalian
    - on_time: Tepat waktu
    - late: Terlambat
    - all: Semua pengembalian
    """
    start, end = get_date_range(period, start_date, end_date)
    
    query = db.query(Borrowing).filter(
        Borrowing.status == BorrowingStatusEnum.RETURNED,
        Borrowing.return_date >= start,
        Borrowing.return_date <= end
    )
    
    # Get all returns first to categorize
    all_returns = query.all()
    
    on_time_list = []
    late_list = []
    
    for b in all_returns:
        item = {
            "id": b.id,
            "santri_nama": b.siswa.nama_lengkap if b.siswa else "Unknown",
            "santri_nis": b.siswa.nis if b.siswa else None,
            "asrama": "-",
            "book_judul": b.book.judul if b.book else "Unknown",
            "borrow_date": str(b.borrow_date),
            "due_date": str(b.due_date),
            "return_date": str(b.return_date),
            "days_late": (b.return_date - b.due_date).days if b.return_date and b.return_date > b.due_date else 0,
            "fine_amount": b.fine_amount or 0
        }
        
        if b.return_date and b.return_date > b.due_date:
            late_list.append(item)
        else:
            on_time_list.append(item)
    
    # Filter by report type
    if report_type == "on_time":
        items = on_time_list
    elif report_type == "late":
        items = late_list
    else:
        items = on_time_list + late_list
    
    # Pagination
    paginated = items[skip:skip + limit]
    
    # Summary
    total_fine = sum(i["fine_amount"] for i in late_list)
    
    summary = {
        "total_returns": len(all_returns),
        "on_time_count": len(on_time_list),
        "late_count": len(late_list),
        "total_fine_collected": total_fine,
        "on_time_percentage": round((len(on_time_list) / len(all_returns) * 100), 1) if all_returns else 0,
        "period": f"{start} - {end}"
    }
    
    return {
        "items": paginated,
        "total": len(items),
        "summary": summary
    }


# ============== BOOK STOCK REPORTS ==============

@router.get("/books")
def get_book_report(
    db: Session = Depends(get_db),
    report_type: str = Query("all", description="all, popular, rare, lost"),
    category_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100
):
    """
    Laporan Stok Buku
    - all: Semua buku
    - popular: Sering dipinjam (>5x)
    - rare: Jarang dipinjam (<3x)
    - lost: Hilang/Rusak
    """
    # Base query with borrow count
    query = db.query(
        Book,
        func.count(Borrowing.id).label('borrow_count')
    ).outerjoin(Borrowing).group_by(Book.id)
    
    if category_id:
        query = query.filter(Book.category_id == category_id)
    
    # Get all books with counts
    all_books = query.all()
    
    items = []
    popular_count = 0
    rare_count = 0
    lost_count = 0
    
    for book, borrow_count in all_books:
        item = {
            "id": book.id,
            "kode_buku": book.kode_buku,
            "judul": book.judul,
            "penulis": book.penulis,
            "penerbit": book.penerbit,
            "category": book.category.nama_kategori if book.category else "-",
            "total_stok": book.total_stok,
            "stok_tersedia": book.stok_tersedia,
            "borrow_count": borrow_count,
            "status": book.status.value if hasattr(book.status, 'value') else str(book.status)
        }
        
        # Categorize
        if borrow_count >= 5:
            popular_count += 1
            item["popularity"] = "popular"
        elif borrow_count < 3:
            rare_count += 1
            item["popularity"] = "rare"
        else:
            item["popularity"] = "normal"
        
        if book.status.value == "unavailable":
            lost_count += 1
        
        # Filter by report type
        if report_type == "popular" and borrow_count >= 5:
            items.append(item)
        elif report_type == "rare" and borrow_count < 3:
            items.append(item)
        elif report_type == "lost" and book.status.value == "unavailable":
            items.append(item)
        elif report_type == "all":
            items.append(item)
    
    # Sort by borrow count for popular, reverse for rare
    if report_type == "popular":
        items.sort(key=lambda x: x["borrow_count"], reverse=True)
    elif report_type == "rare":
        items.sort(key=lambda x: x["borrow_count"])
    
    # Pagination
    paginated = items[skip:skip + limit]
    
    summary = {
        "total_books": len(all_books),
        "total_stok": sum(b.total_stok for b, _ in all_books),
        "stok_tersedia": sum(b.stok_tersedia for b, _ in all_books),
        "popular_books": popular_count,
        "rare_books": rare_count,
        "unavailable_books": lost_count
    }
    
    return {
        "items": paginated,
        "total": len(items),
        "summary": summary
    }


# ============== SANTRI REPORTS ==============

@router.get("/santri")
def get_santri_report(
    db: Session = Depends(get_db),
    report_type: str = Query("all", description="all, active, with_fine, never_borrowed"),
    asrama_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100
):
    """
    Laporan Santri
    - all: Semua santri
    - active: Sedang meminjam
    - with_fine: Punya denda
    - never_borrowed: Belum pernah meminjam
    """
    # Base query with borrowing stats
    query = db.query(
        Siswa,
        func.count(Borrowing.id).label('total_borrow'),
        func.sum(Borrowing.fine_amount).label('total_fine'),
        func.sum(
            case(
                (Borrowing.status == BorrowingStatusEnum.BORROWED, 1),
                else_=0
            )
        ).label('active_borrow')
    ).outerjoin(Borrowing).group_by(Siswa.id)
    
    # Filter by status
    query = query.filter(Siswa.status == 'active')
    
    all_santri = query.all()
    
    items = []
    active_count = 0
    with_fine_count = 0
    never_borrowed_count = 0
    
    for santri, total_borrow, total_fine, active_borrow in all_santri:
        total_borrow = total_borrow or 0
        total_fine = total_fine or 0
        active_borrow = active_borrow or 0
        
        item = {
            "id": santri.id,
            "nis": santri.nis,
            "nama": santri.nama_lengkap,
            "jenis_kelamin": santri.jenis_kelamin.value if hasattr(santri.jenis_kelamin, 'value') else str(santri.jenis_kelamin),
            "asrama": "-",
            "kamar": "-",
            "total_borrow": total_borrow,
            "active_borrow": active_borrow,
            "total_fine": total_fine,
            "status": santri.status.value if hasattr(santri.status, 'value') else str(santri.status)
        }
        
        # Categorize
        if active_borrow > 0:
            active_count += 1
        if total_fine > 0:
            with_fine_count += 1
        if total_borrow == 0:
            never_borrowed_count += 1
        
        # Filter by report type
        if report_type == "active" and active_borrow > 0:
            items.append(item)
        elif report_type == "with_fine" and total_fine > 0:
            items.append(item)
        elif report_type == "never_borrowed" and total_borrow == 0:
            items.append(item)
        elif report_type == "all":
            items.append(item)
    
    # Sort
    if report_type == "active":
        items.sort(key=lambda x: x["active_borrow"], reverse=True)
    elif report_type == "with_fine":
        items.sort(key=lambda x: x["total_fine"], reverse=True)
    
    # Pagination
    paginated = items[skip:skip + limit]
    
    summary = {
        "total_santri": len(all_santri),
        "active_borrowers": active_count,
        "with_unpaid_fine": with_fine_count,
        "never_borrowed": never_borrowed_count,
        "total_outstanding_fine": sum(i["total_fine"] for i in items if i["total_fine"] > 0)
    }
    
    return {
        "items": paginated,
        "total": len(items),
        "summary": summary
    }


# ============== EXPORT ENDPOINTS ==============

@router.get("/export/excel")
def export_excel(
    db: Session = Depends(get_db),
    report: str = Query(..., description="borrowings, returns, books, santri"),
    period: str = Query("this_month"),
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    report_type: Optional[str] = None,
    asrama_id: Optional[int] = None,
    category_id: Optional[int] = None
):
    """Export report to Excel"""
    
    # Get data based on report type
    if report == "borrowings":
        data = get_borrowing_report(db, period, start_date, end_date, asrama_id, None, category_id, None, 0, 10000)
        columns = ["No", "NIS", "Nama Santri", "Asrama", "Judul Buku", "Kategori", "Tgl Pinjam", "Jatuh Tempo", "Status", "Denda"]
        rows = [[
            idx + 1,
            i["santri_nis"],
            i["santri_nama"],
            i["asrama"],
            i["book_judul"],
            i["category"],
            i["borrow_date"],
            i["due_date"],
            i["status"],
            i["fine_amount"]
        ] for idx, i in enumerate(data["items"])]
        title = f"Laporan Peminjaman ({data['summary']['period']})"
        
    elif report == "returns":
        data = get_return_report(db, period, start_date, end_date, report_type or "all", 0, 10000)
        columns = ["No", "NIS", "Nama Santri", "Asrama", "Judul Buku", "Tgl Pinjam", "Jatuh Tempo", "Tgl Kembali", "Keterlambatan", "Denda"]
        rows = [[
            idx + 1,
            i["santri_nis"],
            i["santri_nama"],
            i["asrama"],
            i["book_judul"],
            i["borrow_date"],
            i["due_date"],
            i["return_date"],
            f"{i['days_late']} hari" if i["days_late"] > 0 else "-",
            i["fine_amount"]
        ] for idx, i in enumerate(data["items"])]
        title = f"Laporan Pengembalian ({data['summary']['period']})"
        
    elif report == "books":
        data = get_book_report(db, report_type or "all", category_id, 0, 10000)
        columns = ["No", "Kode Buku", "Judul", "Penulis", "Penerbit", "Kategori", "Total Stok", "Tersedia", "Jml Dipinjam", "Status"]
        rows = [[
            idx + 1,
            i["kode_buku"],
            i["judul"],
            i["penulis"],
            i["penerbit"],
            i["category"],
            i["total_stok"],
            i["stok_tersedia"],
            i["borrow_count"],
            i["status"]
        ] for idx, i in enumerate(data["items"])]
        title = "Laporan Stok Buku"
        
    elif report == "santri":
        data = get_santri_report(db, report_type or "all", asrama_id, 0, 10000)
        columns = ["No", "NIS", "Nama Santri", "J.K", "Asrama", "Kamar", "Total Pinjam", "Sedang Pinjam", "Total Denda"]
        rows = [[
            idx + 1,
            i["nis"],
            i["nama"],
            i["jenis_kelamin"],
            i["asrama"],
            i["kamar"],
            i["total_borrow"],
            i["active_borrow"],
            i["total_fine"]
        ] for idx, i in enumerate(data["items"])]
        title = "Laporan Data Santri"
    else:
        raise HTTPException(status_code=400, detail="Invalid report type")
    
    # Create workbook
    wb = Workbook()
    ws = wb.active
    ws.title = "Laporan"
    
    # Styling
    header_font = Font(bold=True, color="FFFFFF")
    header_fill = PatternFill(start_color="10B981", end_color="10B981", fill_type="solid")
    thin_border = Border(
        left=Side(style='thin'),
        right=Side(style='thin'),
        top=Side(style='thin'),
        bottom=Side(style='thin')
    )
    
    # Title
    ws.merge_cells(start_row=1, start_column=1, end_row=1, end_column=len(columns))
    ws.cell(row=1, column=1, value=title).font = Font(bold=True, size=14)
    ws.cell(row=1, column=1).alignment = Alignment(horizontal='center')
    
    # Header row
    for col, header in enumerate(columns, 1):
        cell = ws.cell(row=3, column=col, value=header)
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = Alignment(horizontal='center')
        cell.border = thin_border
    
    # Data rows
    for row_idx, row_data in enumerate(rows, 4):
        for col_idx, value in enumerate(row_data, 1):
            cell = ws.cell(row=row_idx, column=col_idx, value=value)
            cell.border = thin_border
            cell.alignment = Alignment(horizontal='left')
    
    # Auto-width columns
    for col in range(1, len(columns) + 1):
        ws.column_dimensions[get_column_letter(col)].width = 15
    
    # Save to buffer
    buffer = io.BytesIO()
    wb.save(buffer)
    buffer.seek(0)
    
    filename = f"laporan_{report}_{date.today().strftime('%Y%m%d')}.xlsx"
    
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/export/pdf")
def export_pdf(
    db: Session = Depends(get_db),
    report: str = Query(..., description="borrowings, returns, books, santri"),
    period: str = Query("this_month"),
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    report_type: Optional[str] = None,
    asrama_id: Optional[int] = None,
    category_id: Optional[int] = None
):
    """Export report to PDF"""
    
    # Get data based on report type
    if report == "borrowings":
        data = get_borrowing_report(db, period, start_date, end_date, asrama_id, None, category_id, None, 0, 10000)
        columns = ["No", "NIS", "Nama", "Asrama", "Buku", "Tgl Pinjam", "Status", "Denda"]
        rows = [[
            idx + 1,
            i["santri_nis"] or "-",
            i["santri_nama"][:20],
            i["asrama"][:10],
            i["book_judul"][:25],
            i["borrow_date"],
            i["status"],
            f"Rp {i['fine_amount']:,}".replace(',', '.')
        ] for idx, i in enumerate(data["items"][:100])]  # Limit for PDF
        title = f"LAPORAN PEMINJAMAN"
        subtitle = f"Periode: {data['summary']['period']}"
        
    elif report == "returns":
        data = get_return_report(db, period, start_date, end_date, report_type or "all", 0, 10000)
        columns = ["No", "NIS", "Nama", "Buku", "Tgl Kembali", "Terlambat", "Denda"]
        rows = [[
            idx + 1,
            i["santri_nis"] or "-",
            i["santri_nama"][:20],
            i["book_judul"][:25],
            i["return_date"],
            f"{i['days_late']} hari" if i["days_late"] > 0 else "-",
            f"Rp {i['fine_amount']:,}".replace(',', '.')
        ] for idx, i in enumerate(data["items"][:100])]
        title = "LAPORAN PENGEMBALIAN"
        subtitle = f"Periode: {data['summary']['period']}"
        
    elif report == "books":
        data = get_book_report(db, report_type or "all", category_id, 0, 10000)
        columns = ["No", "Kode", "Judul", "Kategori", "Stok", "Tersedia", "Dipinjam"]
        rows = [[
            idx + 1,
            i["kode_buku"],
            i["judul"][:30],
            i["category"][:15],
            i["total_stok"],
            i["stok_tersedia"],
            i["borrow_count"]
        ] for idx, i in enumerate(data["items"][:100])]
        title = "LAPORAN STOK BUKU"
        subtitle = f"Total: {data['summary']['total_books']} buku"
        
    elif report == "santri":
        data = get_santri_report(db, report_type or "all", asrama_id, 0, 10000)
        columns = ["No", "NIS", "Nama", "Asrama", "Kamar", "Pinjam", "Aktif", "Denda"]
        rows = [[
            idx + 1,
            i["nis"],
            i["nama"][:25],
            i["asrama"][:10],
            i["kamar"][:10],
            i["total_borrow"],
            i["active_borrow"],
            f"Rp {i['total_fine']:,}".replace(',', '.')
        ] for idx, i in enumerate(data["items"][:100])]
        title = "LAPORAN DATA SANTRI"
        subtitle = f"Total: {data['summary']['total_santri']} santri"
    else:
        raise HTTPException(status_code=400, detail="Invalid report type")
    
    # Create PDF
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=landscape(A4), topMargin=1*cm, bottomMargin=1*cm)
    elements = []
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'Title',
        parent=styles['Heading1'],
        fontSize=16,
        alignment=1,  # Center
        spaceAfter=6
    )
    subtitle_style = ParagraphStyle(
        'Subtitle',
        parent=styles['Normal'],
        fontSize=10,
        alignment=1,
        spaceAfter=20
    )
    
    # Title
    elements.append(Paragraph(title, title_style))
    elements.append(Paragraph(subtitle, subtitle_style))
    
    # Table data
    table_data = [columns] + rows
    
    # Create table
    table = Table(table_data, repeatRows=1)
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#10B981')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('FONTSIZE', (0, 1), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ('BACKGROUND', (0, 1), (-1, -1), colors.white),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F1F5F9')]),
    ]))
    
    elements.append(table)
    
    # Build PDF
    doc.build(elements)
    buffer.seek(0)
    
    filename = f"laporan_{report}_{date.today().strftime('%Y%m%d')}.pdf"
    
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
