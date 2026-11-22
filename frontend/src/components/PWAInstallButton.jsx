import { Download, Check, Monitor, Info } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

/**
 * PWA Install Button Component
 * Shows install button when app is installable, or installed status
 */
export default function PWAInstallButton({ className = '' }) {
    const { isInstallable, isInstalled, installApp } = usePWAInstall();

    const handleInstall = async () => {
        if (isInstallable) {
            const success = await installApp();
            if (success) {
                console.log('App installed successfully!');
            }
        } else {
            // Show info about PWA requirements
            alert('Untuk menginstall aplikasi:\n\n1. Gunakan browser Chrome/Edge\n2. Akses via HTTPS (production)\n3. Atau gunakan localhost/127.0.0.1\n\nSetelah kondisi terpenuhi, tombol install akan aktif.');
        }
    };

    // Already installed
    if (isInstalled) {
        return (
            <div className={`flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-300 rounded-xl text-sm font-medium ${className}`}>
                <Check size={18} />
                <span>Terinstall</span>
            </div>
        );
    }

    // Show install button (always visible)
    return (
        <button
            onClick={handleInstall}
            className={`flex items-center gap-2 px-4 py-2.5 ${isInstallable
                ? 'bg-white/10 hover:bg-white/20'
                : 'bg-white/5 hover:bg-white/10'
                } backdrop-blur-sm text-white rounded-xl text-sm font-semibold transition-all border border-white/20 hover:border-white/40 shadow-lg hover:shadow-xl ${className}`}
            title={isInstallable ? 'Klik untuk install aplikasi' : 'Install tersedia di HTTPS/localhost'}
        >
            <Download size={18} className={isInstallable ? '' : 'opacity-60'} />
            <span>{isInstallable ? 'Install Aplikasi' : 'Install App'}</span>
            {!isInstallable && <Info size={14} className="opacity-60" />}
        </button>
    );
}

