// ThemeContext.ts - Centralização do Contexto Executivo de Tema
import { createContext } from 'react';
import { Theme } from './types';

export const themes = {
  light: {
    background: '#fbf9fa',        // Seda & marfim suave com nuance nobre
    surface: '#ffffff',           // Cartão executivo puro
    surfaceElevated: '#ffffff',
    surfaceHover: '#f6eff2',      // Hover suave com toque discreto de vinho
    border: '#e6dce0',            // Borda grafite-vinho refinada
    borderSubtle: '#f2ebee',
    borderFocus: '#881337',       // Vinho Tinto Nobre (Burgundy)
    textPrimary: '#0e090c',       // Preto Nobre profundo de alto contraste
    textSecondary: '#463941',     // Grafite acinzentado de excelente legibilidade
    textMuted: '#82737c',         // Muted equilibrado
    primary: '#881337',           // Vinho Tinto Imperial / Burgundy C-Level (#881337)
    primaryHover: '#700f2b',
    primaryLight: 'rgba(136, 19, 55, 0.08)',
    primaryGlow: 'rgba(136, 19, 55, 0.22)',
    textOnPrimary: '#ffffff',
    success: '#059669',           // Esmeralda Corporativo
    successLight: 'rgba(5, 150, 105, 0.08)',
    accent: '#4c0519',            // Vinho Profundo / Cabernet
    accentLight: 'rgba(76, 5, 25, 0.08)',
    danger: '#dc2626',
    dangerLight: 'rgba(220, 38, 38, 0.08)',
    inputBg: '#ffffff',
    inputText: '#0e090c',
    buttonDisabledBg: '#e6dce0',
    buttonDisabledText: '#82737c',
    notification: '#ef4444',
    shadow: '0 4px 20px rgba(14, 9, 12, 0.06)',
    shadowSm: '0 1px 3px rgba(14, 9, 12, 0.04)',
    headerBorder: '#e6dce0',
  },
  dark: {
    background: '#080709',        // Preto Absoluto / Noir Ônix Profundo
    surface: '#120f14',           // Preto Ébano refinado com toque sutil de vinho
    surfaceElevated: '#1a141d',   // Cartão elevado acetinado
    surfaceHover: '#231b26',      // Hover executivo
    border: 'rgba(255, 255, 255, 0.09)',
    borderSubtle: 'rgba(255, 255, 255, 0.04)',
    borderFocus: '#9f1239',       // Vinho Imperial em foco
    textPrimary: '#fcfafb',       // Branco platina de máximo contraste
    textSecondary: '#a89ea4',     // Prata escovado sofisticado
    textMuted: '#71656f',         // Muted discreto
    primary: '#9f1239',           // Vinho Nobre Executivo (Burgundy Royal)
    primaryHover: '#be123c',
    primaryLight: 'rgba(159, 18, 57, 0.16)',
    primaryGlow: 'rgba(159, 18, 57, 0.38)',
    textOnPrimary: '#ffffff',
    success: '#10b981',           // Esmeralda Moderno
    successLight: 'rgba(16, 185, 129, 0.12)',
    accent: '#881337',            // Vinho Profundo
    accentLight: 'rgba(136, 19, 55, 0.16)',
    danger: '#f43f5e',
    dangerLight: 'rgba(244, 63, 94, 0.12)',
    inputBg: '#0a080c',           // Preto puro para inputs
    inputText: '#fcfafb',
    buttonDisabledBg: '#1b151e',
    buttonDisabledText: '#685d66',
    notification: '#ef4444',
    shadow: '0 8px 32px rgba(0, 0, 0, 0.65)',
    shadowSm: '0 2px 8px rgba(0, 0, 0, 0.4)',
    headerBorder: 'rgba(255, 255, 255, 0.08)',
  }
};

export type ThemeColors = typeof themes.dark;

export interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  colors: ThemeColors;
}

export const defaultThemeContext: ThemeContextType = {
  theme: 'dark',
  toggleTheme: () => {},
  colors: themes.dark
};

// Contexto com fallback garantido (NUNCA null) para prevenir erros de desestruturação
export const ThemeContext = createContext<ThemeContextType>(defaultThemeContext);
