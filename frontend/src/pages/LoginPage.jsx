import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight, Eye, EyeOff, Loader2, User, Lock, BookOpen } from 'lucide-react';
import { useAuthStore } from '../stores';
import toast from 'react-hot-toast';
import LoadingScreen from '../components/LoadingScreen';
import Logo from '../components/Logo';
import PWAInstallButton from '../components/PWAInstallButton';

const loginSchema = z.object({
    username: z.string().min(1, 'Username wajib diisi'),
    password: z.string().min(1, 'Password wajib diisi'),
});

export default function LoginPage() {
    const navigate = useNavigate();
    const { login, isLoading } = useAuthStore();
    const [showPassword, setShowPassword] = useState(false);

    // Refs for animation
    const leftPupilRef = useRef(null);
    const rightPupilRef = useRef(null);
    const santriHeadRef = useRef(null);
    const passwordInputRef = useRef(null);

    // State for hands animation
    const [isCoveringEyes, setIsCoveringEyes] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(loginSchema),
    });

    // Eye tracking effect
    useEffect(() => {
        const handleMouseMove = (e) => {
            if (isCoveringEyes) return; // Don't track if eyes are covered

            const mouseX = e.clientX;
            const mouseY = e.clientY;

            [leftPupilRef.current, rightPupilRef.current].forEach(pupil => {
                if (!pupil) return;
                const rect = pupil.getBoundingClientRect();
                const pupilX = rect.left + rect.width / 2;
                const pupilY = rect.top + rect.height / 2;

                const angle = Math.atan2(mouseY - pupilY, mouseX - pupilX);
                const distance = Math.min(2.5, Math.hypot(mouseX - pupilX, mouseY - pupilY) / 100);

                const moveX = Math.cos(angle) * distance;
                const moveY = Math.sin(angle) * distance;

                pupil.style.transform = `translate(${moveX}px, ${moveY}px)`;
            });

            // Subtle head tilt
            if (santriHeadRef.current) {
                const winWidth = window.innerWidth;
                const winHeight = window.innerHeight;
                const tiltX = (mouseX / winWidth - 0.5) * 4;
                const tiltY = (mouseY / winHeight - 0.5) * 2;
                santriHeadRef.current.style.transform = `translateX(${tiltX}px) translateY(${tiltY}px)`;
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [isCoveringEyes]);

    const handlePasswordFocus = () => {
        setIsCoveringEyes(true);
        // Reset pupils to center when covered
        if (leftPupilRef.current) leftPupilRef.current.style.transform = 'translate(0, 0)';
        if (rightPupilRef.current) rightPupilRef.current.style.transform = 'translate(0, 0)';
        // Head looks slightly up
        if (santriHeadRef.current) santriHeadRef.current.style.transform = 'translateY(10px)';
    };

    const handlePasswordBlur = () => {
        setIsCoveringEyes(false);
        // Reset head position
        if (santriHeadRef.current) santriHeadRef.current.style.transform = 'translateY(0)';
    };

    const onSubmit = async (data) => {
        const result = await login(data.username, data.password);
        if (result.success) {
            toast.success('Login berhasil!');
            navigate('/');
        } else {
            toast.error(result.error);
        }
    };

    // Register password field with hook form and adding ref logic
    const { ref: passwordHookRef, ...passwordRest } = register('password');

    return (
        <>
            {/* Show LoadingScreen during login */}
            {isLoading && <LoadingScreen message="Sedang masuk..." />}

            <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-950 relative overflow-hidden p-4 font-display">
                {/* Islamic Pattern Background */}
                <div
                    className="absolute inset-0 opacity-40 pointer-events-none"
                    style={{
                        backgroundImage: 'url(https://lh3.googleusercontent.com/aida-public/AB6AXuDIpIFOKnWTkHXVdg2nmNyRcxc5na3C6By0xxwp1TqPanNP5YE3BVzredAu08Vwb8R72MI8FF5ocq-NI63gcNQ7a2znTGgOYST5fIfgF449XHfpr030kvW3KYCqkZcx4jb0xpn7nTMWUz3EfbbN6kiUjrT_ts9Y8WU97MurDiAzU6ogfQneDN9LocgGe0VKJ9teKSMsoomNvrviWcnuVTDc84isd0PC2d03NRKYgulrXP85UVI8sPLiiuhlRYJh8WxmKj3teCHqvc)',
                        backgroundRepeat: 'repeat'
                    }}
                />

                {/* PWA Install Button - Top Right */}
                <div className="absolute top-6 right-6 z-20">
                    <PWAInstallButton />
                </div>

                <div className="relative z-10 w-full max-w-sm mt-20">
                    {/* 2D Santri Character - Single Layer ON TOP (Z-20) */}
                    <div className="absolute -top-[180px] left-1/2 -translate-x-1/2 w-80 h-48 pointer-events-none filter drop-shadow-2xl z-20">
                        <svg
                            ref={santriHeadRef}
                            className="w-full h-full transition-transform duration-200 ease-out overflow-visible"
                            viewBox="0 0 200 120"
                            style={{ transformOrigin: 'bottom center' }}
                        >
                            {/* Peci/Cap */}
                            <path d="M60 85 L140 85 L135 60 L65 60 Z" fill="#1a1a1a" />

                            {/* Face */}
                            <path d="M65 85 Q100 80 135 85 L135 110 Q100 125 65 110 Z" fill="#ffdbac" />

                            {/* Eyes Container */}
                            <g>
                                <circle cx="85" cy="98" fill="white" r="7" />
                                <circle
                                    ref={leftPupilRef}
                                    cx="85" cy="98" fill="#333" r="3.5"
                                    className="transition-transform duration-100 ease-out"
                                />

                                <circle cx="115" cy="98" fill="white" r="7" />
                                <circle
                                    ref={rightPupilRef}
                                    cx="115" cy="98" fill="#333" r="3.5"
                                    className="transition-transform duration-100 ease-out"
                                />
                            </g>

                            {/* Mouth - Smile */}
                            <path d="M92 108 Q100 112 108 108" fill="none" stroke="#a67c52" strokeLinecap="round" strokeWidth="1.5" />

                            {/* Hands on Grip (Visible when not covering eyes) - Positioned to look like holding the card */}
                            <g style={{ opacity: isCoveringEyes ? 0 : 1 }} className="transition-opacity duration-300">
                                {/* Fingers/Hands resting on top */}
                                <path d="M50 115 Q50 105 60 105 Q70 105 70 115" fill="#ffdbac" stroke="#e6cba0" strokeWidth="1" />
                                <path d="M130 115 Q130 105 140 105 Q150 105 150 115" fill="#ffdbac" stroke="#e6cba0" strokeWidth="1" />
                            </g>

                            {/* Hands Covering Eyes (Visible when password focused) - Refined for 3D/Pop effect */}
                            <g
                                style={{
                                    transform: isCoveringEyes ? 'translateY(-45px) scale(1.15)' : 'translateY(10px)',
                                    opacity: isCoveringEyes ? 1 : 0,
                                    filter: isCoveringEyes ? 'drop-shadow(0px 4px 6px rgba(0,0,0,0.2))' : 'none'
                                }}
                                className="transition-all duration-400 cubic-bezier(0.34, 1.56, 0.64, 1)"
                            >
                                {/* Left Hand - Uses ellipse for more natural palm shape */}
                                <ellipse cx="85" cy="140" rx="20" ry="22" fill="#ffdbac" stroke="#e6cba0" strokeWidth="1" />
                                {/* Right Hand */}
                                <ellipse cx="115" cy="140" rx="20" ry="22" fill="#ffdbac" stroke="#e6cba0" strokeWidth="1" />
                            </g>
                        </svg>
                    </div>

                    {/* Login Card */}
                    <div className="bg-white rounded-[2rem] shadow-2xl p-6 pt-12 relative border border-white/20 z-10 w-full">
                        <div className="text-center mb-6">
                            <div className="inline-flex items-center justify-center w-20 h-20 mb-3">
                                <Logo size="xl" showText={false} />
                            </div>
                            <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">EL-Pinjam</h1>
                            <p className="text-slate-500 text-xs mt-1">Masuk ke Sistem Perpustakaan</p>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            {/* Username */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Email atau Username</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <User className="text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
                                    </div>
                                    <input
                                        type="text"
                                        {...register('username')}
                                        className="block w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-sm"
                                        placeholder="Nama pengguna anda"
                                    />
                                </div>
                                {errors.username && (
                                    <p className="text-red-500 text-[10px] mt-1 ml-1">{errors.username.message}</p>
                                )}
                            </div>

                            {/* Password */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5 ml-1">
                                    <label className="block text-xs font-bold text-slate-700">Password</label>
                                    <a href="#" className="text-[10px] font-bold text-emerald-500 hover:underline">Lupa sandi?</a>
                                </div>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <Lock className="text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
                                    </div>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        {...passwordRest}
                                        ref={(e) => {
                                            passwordHookRef(e);
                                            passwordInputRef.current = e;
                                        }}
                                        onFocus={handlePasswordFocus}
                                        onBlur={handlePasswordBlur}
                                        className="block w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-sm"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-emerald-500"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="text-red-500 text-[10px] mt-1 ml-1">{errors.password.message}</p>
                                )}
                            </div>

                            {/* Submit Button */}
                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-500/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed text-sm"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>Memproses...</span>
                                        </>
                                    ) : (
                                        <>
                                            Masuk Sekarang
                                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>

                        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
                            <p className="text-slate-500 text-[10px]">
                                Dilindungi oleh reCAPTCHA Enterprise.
                            </p>
                        </div>
                    </div>

                    <footer className="mt-8 text-center text-emerald-100/60 text-[10px]">
                        © 2024 EL-Pinjam • Modern Pesantren Ecosystem
                    </footer>
                </div>
            </div>
        </>
    );
}

