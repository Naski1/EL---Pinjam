import React from 'react';

export default function SantriIllustration({ className = "w-64 h-64" }) {
    return (
        <svg
            viewBox="0 0 500 500"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            {/* Background Circle */}
            <circle cx="250" cy="250" r="240" fill="#ECFDF5" />

            {/* Character Group */}
            <g transform="translate(100, 50)">
                {/* Sarong */}
                <path d="M100 280 L200 280 L210 420 L90 420 Z" fill="#059669" />
                <path d="M100 280 Q150 290 200 280" stroke="#047857" strokeWidth="2" fill="none" />

                {/* Shirt (Baju Koko) */}
                <path d="M85 150 L215 150 L215 290 L85 290 Z" fill="#FFFFFF" />
                <path d="M150 150 L150 290" stroke="#E5E7EB" strokeWidth="2" />
                {/* Buttons */}
                <circle cx="150" cy="180" r="3" fill="#D1D5DB" />
                <circle cx="150" cy="210" r="3" fill="#D1D5DB" />
                <circle cx="150" cy="240" r="3" fill="#D1D5DB" />

                {/* Sleeves */}
                <path d="M85 150 L40 220 L70 230 L100 170" fill="#FFFFFF" />
                <path d="M215 150 L260 220 L230 230 L200 170" fill="#FFFFFF" />

                {/* Hands */}
                <circle cx="55" cy="235" r="15" fill="#FCD34D" />
                <circle cx="245" cy="235" r="15" fill="#FCD34D" />

                {/* Head/Face */}
                <path d="M110 80 Q150 80 190 80 L190 140 Q150 160 110 140 Z" fill="#FCD34D" />

                {/* Peci (Cap) */}
                <path d="M100 60 Q150 40 200 60 L200 90 Q150 100 100 90 Z" fill="#111827" />
                <ellipse cx="150" cy="60" rx="50" ry="10" fill="#1F2937" />

                {/* Face Features */}
                <circle cx="135" cy="110" r="3" fill="#1F2937" />
                <circle cx="165" cy="110" r="3" fill="#1F2937" />
                <path d="M140 130 Q150 135 160 130" stroke="#1F2937" strokeWidth="2" strokeLinecap="round" />
            </g>

            {/* Gear Icon (Settings) */}
            <g transform="translate(300, 100) scale(0.6)">
                <circle cx="100" cy="100" r="40" stroke="#64748B" strokeWidth="15" fill="none" />
                <path d="M100 20 L100 50 M100 150 L100 180 M20 100 L50 100 M150 100 L180 100 
                 M43 43 L65 65 M135 135 L157 157 M43 157 L65 135 M135 65 L157 43"
                    stroke="#64748B" strokeWidth="15" strokeLinecap="round" />
                <circle cx="100" cy="100" r="15" fill="#64748B" />
            </g>

            {/* Books Stack */}
            <g transform="translate(30, 350)">
                <rect x="0" y="40" width="80" height="20" rx="2" fill="#3B82F6" />
                <rect x="5" y="20" width="70" height="20" rx="2" fill="#EF4444" />
                <rect x="10" y="0" width="60" height="20" rx="2" fill="#F59E0B" />
            </g>
        </svg>
    );
}
