import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './stores';
import { DashboardLayout } from './components/layout';
import {
  LoginPage,
  DashboardPage,
  AsramaPage,
  AddAsramaPage,
  AsramaDetailPage,
  KamarPage,
  CategoryPage,
  SantriPage,
  AddSantriPage,
  BookPage,
  AddBookPage,
  PeminjamanPage,
  SettingsPage,
  ReportsPage,
} from './pages';

// Protected Route wrapper
function ProtectedRoute({ children }) {
  const { isAuthenticated, fetchUser } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      fetchUser();
    }
  }, []);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// Public Route wrapper (redirect if authenticated)
function PublicRoute({ children }) {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      {/* Toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#333',
            color: '#fff',
          },
          success: {
            iconTheme: {
              primary: '#22c55e',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />

      <Routes>
        {/* Public routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="asrama" element={<AsramaPage />} />
          <Route path="asrama/tambah" element={<AddAsramaPage />} />
          <Route path="asrama/edit/:id" element={<AddAsramaPage />} />
          <Route path="asrama/:id" element={<AsramaDetailPage />} />
          <Route path="kamar" element={<KamarPage />} />
          <Route path="kategori" element={<CategoryPage />} />

          {/* Placeholder routes for future phases */}
          <Route path="santri" element={<SantriPage />} />
          <Route path="santri/tambah" element={<AddSantriPage />} />
          <Route path="santri/edit/:id" element={<AddSantriPage />} />
          <Route path="buku" element={<BookPage />} />
          <Route path="buku/tambah" element={<AddBookPage />} />
          <Route path="buku/edit/:id" element={<AddBookPage />} />
          <Route path="peminjaman" element={<PeminjamanPage />} />
          <Route path="laporan" element={<ReportsPage />} />
          <Route path="pengaturan" element={<SettingsPage />} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

// Coming Soon placeholder
function ComingSoon({ title }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">🚧</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
        <p className="text-gray-500">Fitur ini akan segera tersedia</p>
      </div>
    </div>
  );
}

export default App;
