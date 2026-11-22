import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Building2,
    BookMarked,
    Users,
    BookOpen,
    ClipboardList,
    Settings,
    LogOut,
    Menu,
    X,
    User,
    ChevronDown,
    DoorOpen,
    FileText,
} from 'lucide-react';
import { useAuthStore } from '../../stores';
import toast from 'react-hot-toast';
import Logo from '../Logo';

// Grouped navigation structure
const navGroups = [
    {
        title: 'Main Menu',
        items: [
            { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
            { path: '/peminjaman', icon: ClipboardList, label: 'Peminjaman' },
        ],
    },
    {
        title: 'Inventory',
        items: [
            { path: '/buku', icon: BookOpen, label: 'Koleksi Buku' },
            { path: '/kategori', icon: BookMarked, label: 'Kategori' },
        ],
    },
    {
        title: 'Member Management',
        items: [
            { path: '/santri', icon: Users, label: 'Data Santri' },
            { path: '/asrama', icon: Building2, label: 'Data Asrama' },
            { path: '/kamar', icon: DoorOpen, label: 'Data Kamar' },
        ],
    },
    {
        title: 'System',
        items: [
            { path: '/laporan', icon: FileText, label: 'Laporan' },
            { path: '/pengaturan', icon: Settings, label: 'Pengaturan' },
        ]
    }
];

export default function DashboardLayout() {
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const handleLogout = () => {
        logout();
        toast.success('Logout berhasil');
        navigate('/login');
    };

    return (
        <div className="flex min-h-screen bg-[#f8fafc] font-sans text-slate-900 transition-colors duration-200">
            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    } lg:translate-x-0`}
            >
                {/* Logo */}
                <div className="p-5">
                    <Logo size="md" showText={true} />
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 space-y-6 mt-6 overflow-y-auto">
                    {navGroups.map((group, groupIndex) => (
                        <div key={groupIndex}>
                            <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                                {group.title}
                            </p>
                            <div className="space-y-1">
                                {group.items.map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <NavLink
                                            key={item.path}
                                            to={item.path}
                                            className={({ isActive }) =>
                                                `flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm font-medium ${isActive
                                                    ? 'bg-primary-50 text-primary-800 font-semibold'
                                                    : 'text-slate-600 hover:text-primary-800 hover:bg-slate-50'
                                                }`
                                            }
                                        >
                                            <Icon size={20} className="material-symbols-outlined" /> {/* Using Lucide as fallback for material symbols */}
                                            <span>{item.label}</span>
                                        </NavLink>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* User Section */}
                <div className="p-4 border-t border-slate-100">
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-50">
                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-800">
                            <User size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-800 truncate">{user?.nama_lengkap || 'Admin Lib'}</p>
                            <p className="text-[10px] text-slate-500 font-medium capitalize">{user?.role || 'Administrator'}</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="text-slate-400 hover:text-danger-600 transition-colors"
                            title="Logout"
                        >
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Mobile sidebar toggle */}
            <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden fixed top-4 right-4 z-50 p-2 bg-white rounded-lg shadow-md border border-slate-200 text-slate-600"
            >
                {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/50 z-40"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Main Content */}
            <main className="lg:ml-64 flex-1 p-6 lg:px-10 lg:py-8 relative min-h-screen">
                {/* Islamic Pattern Background */}
                <div className="absolute inset-0 islamic-pattern pointer-events-none"></div>

                <div className="relative max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
