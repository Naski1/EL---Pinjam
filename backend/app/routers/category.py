"""
Category (Book Category) Router
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.models.category import Category
from app.models.petugas import Petugas
from app.schemas.category import (
    CategoryCreate, CategoryUpdate, CategoryResponse, CategoryListResponse
)
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api/categories", tags=["Categories"])


@router.get("", response_model=CategoryListResponse)
async def list_categories(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Petugas = Depends(get_current_user)
):
    """Get list of all categories"""
    query = db.query(Category)
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (Category.kode_kategori.ilike(search_term)) |
            (Category.nama_kategori.ilike(search_term))
        )
    
    total = query.count()
    items = query.order_by(Category.kode_kategori).offset(skip).limit(limit).all()
    
    result_items = []
    for category in items:
        result_items.append(CategoryResponse(
            id=category.id,
            kode_kategori=category.kode_kategori,
            nama_kategori=category.nama_kategori,
            deskripsi=category.deskripsi,
            jumlah_buku=len(category.books) if category.books else 0,
            created_at=category.created_at,
            updated_at=category.updated_at
        ))
    
    return CategoryListResponse(total=total, items=result_items)


@router.post("", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    request: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: Petugas = Depends(get_current_user)
):
    """Create a new category"""
    existing = db.query(Category).filter(Category.kode_kategori == request.kode_kategori).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Kode kategori sudah digunakan"
        )
    
    category = Category(**request.model_dump())
    db.add(category)
    db.commit()
    db.refresh(category)
    
    return CategoryResponse(
        id=category.id,
        kode_kategori=category.kode_kategori,
        nama_kategori=category.nama_kategori,
        deskripsi=category.deskripsi,
        jumlah_buku=0,
        created_at=category.created_at,
        updated_at=category.updated_at
    )


@router.get("/{category_id}", response_model=CategoryResponse)
async def get_category(
    category_id: str,
    db: Session = Depends(get_db),
    current_user: Petugas = Depends(get_current_user)
):
    """Get category by ID"""
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Kategori tidak ditemukan"
        )
    
    return CategoryResponse(
        id=category.id,
        kode_kategori=category.kode_kategori,
        nama_kategori=category.nama_kategori,
        deskripsi=category.deskripsi,
        jumlah_buku=len(category.books) if category.books else 0,
        created_at=category.created_at,
        updated_at=category.updated_at
    )


@router.put("/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: str,
    request: CategoryUpdate,
    db: Session = Depends(get_db),
    current_user: Petugas = Depends(get_current_user)
):
    """Update category"""
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Kategori tidak ditemukan"
        )
    
    if request.kode_kategori and request.kode_kategori != category.kode_kategori:
        existing = db.query(Category).filter(Category.kode_kategori == request.kode_kategori).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Kode kategori sudah digunakan"
            )
    
    update_data = request.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(category, key, value)
    
    db.commit()
    db.refresh(category)
    
    return CategoryResponse(
        id=category.id,
        kode_kategori=category.kode_kategori,
        nama_kategori=category.nama_kategori,
        deskripsi=category.deskripsi,
        jumlah_buku=len(category.books) if category.books else 0,
        created_at=category.created_at,
        updated_at=category.updated_at
    )


@router.delete("/{category_id}")
async def delete_category(
    category_id: str,
    db: Session = Depends(get_db),
    current_user: Petugas = Depends(get_current_user)
):
    """Delete category"""
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Kategori tidak ditemukan"
        )
    
    if category.books:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tidak dapat menghapus kategori yang masih memiliki buku"
        )
    
    db.delete(category)
    db.commit()
    
    return {"message": "Kategori berhasil dihapus"}
