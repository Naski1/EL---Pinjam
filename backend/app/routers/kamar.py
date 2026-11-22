"""
Kamar (Room) Router
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.models.kamar import Kamar, KamarStatusEnum
from app.models.asrama import Asrama
from app.models.petugas import Petugas
from app.schemas.kamar import (
    KamarCreate, KamarUpdate, KamarResponse, KamarListResponse, AsramaInfo
)
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api/kamar", tags=["Kamar"])


@router.get("", response_model=KamarListResponse)
async def list_kamar(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    asrama_id: Optional[str] = None,
    status: Optional[KamarStatusEnum] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Petugas = Depends(get_current_user)
):
    """Get list of all kamar"""
    query = db.query(Kamar)
    
    if asrama_id:
        query = query.filter(Kamar.asrama_id == asrama_id)
    
    if status:
        query = query.filter(Kamar.status == status)
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (Kamar.kode_kamar.ilike(search_term)) |
            (Kamar.nama_kamar.ilike(search_term))
        )
    
    total = query.count()
    items = query.order_by(Kamar.kode_kamar).offset(skip).limit(limit).all()
    
    result_items = []
    for kamar in items:
        asrama_info = None
        if kamar.asrama:
            asrama_info = AsramaInfo(
                id=kamar.asrama.id,
                kode_asrama=kamar.asrama.kode_asrama,
                nama_asrama=kamar.asrama.nama_asrama
            )
        
        result_items.append(KamarResponse(
            id=kamar.id,
            asrama_id=kamar.asrama_id,
            kode_kamar=kamar.kode_kamar,
            nama_kamar=kamar.nama_kamar,
            kapasitas=kamar.kapasitas,
            jumlah_penghuni=kamar.jumlah_penghuni,
            status=kamar.status,
            asrama=asrama_info,
            created_at=kamar.created_at,
            updated_at=kamar.updated_at
        ))
    
    return KamarListResponse(total=total, items=result_items)


@router.post("", response_model=KamarResponse, status_code=status.HTTP_201_CREATED)
async def create_kamar(
    request: KamarCreate,
    db: Session = Depends(get_db),
    current_user: Petugas = Depends(get_current_user)
):
    """Create a new kamar"""
    # Check if asrama exists
    asrama = db.query(Asrama).filter(Asrama.id == request.asrama_id).first()
    if not asrama:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asrama tidak ditemukan"
        )
    
    # Check if kode_kamar exists in this asrama
    existing = db.query(Kamar).filter(
        Kamar.asrama_id == request.asrama_id,
        Kamar.kode_kamar == request.kode_kamar
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Kode kamar sudah digunakan di asrama ini"
        )
    
    kamar = Kamar(**request.model_dump())
    db.add(kamar)
    db.commit()
    db.refresh(kamar)
    
    asrama_info = AsramaInfo(
        id=asrama.id,
        kode_asrama=asrama.kode_asrama,
        nama_asrama=asrama.nama_asrama
    )
    
    return KamarResponse(
        id=kamar.id,
        asrama_id=kamar.asrama_id,
        kode_kamar=kamar.kode_kamar,
        nama_kamar=kamar.nama_kamar,
        kapasitas=kamar.kapasitas,
        jumlah_penghuni=kamar.jumlah_penghuni,
        status=kamar.status,
        asrama=asrama_info,
        created_at=kamar.created_at,
        updated_at=kamar.updated_at
    )


@router.get("/{kamar_id}", response_model=KamarResponse)
async def get_kamar(
    kamar_id: str,
    db: Session = Depends(get_db),
    current_user: Petugas = Depends(get_current_user)
):
    """Get kamar by ID"""
    kamar = db.query(Kamar).filter(Kamar.id == kamar_id).first()
    if not kamar:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Kamar tidak ditemukan"
        )
    
    asrama_info = None
    if kamar.asrama:
        asrama_info = AsramaInfo(
            id=kamar.asrama.id,
            kode_asrama=kamar.asrama.kode_asrama,
            nama_asrama=kamar.asrama.nama_asrama
        )
    
    return KamarResponse(
        id=kamar.id,
        asrama_id=kamar.asrama_id,
        kode_kamar=kamar.kode_kamar,
        nama_kamar=kamar.nama_kamar,
        kapasitas=kamar.kapasitas,
        jumlah_penghuni=kamar.jumlah_penghuni,
        status=kamar.status,
        asrama=asrama_info,
        created_at=kamar.created_at,
        updated_at=kamar.updated_at
    )


@router.put("/{kamar_id}", response_model=KamarResponse)
async def update_kamar(
    kamar_id: str,
    request: KamarUpdate,
    db: Session = Depends(get_db),
    current_user: Petugas = Depends(get_current_user)
):
    """Update kamar"""
    kamar = db.query(Kamar).filter(Kamar.id == kamar_id).first()
    if not kamar:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Kamar tidak ditemukan"
        )
    
    update_data = request.model_dump(exclude_unset=True)
    
    # Check if new asrama_id is valid
    if "asrama_id" in update_data:
        asrama = db.query(Asrama).filter(Asrama.id == update_data["asrama_id"]).first()
        if not asrama:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Asrama tidak ditemukan"
            )
    
    for key, value in update_data.items():
        setattr(kamar, key, value)
    
    db.commit()
    db.refresh(kamar)
    
    asrama_info = None
    if kamar.asrama:
        asrama_info = AsramaInfo(
            id=kamar.asrama.id,
            kode_asrama=kamar.asrama.kode_asrama,
            nama_asrama=kamar.asrama.nama_asrama
        )
    
    return KamarResponse(
        id=kamar.id,
        asrama_id=kamar.asrama_id,
        kode_kamar=kamar.kode_kamar,
        nama_kamar=kamar.nama_kamar,
        kapasitas=kamar.kapasitas,
        jumlah_penghuni=kamar.jumlah_penghuni,
        status=kamar.status,
        asrama=asrama_info,
        created_at=kamar.created_at,
        updated_at=kamar.updated_at
    )


@router.delete("/{kamar_id}")
async def delete_kamar(
    kamar_id: str,
    db: Session = Depends(get_db),
    current_user: Petugas = Depends(get_current_user)
):
    """Delete kamar"""
    kamar = db.query(Kamar).filter(Kamar.id == kamar_id).first()
    if not kamar:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Kamar tidak ditemukan"
        )
    
    if kamar.santris:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tidak dapat menghapus kamar yang masih memiliki santri"
        )
    
    db.delete(kamar)
    db.commit()
    
    return {"message": "Kamar berhasil dihapus"}
