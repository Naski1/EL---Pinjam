"""
Asrama (Dormitory) Router
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.models.asrama import Asrama, AsramaStatusEnum
from app.models.petugas import Petugas
from app.schemas.asrama import (
    AsramaCreate, AsramaUpdate, AsramaResponse, AsramaListResponse
)
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api/asrama", tags=["Asrama"])


@router.get("", response_model=AsramaListResponse)
async def list_asrama(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    status: Optional[AsramaStatusEnum] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Petugas = Depends(get_current_user)
):
    """Get list of all asrama"""
    query = db.query(Asrama)
    
    if status:
        query = query.filter(Asrama.status == status)
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (Asrama.kode_asrama.ilike(search_term)) |
            (Asrama.nama_asrama.ilike(search_term)) |
            (Asrama.penanggung_jawab.ilike(search_term))
        )
    
    total = query.count()
    items = query.order_by(Asrama.kode_asrama).offset(skip).limit(limit).all()
    
    # Calculate jumlah_kamar and jumlah_santri for each
    result_items = []
    for asrama in items:
        asrama_dict = {
            "id": asrama.id,
            "kode_asrama": asrama.kode_asrama,
            "nama_asrama": asrama.nama_asrama,
            "kapasitas": asrama.kapasitas,
            "penanggung_jawab": asrama.penanggung_jawab,
            "deskripsi": asrama.deskripsi,
            "status": asrama.status,
            "jumlah_kamar": len(asrama.kamars) if asrama.kamars else 0,
            "jumlah_santri": len(asrama.santris) if asrama.santris else 0,
            "created_at": asrama.created_at,
            "updated_at": asrama.updated_at
        }
        result_items.append(AsramaResponse(**asrama_dict))
    
    return AsramaListResponse(total=total, items=result_items)


@router.post("", response_model=AsramaResponse, status_code=status.HTTP_201_CREATED)
async def create_asrama(
    request: AsramaCreate,
    db: Session = Depends(get_db),
    current_user: Petugas = Depends(get_current_user)
):
    """Create a new asrama"""
    # Check if kode_asrama exists
    existing = db.query(Asrama).filter(Asrama.kode_asrama == request.kode_asrama).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Kode asrama sudah digunakan"
        )
    
    asrama = Asrama(**request.model_dump())
    db.add(asrama)
    db.commit()
    db.refresh(asrama)
    
    return AsramaResponse(
        id=asrama.id,
        kode_asrama=asrama.kode_asrama,
        nama_asrama=asrama.nama_asrama,
        kapasitas=asrama.kapasitas,
        penanggung_jawab=asrama.penanggung_jawab,
        deskripsi=asrama.deskripsi,
        status=asrama.status,
        jumlah_kamar=0,
        jumlah_santri=0,
        created_at=asrama.created_at,
        updated_at=asrama.updated_at
    )


@router.get("/{asrama_id}", response_model=AsramaResponse)
async def get_asrama(
    asrama_id: str,
    db: Session = Depends(get_db),
    current_user: Petugas = Depends(get_current_user)
):
    """Get asrama by ID"""
    asrama = db.query(Asrama).filter(Asrama.id == asrama_id).first()
    if not asrama:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asrama tidak ditemukan"
        )
    
    return AsramaResponse(
        id=asrama.id,
        kode_asrama=asrama.kode_asrama,
        nama_asrama=asrama.nama_asrama,
        kapasitas=asrama.kapasitas,
        penanggung_jawab=asrama.penanggung_jawab,
        deskripsi=asrama.deskripsi,
        status=asrama.status,
        jumlah_kamar=len(asrama.kamars) if asrama.kamars else 0,
        jumlah_santri=len(asrama.santris) if asrama.santris else 0,
        created_at=asrama.created_at,
        updated_at=asrama.updated_at
    )


@router.put("/{asrama_id}", response_model=AsramaResponse)
async def update_asrama(
    asrama_id: str,
    request: AsramaUpdate,
    db: Session = Depends(get_db),
    current_user: Petugas = Depends(get_current_user)
):
    """Update asrama"""
    asrama = db.query(Asrama).filter(Asrama.id == asrama_id).first()
    if not asrama:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asrama tidak ditemukan"
        )
    
    # Check if new kode_asrama conflicts with existing
    if request.kode_asrama and request.kode_asrama != asrama.kode_asrama:
        existing = db.query(Asrama).filter(Asrama.kode_asrama == request.kode_asrama).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Kode asrama sudah digunakan"
            )
    
    update_data = request.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(asrama, key, value)
    
    db.commit()
    db.refresh(asrama)
    
    return AsramaResponse(
        id=asrama.id,
        kode_asrama=asrama.kode_asrama,
        nama_asrama=asrama.nama_asrama,
        kapasitas=asrama.kapasitas,
        penanggung_jawab=asrama.penanggung_jawab,
        deskripsi=asrama.deskripsi,
        status=asrama.status,
        jumlah_kamar=len(asrama.kamars) if asrama.kamars else 0,
        jumlah_santri=len(asrama.santris) if asrama.santris else 0,
        created_at=asrama.created_at,
        updated_at=asrama.updated_at
    )


@router.delete("/{asrama_id}")
async def delete_asrama(
    asrama_id: str,
    db: Session = Depends(get_db),
    current_user: Petugas = Depends(get_current_user)
):
    """Delete asrama"""
    asrama = db.query(Asrama).filter(Asrama.id == asrama_id).first()
    if not asrama:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asrama tidak ditemukan"
        )
    
    # Check if asrama has kamars or santris
    if asrama.kamars:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tidak dapat menghapus asrama yang masih memiliki kamar"
        )
    
    if asrama.santris:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tidak dapat menghapus asrama yang masih memiliki santri"
        )
    
    db.delete(asrama)
    db.commit()
    
    return {"message": "Asrama berhasil dihapus"}
