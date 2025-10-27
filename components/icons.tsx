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
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style={iconStyle}>
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
  </svg>
);

export const Wand = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style={iconStyle}>
        <path d="M15 4V2m0 18v-2m5-13h2M2 9h2m12.5-6.5L18 4M4 18l1.5-1.5M19.5 4.5L18 6m-12 12l1.5-1.5"></path>
        <path d="M9 12a3 3 0 003-3 3 3 0 00-3-3 3 3 0 00-3 3 3 3 0 003 3z"></path>
        <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
    </svg>
);

export const FileText = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style={iconStyle}>
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
        <polyline points="10 9 9 9 8 9"></polyline>
    </svg>
);

export const Clock = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style={iconStyle}>
        <circle cx="12" cy="12" r="10"></circle>
        <polyline points="12 6 12 12 16 14"></polyline>
    </svg>
);

export const Sparkles = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style={iconStyle}>
        <path d="M12 2L9 9l-7 3 7 3 3 7 3-7 7-3-7-3-3-7z"></path>
        <path d="M22 12l-3-1-1-3-1 3-3 1 3 1 1 3 1-3 3-1z"></path>
        <path d="M5 3l-1-1-1 1-1 1 1 1 1 1 1-1 1-1-1-1z"></path>
    </svg>
);

export const Target = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style={iconStyle}>
        <circle cx="12" cy="12" r="10"></circle>
        <circle cx="12" cy="12" r="6"></circle>
        <circle cx="12" cy="12" r="2"></circle>
    </svg>
);

export const Layout = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style={iconStyle}>
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="3" y1="9" x2="21" y2="9"></line>
      <line x1="9" y1="21" x2="9" y2="9"></line>
    </svg>
);

export const Download = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style={{...iconStyle, marginRight: '8px' }}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="7 10 12 15 17 10"></polyline>
      <line x1="12" y1="15" x2="12" y2="3"></line>
    </svg>
  );
  
export const AutopilotIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style={{
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