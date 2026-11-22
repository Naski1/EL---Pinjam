import { useState, useEffect } from 'react';
import Logo from './Logo';

/**
 * Animated Loading Screen Component
 * Shows logo with "EL-PINJAM" letters appearing one by one in a loop
 * @param {string} message - Loading message to display
 */
export default function LoadingScreen({ message = "Memuat..." }) {
    const [visibleLetters, setVisibleLetters] = useState(0);
    const [showLogo, setShowLogo] = useState(false);
    const letters = ['E', 'L', '-', 'P', 'I', 'N', 'J', 'A', 'M'];

    // Logo fade-in effect on mount
    useEffect(() => {
        const logoTimer = setTimeout(() => setShowLogo(true), 200);
        return () => clearTimeout(logoTimer);
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            setVisibleLetters(prev => {
                // When all letters shown, pause then reset
                if (prev >= letters.length + 3) { // +3 for pause effect
                    return 0;
                }
                return prev + 1;
            });
        }, 120); // Speed of letter appearance

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900">
            {/* Animated background circles */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-400/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            {/* Main content */}
            <div className="relative flex flex-col items-center">
                {/* Logo with scale animation - using the same Logo component */}
                <div className={`mb-6 transition-all duration-700 ease-out ${showLogo ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
                    <div className="animate-float">
                        <Logo size="xl" showText={false} />
                    </div>
                </div>

                {/* Animated text */}
                <div className="flex items-center gap-0.5 mb-4">
                    {letters.map((letter, index) => (
                        <span
                            key={index}
                            className={`text-4xl md:text-5xl font-bold transition-all duration-300 ${index < visibleLetters
                                ? 'opacity-100 translate-y-0 scale-100'
                                : 'opacity-0 translate-y-4 scale-75'
                                } ${letter === '-'
                                    ? 'text-emerald-300 mx-1'
                                    : 'text-white'
                                }`}
                            style={{
                                textShadow: index < visibleLetters ? '0 0 30px rgba(255,255,255,0.4)' : 'none',
                                transitionDelay: `${index * 20}ms`
                            }}
                        >
                            {letter}
                        </span>
                    ))}
                </div>

                {/* Subtitle with fade */}
                <p className={`text-emerald-200/80 text-sm font-medium tracking-widest uppercase mb-8 transition-all duration-500 delay-700 ${showLogo ? 'opacity-100' : 'opacity-0'}`}>
                    Library Management System
                </p>

                {/* Loading bar instead of dots */}
                <div className="w-48 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-300 rounded-full animate-loading-bar" />
                </div>

                {/* Message */}
                <p className="mt-4 text-emerald-200/60 text-sm">{message}</p>
            </div>

            {/* Bottom decoration */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
                <p className="text-emerald-200/30 text-xs">
                    © 2026 Perpustakaan Pesantren
                </p>
            </div>

            {/* Custom styles for animations */}
            <style>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-10px); }
                }
                @keyframes loading-bar {
                    0% { width: 0%; margin-left: 0%; }
                    50% { width: 60%; margin-left: 20%; }
                    100% { width: 0%; margin-left: 100%; }
                }
                .animate-float {
                    animation: float 3s ease-in-out infinite;
                }
                .animate-loading-bar {
                    animation: loading-bar 1.5s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
}
