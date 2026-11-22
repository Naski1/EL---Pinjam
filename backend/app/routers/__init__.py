"""
Routers package - API endpoints
"""
from app.routers.auth import router as auth_router
from app.routers.asrama import router as asrama_router
from app.routers.kamar import router as kamar_router
from app.routers.category import router as category_router
from app.routers.santri import router as santri_router
from app.routers.book import router as book_router
from app.routers.borrowing import router as borrowing_router
from app.routers.dashboard import router as dashboard_router
from app.routers.settings import router as settings_router
from app.routers.reports import router as reports_router

__all__ = [
    "auth_router",
    "asrama_router",
    "kamar_router",
    "category_router",
    "santri_router",
    "book_router",
    "borrowing_router",
    "dashboard_router",
    "settings_router",
    "reports_router"
]
