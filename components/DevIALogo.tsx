import React from 'react';

interface DevIALogoProps {
  size?: number;
  className?: string;
}

export const DevIALogo: React.FC<DevIALogoProps> = ({ size = 48, className = "" }) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 120 120" 
      width={size} 
      height={size}
      className={className}
    >
      <defs>
        <radialGradient id="deviaGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#4CAF50" stopOpacity="0.3"/>
          <stop offset="100%" stopColor="#121212" stopOpacity="0"/>
        </radialGradient>
        
        <linearGradient id="piggyBody" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#388E3C" />
          <stop offset="50%" stopColor="#2E7D32" />
          <stop offset="100%" stopColor="#1B5E20" />
        </linearGradient>

        <linearGradient id="moneyBill" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#81C784"/>
          <stop offset="50%" stopColor="#4CAF50"/>
          <stop offset="100%" stopColor="#2E7D32"/>
        </linearGradient>

        <linearGradient id="goldAccent" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFD54F"/>
          <stop offset="100%" stopColor="#F9A825"/>
        </linearGradient>

        <filter id="shadowEffect" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="3" stdDeviation="2.5" floodColor="#000000" floodOpacity="0.5"/>
        </filter>
      </defs>

      {/* Fundo Circular de Proteção */}
      <circle cx="60" cy="60" r="54" fill="#181D18" stroke="#2E7D32" strokeWidth="2" />
      <circle cx="60" cy="60" r="50" fill="url(#deviaGlow)" />

      {/* PATINHAS DO COFRINHO */}
      <rect x="36" y="80" width="10" height="12" rx="4" fill="#1B5E20" stroke="#4CAF50" strokeWidth="1.2" />
      <rect x="74" y="80" width="10" height="12" rx="4" fill="#1B5E20" stroke="#4CAF50" strokeWidth="1.2" />

      {/* ORELHAS DO COFRINHO */}
      <polygon points="40,36 34,22 48,29" fill="#2E7D32" stroke="#4CAF50" strokeWidth="1.5" />
      <polygon points="80,36 86,22 72,29" fill="#2E7D32" stroke="#4CAF50" strokeWidth="1.5" />

      {/* RABO EM ESPIRAL NEURAL */}
      <path d="M26,62 Q20,60 22,54 Q25,48 28,54" fill="none" stroke="#4CAF50" strokeWidth="2.5" strokeLinecap="round" />

      {/* CORPO DO PORQUINHO / COFRINHO */}
      <ellipse cx="60" cy="61" rx="34" ry="26" fill="url(#piggyBody)" stroke="#4CAF50" strokeWidth="2" filter="url(#shadowEffect)" />

      {/* REDE NEURAL / CONEXÕES SINÁPTICAS NO CORPO (devIA DNA) */}
      <g stroke="#81C784" strokeWidth="1" opacity="0.65">
        <line x1="38" y1="56" x2="48" y2="48" />
        <line x1="48" y1="48" x2="62" y2="52" />
        <line x1="62" y1="52" x2="72" y2="62" />
        <line x1="48" y1="48" x2="45" y2="68" />
        <line x1="45" y1="68" x2="62" y2="70" />
        <line x1="62" y1="70" x2="75" y2="65" />
      </g>
      {/* Nódulos da rede neural */}
      <circle cx="38" cy="56" r="2.2" fill="#FFCA28" />
      <circle cx="48" cy="48" r="2.2" fill="#81C784" />
      <circle cx="62" cy="52" r="2.5" fill="#FFCA28" />
      <circle cx="45" cy="68" r="2.2" fill="#81C784" />
      <circle cx="62" cy="70" r="2.2" fill="#FFCA28" />
      <circle cx="75" cy="64" r="2.2" fill="#81C784" />

      {/* RACHADURA VERMELHA NO COFRE (Identidade devIA) */}
      <path d="M57,40 L62,48 L56,54 L61,60" fill="none" stroke="#C62828" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

      {/* FOCINHO */}
      <ellipse cx="85" cy="61" rx="8" ry="11" fill="#388E3C" stroke="#4CAF50" strokeWidth="1.8" />
      <circle cx="85" cy="58" r="1.8" fill="#121212" />
      <circle cx="85" cy="64" r="1.8" fill="#121212" />

      {/* OLHINHO INTELIGENTE COM BRILHO */}
      <circle cx="74" cy="50" r="3.2" fill="#121212" />
      <circle cx="75.2" cy="49" r="1.2" fill="#FFFFFF" />

      {/* NOTA DE R$ SAINDO DA FENDA SUPERIOR (Dinheiro / Bolso de Formiga) */}
      <g transform="translate(48, 18) rotate(-8)">
        <rect x="0" y="0" width="22" height="13" rx="2" fill="url(#moneyBill)" stroke="#C8E6C9" strokeWidth="1" filter="url(#shadowEffect)" />
        <rect x="2" y="2" width="18" height="9" rx="1" fill="none" stroke="#A5D6A7" strokeWidth="0.7" strokeDasharray="2,1" />
        <text x="11" y="9.5" fontFamily="'Plus Jakarta Sans', sans-serif" fontWeight="900" fontSize="6.5" fill="#FFFFFF" textAnchor="middle">R$</text>
      </g>

      {/* MOEDA DOURADA PULANDO (Toque de economia devIA) */}
      <circle cx="40" cy="22" r="5" fill="url(#goldAccent)" stroke="#FFF9C4" strokeWidth="0.9" />
      <text x="40" y="25.5" fontFamily="'Plus Jakarta Sans', sans-serif" fontWeight="900" fontSize="5" fill="#5D4037" textAnchor="middle">$</text>
    </svg>
  );
};

export default DevIALogo;
