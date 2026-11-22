"""
EL-Pinjam API - FastAPI Application Entry Point
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.database import init_db, SessionLocal
from app.routers import (
    auth_router, asrama_router, kamar_router, category_router,
    santri_router, book_router, borrowing_router, dashboard_router, settings_router, reports_router
)
from app.models.petugas import Petugas, RoleEnum
from app.models.settings import Setting, DEFAULT_SETTINGS
from app.utils.auth import get_password_hash
from fastapi.staticfiles import StaticFiles
import os

def seed_initial_data():
    """Seed initial data if database is empty"""
    db = SessionLocal()
    try:
        # Create default admin user if no users exist
        user_count = db.query(Petugas).count()
        if user_count == 0:
            admin = Petugas(
                username="admin",
                password_hash=get_password_hash("admin123"),
                nama_lengkap="Administrator",
                role=RoleEnum.ADMIN
            )
            db.add(admin)
            print("[OK] Created default admin user (username: admin, password: admin123)")
        
        # Create default settings if none exist
        # Create default settings if not exist (check per key)
        existing_keys = {s.key for s in db.query(Setting).all()}
        
        for setting_data in DEFAULT_SETTINGS:
            if setting_data["key"] not in existing_keys:
                setting = Setting(**setting_data)
                db.add(setting)
                print(f"[OK] Created default setting: {setting_data['key']}")
        
        db.commit()
    except Exception as e:
        print(f"[ERROR] Error seeding data: {e}")
        db.rollback()
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events"""
    # Startup
    print("[START] Starting EL-Pinjam API...")
    init_db()
    print("[OK] Database initialized")
    seed_initial_data()
    print("[OK] Initial data seeded")
    yield
    # Shutdown
    print("[STOP] Shutting down EL-Pinjam API...")


# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Sistem Manajemen Peminjaman Buku Perpustakaan Pesantren",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Ensure uploads directory exists
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify allowed origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth_router)
app.include_router(asrama_router)
app.include_router(kamar_router)
app.include_router(category_router)
app.include_router(santri_router)
app.include_router(book_router)
app.include_router(borrowing_router)
app.include_router(dashboard_router)
app.include_router(settings_router)
app.include_router(reports_router)


@app.get("/")
async def root():
    """Root endpoint - API health check"""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "docs": "/docs"
    }


@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
