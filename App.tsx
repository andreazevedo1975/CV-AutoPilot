// FIX: Replaced HTML content with a valid React component to serve as the application's main entry point. This resolves TypeScript parsing errors and the missing default export issue.
import React, { useState, useEffect, createContext, useContext } from 'react';
import Dashboard from './components/Dashboard';
import AITools from './components/AITools';
import CVManager from './components/CVManager';
import HistoryView from './components/History';
import CreativeStudio from './components/CreativeStudio';
import LeadFinder from './components/LeadFinder';
import { Briefcase, Wand, FileText, Clock, Sparkles, AutopilotIcon, Target, SunIcon, MoonIcon } from './components/icons';
import { useLocalStorage } from './hooks/useLocalStorage';
import { Theme } from './types';

type View = 'dashboard' | 'cv-manager' | 'ai-tools' | 'history' | 'creative-studio' | 'lead-finder';

const themes = {
  light: {
    background: '#f7fafc',
    surface: '#ffffff',
    border: '#e2e8f0',
    textPrimary: '#2d3748',
    textSecondary: '#718096',
    primary: '#1967d2',
    textOnPrimary: '#ffffff',
    success: '#34a853',
    inputBg: '#ffffff',
    inputText: '#2d3748',
    buttonDisabledBg: '#cbd5e0',
    buttonDisabledText: '#718096',
  },
  dark: {
    background: '#1a202c',
    surface: '#2d3748',
    border: '#4a5568',
    textPrimary: '#e2e8f0',
    textSecondary: '#a0aec0',
    primary: '#1967d2',
    textOnPrimary: '#ffffff',
    success: '#34a853',
    inputBg: '#1a202c',
    inputText: '#ffffff',
    buttonDisabledBg: '#4a5568',
    buttonDisabledText: '#a0aec0',
  }
};

export const ThemeContext = createContext(null);

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('cv-manager');
  const [theme, setTheme] = useLocalStorage<Theme>('theme', 'dark');

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  const currentThemeColors = themes[theme];

  useEffect(() => {
    document.body.style.backgroundColor = currentThemeColors.background;
    document.body.style.color = currentThemeColors.textPrimary;
  }, [theme, currentThemeColors]);

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'cv-manager':
        return <CVManager />;
      case 'ai-tools':
        return <AITools />;
      case 'history':
        return <HistoryView />;
      case 'creative-studio':
        return <CreativeStudio />;
      case 'lead-finder':
        return <LeadFinder />;
      default:
        return <CVManager />;
    }
  };

  const navItems = [
    { id: 'cv-manager', label: 'Gerenciador de Currículos', icon: <FileText /> },
    { id: 'ai-tools', label: 'Ferramentas de IA', icon: <Wand /> },
    { id: 'lead-finder', label: 'Buscador de Leads', icon: <Target /> },
    { id: 'dashboard', label: 'Painel de Candidaturas', icon: <Briefcase /> },
    { id: 'history', label: 'Histórico de Gerações', icon: <Clock /> },
    { id: 'creative-studio', label: 'Orientador de RH', icon: <Sparkles /> },
  ];
  
  const getStyles = (colors) => ({
    body: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
      margin: 0,
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: colors.background,
      color: colors.textPrimary
    },
    sidebar: {
      width: '280px',
      backgroundColor: colors.surface,
      padding: '20px',
      boxSizing: 'border-box',
      borderRight: `1px solid ${colors.border}`,
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0
    },
    mainContent: {
      flexGrow: 1,
      padding: '30px',
      boxSizing: 'border-box',
      overflowY: 'auto'
    },
    navItem: {
      display: 'flex',
      alignItems: 'center',
      padding: '12px 15px',
      borderRadius: '8px',
      marginBottom: '8px',
      cursor: 'pointer',
      transition: 'background-color 0.2s, color 0.2s',
      fontSize: '16px',
      fontWeight: 500,
      color: colors.textSecondary
    },
    activeNavItem: {
      backgroundColor: colors.primary,
      color: colors.textOnPrimary,
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      fontSize: '24px',
      fontWeight: 'bold',
      color: colors.primary,
      marginBottom: '30px',
      paddingBottom: '10px',
      borderBottom: `2px solid ${colors.border}`
    },
    themeSwitcher: {
        marginTop: 'auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '12px 15px',
        borderRadius: '8px',
        cursor: 'pointer',
        backgroundColor: colors.background,
        border: `1px solid ${colors.border}`,
        color: colors.textSecondary,
        fontSize: '14px',
        fontWeight: 500,
        gap: '8px',
    }
  });

  const styles = getStyles(currentThemeColors);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, colors: currentThemeColors }}>
      <div style={styles.body}>
        <nav style={styles.sidebar}>
          <h1 style={styles.header}>
            <AutopilotIcon />
            CV-AutoPilot
          </h1>
          <div style={{ flexGrow: 1 }}>
            {navItems.map(item => (
              <div
                key={item.id}
                style={currentView === item.id ? {...styles.navItem, ...styles.activeNavItem} : styles.navItem}
                onClick={() => setCurrentView(item.id as View)}
              >
                {item.icon}
                {item.label}
              </div>
            ))}
          </div>
          <div style={styles.themeSwitcher} onClick={toggleTheme}>
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            {theme === 'dark' ? 'Mudar para Tema Claro' : 'Mudar para Tema Escuro'}
          </div>
        </nav>
        <main style={styles.mainContent}>
          {renderView()}
        </main>
      </div>
    </ThemeContext.Provider>
  );
};

export default App;