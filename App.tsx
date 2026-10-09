// Senior Frontend Architecture - Executive Corporate HR & AI Platform
import React, { useState, useEffect, createContext, useMemo, useCallback } from 'react';
import Dashboard from './components/Dashboard';
import AITools from './components/AITools';
import CVManager from './components/CVManager';
import HistoryView from './components/History';
import CreativeStudio from './components/CreativeStudio';
import LeadFinder from './components/LeadFinder';
import JobTailoredCVBuilder from './components/JobTailoredCVBuilder';
import JobMatchAnalyzer from './components/JobMatchAnalyzer';
import { ContactExtractor } from './components/ContactExtractor';
import { 
  Briefcase, 
  Wand, 
  FileText, 
  Clock, 
  Sparkles, 
  Target, 
  SunIcon, 
  MoonIcon,
  Bell,
  Activity,
  ShieldCheck,
  Zap,
  ChevronRight,
  SearchIcon,
  MicIcon,
  Bot,
  Menu,
  X,
  ContactIcon
} from './components/icons';
import { useLocalStorage } from './hooks/useLocalStorage';
import { Application, Theme, AuthUser } from './types';
import { Monitor, Download, LogOut, User, Globe, DollarSign, TrendingUp, Share2, HardDrive, RefreshCw, Send, BookOpen, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import WindowsInstallerModal from './components/WindowsInstallerModal';
import { ExternalAccessModal } from './components/ExternalAccessModal';
import LoginScreen from './components/LoginScreen';
import { AuthService } from './services/authService';
import JobFormAutofill from './components/JobFormAutofill';
import SalaryBenchmarking from './components/SalaryBenchmarking';
import { PersonalSWOTAnalysis } from './components/PersonalSWOTAnalysis';
import { CVAutoDispatcher } from './components/CVAutoDispatcher';
import { CVAutoPilot360 } from './components/CVAutoPilot360';
import { SystemManualFAQ } from './components/SystemManualFAQ';
import { ScreenContextFAQModal } from './components/ScreenContextFAQModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { PWAInstallButton } from './components/PWAInstallButton';
import { OfflineDocumentsModal } from './components/OfflineDocumentsModal';
import { BackgroundSyncModal } from './components/BackgroundSyncModal';
import { useOfflineDocuments } from './hooks/useOfflineDocuments';
import { useBackgroundSync } from './hooks/useBackgroundSync';

// Custom enterprise logo generated for CV-AutoPilot
const LOGO_SRC = "/src/assets/images/cv_autopilot_logo_1789832318438.jpg";

type View = 'dashboard' | 'cv-manager' | 'contact-extractor' | 'job-tailored-cv' | 'job-analyzer' | 'ai-tools' | 'history' | 'creative-studio' | 'lead-finder' | 'form-autofill' | 'salary-benchmark' | 'personal-swot' | 'cv-dispatcher' | 'autopilot-dispatcher' | 'faq-manual';

import { themes, ThemeContext, defaultThemeContext } from './ThemeContext';
export { themes, ThemeContext, defaultThemeContext } from './ThemeContext';
export type { ThemeColors, ThemeContextType } from './ThemeContext';

const App: React.FC = () => {
  // Sessão de autenticação: Ao iniciar a ferramenta ou retornar após sair, inicia na tela de login
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => AuthService.getCurrentUser());
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isScreenFaqModalOpen, setIsScreenFaqModalOpen] = useState(false);
  const [currentView, setCurrentView] = useState<View>('cv-manager');
  const [theme, setTheme] = useLocalStorage<Theme>('theme', 'dark');
  const [applications, setApplications] = useLocalStorage<Application[]>('applications', []);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [navSearchQuery, setNavSearchQuery] = useState('');
  const [isMobile, setIsMobile] = useState<boolean>(() => 
    typeof window !== 'undefined' ? window.innerWidth < 1024 : false
  );
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [isWindowsModalOpen, setIsWindowsModalOpen] = useState(false);
  const [isExternalAccessModalOpen, setIsExternalAccessModalOpen] = useState(false);
  const { offlineDocs } = useOfflineDocuments();
  const [isOfflineDocsModalOpen, setIsOfflineDocsModalOpen] = useState(false);
  const { pendingCount, isSyncing } = useBackgroundSync();
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [readingScale, setReadingScale] = useLocalStorage<'compact' | 'normal' | 'comfortable'>('cv_autopilot_reading_scale', 'normal');
  const [shouldReduceMotion, setShouldReduceMotion] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      setShouldReduceMotion(mq.matches);
      const listener = (e: MediaQueryListEvent) => setShouldReduceMotion(e.matches);
      mq.addEventListener('change', listener);
      return () => mq.removeEventListener('change', listener);
    }
  }, []);

  // Aplicar escala de leitura selecionada para garantir leitura 100% completa de qualquer tópico
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-reading-scale', readingScale);
    }
  }, [readingScale]);

  // Verificar parâmetros na URL (ex: ?logout=1 para sair, ?login=1 ou ?admin=1 para abrir modal)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const search = window.location.search;
      if (search) {
        const params = new URLSearchParams(search);
        if (params.get('logout') === '1' || params.get('logout') === 'true') {
          AuthService.logout();
          setCurrentUser(null);
          setIsLoginModalOpen(false);
        } else if (params.get('login') === '1' || params.get('login') === 'true' || params.get('admin') === '1') {
          setIsLoginModalOpen(true);
        }
      }
    }
  }, []);

  // No ambiente de teste, garantir renovação automática sem interrupção de uso por travas de IP
  useEffect(() => {
    if (currentUser?.role === 'trial') {
      const interval = setInterval(() => {
        const remaining = AuthService.getTrialRemainingTime(currentUser.email, currentUser.networkIp);
        if (remaining.isExpired) {
          AuthService.renewTestAccountSilently(currentUser.email, currentUser.networkIp);
        }
      }, 60000);
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) {
        setMobileDrawerOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleTheme = useCallback(() => setTheme(prev => prev === 'dark' ? 'light' : 'dark'), [setTheme]);
  const currentThemeColors = useMemo(() => themes[theme] || themes.dark, [theme]);
  const themeContextValue = useMemo(() => ({
    theme: theme || 'dark',
    toggleTheme,
    colors: currentThemeColors || themes.dark
  }), [theme, toggleTheme, currentThemeColors]);

  const handleLogout = () => {
    if (window.confirm("Deseja sair da ferramenta e retornar à tela de login?")) {
      AuthService.logout();
      setCurrentUser(null);
      setIsLoginModalOpen(false);
      setMobileDrawerOpen(false);
    }
  };

  useEffect(() => {
    document.body.style.backgroundColor = currentThemeColors.background;
    document.body.style.color = currentThemeColors.textPrimary;
  }, [theme, currentThemeColors]);

  const today = new Date().toISOString().split('T')[0];
  const notificationCount = applications.filter(app => app.reminderDate && app.reminderDate <= today).length;
  const trialStatus = AuthService.getTrialRemainingTime(currentUser?.email, currentUser?.networkIp);

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard applications={applications} setApplications={setApplications} onNavigateToSWOT={() => setCurrentView('personal-swot')} onNavigateToDispatcher={() => setCurrentView('cv-dispatcher')} />;
      case 'cv-manager':
        return <CVManager onNavigateToSWOT={() => setCurrentView('personal-swot')} onNavigateToDispatcher={() => setCurrentView('cv-dispatcher')} />;
      case 'contact-extractor':
        return <ContactExtractor />;
      case 'job-tailored-cv':
        return <JobTailoredCVBuilder onNavigateToCVManager={() => setCurrentView('cv-manager')} />;
      case 'job-analyzer':
        return <JobMatchAnalyzer onNavigateToTailoredCV={() => setCurrentView('job-tailored-cv')} />;
      case 'ai-tools':
        return <AITools />;
      case 'history':
        return <HistoryView />;
      case 'creative-studio':
        return <CreativeStudio />;
      case 'lead-finder':
        return <LeadFinder />;
      case 'form-autofill':
        return <JobFormAutofill onNavigateToApplications={() => setCurrentView('dashboard')} />;
      case 'salary-benchmark':
        return <SalaryBenchmarking onNavigateToApplications={() => setCurrentView('dashboard')} />;
      case 'personal-swot':
        return <PersonalSWOTAnalysis onNavigateToCVManager={() => setCurrentView('cv-manager')} onNavigateToApplications={() => setCurrentView('dashboard')} />;
      case 'cv-dispatcher':
        return <CVAutoDispatcher onNavigateToApplications={() => setCurrentView('dashboard')} onNavigateToCVManager={() => setCurrentView('cv-manager')} />;
      case 'autopilot-dispatcher':
        return <CVAutoPilot360 onNavigateToApplications={() => setCurrentView('dashboard')} onNavigateToCVManager={() => setCurrentView('cv-manager')} onNavigateToDispatcher={() => setCurrentView('cv-dispatcher')} />;
      case 'faq-manual':
        return <SystemManualFAQ colors={currentThemeColors} theme={theme} onNavigateToView={(view: View) => setCurrentView(view)} />;
      default:
        return <CVManager onNavigateToSWOT={() => setCurrentView('personal-swot')} onNavigateToDispatcher={() => setCurrentView('cv-dispatcher')} />;
    }
  };

  const navGroups = [
    {
      title: 'CARREIRA & INTELIGÊNCIA ARTIFICIAL',
      items: [
        { 
          id: 'autopilot-dispatcher', 
          label: 'Piloto Automático 360° (Disparador)', 
          icon: <Bot size={18} />, 
          badge: 'CopiVaga • Loopcv',
          description: 'Disparador automático multicanais baseado em CopiVaga, VagaAutomática, Loopcv e JobCopilot'
        },
        { 
          id: 'cv-dispatcher', 
          label: 'Disparador de Currículo (IA)', 
          icon: <Send size={18} />, 
          badge: 'Email • Vagas & Região',
          description: 'Disparo por e-mail formatado e preenchimento automático por vaga e região'
        },
        { 
          id: 'personal-swot', 
          label: 'Análise SWOT Pessoal (IA)', 
          icon: <Target size={18} />, 
          badge: 'Estratégia IA',
          description: 'Forças, Fraquezas, Oportunidades, Ameaças e plano de ação'
        },
        { 
          id: 'salary-benchmark', 
          label: 'Benchmarking Salarial (IA)', 
          icon: <DollarSign size={18} />, 
          badge: 'Salarial IA',
          description: 'Médias em tempo real, percentis e remuneração de mercado'
        },
        { 
          id: 'form-autofill', 
          label: 'Auto-Preenchimento de Vagas (IA)', 
          icon: <Zap size={18} />, 
          badge: 'Gupy • Vagas',
          description: 'Preenchimento automático de formulários e perguntas de vagas'
        },
        { 
          id: 'contact-extractor', 
          label: 'Extrator de Contatos de CV', 
          icon: <ContactIcon size={18} />, 
          badge: 'IA 360°',
          description: 'Extração de contatos, vaga e endereço'
        },
        { 
          id: 'job-analyzer', 
          label: 'Analista de Vagas', 
          icon: <Target size={18} />, 
          badge: 'ATS Match',
          description: 'Auditoria de Job Description & ATS'
        },
        { 
          id: 'cv-manager', 
          label: 'Gerenciador de Currículos', 
          icon: <FileText size={18} />, 
          badge: 'ATS 99%',
          description: 'Modelos C-Level & Exportação DOCX/PDF'
        },
        { 
          id: 'job-tailored-cv', 
          label: 'Currículo Sob Medida (Vagas)', 
          icon: <Sparkles size={18} />, 
          badge: 'Sob Medida',
          description: 'Mestre de RH & modelos por vaga'
        },
        { 
          id: 'ai-tools', 
          label: 'Ferramentas de IA & ATS', 
          icon: <Wand size={18} />, 
          badge: 'Gemini AI',
          description: 'Auditoria de keywords & Match'
        },
        { 
          id: 'history', 
          label: 'Histórico de Gerações', 
          icon: <Clock size={18} />, 
          badge: undefined,
          description: 'Registro de cartas e versões'
        },
      ]
    },
    {
      title: 'RECRUTAMENTO & MERCADO',
      items: [
        { 
          id: 'lead-finder', 
          label: 'Pesquisa 360° de Candidatos & Currículos Locais', 
          icon: <Target size={18} />, 
          badge: 'Busca 360°',
          description: 'Cidades, bairros, sites de RH & Correios'
        },
        { 
          id: 'dashboard', 
          label: 'Pipeline de Candidaturas', 
          icon: <Briefcase size={18} />, 
          count: notificationCount,
          description: 'Follow-ups, status e entrevistas'
        },
        { 
          id: 'creative-studio', 
          label: 'Simulador STAR & Mentoria', 
          icon: <Sparkles size={18} />, 
          badge: 'Mentoria STAR',
          description: 'Dra. Valéria Silveira • Dossiê PDF'
        },
      ]
    },
    {
      title: 'MANUAL & AJUDA DO SISTEMA',
      items: [
        { 
          id: 'faq-manual', 
          label: 'Manual do Sistema & FAQ', 
          icon: <BookOpen size={18} />, 
          badge: 'PDF • PPTX',
          description: 'Guia didático de todas as 11 telas com o Professor Sênior e exportação em PDF e PPTX'
        },
      ]
    }
  ];

  const currentViewDetails = () => {
    switch (currentView) {
      case 'salary-benchmark':
        return {
          category: 'Remuneração & Inteligência',
          title: 'Benchmarking Salarial & Mercado (IA)',
          badge: 'Robert Half 2026',
          subtitle: 'Análise comparativa em tempo real de médias salariais CLT/PJ, percentis P25-P90 e táticas de negociação.'
        };
      case 'form-autofill':
        return {
          category: 'Carreira & Automação',
          title: 'Auto-Preenchimento de Formulários de Vagas (IA)',
          badge: 'Gupy • Workday',
          subtitle: 'Preenchimento automatizado de campos, redações de motivação e perguntas de triagem sob medida.'
        };
      case 'contact-extractor':
        return {
          category: 'Recrutamento & Inteligência',
          title: 'Extrator de Contatos & Dossiê de Candidatura',
          badge: 'IA 360° • OCR',
          subtitle: 'Extraia nome completo, e-mail, telefone/WhatsApp, vaga pretendida e endereço completo com CEP via arquivos ou internet.'
        };
      case 'job-analyzer': 
        return {
          category: 'Carreira & IA',
          title: 'Analista de Vagas & Compatibilidade IA',
          badge: 'Match ATS',
          subtitle: 'Auditoria de aderência instantânea entre Job Description e currículo com sugestões de ajuste.'
        };
      case 'cv-manager': 
        return {
          category: 'Carreira & IA',
          title: 'Gerenciador de Currículos',
          badge: 'ATS 99.4%',
          subtitle: 'Estruturação executiva padrão C-Level, auditoria de impacto e exportação instantânea.'
        };
      case 'ai-tools': 
        return {
          category: 'Carreira & IA',
          title: 'Ferramentas de IA & Algoritmo ATS',
          badge: 'Gemini Pro',
          subtitle: 'Alinhamento algorítmico contra filtros de triagem Workday, Taleo, Greenhouse e Gupy.'
        };
      case 'lead-finder': 
        return {
          category: 'Mercado & Talentos',
          title: 'Pesquisa 360° de Candidatos & Currículos Locais',
          badge: 'Busca 360°',
          subtitle: 'Varredura profunda por estados, cidades e bairros integrados para identificar candidatos, currículos e vagas locais.'
        };
      case 'dashboard': 
        return {
          category: 'Gestão de Carreira',
          title: 'Painel de Candidaturas & Follow-ups',
          badge: `${applications.length} Oportunidades`,
          subtitle: 'Kanban inteligente de progresso, lembretes de entrevista e controle de remuneração.'
        };
      case 'history': 
        return {
          category: 'Histórico & Auditoria',
          title: 'Histórico de Gerações de IA',
          badge: 'Seguro',
          subtitle: 'Arquivo consolidado de currículos gerados, cartas de apresentação e diagnósticos.'
        };
      case 'autopilot-dispatcher':
        return {
          category: 'Carreira & Inteligência Artificial',
          title: 'Piloto Automático 360° (Disparador)',
          badge: 'CopiVaga • VagaAutomática • Loopcv • JobCopilot',
          subtitle: 'Disparo autônomo multicanal (20 a 50 candidaturas/dia) em fontes 100% reais (LinkedIn, Gupy, Catho, Indeed e Páginas Oficiais).'
        };
      case 'cv-dispatcher':
        return {
          category: 'Carreira & Inteligência Artificial',
          title: 'Disparador de Currículo & Varredura Web (IA)',
          badge: 'Radar Web • Disparo 1-Clique',
          subtitle: 'Varredura completa na internet por palavra-chave e região, disparo por e-mail formatado e preenchimento de vagas.'
        };
      case 'creative-studio': 
        return {
          category: 'Mentoria & Diretoria de RH',
          title: 'Simulador STAR por Voz & Mentoria Executiva',
          badge: 'Mentoria STAR',
          subtitle: 'Treinamento de resposta com feedback fonético/textual e emissão de Dossiê Executivo em PDF.'
        };
      case 'faq-manual':
        return {
          category: 'Instrução & Suporte',
          title: 'Manual Completo do Sistema & FAQ Interativo',
          badge: 'PDF • PPTX • Prof. Sênior',
          subtitle: 'Guia didático detalhado de todas as 11 telas e funcionalidades com exportação em PDF e PowerPoint (.pptx).'
        };
      default: 
        return {
          category: 'Plataforma',
          title: 'CV-AutoPilot Enterprise',
          badge: 'Enterprise',
          subtitle: 'Inteligência executiva em recrutamento e aceleração de carreira.'
        };
    }
  };

  const currentDetails = currentViewDetails();
  const styles = getStyles(currentThemeColors, sidebarCollapsed, theme, isMobile);

  // Animation variants for smooth module enter & exit transitions
  const pageVariants = shouldReduceMotion ? {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  } : {
    initial: { opacity: 0, y: 14, scale: 0.995, filter: 'blur(3px)' },
    animate: { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' },
    exit: { opacity: 0, y: -10, scale: 0.995, filter: 'blur(2px)' }
  };

  const pageTransition = shouldReduceMotion ? {
    duration: 0.15
  } : {
    duration: 0.24,
    ease: [0.22, 1, 0.36, 1] as [number, number, number, number]
  };

  // Se o usuário não estiver autenticado (ou após sair e retornar à ferramenta), exibe a tela de login
  if (!currentUser) {
    return (
      <ThemeContext.Provider value={themeContextValue}>
        <div style={{ minHeight: '100vh', backgroundColor: currentThemeColors.background }}>
          <LoginScreen
            onLoginSuccess={(user) => {
              setCurrentUser(user);
              setIsLoginModalOpen(false);
            }}
          />
        </div>
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={themeContextValue}>
      <div style={styles.body}>
        {/* Mobile Off-Canvas Drawer & Overlay */}
        {isMobile && mobileDrawerOpen && (
          <>
            <div 
              style={styles.mobileBackdrop} 
              onClick={() => setMobileDrawerOpen(false)}
            />
            <aside style={styles.mobileDrawer}>
              {/* Drawer Brand Header with Close */}
              <div style={styles.mobileDrawerHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={styles.logoContainer}>
                    <img
                      src={LOGO_SRC}
                      alt="CV-AutoPilot Logo"
                      style={styles.logoImg}
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={styles.brandName}>CV-AutoPilot</span>
                      <span style={styles.brandBadge}>PRO</span>
                    </div>
                    <span style={styles.brandSubtitle}>Talent & Career Intelligence</span>
                  </div>
                </div>
                <button
                  onClick={() => setMobileDrawerOpen(false)}
                  style={styles.mobileDrawerCloseBtn}
                  title="Fechar menu"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Status Pill */}
              <div style={styles.statusPill}>
                <span style={styles.statusDot} className="engine-pulse"></span>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={styles.statusText}>Motor ATS Gemini 3.8</span>
                  <span style={styles.statusSubtext}>Algoritmos calibrados • Online</span>
                </div>
              </div>

              {/* Navigation Groups */}
              <div style={styles.navContainer}>
                {navGroups.map((group, gIdx) => (
                  <div key={gIdx} style={{ marginBottom: '16px' }}>
                    <div style={styles.groupTitle}>{group.title}</div>
                    {group.items.map(item => {
                      const isActive = currentView === item.id;
                      return (
                        <div
                          key={item.id}
                          style={isActive ? { ...styles.navItem, ...styles.activeNavItem } : styles.navItem}
                          onClick={() => {
                            setCurrentView(item.id as View);
                            setMobileDrawerOpen(false);
                          }}
                        >
                          <span style={isActive ? styles.activeIconWrap : styles.inactiveIconWrap}>
                            {item.icon}
                          </span>
                          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, gap: '2px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', minWidth: 0 }}>
                              <span style={isActive ? styles.navItemLabelActive : styles.navItemLabel}>
                                {item.label}
                              </span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                                {item.badge && (
                                  <span style={isActive ? styles.itemBadgeActive : styles.itemBadge}>
                                    {item.badge}
                                  </span>
                                )}
                                {item.count && item.count > 0 ? (
                                  <span style={styles.notificationBadge}>{item.count}</span>
                                ) : null}
                              </div>
                            </div>
                            <span style={isActive ? styles.navItemDescActive : styles.navItemDesc}>
                              {item.description}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Recruiter / Profile Footer */}
              <div style={styles.userCard}>
                <div 
                  style={{ ...styles.userAvatar, cursor: 'pointer' }}
                  onClick={() => {
                    setIsLoginModalOpen(true);
                    setMobileDrawerOpen(false);
                  }}
                  title="Clique para gerenciar perfis ou entrar como Administrador"
                >
                  {currentUser.role === 'admin' ? 'AA' : currentUser.role === 'guest' ? 'CV' : 'TT'}
                </div>
                <div 
                  style={{ minWidth: 0, flex: 1, cursor: 'pointer' }}
                  onClick={() => {
                    setIsLoginModalOpen(true);
                    setMobileDrawerOpen(false);
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={styles.userName}>
                      {currentUser.role === 'admin' ? 'André Azevedo' : 'Ambiente de Teste'}
                    </span>
                    <span 
                      style={{ 
                        width: '6px', 
                        height: '6px', 
                        borderRadius: '50%', 
                        backgroundColor: currentThemeColors.success,
                        boxShadow: `0 0 6px ${currentThemeColors.success}`
                      }}
                    />
                  </div>
                  <div style={styles.userRole}>
                    {currentUser.role === 'admin' 
                      ? 'Administrador Master' 
                      : 'Acesso Livre • Sem Login Google'}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <button
                    type="button"
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px' }}
                    onClick={() => {
                      setIsLoginModalOpen(true);
                      setMobileDrawerOpen(false);
                    }}
                    title="Alternar Perfil ou Entrar como Administrador"
                  >
                    <User size={16} color={currentThemeColors.textSecondary} />
                  </button>
                  <button
                    type="button"
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px' }}
                    onClick={handleLogout}
                    title="Sair da Ferramenta e Retornar ao Login"
                  >
                    <LogOut size={16} color={currentThemeColors.textSecondary} />
                  </button>
                </div>
              </div>

              {/* Windows Installer Trigger */}
              <div 
                style={styles.windowsInstallerTrigger} 
                onClick={() => {
                  setIsWindowsModalOpen(true);
                  setMobileDrawerOpen(false);
                }}
                title="Instalar CV-AutoPilot no seu computador Windows"
              >
                <Monitor size={17} />
                <span>Instalar no PC (Windows)</span>
              </div>

              {/* Seletor de Escala de Fonte no Menu Mobile (Leitura Completa de Tópicos) */}
              <div style={{
                padding: '10px 12px',
                backgroundColor: currentThemeColors.background,
                borderRadius: '10px',
                border: `1px solid ${currentThemeColors.border}`,
                marginBottom: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: currentThemeColors.textSecondary }}>
                    Escala de Leitura do Tópico
                  </span>
                  <span style={{ fontSize: '9px', fontWeight: 800, padding: '1px 5px', borderRadius: '4px', backgroundColor: currentThemeColors.primaryLight, color: currentThemeColors.primary }}>
                    {readingScale === 'compact' ? 'Compacto' : readingScale === 'normal' ? 'Normal' : 'Ampliado'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    type="button"
                    onClick={() => setReadingScale('compact')}
                    style={{
                      flex: 1,
                      padding: '6px 4px',
                      borderRadius: '6px',
                      fontSize: '10.5px',
                      fontWeight: readingScale === 'compact' ? 800 : 600,
                      backgroundColor: readingScale === 'compact' ? currentThemeColors.primary : currentThemeColors.surface,
                      color: readingScale === 'compact' ? '#ffffff' : currentThemeColors.textPrimary,
                      border: `1px solid ${readingScale === 'compact' ? currentThemeColors.primary : currentThemeColors.border}`,
                      cursor: 'pointer',
                    }}
                    title="Diminui a fonte para leitura 100% completa sem rolagem excessiva"
                  >
                    A- Compacto
                  </button>
                  <button
                    type="button"
                    onClick={() => setReadingScale('normal')}
                    style={{
                      flex: 1,
                      padding: '6px 4px',
                      borderRadius: '6px',
                      fontSize: '10.5px',
                      fontWeight: readingScale === 'normal' ? 800 : 600,
                      backgroundColor: readingScale === 'normal' ? currentThemeColors.primary : currentThemeColors.surface,
                      color: readingScale === 'normal' ? '#ffffff' : currentThemeColors.textPrimary,
                      border: `1px solid ${readingScale === 'normal' ? currentThemeColors.primary : currentThemeColors.border}`,
                      cursor: 'pointer',
                    }}
                    title="Tamanho padrão de leitura"
                  >
                    A Normal
                  </button>
                  <button
                    type="button"
                    onClick={() => setReadingScale('comfortable')}
                    style={{
                      flex: 1,
                      padding: '6px 4px',
                      borderRadius: '6px',
                      fontSize: '10.5px',
                      fontWeight: readingScale === 'comfortable' ? 800 : 600,
                      backgroundColor: readingScale === 'comfortable' ? currentThemeColors.primary : currentThemeColors.surface,
                      color: readingScale === 'comfortable' ? '#ffffff' : currentThemeColors.textPrimary,
                      border: `1px solid ${readingScale === 'comfortable' ? currentThemeColors.primary : currentThemeColors.border}`,
                      cursor: 'pointer',
                    }}
                    title="Fonte ampliada"
                  >
                    A+ Ampliado
                  </button>
                </div>
              </div>

              {/* Theme Switcher */}
              <div style={styles.themeSwitcher} onClick={toggleTheme}>
                {theme === 'dark' ? <SunIcon size={18} /> : <MoonIcon size={18} />}
                <span>{theme === 'dark' ? 'Modo Executivo Claro' : 'Modo Noturno Escuro'}</span>
              </div>
            </aside>
          </>
        )}

        {/* Desktop Sidebar (hidden on mobile) */}
        <aside style={styles.sidebar}>
          {/* Brand Header */}
          <div style={styles.brandHeader}>
            <div style={styles.logoContainer}>
              <img
                src={LOGO_SRC}
                alt="CV-AutoPilot Logo"
                style={styles.logoImg}
                referrerPolicy="no-referrer"
              />
            </div>
            {!sidebarCollapsed && (
              <div style={styles.brandTextContainer}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={styles.brandName}>CV-AutoPilot</span>
                  <span style={styles.brandBadge}>PRO</span>
                </div>
                <span style={styles.brandSubtitle}>Talent & Career Intelligence</span>
              </div>
            )}
          </div>

          {/* ATS Status Pill */}
          {!sidebarCollapsed ? (
            <div style={styles.statusPill}>
              <span style={styles.statusDot} className="engine-pulse"></span>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={styles.statusText}>Motor ATS Gemini 2.5</span>
                <span style={styles.statusSubtext}>Algoritmos calibrados • Online</span>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }} title="Motor ATS Gemini 2.5 • Ativo">
              <span style={styles.statusDot} className="engine-pulse"></span>
            </div>
          )}

          {/* Optional Quick Nav Filter */}
          {!sidebarCollapsed && (
            <div style={styles.sidebarSearchBox}>
              <SearchIcon size={14} color={currentThemeColors.textMuted} />
              <input
                type="text"
                placeholder="Filtrar módulos..."
                value={navSearchQuery}
                onChange={e => setNavSearchQuery(e.target.value)}
                style={styles.sidebarSearchInput}
              />
            </div>
          )}

          {/* Navigation Groups */}
          <div style={styles.navContainer}>
            {navGroups.map((group, gIdx) => {
              const filteredItems = navSearchQuery.trim()
                ? group.items.filter(item => 
                    item.label.toLowerCase().includes(navSearchQuery.toLowerCase()) ||
                    item.description.toLowerCase().includes(navSearchQuery.toLowerCase())
                  )
                : group.items;

              if (filteredItems.length === 0) return null;

              return (
                <div key={gIdx} style={{ marginBottom: '20px' }}>
                  {!sidebarCollapsed && (
                    <div style={styles.groupTitle}>{group.title}</div>
                  )}
                  {filteredItems.map(item => {
                    const isActive = currentView === item.id;
                    return (
                      <div
                        key={item.id}
                        style={isActive ? { ...styles.navItem, ...styles.activeNavItem } : styles.navItem}
                        onClick={() => setCurrentView(item.id as View)}
                        title={sidebarCollapsed ? `${item.label} - ${item.description}` : undefined}
                      >
                        <span style={isActive ? styles.activeIconWrap : styles.inactiveIconWrap}>
                          {item.icon}
                        </span>

                        {!sidebarCollapsed && (
                          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, gap: '2px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', minWidth: 0 }}>
                              <span style={isActive ? styles.navItemLabelActive : styles.navItemLabel}>
                                {item.label}
                              </span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                                {item.badge && (
                                  <span style={isActive ? styles.itemBadgeActive : styles.itemBadge}>
                                    {item.badge}
                                  </span>
                                )}
                                {item.count && item.count > 0 ? (
                                  <span style={styles.notificationBadge}>{item.count}</span>
                                ) : null}
                              </div>
                            </div>
                            <span style={isActive ? styles.navItemDescActive : styles.navItemDesc}>
                              {item.description}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Recruiter / Profile Footer */}
          {!sidebarCollapsed && (
            <div style={styles.userCard}>
              <div 
                style={{ ...styles.userAvatar, cursor: 'pointer' }}
                onClick={() => setIsLoginModalOpen(true)}
                title="Clique para alternar perfil ou entrar como Administrador"
              >
                {currentUser.role === 'admin' ? 'AA' : currentUser.role === 'guest' ? 'CV' : 'TT'}
              </div>
              <div 
                style={{ minWidth: 0, flex: 1, cursor: 'pointer' }}
                onClick={() => setIsLoginModalOpen(true)}
                title="Clique para alternar perfil ou entrar como Administrador"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={styles.userName}>
                    {currentUser.role === 'admin' ? 'André Azevedo' : 'Ambiente de Teste'}
                  </span>
                  <span 
                    style={{ 
                      width: '6px', 
                      height: '6px', 
                      borderRadius: '50%', 
                      backgroundColor: currentThemeColors.success,
                      boxShadow: `0 0 6px ${currentThemeColors.success}`
                    }}
                  />
                </div>
                <div style={styles.userRole}>
                  {currentUser.role === 'admin' 
                    ? 'Administrador Master' 
                    : 'Acesso Livre • Sem Login Google'}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button
                  type="button"
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px' }}
                  onClick={() => setIsLoginModalOpen(true)}
                  title="Alternar Perfil ou Entrar como Administrador"
                >
                  <User size={16} color={currentThemeColors.textSecondary} />
                </button>
                <button
                  type="button"
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px' }}
                  onClick={handleLogout}
                  title="Sair da Ferramenta e Retornar ao Login"
                >
                  <LogOut size={16} color={currentThemeColors.textSecondary} />
                </button>
              </div>
            </div>
          )}

          {/* Windows Installer Trigger */}
          <div 
            style={styles.windowsInstallerTrigger} 
            onClick={() => setIsWindowsModalOpen(true)}
            title="Instalar CV-AutoPilot no seu computador Windows (PC / Desktop)"
          >
            <Monitor size={18} />
            {!sidebarCollapsed && (
              <span>Instalar no PC (Windows)</span>
            )}
          </div>

          {/* External Access URL Trigger */}
          <div 
            style={styles.externalUrlSidebarTrigger} 
            onClick={() => setIsExternalAccessModalOpen(true)}
            title="URL Oficial de Acesso Externo Segura (HTTPS para qualquer navegador)"
          >
            <Globe size={18} color="#10b981" />
            {!sidebarCollapsed && (
              <span>Link Externo Seguro</span>
            )}
          </div>

          {/* Theme Switcher */}
          <div style={styles.themeSwitcher} onClick={toggleTheme} title="Alternar Modo Claro / Escuro">
            {theme === 'dark' ? <SunIcon size={18} /> : <MoonIcon size={18} />}
            {!sidebarCollapsed && (
              <span>{theme === 'dark' ? 'Modo Executivo Claro' : 'Modo Noturno Escuro'}</span>
            )}
          </div>
        </aside>

        {/* Main Content Area */}
        <div style={styles.mainWrapper}>
          {/* Top Corporate App Bar */}
          <header style={styles.topBar}>
            <div style={styles.topBarLeft}>
              {isMobile ? (
                <button
                  style={styles.mobileHamburgerBtn}
                  onClick={() => setMobileDrawerOpen(true)}
                  title="Abrir Menu de Navegação"
                  aria-label="Abrir Menu"
                >
                  <Menu size={20} />
                </button>
              ) : (
                <button
                  style={styles.collapseToggle}
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  title={sidebarCollapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="9" y1="3" x2="9" y2="21"></line>
                  </svg>
                </button>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1, overflow: 'hidden' }}>
                {!isMobile && (
                  <div style={styles.breadcrumbRow}>
                    <span style={styles.topBreadcrumbRoot}>Plataforma</span>
                    <ChevronRight size={12} color={currentThemeColors.textMuted} style={{ flexShrink: 0 }} />
                    <span style={styles.topBreadcrumb}>{currentDetails.category}</span>
                    <ChevronRight size={12} color={currentThemeColors.textMuted} style={{ flexShrink: 0 }} />
                    <span style={styles.topBreadcrumbActive}>{currentDetails.title}</span>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '10px', minWidth: 0 }}>
                  {isMobile && (
                    <img
                      src={LOGO_SRC}
                      alt="Logo"
                      style={{ width: '26px', height: '26px', borderRadius: '7px', flexShrink: 0 }}
                    />
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '6px' : '10px', minWidth: 0, flexWrap: 'nowrap' }}>
                    <h1 style={isMobile ? styles.topPageTitleMobile : styles.topPageTitle}>
                      {currentDetails.title}
                    </h1>
                    <span style={styles.topHeaderBadge}>{currentDetails.badge}</span>

                    {/* Botão Contextual de FAQ e Guia Desta Tela */}
                    <button
                      type="button"
                      onClick={() => setIsScreenFaqModalOpen(true)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: isMobile ? '2px 7px' : '4px 10px',
                        borderRadius: '8px',
                        border: `1px solid ${currentThemeColors.borderFocus || '#881337'}`,
                        backgroundColor: currentThemeColors.primaryLight || 'rgba(136, 19, 55, 0.1)',
                        color: currentThemeColors.primary,
                        fontSize: isMobile ? '10px' : '11.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        flexShrink: 0
                      }}
                      title={`Abrir FAQ e Guia de Funcionalidades detalhado da tela ${currentDetails.title}`}
                    >
                      <HelpCircle size={13} color={currentThemeColors.primary} />
                      <span>FAQ Desta Tela</span>
                    </button>
                  </div>
                </div>
                {!isMobile && (
                  <p style={styles.topPageSubtitle}>
                    {currentDetails.subtitle}
                  </p>
                )}
              </div>
            </div>

            <div style={styles.topBarRight}>
              {/* Botão de Instalação PWA */}
              <PWAInstallButton colors={currentThemeColors} compact={isMobile} />

              {/* Botão de Consulta de Documentos Offline (IndexedDB / Workbox) */}
              <button 
                type="button"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: isMobile ? '5px 8px' : '6px 12px',
                  borderRadius: '10px',
                  border: `1px solid ${currentThemeColors.border}`,
                  backgroundColor: currentThemeColors.surface,
                  cursor: 'pointer',
                  color: currentThemeColors.textPrimary,
                  fontSize: '11.5px',
                  fontWeight: 700,
                  transition: 'all 0.15s ease',
                  flexShrink: 0
                }}
                onClick={() => setIsOfflineDocsModalOpen(true)}
                title="Consultar currículos e cartas salvos para leitura offline (IndexedDB & Service Worker)"
              >
                <HardDrive size={14} color="#10b981" />
                {!isMobile && <span>Leitura Offline</span>}
                {offlineDocs.length > 0 && (
                  <span style={{
                    fontSize: '9.5px',
                    fontWeight: 800,
                    padding: '1px 6px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    color: '#10b981'
                  }}>
                    {offlineDocs.length}
                  </span>
                )}
              </button>

              {/* Botão de Background Sync (Workbox 7) */}
              <button 
                type="button"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: isMobile ? '5px 8px' : '6px 12px',
                  borderRadius: '10px',
                  border: `1px solid ${pendingCount > 0 ? 'rgba(245, 158, 11, 0.4)' : currentThemeColors.border}`,
                  backgroundColor: pendingCount > 0 ? 'rgba(245, 158, 11, 0.12)' : currentThemeColors.surface,
                  cursor: 'pointer',
                  color: pendingCount > 0 ? '#f59e0b' : currentThemeColors.textPrimary,
                  fontSize: '11.5px',
                  fontWeight: 700,
                  transition: 'all 0.15s ease',
                  flexShrink: 0
                }}
                onClick={() => setIsSyncModalOpen(true)}
                title="Background Sync (Workbox): Sincronização automática de dados de candidaturas e currículos ao reconectar"
              >
                <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} color={pendingCount > 0 ? '#f59e0b' : currentThemeColors.primary} />
                {!isMobile && <span>Sync Workbox</span>}
                {pendingCount > 0 && (
                  <span style={{
                    fontSize: '9.5px',
                    fontWeight: 800,
                    padding: '1px 6px',
                    borderRadius: '4px',
                    backgroundColor: '#f59e0b',
                    color: '#000000'
                  }}>
                    {pendingCount}
                  </span>
                )}
              </button>

              {/* Botão Copiar URL para Compartilhar (Acesso Livre sem Login) */}
              <button 
                type="button"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: isMobile ? '5px 8px' : '6px 12px',
                  borderRadius: '10px',
                  border: `1px solid ${currentThemeColors.border}`,
                  backgroundColor: currentThemeColors.surface,
                  cursor: 'pointer',
                  color: currentThemeColors.textPrimary,
                  fontSize: '11.5px',
                  fontWeight: 700,
                  transition: 'all 0.15s ease',
                  flexShrink: 0
                }}
                onClick={() => setIsExternalAccessModalOpen(true)}
                title="Copiar link oficial de acesso livre (sem exigência de conta do Google ou Gmail)"
              >
                <Share2 size={14} color={currentThemeColors.primary} />
                {!isMobile && <span>URL Livre</span>}
                <span style={{
                  fontSize: '9.5px',
                  fontWeight: 800,
                  padding: '1px 6px',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  color: '#10b981'
                }}>
                  Aberta
                </span>
              </button>

              {/* Botão Manual & FAQ com Professor Sênior (PDF & PPTX) */}
              <button 
                type="button"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: isMobile ? '5px 8px' : '6px 12px',
                  borderRadius: '10px',
                  border: currentView === 'faq-manual' ? `1px solid ${currentThemeColors.primary}` : `1px solid ${currentThemeColors.border}`,
                  backgroundColor: currentView === 'faq-manual' ? (currentThemeColors.primaryLight || 'rgba(136, 19, 55, 0.12)') : currentThemeColors.surface,
                  cursor: 'pointer',
                  color: currentView === 'faq-manual' ? currentThemeColors.primary : currentThemeColors.textPrimary,
                  fontSize: '11.5px',
                  fontWeight: 700,
                  transition: 'all 0.15s ease',
                  flexShrink: 0
                }}
                onClick={() => setCurrentView('faq-manual')}
                title="Abrir o Manual do Sistema e FAQ do Professor Sênior com exportação em PDF e PPTX"
              >
                <BookOpen size={14} color={currentThemeColors.primary} />
                {!isMobile && <span>Manual & FAQ</span>}
                <span style={{
                  fontSize: '9.5px',
                  fontWeight: 800,
                  padding: '1px 6px',
                  borderRadius: '4px',
                  backgroundColor: currentThemeColors.primaryLight,
                  color: currentThemeColors.primary
                }}>
                  Guia
                </span>
              </button>

              {/* Status do Ambiente de Teste (Acesso Livre) */}
              <div 
                onClick={() => setIsLoginModalOpen(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: isMobile ? '5px 8px' : '6px 12px',
                  borderRadius: '10px',
                  backgroundColor: currentUser.role === 'admin' 
                    ? (currentThemeColors.primaryLight || 'rgba(136, 19, 55, 0.08)')
                    : 'rgba(16, 185, 129, 0.1)',
                  border: `1px solid ${currentUser.role === 'admin' 
                    ? (currentThemeColors.borderFocus || '#881337') 
                    : 'rgba(16, 185, 129, 0.3)'}`,
                  fontSize: '11px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  flexShrink: 0
                }}
                title="Ambiente de Teste Livre: Qualquer usuário com a URL pode usar todas as funcionalidades sem login do Google. Clique para gerenciar perfis."
              >
                <span 
                  style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    backgroundColor: currentThemeColors.success,
                    boxShadow: `0 0 8px ${currentThemeColors.success}`,
                    flexShrink: 0
                  }}
                />
                <span style={{ color: currentThemeColors.textPrimary, whiteSpace: 'nowrap' }}>
                  {currentUser.role === 'admin' 
                    ? (!isMobile ? 'Admin Master' : 'Admin') 
                    : (!isMobile ? 'Ambiente de Teste' : 'Teste')}
                </span>
              </div>

              {/* Notification Pill if pending */}
              {notificationCount > 0 && (
                <button 
                  style={styles.notificationTrigger}
                  onClick={() => setCurrentView('dashboard')}
                  title={`${notificationCount} candidaturas aguardando follow-up`}
                >
                  <Bell size={16} />
                  <span style={styles.notificationCountBubble}>{notificationCount}</span>
                </button>
              )}

              {/* Perfil / Troca de Usuário (Ícone Discreto) */}
              <button 
                type="button"
                style={styles.quickThemeBtn}
                onClick={() => setIsLoginModalOpen(true)}
                title="Gerenciar Contas ou Alternar Perfil"
                aria-label="Gerenciar Contas"
              >
                <User size={16} color={currentThemeColors.textSecondary} />
              </button>

              {/* Quick Theme Toggle Icon */}
              <button 
                type="button"
                style={styles.quickThemeBtn} 
                onClick={toggleTheme} 
                title="Alternar Tema Visual"
              >
                {theme === 'dark' ? <SunIcon size={18} /> : <MoonIcon size={18} />}
              </button>
            </div>
          </header>

          {/* View Body with Smooth Enter & Exit Animations */}
          <main style={styles.mainContent}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={currentView}
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={pageTransition}
                style={{ width: '100%', minHeight: '100%' }}
              >
                {renderView()}
              </motion.div>
            </AnimatePresence>
          </main>

          {/* Mobile Bottom Navigation Bar (Smart Thumb Reach for Phones) */}
          {isMobile && (
            <nav style={styles.mobileBottomNav} aria-label="Navegação Principal Mobile">
              {[
                { id: 'job-analyzer', label: 'Analista', icon: <Target size={18} />, highlight: true },
                { id: 'cv-manager', label: 'Currículos', icon: <FileText size={18} /> },
                { id: 'lead-finder', label: 'Pesquisa 360°', icon: <Target size={18} /> },
                { id: 'job-tailored-cv', label: 'CV p/ Vaga', icon: <Sparkles size={18} /> },
                { id: 'more-menu', label: 'Mais', icon: <Menu size={18} />, action: () => setMobileDrawerOpen(true) },
              ].map(navItem => {
                const isActive = currentView === navItem.id;
                return (
                  <button
                    key={navItem.id}
                    style={isActive ? styles.mobileBottomNavBtnActive : styles.mobileBottomNavBtn}
                    onClick={() => {
                      if (navItem.action) {
                        navItem.action();
                      } else {
                        setCurrentView(navItem.id as View);
                      }
                    }}
                  >
                    <div style={navItem.highlight && !isActive ? { color: currentThemeColors.primary } : undefined}>
                      {navItem.icon}
                    </div>
                    <span style={styles.mobileBottomNavLabel}>{navItem.label}</span>
                    {isActive && <span style={styles.mobileBottomNavIndicator} />}
                  </button>
                );
              })}
            </nav>
          )}
        </div>

        {/* Windows Installer Modal */}
        <WindowsInstallerModal 
          isOpen={isWindowsModalOpen}
          onClose={() => setIsWindowsModalOpen(false)}
        />

        {/* Modal de URL Oficial de Acesso Externo Segura */}
        <ExternalAccessModal
          isOpen={isExternalAccessModalOpen}
          onClose={() => setIsExternalAccessModalOpen(false)}
          colors={currentThemeColors}
        />

        {/* Modal Executivo de Troca de Perfil & Login de Administrador */}
        {isLoginModalOpen && (
          <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 3000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            overflowY: 'auto'
          }}>
            <div style={{ width: '100%', maxWidth: '640px', margin: 'auto' }}>
              <LoginScreen 
                onLoginSuccess={(user) => {
                  setCurrentUser(user);
                  setIsLoginModalOpen(false);
                }}
                onClose={() => setIsLoginModalOpen(false)}
              />
            </div>
          </div>
        )}

        {/* Modal de Leitura Offline (IndexedDB via Service Worker) */}
        <OfflineDocumentsModal
          isOpen={isOfflineDocsModalOpen}
          onClose={() => setIsOfflineDocsModalOpen(false)}
          colors={currentThemeColors}
        />

        {/* Modal de Gestão da Fila do Background Sync (Workbox 7) */}
        <BackgroundSyncModal
          isOpen={isSyncModalOpen}
          onClose={() => setIsSyncModalOpen(false)}
          colors={currentThemeColors}
        />

        {/* Modal de FAQ e Guia Contextual de Todas as Telas */}
        <ScreenContextFAQModal
          isOpen={isScreenFaqModalOpen}
          onClose={() => setIsScreenFaqModalOpen(false)}
          currentView={currentView}
          colors={currentThemeColors}
          theme={theme}
          onNavigateToView={(view: View) => setCurrentView(view)}
        />

        {/* Botão Flutuante (FAB) de FAQ & Ajuda Presente em TODAS as Telas */}
        <div style={{
          position: 'fixed',
          bottom: isMobile ? '76px' : '24px',
          right: '20px',
          zIndex: 1050
        }}>
          <button
            type="button"
            onClick={() => setIsScreenFaqModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: isMobile ? '9px 14px' : '11px 18px',
              borderRadius: '30px',
              backgroundColor: currentThemeColors.primary,
              color: '#ffffff',
              border: `2px solid rgba(255, 255, 255, 0.25)`,
              boxShadow: '0 8px 24px rgba(136, 19, 55, 0.45)',
              cursor: 'pointer',
              fontSize: isMobile ? '12px' : '13px',
              fontWeight: 800,
              transition: 'all 0.2s ease'
            }}
            title={`Abrir FAQ e Guia de Funcionalidades da tela ${currentDetails.title}`}
          >
            <HelpCircle size={18} />
            <span>FAQ desta Tela</span>
          </button>
        </div>

        {/* Notificador de Modo Offline (Suporte a Usuários em Trânsito via Workbox) */}
        <OfflineIndicator 
          onOpenOfflineDocs={() => setIsOfflineDocsModalOpen(true)} 
          onOpenSyncQueue={() => setIsSyncModalOpen(true)} 
        />
      </div>
    </ThemeContext.Provider>
  );
};

const getStyles = (colors: any, collapsed: boolean, theme: string, isMobile: boolean): { [key: string]: React.CSSProperties } => ({
  body: {
    fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    margin: 0,
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: colors.background,
    color: colors.textPrimary,
    transition: 'background-color 0.25s ease, color 0.25s ease',
  },
  sidebar: {
    width: collapsed ? '80px' : '335px',
    minWidth: collapsed ? '80px' : '335px',
    backgroundColor: colors.surface,
    padding: collapsed ? '20px 10px' : '20px 14px',
    boxSizing: 'border-box',
    borderRight: `1px solid ${colors.border}`,
    display: isMobile ? 'none' : 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    zIndex: 100,
    boxShadow: theme === 'dark' ? '4px 0 24px rgba(0,0,0,0.3)' : '2px 0 12px rgba(15,23,42,0.03)',
  },
  brandHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    paddingBottom: '16px',
    marginBottom: '16px',
    borderBottom: `1px solid ${colors.border}`,
  },
  logoContainer: {
    width: '42px',
    height: '42px',
    borderRadius: '10px',
    overflow: 'hidden',
    boxShadow: `0 4px 14px ${colors.primaryGlow || 'rgba(159, 18, 57, 0.35)'}`,
    border: `1.5px solid ${colors.primary}`,
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0a080c',
  },
  logoImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  brandTextContainer: {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  brandName: {
    fontSize: '17px',
    fontWeight: '800',
    letterSpacing: '-0.02em',
    color: colors.textPrimary,
    whiteSpace: 'nowrap',
  },
  brandBadge: {
    fontSize: '9px',
    fontWeight: '800',
    letterSpacing: '0.06em',
    padding: '2px 6px',
    borderRadius: '4px',
    backgroundColor: colors.primary,
    color: '#ffffff',
  },
  brandSubtitle: {
    fontSize: '11px',
    fontWeight: '500',
    color: colors.textSecondary,
    whiteSpace: 'nowrap',
  },
  statusPill: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: colors.primaryLight,
    padding: '10px 12px',
    borderRadius: '10px',
    marginBottom: '16px',
    border: `1px solid ${colors.border}`,
  },
  statusDot: {
    width: '9px',
    height: '9px',
    borderRadius: '50%',
    backgroundColor: colors.success,
    boxShadow: `0 0 10px ${colors.success}`,
    flexShrink: 0,
  },
  statusText: {
    fontSize: '12px',
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 1.2,
  },
  statusSubtext: {
    fontSize: '11px',
    color: colors.textSecondary,
    lineHeight: 1.2,
    marginTop: '2px',
  },
  sidebarSearchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 10px',
    backgroundColor: colors.inputBg,
    borderRadius: '8px',
    border: `1px solid ${colors.border}`,
    marginBottom: '16px',
  },
  sidebarSearchInput: {
    background: 'none',
    border: 'none',
    outline: 'none',
    fontSize: '12px',
    color: colors.inputText,
    width: '100%',
  },
  navContainer: {
    flexGrow: 1,
    overflowY: 'auto',
    paddingRight: '4px',
  },
  groupTitle: {
    fontSize: '10px',
    fontWeight: '800',
    letterSpacing: '0.08em',
    color: colors.textMuted,
    marginBottom: '8px',
    paddingLeft: '10px',
    textTransform: 'uppercase',
    wordBreak: 'break-word',
  },
  navItem: {
    display: 'flex',
    alignItems: collapsed ? 'center' : 'flex-start',
    justifyContent: collapsed ? 'center' : 'flex-start',
    gap: collapsed ? '0' : '10px',
    padding: collapsed ? '10px' : '9px 12px',
    borderRadius: '10px',
    marginBottom: '7px',
    boxSizing: 'border-box',
    cursor: 'pointer',
    transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
    position: 'relative',
    userSelect: 'none',
    border: '1px solid transparent',
  },
  activeNavItem: {
    backgroundColor: colors.primaryLight,
    border: `1px solid ${colors.primary}`,
    boxShadow: `0 2px 10px ${colors.primaryGlow || 'rgba(37,99,235,0.15)'}`,
  },
  inactiveIconWrap: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: colors.textSecondary,
    transition: 'color 0.18s ease',
    marginTop: collapsed ? '0' : '2px',
    flexShrink: 0,
  },
  activeIconWrap: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: colors.primary,
    marginTop: collapsed ? '0' : '2px',
    flexShrink: 0,
  },
  navItemLabel: {
    fontSize: '12.5px',
    fontWeight: '600',
    color: colors.textPrimary,
    whiteSpace: 'normal',
    wordBreak: 'break-word',
    overflowWrap: 'break-word',
    lineHeight: 1.3,
  },
  navItemLabelActive: {
    fontSize: '12.5px',
    fontWeight: '700',
    color: colors.primary,
    whiteSpace: 'normal',
    wordBreak: 'break-word',
    overflowWrap: 'break-word',
    lineHeight: 1.3,
  },
  navItemDesc: {
    fontSize: '11px',
    color: colors.textMuted,
    whiteSpace: 'normal',
    wordBreak: 'break-word',
    overflowWrap: 'break-word',
    lineHeight: 1.35,
    marginTop: '3px',
  },
  navItemDescActive: {
    fontSize: '11px',
    color: colors.textSecondary,
    whiteSpace: 'normal',
    wordBreak: 'break-word',
    overflowWrap: 'break-word',
    lineHeight: 1.35,
    marginTop: '3px',
  },
  itemBadge: {
    fontSize: '9.5px',
    fontWeight: '700',
    backgroundColor: colors.background,
    color: colors.textSecondary,
    padding: '2px 6px',
    borderRadius: '5px',
    border: `1px solid ${colors.border}`,
    whiteSpace: 'nowrap',
    flexShrink: 0,
    lineHeight: 1.2,
  },
  itemBadgeActive: {
    fontSize: '9.5px',
    fontWeight: '800',
    backgroundColor: colors.primary,
    color: '#ffffff',
    padding: '2px 6px',
    borderRadius: '5px',
    whiteSpace: 'nowrap',
    flexShrink: 0,
    lineHeight: 1.2,
  },
  notificationBadge: {
    backgroundColor: colors.notification,
    color: '#ffffff',
    borderRadius: '8px',
    minWidth: '18px',
    height: '18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '10px',
    fontWeight: '800',
    padding: '0 4px',
    flexShrink: 0,
  },
  userCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 12px',
    backgroundColor: colors.background,
    borderRadius: '10px',
    border: `1px solid ${colors.border}`,
    marginBottom: '10px',
  },
  userAvatar: {
    width: '34px',
    height: '34px',
    borderRadius: '8px',
    backgroundColor: colors.primary,
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: '800',
    flexShrink: 0,
    boxShadow: `0 2px 8px ${colors.primaryGlow || 'rgba(159, 18, 57, 0.35)'}`,
  },
  userName: {
    fontSize: '12px',
    fontWeight: '700',
    color: colors.textPrimary,
    whiteSpace: 'normal',
    wordBreak: 'break-word',
    overflowWrap: 'break-word',
    lineHeight: 1.3,
  },
  userRole: {
    fontSize: '10.5px',
    color: colors.textSecondary,
    whiteSpace: 'normal',
    wordBreak: 'break-word',
    overflowWrap: 'break-word',
    lineHeight: 1.3,
    marginTop: '2px',
  },
  windowsInstallerTrigger: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: collapsed ? 'center' : 'flex-start',
    gap: '10px',
    padding: '9px 12px',
    borderRadius: '10px',
    cursor: 'pointer',
    backgroundColor: colors.primaryLight || 'rgba(136, 19, 55, 0.08)',
    border: `1px solid ${colors.borderFocus || '#881337'}`,
    color: colors.primary,
    fontSize: '12px',
    fontWeight: '700',
    transition: 'all 0.18s ease',
    marginBottom: '8px',
  },
  externalUrlSidebarTrigger: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: collapsed ? 'center' : 'flex-start',
    gap: '10px',
    padding: '9px 12px',
    borderRadius: '10px',
    cursor: 'pointer',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    color: '#059669',
    fontSize: '12px',
    fontWeight: '700',
    transition: 'all 0.18s ease',
    marginBottom: '8px',
  },
  topWindowsBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '7px 12px',
    borderRadius: '10px',
    cursor: 'pointer',
    backgroundColor: colors.primaryLight || 'rgba(136, 19, 55, 0.08)',
    border: `1px solid ${colors.borderFocus || '#881337'}`,
    color: colors.textPrimary,
    fontSize: '12px',
    fontWeight: '700',
    transition: 'all 0.18s ease',
  },
  topExternalUrlBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '7px 12px',
    borderRadius: '10px',
    cursor: 'pointer',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    color: colors.textPrimary,
    fontSize: '12px',
    fontWeight: '700',
    transition: 'all 0.18s ease',
  },
  themeSwitcher: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: collapsed ? 'center' : 'flex-start',
    gap: '10px',
    padding: '9px 12px',
    borderRadius: '10px',
    cursor: 'pointer',
    backgroundColor: colors.background,
    border: `1px solid ${colors.border}`,
    color: colors.textSecondary,
    fontSize: '12px',
    fontWeight: '700',
    transition: 'all 0.18s ease',
  },
  mainWrapper: {
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    minHeight: '100vh',
    height: '100dvh',
    overflow: 'hidden',
  },
  topBar: {
    minHeight: isMobile ? '56px' : '68px',
    height: 'auto',
    backgroundColor: colors.surface,
    borderBottom: `1px solid ${colors.headerBorder}`,
    padding: isMobile ? '8px 12px' : '10px 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
    boxShadow: colors.shadowSm,
    zIndex: 50,
    gap: '10px',
  },
  topBarLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: isMobile ? '8px' : '12px',
    minWidth: 0,
    flex: 1,
  },
  collapseToggle: {
    background: 'none',
    border: `1px solid ${colors.border}`,
    borderRadius: '8px',
    padding: '7px',
    cursor: 'pointer',
    color: colors.textSecondary,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    transition: 'all 0.18s ease',
  },
  mobileHamburgerBtn: {
    background: 'none',
    border: `1px solid ${colors.border}`,
    borderRadius: '8px',
    padding: '8px',
    cursor: 'pointer',
    color: colors.textPrimary,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    flexShrink: 0,
  },
  breadcrumbRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginBottom: '3px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    flexWrap: 'nowrap',
  },
  topBreadcrumbRoot: {
    fontSize: '11px',
    fontWeight: '600',
    color: colors.textMuted,
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  topBreadcrumb: {
    fontSize: '11px',
    fontWeight: '600',
    color: colors.textSecondary,
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  topBreadcrumbActive: {
    fontSize: '11px',
    fontWeight: '700',
    color: colors.primary,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  topPageTitle: {
    fontSize: 'clamp(14px, 1.25vw, 18px)',
    fontWeight: '800',
    color: colors.textPrimary,
    margin: 0,
    letterSpacing: '-0.02em',
    lineHeight: 1.25,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  topPageTitleMobile: {
    fontSize: 'clamp(12px, 3.2vw, 14px)',
    fontWeight: '800',
    color: colors.textPrimary,
    margin: 0,
    letterSpacing: '-0.01em',
    lineHeight: 1.25,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  topPageSubtitle: {
    fontSize: isMobile ? '10px' : '11.5px',
    fontWeight: '500',
    color: colors.textSecondary,
    margin: '2px 0 0 0',
    lineHeight: 1.3,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  topHeaderBadge: {
    fontSize: isMobile ? '9px' : '10.5px',
    fontWeight: '700',
    padding: isMobile ? '1px 6px' : '2px 8px',
    borderRadius: '6px',
    backgroundColor: colors.primaryLight,
    color: colors.primary,
    border: `1px solid ${colors.border}`,
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  topBarRight: {
    display: 'flex',
    alignItems: 'center',
    gap: isMobile ? '6px' : '8px',
    flexShrink: 0,
  },
  quickNavGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: colors.background,
    padding: '4px',
    borderRadius: '10px',
    border: `1px solid ${colors.border}`,
  },
  quickNavBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: '600',
    color: colors.textSecondary,
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  quickNavBtnActive: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: '700',
    color: colors.primary,
    backgroundColor: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: '6px',
    cursor: 'pointer',
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
  },
  topBadgeEnterprise: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    borderRadius: '20px',
    backgroundColor: colors.primaryLight,
    border: `1px solid ${colors.border}`,
    fontSize: '12px',
    fontWeight: '700',
    color: colors.textPrimary,
  },
  statusDotGlow: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    backgroundColor: colors.success,
    boxShadow: `0 0 8px ${colors.success}`,
  },
  notificationTrigger: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    backgroundColor: colors.background,
    border: `1px solid ${colors.border}`,
    color: colors.textSecondary,
    cursor: 'pointer',
  },
  notificationCountBubble: {
    position: 'absolute',
    top: '-4px',
    right: '-4px',
    backgroundColor: colors.notification,
    color: '#ffffff',
    fontSize: '9px',
    fontWeight: '800',
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickThemeBtn: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    border: `1px solid ${colors.border}`,
    backgroundColor: colors.background,
    color: colors.textSecondary,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.18s ease',
  },
  mainContent: {
    flexGrow: 1,
    padding: isMobile ? '10px 8px 84px 8px' : '20px 24px',
    boxSizing: 'border-box',
    overflowY: 'auto',
    minWidth: 0,
  },
  // Mobile Off-canvas Drawer & Overlay
  mobileBackdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    backdropFilter: 'blur(4px)',
    WebkitBackdropFilter: 'blur(4px)',
    zIndex: 999,
  },
  mobileDrawer: {
    position: 'fixed',
    top: 0,
    bottom: 0,
    left: 0,
    width: '330px',
    maxWidth: '92vw',
    backgroundColor: colors.surface,
    padding: '20px 16px',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 1000,
    boxShadow: '8px 0 32px rgba(0,0,0,0.6)',
    borderRight: `1px solid ${colors.border}`,
    overflowY: 'auto',
  },
  mobileDrawerHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: '16px',
    marginBottom: '16px',
    borderBottom: `1px solid ${colors.border}`,
  },
  mobileDrawerCloseBtn: {
    background: 'none',
    border: `1px solid ${colors.border}`,
    borderRadius: '8px',
    padding: '6px',
    cursor: 'pointer',
    color: colors.textSecondary,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  // Mobile Bottom Navigation
  mobileBottomNav: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    height: '62px',
    backgroundColor: colors.surface,
    borderTop: `1px solid ${colors.border}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-around',
    zIndex: 900,
    boxShadow: '0 -4px 16px rgba(0,0,0,0.25)',
    paddingBottom: 'env(safe-area-inset-bottom, 0px)',
  },
  mobileBottomNavBtn: {
    flex: 1,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '3px',
    background: 'transparent',
    border: 'none',
    color: colors.textMuted,
    cursor: 'pointer',
    padding: '4px 0',
    position: 'relative',
    transition: 'color 0.15s ease',
  },
  mobileBottomNavBtnActive: {
    flex: 1,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '3px',
    background: 'transparent',
    border: 'none',
    color: colors.primary,
    cursor: 'pointer',
    padding: '4px 0',
    position: 'relative',
    fontWeight: '700',
  },
  mobileBottomNavLabel: {
    fontSize: '10px',
    lineHeight: 1,
    letterSpacing: '-0.01em',
    whiteSpace: 'nowrap',
  },
  mobileBottomNavIndicator: {
    position: 'absolute',
    top: 0,
    width: '28px',
    height: '3px',
    borderRadius: '0 0 3px 3px',
    backgroundColor: colors.primary,
    boxShadow: `0 2px 6px ${colors.primaryGlow || 'rgba(136, 19, 55, 0.4)'}`,
  },
});

export default App;
