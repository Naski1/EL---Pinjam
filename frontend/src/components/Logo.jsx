import { BookOpen, Smartphone } from 'lucide-react';

/**
 * EL-Pinjam Logo Component
 * Islamic-themed library management system logo
 */
export default function Logo({ size = 'md', showText = true, className = '' }) {
    const sizes = {
        sm: { container: 'w-8 h-8', icon: 16, text: 'text-sm' },
        md: { container: 'w-10 h-10', icon: 20, text: 'text-base' },
        lg: { container: 'w-16 h-16', icon: 32, text: 'text-xl' },
        xl: { container: 'w-24 h-24', icon: 48, text: 'text-2xl' },
    };

    const s = sizes[size] || sizes.md;

    return (
        <div className={`flex items-center gap-3 ${className}`}>
            {/* Logo Icon - SVG Based */}
            <div className={`${s.container} relative`}>
                <svg viewBox="0 0 100 100" className="w-full h-full">
                    {/* Background circle with gradient */}
                    <defs>
                        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#10b981" />
                            <stop offset="100%" stopColor="#059669" />
                        </linearGradient>
                        <linearGradient id="bookGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#34d399" />
                            <stop offset="100%" stopColor="#10b981" />
                        </linearGradient>
                    </defs>

                    {/* Main circle background */}
                    <circle cx="50" cy="50" r="48" fill="url(#logoGradient)" />

                    {/* Crescent moon */}
                    <path
                        d="M50 12 C42 12, 35 18, 35 26 C35 34, 42 40, 50 40 C44 40, 40 34, 40 26 C40 18, 44 12, 50 12"
                        fill="#fcd34d"
                    />

                    {/* Star */}
                    <polygon
                        points="58,18 59,22 63,22 60,25 61,29 58,27 55,29 56,25 53,22 57,22"
                        fill="#fcd34d"
                    />

                    {/* Open book base */}
                    <path
                        d="M20 70 Q50 60 80 70 L80 85 Q50 75 20 85 Z"
                        fill="url(#bookGradient)"
                        opacity="0.9"
                    />
                    <path
                        d="M20 70 Q50 60 50 55 L50 75 Q50 65 20 75 Z"
                        fill="#34d399"
                    />
                    <path
                        d="M80 70 Q50 60 50 55 L50 75 Q50 65 80 75 Z"
                        fill="#6ee7b7"
                    />

                    {/* Smartphone/tablet in center */}
                    <rect x="38" y="35" width="24" height="35" rx="3" fill="white" />
                    <rect x="40" y="38" width="20" height="28" rx="2" fill="#d1fae5" />

                    {/* Bookmark icon on phone */}
                    <path d="M45 42 L45 56 L50 52 L55 56 L55 42 Z" fill="#10b981" />

                    {/* Small dome decorations */}
                    <ellipse cx="25" cy="55" rx="8" ry="6" fill="#34d399" opacity="0.7" />
                    <path d="M25 49 L25 42" stroke="#34d399" strokeWidth="2" />
                    <ellipse cx="75" cy="55" rx="8" ry="6" fill="#34d399" opacity="0.7" />
                    <path d="M75 49 L75 42" stroke="#34d399" strokeWidth="2" />
                </svg>
            </div>

            {/* Text */}
            {showText && (
                <div>
                    <h1 className={`font-display font-bold ${s.text} leading-none text-primary-800`}>
                        EL-Pinjam
                    </h1>
                    <p className="text-[9px] uppercase tracking-[0.2em] font-bold text-slate-400 mt-1">
                        Library System
                    </p>
                </div>
            )}
        </div>
    );
}
