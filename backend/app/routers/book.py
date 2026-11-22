"""
Book Router - CRUD operations for Books
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional
import pandas as pd
import io

from app.database import get_db
from app.models.book import Book, BookStatusEnum
from app.models.category import Category
from app.schemas.book import (
    BookCreate, BookUpdate, BookResponse, BookListResponse
)
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api/books", tags=["Books"])


@router.get("", response_model=BookListResponse)
async def list_books(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    category_id: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get list of books with search, filter and pagination"""
    query = db.query(Book)
    
    # Search filter
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Book.kode_buku.ilike(search_term),
                Book.judul.ilike(search_term),
                Book.penulis.ilike(search_term),
                Book.penerbit.ilike(search_term),
                Book.isbn.ilike(search_term),
            )
        )
    
    # Category filter
    if category_id:
        query = query.filter(Book.category_id == category_id)
    
    # Status filter
    if status:
        query = query.filter(Book.status == status)
    
    # Get total count
    total = query.count()
    
    # Apply pagination
    books = query.order_by(Book.judul).offset(skip).limit(limit).all()
    
    return BookListResponse(
        items=[BookResponse.model_validate(b) for b in books],
        total=total,
        skip=skip,
        limit=limit
    )


@router.post("", response_model=BookResponse, status_code=status.HTTP_201_CREATED)
async def create_book(
    book_data: BookCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Create a new book"""
    # Check if book code already exists
    existing = db.query(Book).filter(Book.kode_buku == book_data.kode_buku).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Buku dengan kode {book_data.kode_buku} sudah ada"
        )
    
    # Map status
    status_map = {
        'available': BookStatusEnum.AVAILABLE,
        'damaged': BookStatusEnum.DAMAGED,
        'lost': BookStatusEnum.LOST,
        'unavailable': BookStatusEnum.DAMAGED,
    }
    
    data = book_data.model_dump()
    data['status'] = status_map.get(data.get('status', 'available'), BookStatusEnum.AVAILABLE)
    data['stok_tersedia'] = data.get('total_stok', 1)
    
    # Map pengarang to penulis (schema uses pengarang, model uses penulis)
    if 'pengarang' in data:
        data['penulis'] = data.pop('pengarang')
    
    # Create book
    book = Book(**data)
    db.add(book)
    db.commit()
    db.refresh(book)
    
    return BookResponse.model_validate(book)


@router.get("/{book_id}", response_model=BookResponse)
async def get_book(
    book_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get book by ID"""
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Buku tidak ditemukan"
        )
    return BookResponse.model_validate(book)


@router.put("/{book_id}", response_model=BookResponse)
async def update_book(
    book_id: str,
    book_data: BookUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Update book"""
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Buku tidak ditemukan"
        )
    
    # Check code uniqueness if changed
    if book_data.kode_buku and book_data.kode_buku != book.kode_buku:
        existing = db.query(Book).filter(Book.kode_buku == book_data.kode_buku).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Buku dengan kode {book_data.kode_buku} sudah ada"
            )
    
    # Update fields
    update_data = book_data.model_dump(exclude_unset=True)
    
    # Map pengarang to penulis
    if 'pengarang' in update_data:
        update_data['penulis'] = update_data.pop('pengarang')
    
    # Map status if provided
    if 'status' in update_data and update_data['status']:
        status_map = {
            'available': BookStatusEnum.AVAILABLE,
            'damaged': BookStatusEnum.DAMAGED,
            'lost': BookStatusEnum.LOST,
            'unavailable': BookStatusEnum.DAMAGED,
        }
        update_data['status'] = status_map.get(update_data['status'], BookStatusEnum.AVAILABLE)
    
    for field, value in update_data.items():
        setattr(book, field, value)
    
    db.commit()
    db.refresh(book)
    
    return BookResponse.model_validate(book)


@router.delete("/{book_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_book(
    book_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Delete book"""
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Buku tidak ditemukan"
        )
    
    # Check if book has active borrowings
    if book.stok_tersedia < book.total_stok:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tidak dapat menghapus buku yang sedang dipinjam"
        )
    
    db.delete(book)
    db.commit()
    
    return None


@router.get("/{book_id}/barcode")
async def generate_barcode(
    book_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Generate barcode image for a book"""
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Buku tidak ditemukan"
        )
    
    try:
        import barcode
        from barcode.writer import ImageWriter
        
        # Generate Code128 barcode
        code128 = barcode.get_barcode_class('code128')
        rv = io.BytesIO()
        
        # Create barcode with the book code
        bc = code128(book.kode_buku, writer=ImageWriter())
        bc.write(rv, options={'module_width': 0.3, 'module_height': 15, 'text_distance': 5})
        
        rv.seek(0)
        
        return StreamingResponse(
            rv,
            media_type="image/png",
            headers={"Content-Disposition": f"attachment; filename=barcode_{book.kode_buku}.png"}
        )
    except ImportError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Modul barcode tidak terinstall. Jalankan: pip install python-barcode Pillow"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Gagal menggenerate barcode: {str(e)}"
        )


@router.post("/bulk-import")
async def bulk_import_books(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Bulk import books from Excel/CSV file"""
    # Validate file type
    if not file.filename.endswith(('.xlsx', '.xls', '.csv')):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File harus berformat Excel (.xlsx, .xls) atau CSV (.csv)"
        )
    
    try:
        # Read file
        contents = await file.read()
        
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(contents))
        else:
            df = pd.read_excel(io.BytesIO(contents))
        
        # Expected columns
        required_columns = ['kode_buku', 'judul']
        
        # Check required columns
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Kolom yang diperlukan tidak ditemukan: {', '.join(missing_columns)}"
            )
        
        # Process rows
        success_count = 0
        error_rows = []
        
        for index, row in df.iterrows():
            try:
                # Check if code exists
                existing = db.query(Book).filter(Book.kode_buku == str(row['kode_buku'])).first()
                if existing:
                    error_rows.append({
                        "row": index + 2,
                        "kode": row['kode_buku'],
                        "error": "Kode buku sudah ada"
                    })
                    continue
                
                # Find category by code/name if provided
                category_id = None
                if 'kategori' in df.columns and pd.notna(row.get('kategori')):
                    category = db.query(Category).filter(
                        or_(
                            Category.kode_kategori == str(row['kategori']),
                            Category.nama_kategori.ilike(f"%{row['kategori']}%")
                        )
                    ).first()
                    if category:
                        category_id = category.id
                
                stock = int(row.get('stok', 1)) if pd.notna(row.get('stok')) else 1
                
                # Create book - use penulis or pengarang from file
                penulis = None
                if 'penulis' in df.columns and pd.notna(row.get('penulis')):
                    penulis = str(row['penulis'])
                elif 'pengarang' in df.columns and pd.notna(row.get('pengarang')):
                    penulis = str(row['pengarang'])
                
                book = Book(
                    kode_buku=str(row['kode_buku']),
                    judul=str(row['judul']),
                    penulis=penulis,
                    penerbit=str(row.get('penerbit', '')) if pd.notna(row.get('penerbit')) else None,
                    tahun_terbit=int(row.get('tahun_terbit', 0)) if pd.notna(row.get('tahun_terbit')) else None,
                    isbn=str(row.get('isbn', '')) if pd.notna(row.get('isbn')) else None,
                    total_stok=stock,
                    stok_tersedia=stock,
                    lokasi_rak=str(row.get('lokasi_rak', '')) if pd.notna(row.get('lokasi_rak')) else None,
                    category_id=category_id,
                )
                
                db.add(book)
                success_count += 1
                
            except Exception as e:
                error_rows.append({
                    "row": index + 2,
                    "kode": row.get('kode_buku', 'N/A'),
                    "error": str(e)
                })
        
        db.commit()
        
        return {
            "message": f"Import selesai. {success_count} buku berhasil diimport.",
            "success_count": success_count,
            "error_count": len(error_rows),
            "errors": error_rows[:10]
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Gagal memproses file: {str(e)}"
        )


@router.post("/upload-cover")
async def upload_cover(
    file: UploadFile = File(...),
    current_user = Depends(get_current_user)
):
    """Upload book cover image and return filename"""
    # Validate file type
    if not file.content_type.startswith('image/'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File harus berupa gambar (jpg, png, jpeg, webp)"
        )
    
    try:
        # Create unique filename
        file_ext = file.filename.split('.')[-1]
        import uuid
        import os
        import shutil
        
        # Ensure directory exists
        upload_dir = "uploads/books"
        os.makedirs(upload_dir, exist_ok=True)
        
        filename = f"book_{uuid.uuid4()}.{file_ext}"
        file_path = f"{upload_dir}/{filename}"
        
        # Save file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Return relative path for frontend usage
        return {"filename": f"books/{filename}"}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Gagal mengupload cover: {str(e)}"
        )
