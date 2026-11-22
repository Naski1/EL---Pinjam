# EL-Pinjam Backend

Sistem API untuk aplikasi peminjaman buku perpustakaan pesantren.

## Quick Start

### 1. Setup Virtual Environment (Recommended)

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Run Server

```bash
uvicorn app.main:app --reload
```

Server akan berjalan di: http://localhost:8000

### 4. API Documentation

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Default Login

- **Username**: admin
- **Password**: admin123

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register (Admin only)
- `GET /api/auth/me` - Get current user

### Asrama
- `GET /api/asrama` - List asrama
- `POST /api/asrama` - Create asrama
- `GET /api/asrama/{id}` - Get asrama
- `PUT /api/asrama/{id}` - Update asrama
- `DELETE /api/asrama/{id}` - Delete asrama

### Kamar
- `GET /api/kamar` - List kamar
- `POST /api/kamar` - Create kamar
- `GET /api/kamar/{id}` - Get kamar
- `PUT /api/kamar/{id}` - Update kamar
- `DELETE /api/kamar/{id}` - Delete kamar

### Categories
- `GET /api/categories` - List categories
- `POST /api/categories` - Create category
- `GET /api/categories/{id}` - Get category
- `PUT /api/categories/{id}` - Update category
- `DELETE /api/categories/{id}` - Delete category
