"""
Santri Router - CRUD operations for Santri (Students)
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional
import pandas as pd
import io

from app.database import get_db
from app.models.santri import Santri, SantriStatusEnum, JenisKelaminEnum
from app.models.asrama import Asrama
from app.models.kamar import Kamar
from app.schemas.santri import (
    SantriCreate, SantriUpdate, SantriResponse, SantriListResponse
)
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api/santri", tags=["Santri"])


@router.get("", response_model=SantriListResponse)
async def list_santri(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    asrama_id: Optional[str] = None,
    kamar_id: Optional[str] = None,
    status: Optional[str] = None,
    jenis_kelamin: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get list of santri with search, filter and pagination"""
    query = db.query(Santri)
    
    # Search filter
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Santri.nis.ilike(search_term),
                Santri.nama_lengkap.ilike(search_term),
                Santri.nama_wali.ilike(search_term),
            )
        )
    
    # Status filter
    if status:
        query = query.filter(Santri.status == status)
    
    # Asrama filter
    if asrama_id:
        query = query.filter(Santri.asrama_id == asrama_id)
    
    # Kamar filter
    if kamar_id:
        query = query.filter(Santri.kamar_id == kamar_id)
    
    # Get total count
    total = query.count()
    
    # Apply pagination
    santris = query.order_by(Santri.nama_lengkap).offset(skip).limit(limit).all()
    
    return SantriListResponse(
        items=[SantriResponse.model_validate(s) for s in santris],
        total=total,
        skip=skip,
        limit=limit
    )


@router.post("", response_model=SantriResponse, status_code=status.HTTP_201_CREATED)
async def create_santri(
    santri_data: SantriCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Create a new santri"""
    # Check if NIS already exists
    existing = db.query(Santri).filter(Santri.nis == santri_data.nis).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Santri dengan NIS {santri_data.nis} sudah ada"
        )
    
    # Map jenis_kelamin
    jk_map = {
        'L': JenisKelaminEnum.LAKI_LAKI,
        'P': JenisKelaminEnum.PEREMPUAN
    }
    jk_value = jk_map.get(santri_data.jenis_kelamin, JenisKelaminEnum.LAKI_LAKI)
    
    # Map status
    status_map = {
        'active': SantriStatusEnum.ACTIVE,
        'alumni': SantriStatusEnum.ALUMNI,
        'keluar': SantriStatusEnum.KELUAR,
        'inactive': SantriStatusEnum.KELUAR,
        'graduated': SantriStatusEnum.ALUMNI,
    }
    status_value = status_map.get(santri_data.status, SantriStatusEnum.ACTIVE)
    
    # Create santri
    data = santri_data.model_dump()
    data['jenis_kelamin'] = jk_value
    data['status'] = status_value
    
    santri = Santri(**data)
    db.add(santri)
    db.commit()
    db.refresh(santri)
    
    return SantriResponse.model_validate(santri)


@router.get("/{santri_id}", response_model=SantriResponse)
async def get_santri(
    santri_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get santri by ID"""
    santri = db.query(Santri).filter(Santri.id == santri_id).first()
    if not santri:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Santri tidak ditemukan"
        )
    return SantriResponse.model_validate(santri)


@router.put("/{santri_id}", response_model=SantriResponse)
async def update_santri(
    santri_id: str,
    santri_data: SantriUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Update santri"""
    santri = db.query(Santri).filter(Santri.id == santri_id).first()
    if not santri:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Santri tidak ditemukan"
        )
    
    # Check NIS uniqueness if changed
    if santri_data.nis and santri_data.nis != santri.nis:
        existing = db.query(Santri).filter(Santri.nis == santri_data.nis).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Santri dengan NIS {santri_data.nis} sudah ada"
            )
    
    # Update fields
    update_data = santri_data.model_dump(exclude_unset=True)
    
    # Map jenis_kelamin if provided
    if 'jenis_kelamin' in update_data and update_data['jenis_kelamin']:
        jk_map = {'L': JenisKelaminEnum.LAKI_LAKI, 'P': JenisKelaminEnum.PEREMPUAN}
        update_data['jenis_kelamin'] = jk_map.get(update_data['jenis_kelamin'], JenisKelaminEnum.LAKI_LAKI)
    
    # Map status if provided
    if 'status' in update_data and update_data['status']:
        status_map = {
            'active': SantriStatusEnum.ACTIVE,
            'alumni': SantriStatusEnum.ALUMNI,
            'keluar': SantriStatusEnum.KELUAR,
            'inactive': SantriStatusEnum.KELUAR,
            'graduated': SantriStatusEnum.ALUMNI,
        }
        update_data['status'] = status_map.get(update_data['status'], SantriStatusEnum.ACTIVE)
    
    for field, value in update_data.items():
        setattr(santri, field, value)
    
    db.commit()
    db.refresh(santri)
    
    return SantriResponse.model_validate(santri)


@router.delete("/{santri_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_santri(
    santri_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Delete santri"""
    santri = db.query(Santri).filter(Santri.id == santri_id).first()
    if not santri:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Santri tidak ditemukan"
        )
    
    # Check if santri has active borrowings
    if santri.active_borrowings_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tidak dapat menghapus santri yang masih memiliki peminjaman aktif"
        )
    
    db.delete(santri)
    db.commit()
    
    return None


@router.post("/bulk-import")
async def bulk_import_santri(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Bulk import santri from Excel/CSV file"""
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
        required_columns = ['nis', 'nama_lengkap', 'jenis_kelamin']
        
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
                # Check if NIS exists
                existing = db.query(Santri).filter(Santri.nis == str(row['nis'])).first()
                if existing:
                    error_rows.append({
                        "row": index + 2,
                        "nis": row['nis'],
                        "error": "NIS sudah ada"
                    })
                    continue
                
                # Map jenis_kelamin
                jk = str(row['jenis_kelamin']).upper()
                if jk in ['L', 'LAKI-LAKI', 'MALE']:
                    jk_value = JenisKelaminEnum.LAKI_LAKI
                elif jk in ['P', 'PEREMPUAN', 'FEMALE']:
                    jk_value = JenisKelaminEnum.PEREMPUAN
                else:
                    error_rows.append({
                        "row": index + 2,
                        "nis": row['nis'],
                        "error": "Jenis kelamin tidak valid (L/P)"
                    })
                    continue
                
                # Create santri
                santri = Santri(
                    nis=str(row['nis']),
                    nama_lengkap=str(row['nama_lengkap']),
                    jenis_kelamin=jk_value,
                    alamat=str(row.get('alamat', '')) if pd.notna(row.get('alamat')) else None,
                    nama_wali=str(row.get('nama_wali', '')) if pd.notna(row.get('nama_wali')) else None,
                    no_hp_wali=str(row.get('no_hp_wali', '')) if pd.notna(row.get('no_hp_wali')) else None,
                )
                
                db.add(santri)
                success_count += 1
                
            except Exception as e:
                error_rows.append({
                    "row": index + 2,
                    "nis": row.get('nis', 'N/A'),
                    "error": str(e)
                })
        
        db.commit()
        
        return {
            "message": f"Import selesai. {success_count} data berhasil diimport.",
            "success_count": success_count,
            "error_count": len(error_rows),
            "errors": error_rows[:10]
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Gagal memproses file: {str(e)}"
        )


@router.post("/upload-photo")
async def upload_photo(
    file: UploadFile = File(...),
    current_user = Depends(get_current_user)
):
    """Upload santri photo and return filename"""
    # Validate file type
    if not file.content_type.startswith('image/'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File harus berupa gambar (jpg, png, jpeg)"
        )
    
    try:
        # Create unique filename
        file_ext = file.filename.split('.')[-1]
        import uuid
        import os
        import shutil
        
        filename = f"santri_{uuid.uuid4()}.{file_ext}"
        file_path = f"uploads/{filename}"
        
        # Save file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        return {"filename": filename}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Gagal mengupload foto: {str(e)}"
        )
