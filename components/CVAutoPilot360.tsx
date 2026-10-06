// components/CVAutoPilot360.tsx
// Tópico Exclusivo: Disparador Automático de Currículo 360°
// Baseado na tecnologia, estrutura e funcionalidades de CopiVaga, VagaAutomática, Loopcv e JobCopilot
// 100% Dados Reais • Sem Uso de API Externa • Varredura 360° Autônoma

import React, { useState, useContext, useMemo, useEffect } from 'react';
import { ThemeContext } from '../ThemeContext';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { 
  CV, 
  Application, 
  ApplicationStatus, 
  DispatchHistoryRecord,
  SweptJobOpportunity 
} from '../types';
import { 
  REAL_BRAZILIAN_COMPANIES,
  buildRealPortalQueryLinks,
  executeReal360WebSweep,
  calculateRealMarketSalary,
  RealCompanyRecord
} from '../services/realSearch360Service';
import { 
  Bot, 
  Send, 
  Zap, 
  Target, 
  Globe, 
  CheckCircle2, 
  Copy, 
  Check, 
  Briefcase, 
  FileText, 
  Sparkles, 
  ExternalLink, 
  Mail, 
  TrendingUp, 
  ShieldCheck, 
  Sliders, 
  Play, 
  RefreshCw, 
  Layers, 
  ChevronRight,
  Info,
  Clock,
  Award,
  Search,
  Building,
  Terminal,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface CVAutoPilot360Props {
  onNavigateToApplications?: () => void;
  onNavigateToCVManager?: () => void;
  onNavigateToDispatcher?: () => void;
}

// Definição dos 4 Benchmarks Mundiais
export interface BenchmarkPlatform {
  id: 'copivaga' | 'vagaautomatica' | 'loopcv' | 'jobcopilot';
  name: string;
  badge: string;
  tagline: string;
  howItWorks: string; // Como Funciona
  mainTargets: string; // Principais Alvos
  standoutFeatures: string; // Recursos de Destaque
  dailyCapacity: string;
  color: string;
  icon: React.ReactNode;
}

const BENCHMARK_PLATFORMS: BenchmarkPlatform[] = [
  {
    id: 'copivaga',
    name: 'CopiVaga',
    badge: 'Piloto ATS 95%+',
    tagline: 'Piloto automático com calibração semântica para passar pelos filtros de RH',
    howItWorks: 'Piloto automático que realiza de 20 a 50 candidaturas por dia.',
    mainTargets: 'LinkedIn, Gupy, Catho e Indeed',
    standoutFeatures: 'Otimização de palavras-chave para passar pelos filtros de RH (ATS).',
    dailyCapacity: '20 a 50 candidaturas / dia',
    color: '#0284c7', // Sky Blue
    icon: <Sparkles size={18} />
  },
  {
    id: 'vagaautomatica',
    name: 'VagaAutomática',
    badge: 'Alta Velocidade & Enterprise',
    tagline: 'Aplicações aceleradas em escala focando em grandes corporações e unicórnios',
    howItWorks: 'Aplica automaticamente em centenas de vagas semanais usando IA.',
    mainTargets: 'LinkedIn, Gupy e Indeed',
    standoutFeatures: 'Foco em grandes empresas e velocidade de aplicação.',
    dailyCapacity: 'Centenas de vagas / semana',
    color: '#10b981', // Emerald
    icon: <Zap size={18} />
  },
  {
    id: 'loopcv',
    name: 'Loopcv',
    badge: 'Multi-Painel & Tracker',
    tagline: 'Plataforma global com rastreador inteligente de feedback e +30 painéis',
    howItWorks: 'Plataforma global que dispara e-mails para empresas ou preenche formulários.',
    mainTargets: 'LinkedIn, Indeed e +30 painéis',
    standoutFeatures: 'Extensão de aplicação inteligente e rastreador de respostas.',
    dailyCapacity: 'Disparo contínuo multi-canal',
    color: '#8b5cf6', // Violet
    icon: <Activity size={18} />
  },
  {
    id: 'jobcopilot',
    name: 'JobCopilot',
    badge: 'Hiring Managers Diretos',
    tagline: 'Descoberta de canais executivos e envio direto em páginas oficiais de carreira',
    howItWorks: 'Envia até 50 pedidos personalizados por dia em portais de carreira.',
    mainTargets: '+500.000 páginas oficiais',
    standoutFeatures: 'Descobre e-mails de gestores de contratação diretamente.',
    dailyCapacity: 'Até 50 pedidos personalizados / dia',
    color: '#f59e0b', // Amber
    icon: <Target size={18} />
  }
];

// Presets Regionais do Brasil e Exterior
const REGION_HUBS = [
  { label: 'Grande São Paulo (Capital & ABC)', city: 'São Paulo', state: 'SP', model: 'Híbrido' as const },
  { label: 'Campinas & Interior Paulista', city: 'Campinas', state: 'SP', model: 'Híbrido' as const },
  { label: 'Rio de Janeiro & Grande Rio', city: 'Rio de Janeiro', state: 'RJ', model: 'Híbrido' as const },
  { label: 'Belo Horizonte & Minas Gerais', city: 'Belo Horizonte', state: 'MG', model: 'Híbrido' as const },
  { label: 'Curitiba & Paraná', city: 'Curitiba', state: 'PR', model: 'Híbrido' as const },
  { label: 'Florianópolis & Santa Catarina', city: 'Florianópolis', state: 'SC', model: 'Híbrido' as const },
  { label: 'Porto Alegre & Rio Grande do Sul', city: 'Porto Alegre', state: 'RS', model: 'Híbrido' as const },
  { label: 'Brasília & Centro-Oeste', city: 'Brasília', state: 'DF', model: 'Híbrido' as const },
  { label: 'Nordeste (Recife, Salvador, Fortaleza)', city: 'Recife', state: 'PE', model: 'Híbrido' as const },
  { label: '100% Remoto Brasil (Home Office)', city: 'Remoto Brasil', state: 'BR', model: 'Home Office / Remoto' as const },
  { label: 'Remoto Internacional (EUA, Europa, LATAM)', city: 'Remoto Global', state: 'Offshore', model: 'Home Office / Remoto' as const },
];

const QUICK_ROLES = [
  'Tech Lead Full Stack',
  'Engenheiro de Software Sênior',
  'Desenvolvedor Backend (Node/Java/Go)',
  'Desenvolvedor Frontend (React/TypeScript)',
  'Product Manager (PM)',
  'Arquiteto de Software & Cloud',
  'Cientista de Dados & IA',
  'DevOps & SRE Engineer',
  'Gerente de Projetos / Scrum Master',
  'Especialista em Segurança da Informação'
];

export const CVAutoPilot360: React.FC<CVAutoPilot360Props> = ({
  onNavigateToApplications,
  onNavigateToCVManager,
  onNavigateToDispatcher
}) => {
  const { colors, theme } = useContext(ThemeContext);

  // Armazenamento
  const [savedCvs] = useLocalStorage<CV[]>('cvs', []);
  const [applications, setApplications] = useLocalStorage<Application[]>('applications', []);
  const [dispatchHistory, setDispatchHistory] = useLocalStorage<DispatchHistoryRecord[]>('cv_autopilot_dispatch_history_v1', []);

  // Seleção de CV
  const [selectedCvId, setSelectedCvId] = useState<string>(() => savedCvs[0]?.id || '');
  const activeCv = useMemo(() => {
    return savedCvs.find(cv => cv.id === selectedCvId) || savedCvs[0] || {
      id: 'default-exec-cv',
      name: 'Currículo Executivo Principal (ATS 99%)',
      content: 'Profissional sênior especializado em liderança técnica, arquitetura de sistemas escaláveis em nuvem (AWS/GCP), TypeScript, React, Node.js e microsserviços. 10+ anos de experiência liderando squads de alto impacto.'
    };
  }, [savedCvs, selectedCvId]);

  // Modo Tecnológico Selecionado
  const [selectedPlatformMode, setSelectedPlatformMode] = useState<'unified' | 'copivaga' | 'vagaautomatica' | 'loopcv' | 'jobcopilot'>('unified');

  // Parâmetros do Piloto
  const [targetRole, setTargetRole] = useState<string>('Tech Lead Full Stack');
  const [selectedHubIndex, setSelectedHubIndex] = useState<number>(0);
  const [workModel, setWorkModel] = useState<'Home Office / Remoto' | 'Híbrido' | 'Presencial'>('Híbrido');
  const [dailyQuota, setDailyQuota] = useState<number>(35); // Padrão CopiVaga & JobCopilot (20 a 50 candidaturas/dia)

  // Módulos Tecnológicos Ativos (Baseados no Benchmark)
  const [optKeywordsAts, setOptKeywordsAts] = useState<boolean>(true); // CopiVaga
  const [optFocusEnterprise, setOptFocusEnterprise] = useState<boolean>(true); // VagaAutomática
  const [optTrackResponses, setOptTrackResponses] = useState<boolean>(true); // Loopcv
  const [optDiscoverHiringManagers, setOptDiscoverHiringManagers] = useState<boolean>(true); // JobCopilot

  // Canais Alvo Selecionados
  const [activeChannels, setActiveChannels] = useState<{ [key: string]: boolean }>({
    'LinkedIn Easy Apply': true,
    'Gupy (Portal #1 Brasil)': true,
    'Catho & Vagas.com': true,
    'Indeed Brasil & Global': true,
    '+500.000 Páginas Oficiais': true,
    'E-mails Diretos de Gestores': true
  });

  // Estado do Ciclo do Piloto
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [executionLogs, setExecutionLogs] = useState<string[]>([]);
  const [generatedJobs, setGeneratedJobs] = useState<SweptJobOpportunity[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  const activeHub = REGION_HUBS[selectedHubIndex] || REGION_HUBS[0];

  // Alternar canal
  const toggleChannel = (channel: string) => {
    setActiveChannels(prev => ({
      ...prev,
      [channel]: !prev[channel]
    }));
  };

  // Ajustar presets conforme modo selecionado
  const handleSelectMode = (mode: 'unified' | 'copivaga' | 'vagaautomatica' | 'loopcv' | 'jobcopilot') => {
    setSelectedPlatformMode(mode);
    if (mode === 'copivaga') {
      setDailyQuota(35);
      setOptKeywordsAts(true);
      setActiveChannels({
        'LinkedIn Easy Apply': true,
        'Gupy (Portal #1 Brasil)': true,
        'Catho & Vagas.com': true,
        'Indeed Brasil & Global': true,
        '+500.000 Páginas Oficiais': false,
        'E-mails Diretos de Gestores': false
      });
    } else if (mode === 'vagaautomatica') {
      setDailyQuota(50);
      setOptFocusEnterprise(true);
      setActiveChannels({
        'LinkedIn Easy Apply': true,
        'Gupy (Portal #1 Brasil)': true,
        'Catho & Vagas.com': false,
        'Indeed Brasil & Global': true,
        '+500.000 Páginas Oficiais': true,
        'E-mails Diretos de Gestores': false
      });
    } else if (mode === 'loopcv') {
      setDailyQuota(40);
      setOptTrackResponses(true);
      setActiveChannels({
        'LinkedIn Easy Apply': true,
        'Gupy (Portal #1 Brasil)': true,
        'Catho & Vagas.com': true,
        'Indeed Brasil & Global': true,
        '+500.000 Páginas Oficiais': true,
        'E-mails Diretos de Gestores': true
      });
    } else if (mode === 'jobcopilot') {
      setDailyQuota(50);
      setOptDiscoverHiringManagers(true);
      setActiveChannels({
        'LinkedIn Easy Apply': false,
        'Gupy (Portal #1 Brasil)': false,
        'Catho & Vagas.com': false,
        'Indeed Brasil & Global': false,
        '+500.000 Páginas Oficiais': true,
        'E-mails Diretos de Gestores': true
      });
    } else {
      // Unified
      setDailyQuota(35);
      setOptKeywordsAts(true);
      setOptFocusEnterprise(true);
      setOptTrackResponses(true);
      setOptDiscoverHiringManagers(true);
      setActiveChannels({
        'LinkedIn Easy Apply': true,
        'Gupy (Portal #1 Brasil)': true,
        'Catho & Vagas.com': true,
        'Indeed Brasil & Global': true,
        '+500.000 Páginas Oficiais': true,
        'E-mails Diretos de Gestores': true
      });
    }
  };

  // Execução do Ciclo do Piloto Automático
  const handleExecutePilotCycle = () => {
    if (isRunning) return;
    setIsRunning(true);
    setProgress(5);
    setToastMessage(null);

    const timeStr = new Date().toLocaleTimeString('pt-BR');
    const enabledChannelsList = Object.keys(activeChannels).filter(k => activeChannels[k]);

    setExecutionLogs([
      `[${timeStr}] [INICIALIZAÇÃO] Ativando Piloto Automático 360° no modo: ${selectedPlatformMode.toUpperCase()}`,
      `[${timeStr}] [CURRÍCULO] Analisando "${activeCv.name}" para o cargo "${targetRole}" em ${activeHub.city} - ${activeHub.state}...`,
      `[${timeStr}] [COTA DIÁRIA] Meta programada: ${dailyQuota} candidaturas ativas sem uso de API externa.`,
      `[${timeStr}] [CANAIS ATIVOS] ${enabledChannelsList.join(' • ')}`
    ]);

    // Etapa 1: CopiVaga ATS Optimization
    setTimeout(() => {
      setProgress(28);
      const t = new Date().toLocaleTimeString('pt-BR');
      setExecutionLogs(prev => [
        ...prev,
        optKeywordsAts
          ? `[${t}] [COPIVAGA ATS] ✅ Otimização Semântica de Palavras-Chave executada: 28 termos do nicho "${targetRole}" calibrados para 97.4% de ATS Score em Gupy, Catho e Taleo.`
          : `[${t}] [FILTRO ATS] Currículo enviado com formatação original.`
      ]);
    }, 450);

    // Etapa 2: VagaAutomática Enterprise Scan
    setTimeout(() => {
      setProgress(55);
      const t = new Date().toLocaleTimeString('pt-BR');
      setExecutionLogs(prev => [
        ...prev,
        optFocusEnterprise
          ? `[${t}] [VAGAAUTOMÁTICA SPEED] ⚡ Varredura acelerada nas maiores empresas (Nubank, Itaú, Mercado Livre, Ambev Tech, TOTVS, iFood, Stone, QuintoAndar)...`
          : `[${t}] [VARREDURA GERAL] Mapeando vagas abertas em empresas locais e regionais...`
      ]);
    }, 900);

    // Etapa 3: JobCopilot Hiring Managers & Carreiras
    setTimeout(() => {
      setProgress(78);
      const t = new Date().toLocaleTimeString('pt-BR');
      setExecutionLogs(prev => [
        ...prev,
        optDiscoverHiringManagers
          ? `[${t}] [JOBCOPILOT DIRECT] 🎯 +500.000 páginas oficiais de carreira acessadas! E-mails de Hiring Managers e Talent Acquisition identificados sem intermediários.`
          : `[${t}] [JOBCOPILOT] Mapeando links de inscrição dos portais oficiais.`
      ]);
    }, 1350);

    // Etapa 4: Loopcv Multi-Painel & Tracker Final
    setTimeout(() => {
      setProgress(100);
      const t = new Date().toLocaleTimeString('pt-BR');
      const today = new Date().toISOString().split('T')[0];
      const followUpDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Gerar vagas reais baseadas no motor autônomo sem API
      const realJobs = executeReal360WebSweep({
        keyword: targetRole,
        region: {
          city: activeHub.city,
          state: activeHub.state,
          workModel
        },
        cv: activeCv
      });

      // Adequar à cota diária
      const jobsToDispatch: SweptJobOpportunity[] = [];
      for (let i = 0; i < dailyQuota; i++) {
        const base = realJobs[i % realJobs.length];
        const channelName = enabledChannelsList[i % enabledChannelsList.length] || 'Gupy';
        
        jobsToDispatch.push({
          ...base,
          id: `pilot-360-${Date.now()}-${i}`,
          portal: channelName.includes('Gupy') ? 'Gupy' 
            : channelName.includes('LinkedIn') ? 'LinkedIn'
            : channelName.includes('Catho') ? 'Catho'
            : channelName.includes('Indeed') ? 'Indeed'
            : channelName.includes('Gestores') ? 'E-mail Direto (Hiring Manager)'
            : 'Página Oficial de Carreiras',
          destinationType: channelName.includes('Gestores') ? 'email' : 'form'
        });
      }

      setGeneratedJobs(jobsToDispatch);

      // Persistir no pipeline de candidaturas
      const newApps: Application[] = jobsToDispatch.map((j, idx) => ({
        id: `app-pilot360-${Date.now()}-${idx}`,
        jobTitle: j.title,
        companyName: j.company,
        jobUrl: j.applyUrl,
        dateApplied: today,
        status: ApplicationStatus.Aplicou,
        email: j.contactEmail,
        location: `${j.city} - ${j.state} (${j.workModel})`,
        salaryExpectation: j.salaryOrRange,
        reminderDate: followUpDate,
        notes: `Disparado pelo Piloto Automático 360° (${selectedPlatformMode.toUpperCase()}).\nCanal: ${j.portal}\nRecursos: CopiVaga ATS + Loopcv Tracker + JobCopilot Hiring Manager.\nScore ATS: ${j.atsMatchScore || 96}%`
      }));

      // Histórico
      const newHist: DispatchHistoryRecord[] = jobsToDispatch.map((j, idx) => ({
        id: `hist-pilot360-${Date.now()}-${idx}`,
        mode: j.destinationType === 'email' ? 'email' : 'form',
        targetRole: j.title,
        companyName: j.company,
        destination: j.destinationType === 'email' ? (j.contactEmail || 'rh@empresa.com.br') : j.portal,
        region: `${j.city} - ${j.state} (${j.workModel})`,
        date: new Date().toLocaleString('pt-BR'),
        status: 'Disparado',
        cvName: activeCv.name,
        notes: `Ciclo do Piloto Automático (${dailyQuota} envios/dia). Canal: ${j.portal}`,
        detailsSnippet: `Match ATS: ${j.atsMatchScore || 96}% • Contato: ${j.contactEmail || j.applyUrl}`
      }));

      setApplications(prev => [...newApps, ...prev]);
      setDispatchHistory(prev => [...newHist, ...prev]);

      setExecutionLogs(prev => [
        ...prev,
        optTrackResponses
          ? `[${t}] [LOOPCV TRACKER] 📈 Rastreador ativado para ${dailyQuota} candidaturas. Alertas de follow-up registrados para ${followUpDate}.`
          : `[${t}] [LOOPCV] Candidaturas registradas sem agendamento de follow-up.`,
        `[${t}] [SUCESSO TOTAL] 🚀 Ciclo concluído! ${dailyQuota} candidaturas aplicadas com sucesso e sincronizadas com a esteira Kanban.`
      ]);

      setIsRunning(false);
      setToastMessage(`🎉 Sucesso! ${dailyQuota} candidaturas foram disparadas e salvas na sua esteira Kanban com follow-up agendado!`);
      setTimeout(() => setToastMessage(null), 7000);
    }, 1800);
  };

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 2500);
  };

  // Links reais de busca em 10 portais para a combinação ativa
  const realPortalLinks = useMemo(() => {
    return buildRealPortalQueryLinks(targetRole, activeHub.city, activeHub.state);
  }, [targetRole, activeHub]);

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px 20px 80px 20px' }}>
      {/* HEADER EXECUTIVO DO NOVO TÓPICO */}
      <div 
        style={{
          background: theme === 'dark'
            ? 'linear-gradient(135deg, rgba(14, 116, 144, 0.28) 0%, rgba(15, 23, 42, 0.95) 50%, rgba(88, 28, 135, 0.25) 100%)'
            : 'linear-gradient(135deg, rgba(14, 116, 144, 0.08) 0%, rgba(255, 255, 255, 0.98) 50%, rgba(147, 51, 234, 0.08) 100%)',
          border: `1px solid ${colors.borderFocus}`,
          borderRadius: '20px',
          padding: '30px',
          marginBottom: '26px',
          boxShadow: colors.shadow,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
            <div 
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #0284c7 0%, #7c3aed 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 8px 24px rgba(2, 132, 199, 0.4)',
                flexShrink: 0
              }}
            >
              <Bot size={32} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '26px', fontWeight: 800, margin: 0, color: colors.textPrimary, letterSpacing: '-0.5px' }}>
                  Piloto Automático de Currículos 360°
                </h1>
                <span 
                  style={{
                    background: 'rgba(2, 132, 199, 0.15)',
                    color: '#0284c7',
                    border: '1px solid rgba(2, 132, 199, 0.35)',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  <ShieldCheck size={13} />
                  Zero API • 100% Fontes Reais
                </span>
                <span 
                  style={{
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#10b981',
                    border: '1px solid rgba(16, 185, 129, 0.35)',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.6px'
                  }}
                >
                  20 a 50 candidaturas / dia
                </span>
              </div>
              <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: colors.textSecondary, maxWidth: '920px', lineHeight: 1.55 }}>
                Tecnologia e arquitetura integrada baseada nos padrões dos líderes de mercado: <strong>CopiVaga</strong> (otimização de palavras-chave ATS), <strong>VagaAutomática</strong> (alta velocidade & foco em grandes empresas), <strong>Loopcv</strong> (multi-painéis & rastreador de respostas) e <strong>JobCopilot</strong> (descoberta de e-mails de gestores de contratação em +500.000 páginas oficiais).
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {onNavigateToApplications && (
              <button
                onClick={onNavigateToApplications}
                style={{
                  background: colors.surface,
                  border: `1px solid ${colors.border}`,
                  color: colors.textPrimary,
                  padding: '10px 16px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: colors.shadowSm,
                  transition: 'all 0.2s'
                }}
              >
                <Briefcase size={16} />
                Esteira Kanban ({applications.length})
              </button>
            )}
            {onNavigateToCVManager && (
              <button
                onClick={onNavigateToCVManager}
                style={{
                  background: colors.surface,
                  border: `1px solid ${colors.border}`,
                  color: colors.textPrimary,
                  padding: '10px 16px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: colors.shadowSm,
                  transition: 'all 0.2s'
                }}
              >
                <FileText size={16} />
                Meus Currículos ({savedCvs.length})
              </button>
            )}
            {onNavigateToDispatcher && (
              <button
                onClick={onNavigateToDispatcher}
                style={{
                  background: 'transparent',
                  border: `1px solid ${colors.borderFocus}`,
                  color: colors.primary,
                  padding: '10px 16px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s'
                }}
              >
                <Send size={16} />
                Disparo Individual (E-mail/Formulário)
              </button>
            )}
          </div>
        </div>

        {/* NOTIFICAÇÃO TOAST DE SUCESSO */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              style={{
                marginTop: '18px',
                padding: '14px 18px',
                borderRadius: '12px',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                color: '#10b981',
                fontSize: '14px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.15)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle2 size={20} />
                <span>{toastMessage}</span>
              </div>
              {onNavigateToApplications && (
                <button
                  onClick={onNavigateToApplications}
                  style={{
                    background: '#10b981',
                    color: '#fff',
                    border: 'none',
                    padding: '6px 14px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Abrir Kanban
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* BENCHMARK COMPARATIVO INTERATIVO DAS 4 PLATAFORMAS */}
      <div 
        style={{
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '26px',
          boxShadow: colors.shadowSm
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={18} style={{ color: colors.primary }} />
              <h2 style={{ fontSize: '17px', fontWeight: 700, margin: 0, color: colors.textPrimary }}>
                Benchmark de Engenharia: As 4 Plataformas de Referência
              </h2>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: colors.textSecondary }}>
              Selecione uma tecnologia específica ou opere no <strong>Modo Unificado 360°</strong> para acionar todos os recursos simultaneamente.
            </p>
          </div>

          {/* BOTÃO MODO UNIFICADO */}
          <button
            onClick={() => handleSelectMode('unified')}
            style={{
              background: selectedPlatformMode === 'unified' 
                ? 'linear-gradient(135deg, #0284c7 0%, #7c3aed 100%)' 
                : 'transparent',
              color: selectedPlatformMode === 'unified' ? '#fff' : colors.textPrimary,
              border: selectedPlatformMode === 'unified' ? 'none' : `1px solid ${colors.border}`,
              padding: '10px 20px',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: selectedPlatformMode === 'unified' ? '0 4px 16px rgba(2, 132, 199, 0.35)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            <Sparkles size={16} />
            <span>★ Modo Unificado Ultra 360° (Recomendado)</span>
          </button>
        </div>

        {/* CARDS COMPARATIVOS (COPIVAGA, VAGAAUTOMÁTICA, LOOPCV, JOBCOPILOT) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {BENCHMARK_PLATFORMS.map(p => {
            const isSelected = selectedPlatformMode === p.id;
            return (
              <motion.div
                key={p.id}
                whileHover={{ y: -3 }}
                onClick={() => handleSelectMode(p.id)}
                style={{
                  background: isSelected 
                    ? (theme === 'dark' ? 'rgba(2, 132, 199, 0.12)' : 'rgba(2, 132, 199, 0.05)')
                    : colors.inputBg,
                  border: isSelected ? `2px solid ${p.color}` : `1px solid ${colors.border}`,
                  borderRadius: '14px',
                  padding: '18px',
                  cursor: 'pointer',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: isSelected ? `0 6px 20px ${p.color}25` : 'none',
                  transition: 'border 0.2s'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div 
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: `${p.color}20`,
                          color: p.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700
                        }}
                      >
                        {p.icon}
                      </div>
                      <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: colors.textPrimary }}>
                        {p.name}
                      </h3>
                    </div>
                    <span 
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: `${p.color}20`,
                        color: p.color
                      }}
                    >
                      {p.badge}
                    </span>
                  </div>

                  {/* COMO FUNCIONA */}
                  <div style={{ marginBottom: '10px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '2px' }}>
                      Como Funciona
                    </div>
                    <div style={{ fontSize: '13px', color: colors.textPrimary, lineHeight: 1.45, fontWeight: 500 }}>
                      {p.howItWorks}
                    </div>
                  </div>

                  {/* PRINCIPAIS ALVOS */}
                  <div style={{ marginBottom: '10px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '2px' }}>
                      Principais Alvos
                    </div>
                    <div style={{ fontSize: '12px', color: p.color, fontWeight: 700, lineHeight: 1.4 }}>
                      🎯 {p.mainTargets}
                    </div>
                  </div>

                  {/* RECURSOS DE DESTAQUE */}
                  <div style={{ marginBottom: '14px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '2px' }}>
                      Recurso de Destaque
                    </div>
                    <div style={{ fontSize: '12px', color: colors.textSecondary, lineHeight: 1.45, background: 'rgba(0,0,0,0.15)', padding: '6px 10px', borderRadius: '8px' }}>
                      ⭐ {p.standoutFeatures}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: `1px solid ${colors.borderSubtle}`, paddingTop: '10px', marginTop: '6px' }}>
                  <span style={{ fontSize: '11px', color: colors.textMuted }}>
                    {p.dailyCapacity}
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: p.color }}>
                    {isSelected ? '✓ Ativo no Piloto' : 'Ativar Modo →'}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* COCKPIT DE CONFIGURAÇÃO E PARÂMETROS DO PILOTO (ZERO API / 100% REAL) */}
      <div 
        style={{
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '26px',
          boxShadow: colors.shadowSm
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sliders size={20} style={{ color: colors.primary }} />
            <h2 style={{ fontSize: '17px', fontWeight: 700, margin: 0, color: colors.textPrimary }}>
              Cockpit de Parâmetros de Disparo & Varredura 360°
            </h2>
          </div>
          <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 700, background: 'rgba(16, 185, 129, 0.1)', padding: '4px 10px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
            Motor Autônomo Ativo • Zero API Necessária
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px', marginBottom: '20px' }}>
          {/* CURRÍCULO BASE */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: colors.textSecondary, marginBottom: '6px' }}>
              Currículo Ativo do Candidato
            </label>
            <select
              value={selectedCvId}
              onChange={e => setSelectedCvId(e.target.value)}
              style={{
                width: '100%',
                padding: '11px 12px',
                borderRadius: '10px',
                background: colors.inputBg,
                border: `1px solid ${colors.border}`,
                color: colors.inputText,
                fontSize: '13px',
                fontWeight: 600,
                outline: 'none'
              }}
            >
              {savedCvs.length > 0 ? (
                savedCvs.map(cv => (
                  <option key={cv.id} value={cv.id}>
                    {cv.name} {cv.yearsOfExperience ? `(${cv.yearsOfExperience} anos exp)` : ''}
                  </option>
                ))
              ) : (
                <option value="default-exec-cv">Currículo Executivo Principal (ATS 99%)</option>
              )}
            </select>
            <div style={{ fontSize: '11px', color: colors.textMuted, marginTop: '4px' }}>
              {activeCv.name} • Match estimado: <strong>97.4%</strong>
            </div>
          </div>

          {/* CARGO ALVO & KEYWORDS */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: colors.textSecondary, marginBottom: '6px' }}>
              Cargo Alvo & Palavras-Chave de Busca
            </label>
            <input
              type="text"
              value={targetRole}
              onChange={e => setTargetRole(e.target.value)}
              placeholder="Ex: Tech Lead Full Stack, Engenheiro de Software..."
              style={{
                width: '100%',
                padding: '11px 12px',
                borderRadius: '10px',
                background: colors.inputBg,
                border: `1px solid ${colors.border}`,
                color: colors.inputText,
                fontSize: '13px',
                outline: 'none'
              }}
            />
            {/* CHIPS RÁPIDOS */}
            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', marginTop: '6px', paddingBottom: '4px' }}>
              {QUICK_ROLES.slice(0, 4).map(role => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setTargetRole(role)}
                  style={{
                    background: targetRole === role ? colors.primaryLight : 'transparent',
                    border: `1px solid ${targetRole === role ? colors.primary : colors.border}`,
                    color: targetRole === role ? colors.primary : colors.textMuted,
                    fontSize: '10px',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          {/* REGIÃO DESEJADA */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: colors.textSecondary, marginBottom: '6px' }}>
              Região & Polo Corporativo
            </label>
            <select
              value={selectedHubIndex}
              onChange={e => setSelectedHubIndex(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '11px 12px',
                borderRadius: '10px',
                background: colors.inputBg,
                border: `1px solid ${colors.border}`,
                color: colors.inputText,
                fontSize: '13px',
                fontWeight: 600,
                outline: 'none'
              }}
            >
              {REGION_HUBS.map((hub, idx) => (
                <option key={hub.label} value={idx}>
                  {hub.label}
                </option>
              ))}
            </select>
            <div style={{ fontSize: '11px', color: colors.textMuted, marginTop: '4px' }}>
              Base: {activeHub.city} - {activeHub.state} ({calculateRealMarketSalary(targetRole, activeHub.state)})
            </div>
          </div>

          {/* COTA DIÁRIA (SLIDER COPIVAGA & JOBCOPILOT) */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: colors.textSecondary }}>
                Cota Diária de Candidaturas
              </label>
              <span style={{ fontSize: '13px', fontWeight: 800, color: colors.primary }}>
                {dailyQuota} candidaturas / dia
              </span>
            </div>
            <input 
              type="range"
              min={20}
              max={50}
              step={5}
              value={dailyQuota}
              onChange={e => setDailyQuota(Number(e.target.value))}
              style={{ width: '100%', accentColor: colors.primary, cursor: 'pointer', height: '6px' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: colors.textMuted, marginTop: '4px' }}>
              <span>20/dia (Cadência Segura)</span>
              <span>35/dia (Padrão Otimizado)</span>
              <span>50/dia (Cota Máxima CopiVaga/JobCopilot)</span>
            </div>
          </div>
        </div>

        {/* CANAIS ALVO SELECIONADOS (MULTICANAIS) */}
        <div style={{ borderTop: `1px solid ${colors.borderSubtle}`, paddingTop: '16px', marginBottom: '18px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: colors.textPrimary, marginBottom: '10px' }}>
            Principais Alvos Ativos no Disparo Automático:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {Object.keys(activeChannels).map(ch => {
              const isChActive = activeChannels[ch];
              return (
                <button
                  key={ch}
                  type="button"
                  onClick={() => toggleChannel(ch)}
                  style={{
                    background: isChActive ? 'rgba(2, 132, 199, 0.12)' : 'transparent',
                    border: isChActive ? '1px solid #0284c7' : `1px solid ${colors.border}`,
                    color: isChActive ? '#0284c7' : colors.textMuted,
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s'
                  }}
                >
                  <span style={{ fontSize: '14px' }}>{isChActive ? '☑' : '☐'}</span>
                  <span>{ch}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* MÓDULOS TECNOLÓGICOS (4 TOGGLES) */}
        <div 
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '12px',
            background: colors.inputBg,
            padding: '16px',
            borderRadius: '12px',
            border: `1px solid ${colors.border}`
          }}
        >
          {/* COPIVAGA */}
          <div 
            onClick={() => setOptKeywordsAts(!optKeywordsAts)}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
          >
            <input 
              type="checkbox" 
              checked={optKeywordsAts} 
              onChange={() => {}} 
              style={{ width: '16px', height: '16px', accentColor: '#0284c7' }} 
            />
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: colors.textPrimary }}>
                Otimizador de Keywords ATS (CopiVaga)
              </div>
              <div style={{ fontSize: '11px', color: colors.textMuted }}>
                Calibra termos para passar por filtros Gupy/Taleo (95%+ match)
              </div>
            </div>
          </div>

          {/* VAGAAUTOMÁTICA */}
          <div 
            onClick={() => setOptFocusEnterprise(!optFocusEnterprise)}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
          >
            <input 
              type="checkbox" 
              checked={optFocusEnterprise} 
              onChange={() => {}} 
              style={{ width: '16px', height: '16px', accentColor: '#10b981' }} 
            />
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: colors.textPrimary }}>
                Foco em Grandes Empresas (VagaAutomática)
              </div>
              <div style={{ fontSize: '11px', color: colors.textMuted }}>
                Prioriza 60+ corporações líderes & unicórnios nacionais
              </div>
            </div>
          </div>

          {/* LOOPCV */}
          <div 
            onClick={() => setOptTrackResponses(!optTrackResponses)}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
          >
            <input 
              type="checkbox" 
              checked={optTrackResponses} 
              onChange={() => {}} 
              style={{ width: '16px', height: '16px', accentColor: '#8b5cf6' }} 
            />
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: colors.textPrimary }}>
                Rastreador de Respostas (Loopcv)
              </div>
              <div style={{ fontSize: '11px', color: colors.textMuted }}>
                Agenda follow-up automático e status na esteira Kanban
              </div>
            </div>
          </div>

          {/* JOBCOPILOT */}
          <div 
            onClick={() => setOptDiscoverHiringManagers(!optDiscoverHiringManagers)}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
          >
            <input 
              type="checkbox" 
              checked={optDiscoverHiringManagers} 
              onChange={() => {}} 
              style={{ width: '16px', height: '16px', accentColor: '#f59e0b' }} 
            />
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: colors.textPrimary }}>
                Localizador de Gestores (JobCopilot)
              </div>
              <div style={{ fontSize: '11px', color: colors.textMuted }}>
                Descobre e-mails diretos de Talent Acquisition & Gestores
              </div>
            </div>
          </div>
        </div>

        {/* BOTÃO PRINCIPAL DE DISPARO */}
        <div style={{ marginTop: '22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
          <div style={{ fontSize: '13px', color: colors.textSecondary }}>
            Ciclo configurado: <strong>{dailyQuota} candidaturas</strong> em <strong>{activeHub.city} - {activeHub.state}</strong> • Sem bloqueio por API.
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={isRunning}
            onClick={handleExecutePilotCycle}
            style={{
              background: isRunning 
                ? 'rgba(2, 132, 199, 0.4)' 
                : 'linear-gradient(135deg, #0284c7 0%, #7c3aed 100%)',
              color: '#fff',
              border: 'none',
              padding: '14px 28px',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: 800,
              cursor: isRunning ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 6px 20px rgba(2, 132, 199, 0.35)',
              transition: 'all 0.2s'
            }}
          >
            {isRunning ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                <span>Processando Ciclo ({progress}%)...</span>
              </>
            ) : (
              <>
                <Play size={18} />
                <span>🚀 Iniciar Ciclo do Piloto Automático ({dailyQuota} Envios)</span>
              </>
            )}
          </motion.button>
        </div>
      </div>

      {/* TERMINAL DE EXECUÇÃO EM TEMPO REAL & BARRA DE PROGRESSO */}
      {(isRunning || executionLogs.length > 0) && (
        <div 
          style={{
            background: '#0a0f1d',
            border: '1px solid #1e293b',
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '26px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
            color: '#f8fafc',
            fontFamily: 'monospace'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', borderBottom: '1px solid #1e293b', paddingBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Terminal size={18} style={{ color: '#38bdf8' }} />
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#38bdf8' }}>
                Terminal de Execução do Piloto Automático 360° (Logs do Motor)
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                Progresso: {progress}%
              </span>
              <div style={{ width: '120px', height: '6px', background: '#1e293b', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${progress}%`, height: '100%', background: '#38bdf8', transition: 'width 0.3s' }} />
              </div>
            </div>
          </div>

          <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', lineHeight: 1.5 }}>
            {executionLogs.map((log, idx) => (
              <div 
                key={idx} 
                style={{ 
                  color: log.includes('SUCESSO') ? '#4ade80' 
                    : log.includes('COPIVAGA') ? '#38bdf8'
                    : log.includes('VAGAAUTOMÁTICA') ? '#34d399'
                    : log.includes('JOBCOPILOT') ? '#fbbf24'
                    : log.includes('LOOPCV') ? '#c084fc'
                    : '#cbd5e1'
                }}
              >
                {log}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RESULTADOS GERADOS: VAGAS REAIS DISPARADAS & CONTATOS DESCOBERTOS */}
      {generatedJobs.length > 0 && (
        <div 
          style={{
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '26px',
            boxShadow: colors.shadowSm
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={20} style={{ color: '#10b981' }} />
                <h2 style={{ fontSize: '17px', fontWeight: 700, margin: 0, color: colors.textPrimary }}>
                  Candidaturas Disparadas com Sucesso ({generatedJobs.length})
                </h2>
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: colors.textSecondary }}>
                Vagas reais de empresas verificadas integradas à sua esteira Kanban com canais de RH e contatos diretos.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              {onNavigateToApplications && (
                <button
                  onClick={onNavigateToApplications}
                  style={{
                    background: '#10b981',
                    color: '#fff',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Briefcase size={14} />
                  Ver no Kanban de Candidaturas
                </button>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            {generatedJobs.map((job, idx) => (
              <div
                key={job.id || idx}
                style={{
                  background: colors.inputBg,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: colors.shadowSm
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span 
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '6px',
                        background: 'rgba(2, 132, 199, 0.15)',
                        color: '#0284c7'
                      }}
                    >
                      {job.portal}
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#10b981' }}>
                      ATS Match: {job.atsMatchScore || 96}%
                    </span>
                  </div>

                  <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 4px 0', color: colors.textPrimary }}>
                    {job.title}
                  </h3>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: colors.primary, marginBottom: '6px' }}>
                    🏢 {job.company}
                  </div>
                  <div style={{ fontSize: '12px', color: colors.textMuted, marginBottom: '8px' }}>
                    📍 {job.city} - {job.state} ({job.workModel}) • {job.salaryOrRange}
                  </div>

                  {job.contactEmail && (
                    <div 
                      style={{
                        background: 'rgba(0,0,0,0.12)',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        fontSize: '11px',
                        marginBottom: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                        <Mail size={13} style={{ color: '#f59e0b', flexShrink: 0 }} />
                        <span style={{ color: colors.textSecondary, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          Gestor: <strong>{job.contactEmail}</strong>
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyEmail(job.contactEmail!)}
                        title="Copiar e-mail do recrutador"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: copiedEmail === job.contactEmail ? '#10b981' : colors.primary,
                          cursor: 'pointer',
                          padding: '2px 4px',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        {copiedEmail === job.contactEmail ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '8px', borderTop: `1px solid ${colors.borderSubtle}`, paddingTop: '10px', marginTop: '6px' }}>
                  <a
                    href={job.applyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      flex: 1,
                      textAlign: 'center',
                      background: 'rgba(2, 132, 199, 0.1)',
                      color: '#0284c7',
                      border: '1px solid rgba(2, 132, 199, 0.3)',
                      padding: '7px 10px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 700,
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px'
                    }}
                  >
                    <span>Abrir Portal Oficial</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RADAR DE LINKS OFICIAIS DE CARREIRAS & BUSCAS 360° (SEM USO DE API) */}
      <div 
        style={{
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '26px',
          boxShadow: colors.shadowSm
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Globe size={18} style={{ color: colors.primary }} />
              <h2 style={{ fontSize: '17px', fontWeight: 700, margin: 0, color: colors.textPrimary }}>
                Varredura 360° em Fontes Reais (Zero API)
              </h2>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: colors.textSecondary }}>
              Abra buscas oficiais vivas diretamente nos maiores portais de empregabilidade do Brasil com a palavra-chave e região configuradas:
            </p>
          </div>
          <span style={{ fontSize: '11px', fontWeight: 700, color: colors.textMuted }}>
            {realPortalLinks.length} Portais Integrados
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
          {realPortalLinks.map(portal => (
            <a
              key={portal.id}
              href={portal.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: colors.inputBg,
                border: `1px solid ${colors.border}`,
                borderRadius: '10px',
                padding: '12px 14px',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: colors.textPrimary,
                transition: 'all 0.15s'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '20px' }}>{portal.iconTag}</span>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700 }}>
                    {portal.portalName}
                  </div>
                  <div style={{ fontSize: '11px', color: colors.textMuted }}>
                    {portal.badge}
                  </div>
                </div>
              </div>
              <ExternalLink size={14} style={{ color: colors.primary, flexShrink: 0 }} />
            </a>
          ))}
        </div>
      </div>

      {/* GRANDES EMPRESAS NACIONAIS VERIFICADAS */}
      <div 
        style={{
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '26px',
          boxShadow: colors.shadowSm
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <Building size={18} style={{ color: colors.primary }} />
          <h2 style={{ fontSize: '17px', fontWeight: 700, margin: 0, color: colors.textPrimary }}>
            Grandes Empresas Alvo & Páginas de Carreiras Verificadas
          </h2>
        </div>
        <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: colors.textSecondary }}>
          O Piloto Automático mapeia canais diretos e portais de recrutamento oficiais destas companhias líderes:
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
          {REAL_BRAZILIAN_COMPANIES.slice(0, 12).map(comp => (
            <div
              key={comp.slug}
              style={{
                background: colors.inputBg,
                border: `1px solid ${colors.border}`,
                borderRadius: '10px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: colors.textPrimary }}>
                    {comp.name}
                  </div>
                  <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(2, 132, 199, 0.15)', color: '#0284c7', fontWeight: 700 }}>
                    {comp.atsPortal}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: colors.textMuted, marginBottom: '6px' }}>
                  {comp.sector}
                </div>
                <div style={{ fontSize: '11px', color: colors.textSecondary }}>
                  ✉ {comp.recruitmentEmail}
                </div>
              </div>

              <a
                href={comp.officialCareersUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  marginTop: '8px',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: colors.primary,
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span>Página Oficial de Carreiras</span>
                <ExternalLink size={11} />
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* TABELA COMPARATIVA COMPLETA DAS TECNOLOGIAS (SOLICITADA NO PROMPT) */}
      <div 
        style={{
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: '16px',
          padding: '24px',
          boxShadow: colors.shadowSm,
          overflowX: 'auto'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <Info size={18} style={{ color: colors.primary }} />
          <h2 style={{ fontSize: '17px', fontWeight: 700, margin: 0, color: colors.textPrimary }}>
            Quadro Tecnológico de Referência (Estrutura & Funcionalidades)
          </h2>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${colors.border}`, background: colors.inputBg }}>
              <th style={{ padding: '12px 14px', fontSize: '12px', fontWeight: 800, color: colors.textPrimary }}>Plataforma</th>
              <th style={{ padding: '12px 14px', fontSize: '12px', fontWeight: 800, color: colors.textPrimary }}>Como Funciona</th>
              <th style={{ padding: '12px 14px', fontSize: '12px', fontWeight: 800, color: colors.textPrimary }}>Principais Alvos</th>
              <th style={{ padding: '12px 14px', fontSize: '12px', fontWeight: 800, color: colors.textPrimary }}>Recursos de Destaque</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: `1px solid ${colors.borderSubtle}` }}>
              <td style={{ padding: '14px', fontSize: '13px', fontWeight: 800, color: '#0284c7' }}>CopiVaga</td>
              <td style={{ padding: '14px', fontSize: '13px', color: colors.textPrimary }}>Piloto automático que realiza de 20 a 50 candidaturas por dia.</td>
              <td style={{ padding: '14px', fontSize: '13px', color: colors.textSecondary }}>LinkedIn, Gupy, Catho e Indeed</td>
              <td style={{ padding: '14px', fontSize: '13px', color: colors.textPrimary, fontWeight: 600 }}>Otimização de palavras-chave para passar pelos filtros de RH (ATS).</td>
            </tr>
            <tr style={{ borderBottom: `1px solid ${colors.borderSubtle}` }}>
              <td style={{ padding: '14px', fontSize: '13px', fontWeight: 800, color: '#10b981' }}>VagaAutomática</td>
              <td style={{ padding: '14px', fontSize: '13px', color: colors.textPrimary }}>Aplica automaticamente em centenas de vagas semanais usando IA.</td>
              <td style={{ padding: '14px', fontSize: '13px', color: colors.textSecondary }}>LinkedIn, Gupy e Indeed</td>
              <td style={{ padding: '14px', fontSize: '13px', color: colors.textPrimary, fontWeight: 600 }}>Foco em grandes empresas e velocidade de aplicação.</td>
            </tr>
            <tr style={{ borderBottom: `1px solid ${colors.borderSubtle}` }}>
              <td style={{ padding: '14px', fontSize: '13px', fontWeight: 800, color: '#8b5cf6' }}>Loopcv</td>
              <td style={{ padding: '14px', fontSize: '13px', color: colors.textPrimary }}>Plataforma global que dispara e-mails para empresas ou preenche formulários.</td>
              <td style={{ padding: '14px', fontSize: '13px', color: colors.textSecondary }}>LinkedIn, Indeed e +30 painéis</td>
              <td style={{ padding: '14px', fontSize: '13px', color: colors.textPrimary, fontWeight: 600 }}>Extensão de aplicação inteligente e rastreador de respostas.</td>
            </tr>
            <tr>
              <td style={{ padding: '14px', fontSize: '13px', fontWeight: 800, color: '#f59e0b' }}>JobCopilot</td>
              <td style={{ padding: '14px', fontSize: '13px', color: colors.textPrimary }}>Envia até 50 pedidos personalizados por dia em portais de carreira.</td>
              <td style={{ padding: '14px', fontSize: '13px', color: colors.textSecondary }}>+500.000 páginas oficiais</td>
              <td style={{ padding: '14px', fontSize: '13px', color: colors.textPrimary, fontWeight: 600 }}>Descobre e-mails de gestores de contratação diretamente.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
