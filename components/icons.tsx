// FIX: Provide implementation for SVG icon components used throughout the application.
import React from 'react';

const iconStyle: React.CSSProperties = {
  width: '20px',
  height: '20px',
  strokeWidth: '2',
  stroke: 'currentColor',
  fill: 'none',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  marginRight: '12px',
  flexShrink: 0,
};

export const Briefcase = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24" style={iconStyle}>
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
  </svg>
);

export const Wand = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24" style={iconStyle}>
        <path d="M15 4V2m0 18v-2m5-13h2M2 9h2m12.5-6.5L18 4M4 18l1.5-1.5M19.5 4.5L18 6m-12 12l1.5-1.5"></path>
        <path d="M9 12a3 3 0 003-3 3 3 0 00-3-3 3 3 0 00-3 3 3 3 0 003 3z"></path>
        <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
    </svg>
);

export const FileText = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24" style={iconStyle}>
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
        <polyline points="10 9 9 9 8 9"></polyline>
    </svg>
);

export const Clock = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24" style={iconStyle}>
        <circle cx="12" cy="12" r="10"></circle>
        <polyline points="12 6 12 12 16 14"></polyline>
    </svg>
);

export const Sparkles = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24" style={iconStyle}>
        <path d="M12 2L9 9l-7 3 7 3 3 7 3-7 7-3-7-3-3-7z"></path>
        <path d="M22 12l-3-1-1-3-1 3-3 1 3 1 1 3 1-3 3-1z"></path>
        <path d="M5 3l-1-1-1 1-1 1 1 1 1 1 1-1 1-1-1-1z"></path>
    </svg>
);

export const Target = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24" style={iconStyle}>
        <circle cx="12" cy="12" r="10"></circle>
        <circle cx="12" cy="12" r="6"></circle>
        <circle cx="12" cy="12" r="2"></circle>
    </svg>
);

export const Download = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24" style={{...iconStyle, marginRight: '8px' }}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="7 10 12 15 17 10"></polyline>
      <line x1="12" y1="15" x2="12" y2="3"></line>
    </svg>
  );

export const Phone = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style={{ ...iconStyle, marginRight: '4px', width: '14px', height: '14px' }}>
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
    </svg>
);

export const Mail = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style={{ ...iconStyle, marginRight: '4px', width: '14px', height: '14px' }}>
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
        <polyline points="22,6 12,13 2,6"></polyline>
    </svg>
);

export const Copy = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style={{...iconStyle, marginRight: '4px', width: '14px', height: '14px' }}>
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
    </svg>
);
  
export const AutopilotIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24" style={{
        width: '28px',
        height: '28px',
        stroke: '#1967d2',
        strokeWidth: '2',
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        fill: 'none',
        marginRight: '10px',
    }}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <path d="m12 18 1.5-3.5L17 13l-3.5-1.5L12 8l-1.5 3.5L7 13l3.5 1.5Z"></path>
    </svg>
);

export const Bell = ({ style } : { style?: React.CSSProperties }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style={{...iconStyle, ...style}}>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
    </svg>
);

export const AdvisorIcon = ({ style }: { style?: React.CSSProperties }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" style={style}>
    <defs>
        <clipPath id="avatarClipRealistic">
            <circle cx="50" cy="50" r="48" />
        </clipPath>
        <linearGradient id="officeBgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#dbe4f0" />
            <stop offset="60%" stopColor="#c8d3e0" />
            <stop offset="100%" stopColor="#b0bac7" />
        </linearGradient>
        <radialGradient id="faceShading" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#F2C1A5" />
            <stop offset="80%" stopColor="#E6A889" />
            <stop offset="100%" stopColor="#D99C7C" />
        </radialGradient>
        <linearGradient id="hairShading" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3D2E27" />
            <stop offset="50%" stopColor="#2A1F1A" />
            <stop offset="100%" stopColor="#1C1410" />
        </linearGradient>
        <linearGradient id="blazerShading" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#1D2B3E" />
            <stop offset="100%" stopColor="#0F1724" />
        </linearGradient>
        <linearGradient id="blouseShading" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#9CB4D2" />
            <stop offset="100%" stopColor="#7E96B5" />
        </linearGradient>
    </defs>

    <g clipPath="url(#avatarClipRealistic)">
        {/* Fundo do escritório */}
        <rect width="100" height="100" fill="url(#officeBgGradient)" />
        <rect x="65" y="10" width="25" height="70" fill="#c0a991" opacity="0.5" />
        <rect x="70" y="15" width="18" height="5" fill="#a1887f" opacity="0.6" />
        <rect x="70" y="25" width="18" height="5" fill="#a1887f" opacity="0.6" />
        <rect x="70" y="35" width="18" height="5" fill="#a1887f" opacity="0.6" />
        
        {/* Corpo e Roupa */}
        <path d="M15,100 C25,75 75,75 85,100 Z" fill="url(#blazerShading)" />
        <path d="M40,78 C44,70 56,70 60,78 L50,95 Z" fill="url(#blouseShading)" />
        <path d="M48,60 L45,75 L55,75 L52,60 Z" fill="#D99C7C" />
        
        {/* Cabeça */}
        <circle cx="50" cy="45" r="23" fill="url(#faceShading)" />

        {/* Cabelo */}
        <path fill="url(#hairShading)" d="M26,45 C15,20 85,20 74,45 Q90,70 70,75 C65,55 35,55 30,75 Q10,70 26,45 Z" />
        <path fill="#4A342A" opacity="0.7" d="M30,30 C40,25 60,25 70,30 Q65,45 50,45 Q35,45 30,30 Z" />
        <path stroke="#5C473E" strokeWidth="0.5" fill="none" d="M35,32 C40,30 45,30 50,32 M55,33 C58,32 62,32 65,33 M32,40 C35,38 40,38 43,40 M57,40 C60,38 64,38 67,40" />
        
        {/* Olhos */}
        <g transform="translate(0, 2)">
            <path d="M33,45 Q38,42 43,45" fill="#FFFFFF" />
            <path d="M57,45 Q62,42 67,45" fill="#FFFFFF" />
            <circle cx="38" cy="45" r="2.5" fill="#5D4037" />
            <circle cx="62" cy="45" r="2.5" fill="#5D4037" />
            <circle cx="39" cy="44" r="1" fill="white" opacity="0.9"/>
            <circle cx="63" cy="44" r="1" fill="white" opacity="0.9"/>
            <path d="M32,43 Q38,40 44,43" stroke="#4E342E" strokeWidth="1" fill="none" />
            <path d="M56,43 Q62,40 68,43" stroke="#4E342E" strokeWidth="1" fill="none" />
        </g>
        
        {/* Nariz */}
        <path d="M50,50 L49,56 Q50,58 51,56 Z" fill="#D99C7C" opacity="0.7"/>
        <path d="M49,56 L50,50" stroke="#C88F70" strokeWidth="0.5" fill="none"/>
        
        {/* Boca */}
        <path d="M42,61 Q50,65 58,61 Q50,64 42,61" fill="#FFFFFF" />
        <path d="M43,61 Q50,63.5 57,61" stroke="#B5846D" strokeWidth="0.8" fill="none" />

        {/* Sombra no pescoço */}
        <path d="M40,68 Q50,65 60,68 Q50,72 40,68" fill="#000000" opacity="0.1" />

        {/* Broche HR */}
        <g transform="translate(65, 75) rotate(10)">
            <rect x="-5" y="-4" width="10" height="7" fill="#E0E0E0" rx="1.5"/>
            <rect x="-4.5" y="-3.5" width="9" height="6" fill="#F5F5F5" rx="1"/>
            <text x="0" y="1.5" fontFamily="'Times New Roman', serif" fontSize="4.5" fill="#1D2B3E" textAnchor="middle" fontWeight="bold">HR</text>
        </g>
    </g>
    
    {/* Borda */}
    <circle cx="50" cy="50" r="48" fill="none" stroke="#4a5568" strokeWidth="1.5" />
</svg>
);

const themeIconStyle: React.CSSProperties = {
    ...iconStyle,
    marginRight: '8px',
}

export const SunIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style={themeIconStyle}>
        <circle cx="12" cy="12" r="5"></circle>
        <line x1="12" y1="1" x2="12" y2="3"></line>
        <line x1="12" y1="21" x2="12" y2="23"></line>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
        <line x1="1" y1="12" x2="3" y2="12"></line>
        <line x1="21" y1="12" x2="23" y2="12"></line>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
    </svg>
);

export const MoonIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style={themeIconStyle}>
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
    </svg>
);

export const Pencil = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style={{...iconStyle, margin: 0, width: '16px', height: '16px' }}>
        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
    </svg>
);

export const Trash = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style={{...iconStyle, margin: 0, width: '16px', height: '16px' }}>
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    </svg>
);