// FIX: Replaced HTML content with a valid React component to serve as the application's main entry point. This resolves TypeScript parsing errors and the missing default export issue.
import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import AITools from './components/AITools';
import CVManager from './components/CVManager';
import HistoryView from './components/History';
import CreativeStudio from './components/CreativeStudio';
import LeadFinder from './components/LeadFinder';
import { Briefcase, Wand, FileText, Clock, Sparkles, AutopilotIcon, Target } from './components/icons';

type View = 'dashboard' | 'cv-manager' | 'ai-tools' | 'history' | 'creative-studio' | 'lead-finder';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('cv-manager');

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

  // Inlined styles to avoid needing a separate CSS file and to match the self-contained component style.
  const bodyStyle: React.CSSProperties = {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
    margin: 0,
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: '#f0f2f5',
    color: '#333'
  };

  const sidebarStyle: React.CSSProperties = {
    width: '280px',
    backgroundColor: '#fff',
    padding: '20px',
    boxSizing: 'border-box',
    borderRight: '1px solid #e0e0e0',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0
  };

  const mainContentStyle: React.CSSProperties = {
    flexGrow: 1,
    padding: '30px',
    boxSizing: 'border-box',
    overflowY: 'auto'
  };

  const navItemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 15px',
    borderRadius: '8px',
    marginBottom: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.2s, color 0.2s',
    fontSize: '16px',
    fontWeight: 500,
    color: '#3c4043'
  };
  
  const activeNavItemStyle: React.CSSProperties = {
    ...navItemStyle,
    backgroundColor: '#1967d2',
    color: '#fff',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1967d2',
    marginBottom: '30px',
    paddingBottom: '10px',
    borderBottom: '2px solid #e0e0e0'
  };

  return (
    <div style={bodyStyle}>
      <nav style={sidebarStyle}>
        <h1 style={headerStyle}>
          <AutopilotIcon />
          CV-AutoPilot
        </h1>
        {navItems.map(item => (
          <div
            key={item.id}
            style={currentView === item.id ? activeNavItemStyle : navItemStyle}
            onClick={() => setCurrentView(item.id as View)}
          >
            {item.icon}
            {item.label}
          </div>
        ))}
      </nav>
      <main style={mainContentStyle}>
        {renderView()}
      </main>
    </div>
  );
};

export default App;