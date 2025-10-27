
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
