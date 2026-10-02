import React, { useState, useContext, useMemo } from 'react';
import { 
  Send, 
  Mail, 
  Zap, 
  MapPin, 
  Briefcase, 
  Building2, 
  Copy, 
  Check, 
  ExternalLink, 
  Sparkles, 
  RefreshCw, 
  History, 
  CheckCircle2, 
  Clock, 
  FileText, 
  DollarSign, 
  ChevronRight, 
  Globe, 
  Layers, 
  Sliders, 
  AlertCircle,
  HelpCircle,
  Code,
  ShieldCheck,
  Share2,
  Trash2,
  ArrowUpRight,
  Search,
  Compass,
  ArrowRight,
  Filter
} from 'lucide-react';
import { ThemeContext } from '../ThemeContext';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { 
  CV, 
  Application, 
  ApplicationStatus,
  AutoDispatcherMode,
  DispatchEmailTone,
  DispatchRegionTarget,
  EmailDispatchPackage,
  FormDispatchPackage,
  FormDispatchField,
  DispatchHistoryRecord,
  JobFormAutofillPortal,
  SweptJobOpportunity
} from '../types';
import { 
  generateEmailDispatchPackage, 
  generateFormDispatchPackage,
  sweepWebOpportunitiesByKeyword
} from '../services/geminiService';

interface CVAutoDispatcherProps {
  onNavigateToApplications?: () => void;
  onNavigateToCVManager?: () => void;
}

interface RegionPreset {
  label: string;
  badge: string;
  city: string;
  state: string;
  workModel: 'Home Office / Remoto' | 'Híbrido' | 'Presencial' | 'Qualquer Modelo';
  salaryTip: string;
}

const REGION_PRESETS: RegionPreset[] = [
  {
    label: 'Grande São Paulo (Capital e ABC)',
    badge: 'SP • Hub Central',
    city: 'São Paulo',
    state: 'SP',
    workModel: 'Híbrido',
    salaryTip: 'Remuneração topo de mercado (SP Capital: ~R$ 15k a 20k CLT)'
  },
  {
    label: 'Campinas e Interior Paulista',
    badge: 'SP • Vale do Silício BR',
    city: 'Campinas',
    state: 'SP',
    workModel: 'Híbrido',
    salaryTip: 'Forte demanda tech (R$ 13k a 17k CLT)'
  },
  {
    label: 'Rio de Janeiro e Região Metropolitana',
    badge: 'RJ • Corporativo & Energia',
    city: 'Rio de Janeiro',
    state: 'RJ',
    workModel: 'Híbrido',
    salaryTip: 'Faixa média RJ (~R$ 12k a 16k CLT)'
  },
  {
    label: 'Belo Horizonte e Minas Gerais',
    badge: 'MG • San Pedro Valley',
    city: 'Belo Horizonte',
    state: 'MG',
    workModel: 'Híbrido',
    salaryTip: 'Hub inovador (~R$ 11k a 15k CLT)'
  },
  {
    label: 'Curitiba e Paraná',
    badge: 'PR • Polo Sul',
    city: 'Curitiba',
    state: 'PR',
    workModel: 'Híbrido',
    salaryTip: 'Ecossistema aquecido (~R$ 11k a 15k CLT)'
  },
  {
    label: 'Florianópolis e Santa Catarina',
    badge: 'SC • Ilha do Silício',
    city: 'Florianópolis',
    state: 'SC',
    workModel: 'Híbrido',
    salaryTip: 'Alto padrão tech (~R$ 12k a 16k CLT)'
  },
  {
    label: 'Porto Alegre e Rio Grande do Sul',
    badge: 'RS • Polo Tecnológico',
    city: 'Porto Alegre',
    state: 'RS',
    workModel: 'Híbrido',
    salaryTip: 'Indústria e Software (~R$ 10k a 14k CLT)'
  },
  {
    label: 'Brasília e Centro-Oeste',
    badge: 'DF • Setor Público & GovTech',
    city: 'Brasília',
    state: 'DF',
    workModel: 'Híbrido',
    salaryTip: 'Alta estabilidade (~R$ 13k a 18k CLT)'
  },
  {
    label: 'Nordeste (Recife, Salvador, Fortaleza)',
    badge: 'NE • Porto Digital & Hubs',
    city: 'Recife',
    state: 'PE',
    workModel: 'Híbrido',
    salaryTip: 'Porto Digital & Expansão (~R$ 10k a 14k CLT)'
  },
  {
    label: '100% Remoto Brasil (Home Office Nacional)',
    badge: 'Brasil • Remoto Integral',
    city: 'Remoto Brasil',
    state: 'Nacional / BR',
    workModel: 'Home Office / Remoto',
    salaryTip: 'Sem custo de transporte (~R$ 13k a 17k CLT ou R$ 95/h PJ)'
  },
  {
    label: 'Remoto Internacional (EUA, Europa, LATAM)',
    badge: 'Global • Dólar / Euro',
    city: 'Remoto Internacional (EUA/Europa)',
    state: 'Global / Offshore',
    workModel: 'Home Office / Remoto',
    salaryTip: 'Compensação em moeda forte (US$ 4.500 a US$ 8.000 / mês PJ)'
  }
];

export const CVAutoDispatcher: React.FC<CVAutoDispatcherProps> = ({
  onNavigateToApplications,
  onNavigateToCVManager
}) => {
  const { colors, theme } = useContext(ThemeContext);

  // Armazenamento
  const [savedCvs] = useLocalStorage<CV[]>('cvs', []);
  const [applications, setApplications] = useLocalStorage<Application[]>('applications', []);
  const [dispatchHistory, setDispatchHistory] = useLocalStorage<DispatchHistoryRecord[]>('cv_autopilot_dispatch_history_v1', []);

  // Modo Principal (Radar de Varredura Web, E-mail, Preenchimento ou Histórico)
  const [activeTab, setActiveTab] = useState<'radar' | 'email' | 'form' | 'history'>('radar');

  // ==========================================
  // ESTADO: VARREDURA NA INTERNET POR PALAVRA-CHAVE & REGIÃO
  // ==========================================
  const [searchKeyword, setSearchKeyword] = useState<string>('Tech Lead Full Stack');
  const [isSweeping, setIsSweeping] = useState<boolean>(false);
  const [sweptJobs, setSweptJobs] = useState<SweptJobOpportunity[]>([]);
  const [hasPerformedSweep, setHasPerformedSweep] = useState<boolean>(false);
  const [sweepToast, setSweepToast] = useState<string | null>(null);

  // Seleção de CV
  const [selectedCvId, setSelectedCvId] = useState<string>(() => savedCvs[0]?.id || '');
  const activeCv = useMemo(() => {
    return savedCvs.find(cv => cv.id === selectedCvId) || savedCvs[0] || {
      id: 'demo-cv',
      name: 'Currículo Principal Executivo',
      content: 'André Azevedo - Tech Lead & Especialista em Arquitetura de Software e Cloud (AWS/GCP, React, Node.js, TypeScript). 10+ anos de experiência liderando equipes e escalando produtos de alta disponibilidade.'
    };
  }, [savedCvs, selectedCvId]);

  // Dados Compartilhados da Vaga
  const [targetRole, setTargetRole] = useState<string>('Tech Lead Full Stack & Cloud');
  const [targetCompany, setTargetCompany] = useState<string>('Fintech Enterprise');
  const [jobUrl, setJobUrl] = useState<string>('');
  const [jobDescription, setJobDescription] = useState<string>(
    'Buscamos profissional para liderar desenvolvimento de sistemas escaláveis em TypeScript, React, Node.js e Cloud AWS/GCP, com comunicação clara e foco em impacto.'
  );

  // Configuração da Região Desejada
  const [selectedPresetIndex, setSelectedPresetIndex] = useState<number>(0);
  const [customCity, setCustomCity] = useState<string>('São Paulo');
  const [customState, setCustomState] = useState<string>('SP');
  const [workModel, setWorkModel] = useState<'Home Office / Remoto' | 'Híbrido' | 'Presencial' | 'Qualquer Modelo'>('Híbrido');
  const [isCustomRegion, setIsCustomRegion] = useState<boolean>(false);

  // Região Ativa Consolidada
  const currentRegion: DispatchRegionTarget = useMemo(() => {
    if (isCustomRegion) {
      return {
        city: customCity.trim() || 'São Paulo',
        state: customState.trim() || 'SP',
        workModel
      };
    }
    const preset = REGION_PRESETS[selectedPresetIndex] || REGION_PRESETS[0];
    return {
      city: preset.city,
      state: preset.state,
      workModel: preset.workModel
    };
  }, [isCustomRegion, customCity, customState, workModel, selectedPresetIndex]);

  // ==========================================
  // ESTADO: DISPARO POR E-MAIL
  // ==========================================
  const [recruiterEmail, setRecruiterEmail] = useState<string>('carreiras@empresa.com.br');
  const [recruiterName, setRecruiterName] = useState<string>('');
  const [emailTone, setEmailTone] = useState<DispatchEmailTone>('executive');
  const [emailNotes, setEmailNotes] = useState<string>('');
  const [isGeneratingEmail, setIsGeneratingEmail] = useState<boolean>(false);
  const [emailPackage, setEmailPackage] = useState<EmailDispatchPackage | null>(null);
  const [copiedSubject, setCopiedSubject] = useState<boolean>(false);
  const [copiedBody, setCopiedBody] = useState<boolean>(false);
  const [emailSavedToast, setEmailSavedToast] = useState<string | null>(null);

  // ==========================================
  // ESTADO: DISPARO POR FORMULÁRIO / INSERÇÃO
  // ==========================================
  const [portal, setPortal] = useState<JobFormAutofillPortal>('gupy');
  const [isGeneratingForm, setIsGeneratingForm] = useState<boolean>(false);
  const [formPackage, setFormPackage] = useState<FormDispatchPackage | null>(null);
  const [copiedFieldId, setCopiedFieldId] = useState<string | null>(null);
  const [copiedScript, setCopiedScript] = useState<boolean>(false);
  const [formSavedToast, setFormSavedToast] = useState<string | null>(null);
  const [activeFormCategory, setActiveFormCategory] = useState<string>('all');

  // Aplicar Preset de Região
  const handleSelectPreset = (index: number) => {
    setSelectedPresetIndex(index);
    setIsCustomRegion(false);
    const p = REGION_PRESETS[index];
    if (p) {
      setCustomCity(p.city);
      setCustomState(p.state);
      setWorkModel(p.workModel);
    }
  };

  // Gerar E-mail Formatado
  const handleGenerateEmail = async () => {
    setIsGeneratingEmail(true);
    setEmailSavedToast(null);
    try {
      const res = await generateEmailDispatchPackage({
        cv: activeCv,
        targetRole,
        targetCompany,
        recruiterName,
        recruiterEmail,
        region: currentRegion,
        tone: emailTone,
        customNotes: emailNotes
      });
      setEmailPackage(res);
    } catch (err) {
      console.error("Erro ao gerar e-mail formatado:", err);
    } finally {
      setIsGeneratingEmail(false);
    }
  };

  // Gerar Pacote de Inserção em Formulário
  const handleGenerateForm = async () => {
    setIsGeneratingForm(true);
    setFormSavedToast(null);
    try {
      const res = await generateFormDispatchPackage({
        cv: activeCv,
        targetRole,
        targetCompany,
        jobUrl,
        jobDescription,
        region: currentRegion,
        portal
      });
      setFormPackage(res);
    } catch (err) {
      console.error("Erro ao gerar pacote de formulário:", err);
    } finally {
      setIsGeneratingForm(false);
    }
  };

  // Registrar E-mail no Pipeline de Candidaturas e no Histórico
  const handleRecordEmailApplication = () => {
    if (!emailPackage) return;

    const today = new Date().toISOString().split('T')[0];
    const followUpDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const newApp: Application = {
      id: `app-dispatch-${Date.now()}`,
      jobTitle: targetRole,
      companyName: targetCompany || 'Empresa em Contato',
      dateApplied: today,
      status: ApplicationStatus.Aplicou,
      email: emailPackage.toEmail,
      location: `${currentRegion.city} - ${currentRegion.state} (${currentRegion.workModel})`,
      reminderDate: followUpDate,
      notes: `Disparo automático de currículo formatado por e-mail realizado em ${today}.\nRegião: ${currentRegion.city} - ${currentRegion.state} (${currentRegion.workModel})\nAssunto: ${emailPackage.subject}\nTom: ${emailTone}`
    };

    setApplications(prev => [newApp, ...prev]);

    const historyRecord: DispatchHistoryRecord = {
      id: `hist-${Date.now()}`,
      mode: 'email',
      targetRole,
      companyName: targetCompany,
      destination: emailPackage.toEmail,
      region: `${currentRegion.city} - ${currentRegion.state} (${currentRegion.workModel})`,
      date: new Date().toLocaleString('pt-BR'),
      status: 'Disparado',
      cvName: activeCv.name,
      notes: `E-mail executivo formatado com sucesso. Assunto: "${emailPackage.subject}"`,
      detailsSnippet: emailPackage.bodyText.substring(0, 180) + '...'
    };

    setDispatchHistory(prev => [historyRecord, ...prev]);
    setEmailSavedToast('✅ Candidatura e disparo registrados no Painel com lembrete de follow-up em 5 dias!');
    setTimeout(() => setEmailSavedToast(null), 5000);
  };

  // Registrar Formulário no Pipeline de Candidaturas e no Histórico
  const handleRecordFormApplication = () => {
    if (!formPackage) return;

    const today = new Date().toISOString().split('T')[0];
    const followUpDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const salaryVal = formPackage.fields.find(f => f.id === 'f-salary')?.value || '';

    const newApp: Application = {
      id: `app-form-${Date.now()}`,
      jobTitle: targetRole,
      companyName: targetCompany || 'Empresa Portal ATS',
      jobUrl: jobUrl || undefined,
      dateApplied: today,
      status: ApplicationStatus.Aplicou,
      location: `${currentRegion.city} - ${currentRegion.state} (${currentRegion.workModel})`,
      salaryExpectation: salaryVal,
      reminderDate: followUpDate,
      notes: `Candidatura auto-preenchida no portal ${portal.toUpperCase()} para a região de ${currentRegion.city} - ${currentRegion.state} (${currentRegion.workModel}).\nPretensão: ${salaryVal}\nMatch ATS Estimado: ${formPackage.atsMatchScore}%`
    };

    setApplications(prev => [newApp, ...prev]);

    const historyRecord: DispatchHistoryRecord = {
      id: `hist-form-${Date.now()}`,
      mode: 'form',
      targetRole,
      companyName: targetCompany,
      destination: `Portal: ${portal.toUpperCase()}`,
      region: `${currentRegion.city} - ${currentRegion.state} (${currentRegion.workModel})`,
      date: new Date().toLocaleString('pt-BR'),
      status: 'Disparado',
      cvName: activeCv.name,
      notes: `Inserção automática gerada para ${portal.toUpperCase()} na região ${currentRegion.city}. Match ATS: ${formPackage.atsMatchScore}%`,
      detailsSnippet: `Pretensão: ${salaryVal} • ${formPackage.fields.length} campos preparados`
    };

    setDispatchHistory(prev => [historyRecord, ...prev]);
    setFormSavedToast('✅ Candidatura registrada com sucesso no Painel de Vagas!');
    setTimeout(() => setFormSavedToast(null), 5000);
  };

  // Varredura Completa na Internet por Palavra-Chave e Região
  const handleSweepInternet = async (kw?: string) => {
    const query = (kw || searchKeyword).trim();
    if (!query) return;
    setIsSweeping(true);
    setSweepToast(null);
    try {
      const results = await sweepWebOpportunitiesByKeyword({
        keyword: query,
        region: currentRegion,
        cv: activeCv
      });
      setSweptJobs(results);
      setHasPerformedSweep(true);
      setSweepToast(`Varredura concluída! ${results.length} oportunidades ativas localizadas para "${query}" em ${currentRegion.city} - ${currentRegion.state}.`);
      setTimeout(() => setSweepToast(null), 5000);
    } catch (err) {
      console.error('Erro na varredura na internet:', err);
      setSweepToast('Falha temporária ao executar varredura. Tente novamente.');
      setTimeout(() => setSweepToast(null), 5000);
    } finally {
      setIsSweeping(false);
    }
  };

  // Disparo Imediato via E-mail para vaga do radar
  const handleDispatchJobViaEmail = (job: SweptJobOpportunity) => {
    setTargetRole(job.title);
    setTargetCompany(job.company);
    if (job.contactEmail) {
      setRecruiterEmail(job.contactEmail);
    } else {
      const compSlug = job.company.toLowerCase().replace(/[^a-z0-9]/g, '');
      setRecruiterEmail(`carreiras@${compSlug}.com.br`);
    }
    if (job.recruiterName) {
      setRecruiterName(job.recruiterName);
    }
    setActiveTab('email');
    setTimeout(() => {
      setIsGeneratingEmail(true);
      generateEmailDispatchPackage({
        cv: activeCv,
        targetRole: job.title,
        targetCompany: job.company,
        recruiterName: job.recruiterName || 'Equipe de Talent Acquisition',
        recruiterEmail: job.contactEmail || `carreiras@${job.company.toLowerCase().replace(/[^a-z0-9]/g, '')}.com.br`,
        region: currentRegion,
        tone: emailTone,
        customNotes: `Oportunidade captada via Radar Web da Internet: ${job.title} na empresa ${job.company}. Requisitos principais: ${job.requirements.join(', ')}`
      }).then(res => {
        setEmailPackage(res);
      }).catch(err => {
        console.error(err);
      }).finally(() => {
        setIsGeneratingEmail(false);
      });
    }, 150);
  };

  // Disparo Imediato via Preenchimento / Formulário para vaga do radar
  const handleDispatchJobViaForm = (job: SweptJobOpportunity) => {
    setTargetRole(job.title);
    setTargetCompany(job.company);
    setJobUrl(job.applyUrl);
    setJobDescription(job.descriptionSnippet);
    const pLower = job.portal.toLowerCase();
    let detectedPortal: JobFormAutofillPortal = 'gupy';
    if (pLower.includes('workday')) detectedPortal = 'workday';
    else if (pLower.includes('greenhouse')) detectedPortal = 'greenhouse';
    else if (pLower.includes('lever')) detectedPortal = 'lever';
    else if (pLower.includes('vagas') || pLower.includes('catho')) detectedPortal = 'vagas_catho';
    else if (pLower.includes('infojobs')) detectedPortal = 'infojobs';
    else if (pLower.includes('linkedin')) detectedPortal = 'linkedin';
    setPortal(detectedPortal);
    setActiveTab('form');
    setTimeout(() => {
      setIsGeneratingForm(true);
      generateFormDispatchPackage({
        cv: activeCv,
        targetRole: job.title,
        targetCompany: job.company,
        jobUrl: job.applyUrl,
        jobDescription: job.descriptionSnippet,
        region: currentRegion,
        portal: detectedPortal
      }).then(res => {
        setFormPackage(res);
      }).catch(err => {
        console.error(err);
      }).finally(() => {
        setIsGeneratingForm(false);
      });
    }, 150);
  };

  // Registrar Oportunidade do Radar diretamente no Kanban de Candidaturas
  const handleDirectRegisterSweptJob = (job: SweptJobOpportunity) => {
    const today = new Date().toISOString().split('T')[0];
    const followUpDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const newApp: Application = {
      id: `app-sweep-${Date.now()}-${job.id}`,
      jobTitle: job.title,
      companyName: job.company,
      jobUrl: job.applyUrl,
      dateApplied: today,
      status: ApplicationStatus.Aplicou,
      email: job.contactEmail,
      location: `${job.city} - ${job.state} (${job.workModel})`,
      salaryExpectation: job.salaryOrRange,
      reminderDate: followUpDate,
      notes: `Vaga localizada via Varredura Web da Internet por Palavra-Chave ("${searchKeyword}").\nPortal/Canal: ${job.portal}\nMatch ATS: ${job.atsMatchScore || 90}%\nFaixa: ${job.salaryOrRange || 'A combinar'}`
    };
    setApplications(prev => [newApp, ...prev]);

    const historyRecord: DispatchHistoryRecord = {
      id: `hist-sweep-${Date.now()}-${job.id}`,
      mode: job.destinationType === 'email' ? 'email' : 'form',
      targetRole: job.title,
      companyName: job.company,
      destination: job.contactEmail || job.portal,
      region: `${job.city} - ${job.state} (${job.workModel})`,
      date: new Date().toLocaleString('pt-BR'),
      status: 'Disparado',
      cvName: activeCv.name,
      notes: `Disparo direto via Radar Web (${job.portal}). Match: ${job.atsMatchScore || 90}%`,
      detailsSnippet: job.descriptionSnippet.substring(0, 180) + '...'
    };
    setDispatchHistory(prev => [historyRecord, ...prev]);
    setSweepToast(`✓ Candidatura para "${job.title}" na "${job.company}" registrada com sucesso no Painel de Vagas!`);
    setTimeout(() => setSweepToast(null), 4000);
  };

  // Multi-Disparo em Lote para todas as vagas varridas
  const handleBatchDispatchAllSwept = () => {
    if (sweptJobs.length === 0) return;
    const today = new Date().toISOString().split('T')[0];
    const followUpDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const newApps: Application[] = sweptJobs.map((job, idx) => ({
      id: `app-batch-${Date.now()}-${idx}`,
      jobTitle: job.title,
      companyName: job.company,
      jobUrl: job.applyUrl,
      dateApplied: today,
      status: ApplicationStatus.Aplicou,
      email: job.contactEmail,
      location: `${job.city} - ${job.state} (${job.workModel})`,
      salaryExpectation: job.salaryOrRange,
      reminderDate: followUpDate,
      notes: `Multi-Disparo Automático via Radar Web da Internet ("${searchKeyword}").\nPortal: ${job.portal}\nMatch ATS: ${job.atsMatchScore || 90}%`
    }));

    const newHistoryRecords: DispatchHistoryRecord[] = sweptJobs.map((job, idx) => ({
      id: `hist-batch-${Date.now()}-${idx}`,
      mode: job.destinationType === 'email' ? 'email' : 'form',
      targetRole: job.title,
      companyName: job.company,
      destination: job.contactEmail || job.portal,
      region: `${job.city} - ${job.state} (${job.workModel})`,
      date: new Date().toLocaleString('pt-BR'),
      status: 'Disparado',
      cvName: activeCv.name,
      notes: `Multi-Disparo em lote via Radar Web (${job.portal}). Match ATS: ${job.atsMatchScore || 90}%`,
      detailsSnippet: job.descriptionSnippet.substring(0, 180) + '...'
    }));

    setApplications(prev => [...newApps, ...prev]);
    setDispatchHistory(prev => [...newHistoryRecords, ...prev]);
    setSweepToast(`🚀 Multi-Disparo concluído! ${sweptJobs.length} candidaturas foram registradas no Painel com lembretes de follow-up.`);
    setTimeout(() => setSweepToast(null), 6000);
  };

  const copyToClipboard = (text: string, onDone: () => void) => {
    navigator.clipboard.writeText(text);
    onDone();
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px 20px 80px 20px' }}>
      {/* HEADER EXECUTIVO DO MÓDULO */}
      <div 
        style={{
          background: theme === 'dark'
            ? 'linear-gradient(135deg, rgba(159, 18, 57, 0.28) 0%, rgba(18, 15, 20, 0.95) 100%)'
            : 'linear-gradient(135deg, rgba(136, 19, 55, 0.08) 0%, rgba(255, 255, 255, 0.98) 100%)',
          border: `1px solid ${colors.borderFocus}`,
          borderRadius: '16px',
          padding: '28px',
          marginBottom: '24px',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: colors.shadow
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div 
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #9f1239 0%, #be123c 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 8px 24px rgba(159, 18, 57, 0.35)',
                flexShrink: 0
              }}
            >
              <Send size={28} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: colors.textPrimary }}>
                  Disparador Automático de Currículo (IA)
                </h1>
                <span 
                  style={{
                    background: colors.primaryLight,
                    color: colors.primary,
                    border: `1px solid ${colors.borderFocus}`,
                    padding: '3px 10px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}
                >
                  E-mail Formatado • Preenchimento por Região
                </span>
              </div>
              <p style={{ margin: '6px 0 0 0', fontSize: '14px', color: colors.textSecondary, maxWidth: '850px', lineHeight: 1.5 }}>
                Envie candidaturas de alto impacto com 1-clique. Se for por <strong>e-mail</strong>, gere mensagens executivas com altíssima taxa de abertura e formatação sob medida. Se for por <strong>preenchimento de vagas</strong>, insira automaticamente dados, respostas de triagem e pretensão ajustada para o <strong>cargo</strong> e a <strong>região desejada</strong>.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            {onNavigateToApplications && (
              <button
                onClick={onNavigateToApplications}
                style={{
                  background: 'transparent',
                  border: `1px solid ${colors.border}`,
                  color: colors.textPrimary,
                  padding: '9px 16px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease'
                }}
              >
                <Briefcase size={15} />
                Painel de Vagas
              </button>
            )}
            {onNavigateToCVManager && (
              <button
                onClick={onNavigateToCVManager}
                style={{
                  background: 'transparent',
                  border: `1px solid ${colors.border}`,
                  color: colors.textPrimary,
                  padding: '9px 16px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease'
                }}
              >
                <FileText size={15} />
                Gerenciar Currículos
              </button>
            )}
          </div>
        </div>

        {/* NAVEGAÇÃO ENTRE ABAS DO DISPARADOR */}
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginTop: '24px',
            borderTop: `1px solid ${colors.borderSubtle}`,
            paddingTop: '18px',
            flexWrap: 'wrap'
          }}
        >
          {/* ABA RADAR: VARREDURA POR PALAVRA-CHAVE & REGIÃO */}
          <button
            onClick={() => setActiveTab('radar')}
            style={{
              background: activeTab === 'radar' ? colors.primary : 'transparent',
              color: activeTab === 'radar' ? '#fff' : colors.textSecondary,
              border: activeTab === 'radar' ? `1px solid ${colors.primaryHover}` : `1px solid ${colors.border}`,
              padding: '10px 18px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s',
              boxShadow: activeTab === 'radar' ? '0 4px 14px rgba(159, 18, 57, 0.35)' : 'none'
            }}
          >
            <Globe size={16} />
            <span>Radar de Varredura Web (IA)</span>
            <span style={{
              fontSize: '10px',
              background: activeTab === 'radar' ? 'rgba(255,255,255,0.25)' : colors.primaryLight,
              color: activeTab === 'radar' ? '#fff' : colors.primary,
              padding: '2px 7px',
              borderRadius: '8px',
              fontWeight: 800
            }}>
              Palavra-Chave & Região
            </span>
          </button>

          <button
            onClick={() => setActiveTab('email')}
            style={{
              background: activeTab === 'email' ? colors.primary : 'transparent',
              color: activeTab === 'email' ? '#fff' : colors.textSecondary,
              border: activeTab === 'email' ? `1px solid ${colors.primaryHover}` : `1px solid ${colors.border}`,
              padding: '10px 18px',
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
            <Mail size={16} />
            <span>Disparo por E-mail (Formatado)</span>
          </button>

          <button
            onClick={() => setActiveTab('form')}
            style={{
              background: activeTab === 'form' ? colors.primary : 'transparent',
              color: activeTab === 'form' ? '#fff' : colors.textSecondary,
              border: activeTab === 'form' ? `1px solid ${colors.primaryHover}` : `1px solid ${colors.border}`,
              padding: '10px 18px',
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
            <Zap size={16} />
            <span>Disparo por Preenchimento de Vagas (Vaga & Região)</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            style={{
              background: activeTab === 'history' ? colors.primary : 'transparent',
              color: activeTab === 'history' ? '#fff' : colors.textSecondary,
              border: activeTab === 'history' ? `1px solid ${colors.primaryHover}` : `1px solid ${colors.border}`,
              padding: '10px 18px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s',
              marginLeft: 'auto'
            }}
          >
            <History size={16} />
            <span>Fila & Histórico ({dispatchHistory.length})</span>
          </button>
        </div>
      </div>

      {/* PAINEL CENTRAL DE CONFIGURAÇÃO: VAGA & REGIÃO (COMPARTILHADO PARA EMAIL E FORMULÁRIO) */}
      {(activeTab === 'email' || activeTab === 'form') && (
        <div 
          style={{
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: '14px',
            padding: '22px',
            marginBottom: '24px',
            boxShadow: colors.shadowSm
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sliders size={18} style={{ color: colors.primary }} />
              <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: colors.textPrimary }}>
                1. Alinhamento da Vaga e Seleção da Região Desejada
              </h2>
            </div>
            <span style={{ fontSize: '12px', color: colors.textMuted }}>
              Os dados de vaga e região serão calibrados em tempo real na formatação do e-mail e nos campos do formulário
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '18px' }}>
            {/* Currículo Base */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: colors.textSecondary, marginBottom: '6px' }}>
                Currículo do Candidato
              </label>
              <select
                value={selectedCvId}
                onChange={e => setSelectedCvId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: colors.inputBg,
                  border: `1px solid ${colors.border}`,
                  color: colors.inputText,
                  fontSize: '13px',
                  outline: 'none'
                }}
              >
                {savedCvs.map(cv => (
                  <option key={cv.id} value={cv.id}>
                    {cv.name} {cv.yearsOfExperience ? `(${cv.yearsOfExperience} anos exp)` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Cargo / Vaga */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: colors.textSecondary, marginBottom: '6px' }}>
                Cargo / Vaga Pretendida *
              </label>
              <input
                type="text"
                value={targetRole}
                onChange={e => setTargetRole(e.target.value)}
                placeholder="Ex: Tech Lead Full Stack, Engenheiro de Software..."
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: colors.inputBg,
                  border: `1px solid ${colors.border}`,
                  color: colors.inputText,
                  fontSize: '13px',
                  outline: 'none'
                }}
              />
            </div>

            {/* Empresa Alvo */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: colors.textSecondary, marginBottom: '6px' }}>
                Empresa Contratante *
              </label>
              <input
                type="text"
                value={targetCompany}
                onChange={e => setTargetCompany(e.target.value)}
                placeholder="Ex: Nubank, Itaú, Mercado Livre, Startup..."
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: colors.inputBg,
                  border: `1px solid ${colors.border}`,
                  color: colors.inputText,
                  fontSize: '13px',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* SELETOR DE REGIÃO DESEJADA (PRESETS RÁPIDOS + PERSONALIZADO) */}
          <div style={{ marginTop: '12px', paddingTop: '16px', borderTop: `1px solid ${colors.borderSubtle}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={16} style={{ color: colors.primary }} />
                <span style={{ fontSize: '13px', fontWeight: 700, color: colors.textPrimary }}>
                  Região Desejada para a Vaga:
                </span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: colors.primary }}>
                  {currentRegion.city} - {currentRegion.state} ({currentRegion.workModel})
                </span>
              </div>
              <button
                onClick={() => setIsCustomRegion(!isCustomRegion)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: colors.primary,
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                {isCustomRegion ? '← Usar Presets Regionais Rápidos' : 'Personalizar Cidade / Estado / Modelo →'}
              </button>
            </div>

            {!isCustomRegion ? (
              <div 
                style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', 
                  gap: '8px' 
                }}
              >
                {REGION_PRESETS.map((preset, idx) => {
                  const isSelected = selectedPresetIndex === idx;
                  return (
                    <div
                      key={preset.label}
                      onClick={() => handleSelectPreset(idx)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: isSelected ? `2px solid ${colors.primary}` : `1px solid ${colors.borderSubtle}`,
                        background: isSelected ? colors.primaryLight : colors.inputBg,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: isSelected ? colors.primary : colors.textSecondary }}>
                          {preset.badge}
                        </span>
                        {isSelected && <Check size={14} style={{ color: colors.primary }} />}
                      </div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: colors.textPrimary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {preset.city} ({preset.workModel})
                      </div>
                      <div style={{ fontSize: '11px', color: colors.textMuted, marginTop: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {preset.salaryTip}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', background: colors.inputBg, padding: '14px', borderRadius: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: colors.textSecondary, marginBottom: '4px' }}>
                    Cidade Desejada
                  </label>
                  <input
                    type="text"
                    value={customCity}
                    onChange={e => setCustomCity(e.target.value)}
                    placeholder="Ex: São Paulo, Campinas, Santos, Remoto..."
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      background: colors.surface,
                      border: `1px solid ${colors.border}`,
                      color: colors.inputText,
                      fontSize: '12px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: colors.textSecondary, marginBottom: '4px' }}>
                    Estado (UF)
                  </label>
                  <input
                    type="text"
                    value={customState}
                    onChange={e => setCustomState(e.target.value.toUpperCase())}
                    placeholder="Ex: SP, RJ, MG, Remoto..."
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      background: colors.surface,
                      border: `1px solid ${colors.border}`,
                      color: colors.inputText,
                      fontSize: '12px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: colors.textSecondary, marginBottom: '4px' }}>
                    Modelo de Trabalho
                  </label>
                  <select
                    value={workModel}
                    onChange={e => setWorkModel(e.target.value as any)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      background: colors.surface,
                      border: `1px solid ${colors.border}`,
                      color: colors.inputText,
                      fontSize: '12px'
                    }}
                  >
                    <option value="Home Office / Remoto">Home Office / Remoto</option>
                    <option value="Híbrido">Híbrido</option>
                    <option value="Presencial">Presencial</option>
                    <option value="Qualquer Modelo">Qualquer Modelo</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 0: RADAR DE VARREDURA NA INTERNET (POR PALAVRA-CHAVE & REGIÃO)       */}
      {/* ========================================================================= */}
      {activeTab === 'radar' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* PAINEL DE CONTROLE DE BUSCA E VARREDURA */}
          <div
            style={{
              background: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: '16px',
              padding: '24px',
              boxShadow: colors.shadowSm,
              position: 'relative'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #9f1239 0%, #be123c 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  boxShadow: '0 4px 12px rgba(159, 18, 57, 0.3)'
                }}>
                  <Globe size={20} />
                </div>
                <div>
                  <h2 style={{ fontSize: '17px', fontWeight: 800, margin: 0, color: colors.textPrimary }}>
                    Varredura Completa na Internet por Palavra-Chave & Região
                  </h2>
                  <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: colors.textSecondary }}>
                    A IA rastreia portais ATS (Gupy, LinkedIn, Greenhouse, Lever, Workday) e canais corporativos da região selecionada
                  </p>
                </div>
              </div>

              {/* Status Pill */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: colors.primaryLight,
                border: `1px solid ${colors.borderFocus}`,
                padding: '5px 12px',
                borderRadius: '20px',
                fontSize: '11.5px',
                fontWeight: 700,
                color: colors.primary
              }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: colors.primary }} className="engine-pulse" />
                Motor Gemini 3.8 Flash • Varredura Ativa
              </div>
            </div>

            {/* BARRA DE BUSCA PRINCIPAL */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: colors.textPrimary, marginBottom: '8px' }}>
                Palavra-Chave (Cargo Pretendido ou Empresa Contratante) *
              </label>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: '280px' }}>
                  <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: colors.textMuted }} />
                  <input
                    type="text"
                    value={searchKeyword}
                    onChange={e => setSearchKeyword(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleSweepInternet(); }}
                    placeholder="Digite o cargo (ex: 'Tech Lead Full Stack') ou a empresa (ex: 'Nubank', 'Itaú', 'Mercado Livre')..."
                    style={{
                      width: '100%',
                      padding: '12px 14px 12px 42px',
                      borderRadius: '10px',
                      background: colors.inputBg,
                      border: `1px solid ${colors.borderFocus}`,
                      color: colors.inputText,
                      fontSize: '14px',
                      fontWeight: 600,
                      outline: 'none',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                    }}
                  />
                </div>

                <button
                  onClick={() => handleSweepInternet()}
                  disabled={isSweeping || !searchKeyword.trim()}
                  style={{
                    background: isSweeping ? colors.buttonDisabledBg : 'linear-gradient(135deg, #9f1239 0%, #be123c 100%)',
                    color: isSweeping ? colors.buttonDisabledText : '#ffffff',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '10px',
                    fontSize: '13.5px',
                    fontWeight: 700,
                    cursor: isSweeping ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 6px 18px rgba(159, 18, 57, 0.35)',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <RefreshCw size={16} className={isSweeping ? 'animate-spin' : ''} />
                  <span>{isSweeping ? 'Varrendo a Internet...' : 'Fazer Varredura Completa'}</span>
                </button>
              </div>

              {/* Sugestões Rápidas de Palavras-Chave */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', color: colors.textMuted, fontWeight: 600 }}>Exemplos Rápidos:</span>
                {[
                  { label: 'Tech Lead Full Stack', type: 'cargo' },
                  { label: 'Desenvolvedor React / Node', type: 'cargo' },
                  { label: 'Nubank', type: 'empresa' },
                  { label: 'Itaú Unibanco', type: 'empresa' },
                  { label: 'Mercado Livre', type: 'empresa' },
                  { label: 'Arquiteto Cloud AWS/GCP', type: 'cargo' },
                  { label: 'Gerente Comercial', type: 'cargo' },
                  { label: 'TOTVS', type: 'empresa' }
                ].map((sug, sIdx) => (
                  <button
                    key={sIdx}
                    type="button"
                    onClick={() => {
                      setSearchKeyword(sug.label);
                      handleSweepInternet(sug.label);
                    }}
                    style={{
                      background: searchKeyword === sug.label ? colors.primaryLight : colors.inputBg,
                      border: `1px solid ${searchKeyword === sug.label ? colors.borderFocus : colors.border}`,
                      color: searchKeyword === sug.label ? colors.primary : colors.textSecondary,
                      padding: '4px 10px',
                      borderRadius: '8px',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <span>{sug.label}</span>
                    <span style={{ fontSize: '9px', opacity: 0.6 }}>({sug.type})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* SELEÇÃO DA REGIÃO ALVO & CURRÍCULO BASE */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', paddingTop: '16px', borderTop: `1px solid ${colors.borderSubtle}` }}>
              {/* Região e Modelo */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: colors.textPrimary, display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <MapPin size={14} color={colors.primary} />
                    Região Alvo da Varredura
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCustomRegion(!isCustomRegion)}
                    style={{ background: 'none', border: 'none', color: colors.primary, fontSize: '11px', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                  >
                    {isCustomRegion ? '← Usar Principais Polos' : '+ Região Personalizada'}
                  </button>
                </div>

                {!isCustomRegion ? (
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {REGION_PRESETS.map((preset, idx) => {
                      const isSel = selectedPresetIndex === idx;
                      return (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => handleSelectPreset(idx)}
                          style={{
                            padding: '6px 10px',
                            borderRadius: '8px',
                            background: isSel ? colors.primary : colors.inputBg,
                            color: isSel ? '#fff' : colors.textSecondary,
                            border: `1px solid ${isSel ? colors.primaryHover : colors.border}`,
                            fontSize: '11.5px',
                            fontWeight: isSel ? 700 : 500,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <span>{preset.city} ({preset.state})</span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                    <input
                      type="text"
                      value={customCity}
                      onChange={e => setCustomCity(e.target.value)}
                      placeholder="Cidade"
                      style={{ padding: '8px 10px', borderRadius: '6px', background: colors.inputBg, border: `1px solid ${colors.border}`, color: colors.inputText, fontSize: '12px' }}
                    />
                    <input
                      type="text"
                      value={customState}
                      onChange={e => setCustomState(e.target.value.toUpperCase())}
                      placeholder="UF (ex: SP)"
                      style={{ padding: '8px 10px', borderRadius: '6px', background: colors.inputBg, border: `1px solid ${colors.border}`, color: colors.inputText, fontSize: '12px' }}
                    />
                    <select
                      value={workModel}
                      onChange={e => setWorkModel(e.target.value as any)}
                      style={{ padding: '8px 10px', borderRadius: '6px', background: colors.inputBg, border: `1px solid ${colors.border}`, color: colors.inputText, fontSize: '12px' }}
                    >
                      <option value="Home Office / Remoto">Remoto</option>
                      <option value="Híbrido">Híbrido</option>
                      <option value="Presencial">Presencial</option>
                      <option value="Qualquer Modelo">Qualquer</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Currículo Selecionado para Aderência / Disparo */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: colors.textPrimary, marginBottom: '8px' }}>
                  Currículo para Análise de Match ATS & Disparo
                </label>
                <select
                  value={selectedCvId}
                  onChange={e => setSelectedCvId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    background: colors.inputBg,
                    border: `1px solid ${colors.border}`,
                    color: colors.inputText,
                    fontSize: '12.5px',
                    fontWeight: 600,
                    outline: 'none'
                  }}
                >
                  {savedCvs.map(cv => (
                    <option key={cv.id} value={cv.id}>
                      {cv.name} {cv.yearsOfExperience ? `(${cv.yearsOfExperience} anos exp)` : ''}
                    </option>
                  ))}
                </select>
                <span style={{ display: 'block', marginTop: '4px', fontSize: '11px', color: colors.textMuted }}>
                  A IA calcula o índice de compatibilidade ATS de cada oportunidade contra este currículo.
                </span>
              </div>
            </div>
          </div>

          {/* TOAST DE FEEDBACK DA VARREDURA */}
          {sweepToast && (
            <div
              style={{
                background: colors.primaryLight,
                border: `1px solid ${colors.borderFocus}`,
                color: colors.textPrimary,
                padding: '12px 18px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '13px',
                fontWeight: 600,
                boxShadow: colors.shadowSm
              }}
            >
              <CheckCircle2 size={18} color={colors.primary} />
              <span>{sweepToast}</span>
            </div>
          )}

          {/* ESTADO: VARRENDO A INTERNET (ANIMADO) */}
          {isSweeping && (
            <div
              style={{
                background: colors.surface,
                border: `1px solid ${colors.borderFocus}`,
                borderRadius: '16px',
                padding: '48px 24px',
                textAlign: 'center',
                boxShadow: colors.shadow
              }}
            >
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(159, 18, 57, 0.2) 0%, rgba(190, 18, 60, 0.4) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto',
                color: colors.primary
              }}>
                <RefreshCw size={30} className="animate-spin" />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 8px 0', color: colors.textPrimary }}>
                Varrendo a Internet em Tempo Real...
              </h3>
              <p style={{ fontSize: '13.5px', color: colors.textSecondary, maxWidth: '580px', margin: '0 auto', lineHeight: 1.5 }}>
                Buscando vagas ativas para <strong>"{searchKeyword}"</strong> na região de <strong>{currentRegion.city} - {currentRegion.state} ({currentRegion.workModel})</strong> em portais ATS (Gupy, LinkedIn, Greenhouse, Lever, Catho, InfoJobs) e canais corporativos...
              </p>
            </div>
          )}

          {/* RESULTADOS DA VARREDURA (LISTA DE VAGAS LOCALIZADAS) */}
          {!isSweeping && hasPerformedSweep && sweptJobs.length > 0 && (
            <div>
              {/* Barra de Ações em Lote e Contagem */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
                flexWrap: 'wrap',
                gap: '12px',
                background: colors.surface,
                padding: '14px 20px',
                borderRadius: '12px',
                border: `1px solid ${colors.border}`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '15px', fontWeight: 800, color: colors.textPrimary }}>
                    {sweptJobs.length} Vagas Encontradas
                  </span>
                  <span style={{ fontSize: '11px', background: colors.primaryLight, color: colors.primary, padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>
                    {searchKeyword} • {currentRegion.city} ({currentRegion.state})
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={handleBatchDispatchAllSwept}
                    style={{
                      background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                      color: '#ffffff',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                    }}
                    title="Adicionar todas as vagas encontradas à esteira de candidaturas e agendar follow-up automático"
                  >
                    <Send size={14} />
                    <span>Multi-Disparo Automático ({sweptJobs.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSweepInternet()}
                    style={{
                      background: 'transparent',
                      color: colors.textSecondary,
                      border: `1px solid ${colors.border}`,
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <RefreshCw size={13} />
                    <span>Atualizar Radar</span>
                  </button>
                </div>
              </div>

              {/* Grid de Cards de Oportunidades */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '18px' }}>
                {sweptJobs.map(job => (
                  <div
                    key={job.id}
                    style={{
                      background: colors.surface,
                      border: `1px solid ${colors.border}`,
                      borderRadius: '14px',
                      padding: '20px',
                      boxShadow: colors.shadowSm,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      transition: 'all 0.2s',
                      position: 'relative'
                    }}
                  >
                    {/* Header do Card: Empresa, Portal e Match */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                          <Building2 size={15} style={{ color: colors.primary }} />
                          <span style={{ fontSize: '13px', fontWeight: 800, color: colors.primary }}>
                            {job.company}
                          </span>
                        </div>
                        <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: colors.textPrimary, lineHeight: 1.3 }}>
                          {job.title}
                        </h3>
                      </div>

                      {/* Match ATS Badge */}
                      <div style={{
                        background: (job.atsMatchScore || 90) >= 90 ? 'rgba(16, 185, 129, 0.15)' : colors.primaryLight,
                        border: `1px solid ${(job.atsMatchScore || 90) >= 90 ? '#10b981' : colors.borderFocus}`,
                        color: (job.atsMatchScore || 90) >= 90 ? '#10b981' : colors.primary,
                        padding: '4px 8px',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontWeight: 800,
                        textAlign: 'center',
                        flexShrink: 0
                      }}>
                        {job.atsMatchScore || 90}% Match
                      </div>
                    </div>

                    {/* Metadados: Localização, Modelo e Faixa Salarial */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '11.5px', color: colors.textSecondary }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', background: colors.inputBg, padding: '3px 8px', borderRadius: '6px', border: `1px solid ${colors.border}` }}>
                        <MapPin size={12} color={colors.primary} />
                        {job.city} - {job.state} ({job.workModel})
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', background: colors.inputBg, padding: '3px 8px', borderRadius: '6px', border: `1px solid ${colors.border}` }}>
                        <Globe size={12} color={colors.textMuted} />
                        {job.portal}
                      </span>
                      {job.salaryOrRange && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(5, 150, 105, 0.08)', color: '#059669', padding: '3px 8px', borderRadius: '6px', border: '1px solid rgba(5, 150, 105, 0.2)', fontWeight: 700 }}>
                          <DollarSign size={12} />
                          {job.salaryOrRange}
                        </span>
                      )}
                    </div>

                    {/* Descrição / Snippet */}
                    <p style={{ fontSize: '12.5px', color: colors.textSecondary, margin: 0, lineHeight: 1.4, flex: 1 }}>
                      {job.descriptionSnippet}
                    </p>

                    {/* Requisitos */}
                    {job.requirements && job.requirements.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {job.requirements.map((req, rIdx) => (
                          <span key={rIdx} style={{ fontSize: '10.5px', background: colors.inputBg, color: colors.textMuted, padding: '2px 7px', borderRadius: '5px', border: `1px solid ${colors.border}` }}>
                            ✓ {req}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Rodapé do Card com Ações 1-Clique */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '10px', borderTop: `1px solid ${colors.borderSubtle}` }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        {/* Ação 1: Disparo Formatado por E-mail */}
                        <button
                          type="button"
                          onClick={() => handleDispatchJobViaEmail(job)}
                          style={{
                            background: colors.primary,
                            color: '#ffffff',
                            border: 'none',
                            padding: '9px 10px',
                            borderRadius: '8px',
                            fontSize: '11.5px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '5px',
                            transition: 'all 0.15s'
                          }}
                          title="Carregar vaga no Disparador por E-mail e gerar texto de alta conversão"
                        >
                          <Mail size={13} />
                          <span>Disparar E-mail</span>
                        </button>

                        {/* Ação 2: Disparo por Formulário / Autofill */}
                        <button
                          type="button"
                          onClick={() => handleDispatchJobViaForm(job)}
                          style={{
                            background: 'transparent',
                            color: colors.primary,
                            border: `1px solid ${colors.borderFocus}`,
                            padding: '9px 10px',
                            borderRadius: '8px',
                            fontSize: '11.5px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '5px',
                            transition: 'all 0.15s'
                          }}
                          title="Carregar vaga no preenchedor de formulário ATS e gerar script de 1-clique"
                        >
                          <Zap size={13} />
                          <span>Preencher Vaga</span>
                        </button>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        {/* Ação 3: Registrar diretamente no Kanban */}
                        <button
                          type="button"
                          onClick={() => handleDirectRegisterSweptJob(job)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: colors.textSecondary,
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 0'
                          }}
                        >
                          <CheckCircle2 size={13} color="#10b981" />
                          <span>Salvar no Painel</span>
                        </button>

                        {/* Ação 4: Abrir link da vaga */}
                        {job.applyUrl && (
                          <a
                            href={job.applyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              color: colors.textMuted,
                              fontSize: '11px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '3px',
                              textDecoration: 'none'
                            }}
                          >
                            <span>Abrir Vaga</span>
                            <ArrowUpRight size={12} />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ESTADO INICIAL / SEM VARREDURA FEITA AINDA */}
          {!isSweeping && !hasPerformedSweep && (
            <div
              style={{
                background: colors.surface,
                border: `1px dashed ${colors.borderFocus}`,
                borderRadius: '16px',
                padding: '48px 24px',
                textAlign: 'center',
                boxShadow: colors.shadowSm
              }}
            >
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: colors.primaryLight,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto',
                color: colors.primary
              }}>
                <Search size={28} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 8px 0', color: colors.textPrimary }}>
                Pronto para Varrer a Internet
              </h3>
              <p style={{ fontSize: '13.5px', color: colors.textSecondary, maxWidth: '560px', margin: '0 auto 20px auto', lineHeight: 1.5 }}>
                Digite um <strong>cargo pretendido</strong> (ex: "Tech Lead", "Engenheiro de Software") ou o nome de uma <strong>empresa contratante</strong> (ex: "Nubank", "Itaú", "Mercado Livre") acima e clique em <strong>"Fazer Varredura Completa"</strong> para mapear as vagas ativas na região selecionada.
              </p>
              <button
                type="button"
                onClick={() => handleSweepInternet()}
                style={{
                  background: 'linear-gradient(135deg, #9f1239 0%, #be123c 100%)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '12px 28px',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 6px 18px rgba(159, 18, 57, 0.35)'
                }}
              >
                Iniciar Varredura para "{searchKeyword}"
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 1: DISPARO POR E-MAIL FORMATADO                                       */}
      {/* ========================================================================= */}
      {activeTab === 'email' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
          {/* COLUNA ESQUERDA: PARÂMETROS DO E-MAIL */}
          <div 
            style={{
              background: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: '14px',
              padding: '22px',
              boxShadow: colors.shadowSm,
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: `1px solid ${colors.borderSubtle}`, paddingBottom: '12px' }}>
              <Mail size={18} style={{ color: colors.primary }} />
              <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: colors.textPrimary }}>
                2. Parâmetros de Disparo do E-mail
              </h3>
            </div>

            {/* Destinatário */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: colors.textSecondary, marginBottom: '6px' }}>
                E-mail do RH / Recrutador *
              </label>
              <input
                type="email"
                value={recruiterEmail}
                onChange={e => setRecruiterEmail(e.target.value)}
                placeholder="Ex: recrutamento@empresa.com, vagas@..."
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: colors.inputBg,
                  border: `1px solid ${colors.border}`,
                  color: colors.inputText,
                  fontSize: '13px'
                }}
              />
              <span style={{ fontSize: '11px', color: colors.textMuted, marginTop: '4px', display: 'block' }}>
                Pode ser o e-mail geral de vagas da empresa ou contato direto do Headhunter.
              </span>
            </div>

            {/* Nome do Recrutador (Opcional) */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: colors.textSecondary, marginBottom: '6px' }}>
                Nome do Recrutador / Gestor (Opcional)
              </label>
              <input
                type="text"
                value={recruiterName}
                onChange={e => setRecruiterName(e.target.value)}
                placeholder="Ex: Mariana Silva, Equipe de Talent Acquisition"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: colors.inputBg,
                  border: `1px solid ${colors.border}`,
                  color: colors.inputText,
                  fontSize: '13px'
                }}
              />
            </div>

            {/* Tom do E-mail */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: colors.textSecondary, marginBottom: '6px' }}>
                Tom e Estilo de Comunicação
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {[
                  { id: 'executive', label: 'Executivo C-Level', desc: 'Foco em impacto, ROI e liderança' },
                  { id: 'technical', label: 'Técnico & Preciso', desc: 'Foco em stack, arquitetura e entrega' },
                  { id: 'consultative', label: 'Consultivo & Parceria', desc: 'Foco em resolução de dores do negócio' },
                  { id: 'creative', label: 'Inovador & Direto', desc: 'Pitch ágil e proposta de valor rápida' }
                ].map(item => {
                  const isSel = emailTone === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setEmailTone(item.id as DispatchEmailTone)}
                      style={{
                        padding: '10px',
                        borderRadius: '8px',
                        border: isSel ? `2px solid ${colors.primary}` : `1px solid ${colors.borderSubtle}`,
                        background: isSel ? colors.primaryLight : colors.inputBg,
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ fontSize: '12px', fontWeight: 700, color: isSel ? colors.primary : colors.textPrimary }}>
                        {item.label}
                      </div>
                      <div style={{ fontSize: '10px', color: colors.textMuted, marginTop: '2px' }}>
                        {item.desc}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Notas adicionais */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: colors.textSecondary, marginBottom: '6px' }}>
                Instruções ou Diferenciais Específicos (Opcional)
              </label>
              <textarea
                value={emailNotes}
                onChange={e => setEmailNotes(e.target.value)}
                placeholder="Ex: Mencione disponibilidade para início em 7 dias, ou indicação de fulano..."
                rows={2}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: colors.inputBg,
                  border: `1px solid ${colors.border}`,
                  color: colors.inputText,
                  fontSize: '12px',
                  resize: 'vertical'
                }}
              />
            </div>

            {/* BOTÃO GERAR COM IA */}
            <button
              onClick={handleGenerateEmail}
              disabled={isGeneratingEmail}
              style={{
                background: 'linear-gradient(135deg, #9f1239 0%, #be123c 100%)',
                color: '#fff',
                border: 'none',
                padding: '14px',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: 700,
                cursor: isGeneratingEmail ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 16px rgba(159, 18, 57, 0.35)',
                transition: 'all 0.2s',
                marginTop: '8px'
              }}
            >
              {isGeneratingEmail ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  Formatando E-mail Executivo com IA...
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  Formatar E-mail de Disparo com IA (Gemini)
                </>
              )}
            </button>
          </div>

          {/* COLUNA DIREITA: RESULTADO FORMATADO E AÇÕES DE DISPARO */}
          <div 
            style={{
              background: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: '14px',
              padding: '22px',
              boxShadow: colors.shadowSm,
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${colors.borderSubtle}`, paddingBottom: '12px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={18} style={{ color: colors.success }} />
                <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: colors.textPrimary }}>
                  3. E-mail Formatado & Central de Disparo
                </h3>
              </div>
              {emailPackage && (
                <span style={{ fontSize: '11px', color: colors.textMuted }}>
                  Gerado em {new Date(emailPackage.generatedAt).toLocaleTimeString('pt-BR')}
                </span>
              )}
            </div>

            {emailSavedToast && (
              <div 
                style={{
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid #10b981',
                  color: '#10b981',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 600,
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Check size={16} />
                {emailSavedToast}
              </div>
            )}

            {!emailPackage ? (
              <div 
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '60px 20px',
                  textAlign: 'center',
                  color: colors.textSecondary
                }}
              >
                <div 
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: colors.primaryLight,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: colors.primary,
                    marginBottom: '16px'
                  }}
                >
                  <Mail size={32} />
                </div>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', color: colors.textPrimary }}>
                  Nenhum e-mail formatado no momento
                </h4>
                <p style={{ margin: 0, fontSize: '13px', maxWidth: '360px', color: colors.textMuted }}>
                  Clique no botão <strong>"Formatar E-mail de Disparo com IA"</strong> para gerar uma mensagem personalizada com assunto de alta conversão, alinhamento com a região <strong>{currentRegion.city}</strong> e links diretos de envio.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* ASSUNTO DO E-MAIL */}
                <div style={{ background: colors.inputBg, border: `1px solid ${colors.border}`, borderRadius: '10px', padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: colors.textSecondary, textTransform: 'uppercase' }}>
                      Assunto (Otimizado para Alta Abertura):
                    </span>
                    <button
                      onClick={() => copyToClipboard(emailPackage.subject, () => {
                        setCopiedSubject(true);
                        setTimeout(() => setCopiedSubject(false), 2000);
                      })}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: copiedSubject ? colors.success : colors.primary,
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      {copiedSubject ? <Check size={12} /> : <Copy size={12} />}
                      {copiedSubject ? 'Copiado!' : 'Copiar Assunto'}
                    </button>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: colors.textPrimary }}>
                    {emailPackage.subject}
                  </div>
                </div>

                {/* CORPO DO E-MAIL */}
                <div style={{ background: colors.inputBg, border: `1px solid ${colors.border}`, borderRadius: '10px', padding: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: colors.textSecondary, textTransform: 'uppercase' }}>
                      Corpo da Mensagem:
                    </span>
                    <button
                      onClick={() => copyToClipboard(emailPackage.bodyText, () => {
                        setCopiedBody(true);
                        setTimeout(() => setCopiedBody(false), 2000);
                      })}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: copiedBody ? colors.success : colors.primary,
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      {copiedBody ? <Check size={12} /> : <Copy size={12} />}
                      {copiedBody ? 'Copiado!' : 'Copiar Corpo Completo'}
                    </button>
                  </div>
                  <pre 
                    style={{
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      fontFamily: 'inherit',
                      fontSize: '13px',
                      lineHeight: 1.6,
                      color: colors.textPrimary,
                      margin: 0,
                      maxHeight: '380px',
                      overflowY: 'auto'
                    }}
                  >
                    {emailPackage.bodyText}
                  </pre>
                </div>

                {/* BOTÕES DE DISPARO RÁPIDO */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px' }}>
                    {/* Mailto */}
                    <a
                      href={emailPackage.mailtoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        background: colors.primary,
                        color: '#fff',
                        textDecoration: 'none',
                        padding: '11px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        textAlign: 'center'
                      }}
                    >
                      <Mail size={15} />
                      Abrir no App de E-mail
                    </a>

                    {/* Gmail Web */}
                    <a
                      href={emailPackage.gmailWebUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        background: 'transparent',
                        border: `1px solid ${colors.border}`,
                        color: colors.textPrimary,
                        textDecoration: 'none',
                        padding: '11px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <ArrowUpRight size={15} />
                      Abrir no Gmail Web
                    </a>

                    {/* Outlook Web */}
                    <a
                      href={emailPackage.outlookWebUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        background: 'transparent',
                        border: `1px solid ${colors.border}`,
                        color: colors.textPrimary,
                        textDecoration: 'none',
                        padding: '11px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <ArrowUpRight size={15} />
                      Abrir no Outlook Web
                    </a>
                  </div>

                  {/* Registrar Candidatura */}
                  <button
                    onClick={handleRecordEmailApplication}
                    style={{
                      background: 'rgba(16, 185, 129, 0.12)',
                      border: '1px solid #10b981',
                      color: '#10b981',
                      padding: '11px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      marginTop: '4px'
                    }}
                  >
                    <CheckCircle2 size={16} />
                    Registrar Candidatura e Salvar no Histórico (Follow-up em 5 dias)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 2: DISPARO POR PREENCHIMENTO DE VAGAS (VAGA E REGIÃO DESEJADA)        */}
      {/* ========================================================================= */}
      {activeTab === 'form' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
          {/* COLUNA ESQUERDA: PARÂMETROS DO FORMULÁRIO */}
          <div 
            style={{
              background: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: '14px',
              padding: '22px',
              boxShadow: colors.shadowSm,
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: `1px solid ${colors.borderSubtle}`, paddingBottom: '12px' }}>
              <Zap size={18} style={{ color: colors.primary }} />
              <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: colors.textPrimary }}>
                2. Parâmetros de Auto-Inserção da Vaga
              </h3>
            </div>

            {/* Portal Alvo */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: colors.textSecondary, marginBottom: '6px' }}>
                Portal / Plataforma da Vaga
              </label>
              <select
                value={portal}
                onChange={e => setPortal(e.target.value as JobFormAutofillPortal)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: colors.inputBg,
                  border: `1px solid ${colors.border}`,
                  color: colors.inputText,
                  fontSize: '13px'
                }}
              >
                <option value="gupy">Gupy (Campos e Testes)</option>
                <option value="linkedin">LinkedIn Easy Apply (Candidatura Simplificada)</option>
                <option value="greenhouse">Greenhouse ATS</option>
                <option value="lever">Lever ATS</option>
                <option value="workday">Workday Enterprise</option>
                <option value="vagas_catho">Vagas.com / Catho</option>
                <option value="infojobs">InfoJobs</option>
                <option value="universal">Formulário Genérico / Qualquer Portal</option>
              </select>
            </div>

            {/* Link da Vaga */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: colors.textSecondary, marginBottom: '6px' }}>
                Link da Vaga (URL)
              </label>
              <input
                type="url"
                value={jobUrl}
                onChange={e => setJobUrl(e.target.value)}
                placeholder="https://empresa.gupy.io/job/... ou linkedin.com/jobs/view/..."
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: colors.inputBg,
                  border: `1px solid ${colors.border}`,
                  color: colors.inputText,
                  fontSize: '13px'
                }}
              />
            </div>

            {/* Descrição ou Requisitos da Vaga */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: colors.textSecondary, marginBottom: '6px' }}>
                Descrição dos Requisitos da Vaga (Opcional)
              </label>
              <textarea
                value={jobDescription}
                onChange={e => setJobDescription(e.target.value)}
                placeholder="Cole os requisitos da vaga para adaptar o resumo e as respostas de triagem com precisão..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: colors.inputBg,
                  border: `1px solid ${colors.border}`,
                  color: colors.inputText,
                  fontSize: '12px',
                  resize: 'vertical'
                }}
              />
            </div>

            {/* ADAPTAÇÃO REGIONAL ATIVA */}
            <div 
              style={{
                background: colors.primaryLight,
                border: `1px solid ${colors.borderFocus}`,
                borderRadius: '10px',
                padding: '14px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <MapPin size={16} style={{ color: colors.primary }} />
                <span style={{ fontSize: '12px', fontWeight: 700, color: colors.primary }}>
                  Região Selecionada: {currentRegion.city} - {currentRegion.state}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '11px', color: colors.textSecondary, lineHeight: 1.4 }}>
                O gerador vai calcular a pretensão salarial compatível com o custo da região, declarar residência/mobilidade local e redigir respostas eliminatórias para passar direto pelos filtros de localização do ATS.
              </p>
            </div>

            {/* BOTÃO GERAR PACOTE DE PREENCHIMENTO */}
            <button
              onClick={handleGenerateForm}
              disabled={isGeneratingForm}
              style={{
                background: 'linear-gradient(135deg, #9f1239 0%, #be123c 100%)',
                color: '#fff',
                border: 'none',
                padding: '14px',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: 700,
                cursor: isGeneratingForm ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 16px rgba(159, 18, 57, 0.35)',
                transition: 'all 0.2s',
                marginTop: '8px'
              }}
            >
              {isGeneratingForm ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  Gerando Pacote de Inserção por Vaga & Região...
                </>
              ) : (
                <>
                  <Zap size={18} />
                  Gerar Inserção Automática (Vaga & Região)
                </>
              )}
            </button>
          </div>

          {/* COLUNA DIREITA: CAMPOS DE INSERÇÃO, SCRIPT INJETOR E RESPOSTAS */}
          <div 
            style={{
              background: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: '14px',
              padding: '22px',
              boxShadow: colors.shadowSm,
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${colors.borderSubtle}`, paddingBottom: '12px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={18} style={{ color: colors.success }} />
                <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: colors.textPrimary }}>
                  3. Campos Prontos para Inserção no Formulário
                </h3>
              </div>
              {formPackage && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '11px', color: colors.textMuted }}>Match ATS:</span>
                  <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: colors.success, padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 700 }}>
                    {formPackage.atsMatchScore}%
                  </span>
                </div>
              )}
            </div>

            {formSavedToast && (
              <div 
                style={{
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid #10b981',
                  color: '#10b981',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 600,
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Check size={16} />
                {formSavedToast}
              </div>
            )}

            {!formPackage ? (
              <div 
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '60px 20px',
                  textAlign: 'center',
                  color: colors.textSecondary
                }}
              >
                <div 
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: colors.primaryLight,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: colors.primary,
                    marginBottom: '16px'
                  }}
                >
                  <Zap size={32} />
                </div>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', color: colors.textPrimary }}>
                  Nenhum pacote de formulário gerado
                </h4>
                <p style={{ margin: 0, fontSize: '13px', maxWidth: '360px', color: colors.textMuted }}>
                  Clique no botão <strong>"Gerar Inserção Automática (Vaga & Região)"</strong> para estruturar todos os campos com cópia em 1-clique e o script injetor automático de formulários.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* SCRIPT INJETOR DE 1-CLIQUE */}
                <div 
                  style={{
                    background: theme === 'dark' ? 'rgba(0, 0, 0, 0.45)' : 'rgba(0, 0, 0, 0.03)',
                    border: `1px solid ${colors.borderFocus}`,
                    borderRadius: '10px',
                    padding: '14px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Code size={16} style={{ color: colors.primary }} />
                      <span style={{ fontSize: '12px', fontWeight: 700, color: colors.textPrimary }}>
                        Script Injetor de 1-Clique (Console / Bookmarklet):
                      </span>
                    </div>
                    <button
                      onClick={() => copyToClipboard(formPackage.browserAutofillScript, () => {
                        setCopiedScript(true);
                        setTimeout(() => setCopiedScript(false), 2500);
                      })}
                      style={{
                        background: copiedScript ? colors.success : colors.primary,
                        color: '#fff',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      {copiedScript ? <Check size={13} /> : <Copy size={13} />}
                      {copiedScript ? 'Script Copiado!' : 'Copiar Script Injetor'}
                    </button>
                  </div>
                  <p style={{ margin: '0 0 8px 0', fontSize: '11px', color: colors.textMuted }}>
                    💡 <strong>Como usar:</strong> Abra a aba da vaga (Gupy, Greenhouse, LinkedIn, etc.), abra o Console do navegador (pressione F12 ou Inspecionar → Console), cole o script e aperte Enter. Todos os campos compatíveis serão preenchidos automaticamente com a vaga e região!
                  </p>
                </div>

                {/* FILTRO DE CATEGORIAS DE CAMPOS */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {['all', 'location', 'experience', 'summary', 'screening'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setActiveFormCategory(cat)}
                      style={{
                        background: activeFormCategory === cat ? colors.primaryLight : 'transparent',
                        color: activeFormCategory === cat ? colors.primary : colors.textSecondary,
                        border: `1px solid ${activeFormCategory === cat ? colors.borderFocus : colors.borderSubtle}`,
                        padding: '4px 10px',
                        borderRadius: '16px',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      {cat === 'all' && 'Todos os Campos'}
                      {cat === 'location' && 'Região & Localização'}
                      {cat === 'experience' && 'Cargo & Salário'}
                      {cat === 'summary' && 'Resumo & Carta'}
                      {cat === 'screening' && 'Perguntas de Triagem'}
                    </button>
                  ))}
                </div>

                {/* LISTA DE CAMPOS PARA COPIAR E COLAR */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '360px', overflowY: 'auto', paddingRight: '4px' }}>
                  {formPackage.fields
                    .filter(f => activeFormCategory === 'all' || f.category === activeFormCategory)
                    .map(field => {
                      const isCopied = copiedFieldId === field.id;
                      return (
                        <div
                          key={field.id}
                          style={{
                            background: colors.inputBg,
                            border: `1px solid ${colors.border}`,
                            borderRadius: '8px',
                            padding: '10px 12px'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 700, color: colors.textSecondary }}>
                              {field.label}
                            </span>
                            <button
                              onClick={() => copyToClipboard(field.value, () => {
                                setCopiedFieldId(field.id);
                                setTimeout(() => setCopiedFieldId(null), 2000);
                              })}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: isCopied ? colors.success : colors.primary,
                                fontSize: '11px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              {isCopied ? <Check size={12} /> : <Copy size={12} />}
                              {isCopied ? 'Copiado!' : 'Copiar'}
                            </button>
                          </div>
                          <div 
                            style={{ 
                              fontSize: '12px', 
                              fontWeight: 500, 
                              color: colors.textPrimary,
                              whiteSpace: field.value.length > 80 ? 'pre-wrap' : 'normal',
                              lineHeight: 1.4
                            }}
                          >
                            {field.value}
                          </div>
                          {field.tips && (
                            <div style={{ fontSize: '10px', color: colors.textMuted, marginTop: '3px' }}>
                              💡 {field.tips}
                            </div>
                          )}
                        </div>
                      );
                    })}

                  {/* PERGUNTAS DE TRIAGEM (SCREENING) */}
                  {(activeFormCategory === 'all' || activeFormCategory === 'screening') && formPackage.screeningAnswers.map((sc, sIdx) => {
                    const scId = `screening-${sIdx}`;
                    const isCopied = copiedFieldId === scId;
                    return (
                      <div
                        key={scId}
                        style={{
                          background: colors.primaryLight,
                          border: `1px solid ${colors.borderFocus}`,
                          borderRadius: '8px',
                          padding: '10px 12px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: colors.primary }}>
                            Pergunta de Triagem #{sIdx + 1}
                          </span>
                          <button
                            onClick={() => copyToClipboard(sc.answer, () => {
                              setCopiedFieldId(scId);
                              setTimeout(() => setCopiedFieldId(null), 2000);
                            })}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: isCopied ? colors.success : colors.primary,
                              fontSize: '11px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            {isCopied ? <Check size={12} /> : <Copy size={12} />}
                            {isCopied ? 'Copiada!' : 'Copiar Resposta'}
                          </button>
                        </div>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: colors.textSecondary, marginBottom: '4px' }}>
                          ❓ {sc.question}
                        </div>
                        <div style={{ fontSize: '12px', color: colors.textPrimary, lineHeight: 1.4 }}>
                          {sc.answer}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* BOTÃO REGISTRAR CANDIDATURA DE FORMULÁRIO */}
                <button
                  onClick={handleRecordFormApplication}
                  style={{
                    background: 'rgba(16, 185, 129, 0.12)',
                    border: '1px solid #10b981',
                    color: '#10b981',
                    padding: '12px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    marginTop: '8px'
                  }}
                >
                  <CheckCircle2 size={16} />
                  Salvar Candidatura no Painel de Vagas
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 3: HISTÓRICO & FILA DE DISPAROS REALIZADOS                            */}
      {/* ========================================================================= */}
      {activeTab === 'history' && (
        <div 
          style={{
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: '14px',
            padding: '24px',
            boxShadow: colors.shadowSm
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 4px 0', color: colors.textPrimary }}>
                Fila & Histórico de Disparos de Currículo
              </h3>
              <p style={{ margin: 0, fontSize: '13px', color: colors.textSecondary }}>
                Registro completo de todas as candidaturas disparadas por e-mail ou preenchidas por portal com rastreamento regional.
              </p>
            </div>

            {dispatchHistory.length > 0 && (
              <button
                onClick={() => {
                  if (window.confirm("Deseja realmente limpar o histórico de disparos?")) {
                    setDispatchHistory([]);
                  }
                }}
                style={{
                  background: 'transparent',
                  border: `1px solid ${colors.border}`,
                  color: colors.danger,
                  padding: '8px 14px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Trash2 size={14} />
                Limpar Histórico
              </button>
            )}
          </div>

          {/* MÉTRICAS RÁPIDAS DO DISPARADOR */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '24px' }}>
            <div style={{ background: colors.inputBg, border: `1px solid ${colors.border}`, borderRadius: '10px', padding: '14px' }}>
              <div style={{ fontSize: '11px', color: colors.textSecondary, fontWeight: 600 }}>TOTAL DISPARADO</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: colors.textPrimary, marginTop: '4px' }}>
                {dispatchHistory.length}
              </div>
            </div>
            <div style={{ background: colors.inputBg, border: `1px solid ${colors.border}`, borderRadius: '10px', padding: '14px' }}>
              <div style={{ fontSize: '11px', color: colors.textSecondary, fontWeight: 600 }}>DISPAROS POR E-MAIL</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: colors.primary, marginTop: '4px' }}>
                {dispatchHistory.filter(h => h.mode === 'email').length}
              </div>
            </div>
            <div style={{ background: colors.inputBg, border: `1px solid ${colors.border}`, borderRadius: '10px', padding: '14px' }}>
              <div style={{ fontSize: '11px', color: colors.textSecondary, fontWeight: 600 }}>AUTO-PREENCHIMENTO VAGAS</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: colors.success, marginTop: '4px' }}>
                {dispatchHistory.filter(h => h.mode === 'form').length}
              </div>
            </div>
            <div style={{ background: colors.inputBg, border: `1px solid ${colors.border}`, borderRadius: '10px', padding: '14px' }}>
              <div style={{ fontSize: '11px', color: colors.textSecondary, fontWeight: 600 }}>EMPRESA ALVO MAIS FREQUENTE</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: colors.textPrimary, marginTop: '8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {dispatchHistory[0]?.companyName || 'N/A'}
              </div>
            </div>
          </div>

          {/* TABELA / LISTA DE HISTÓRICO */}
          {dispatchHistory.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: colors.textMuted }}>
              <History size={36} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
              <p style={{ margin: 0, fontSize: '14px' }}>
                Nenhum disparo registrado ainda. Realize um disparo por e-mail ou preenchimento de vaga para começar a rastrear.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {dispatchHistory.map(record => (
                <div
                  key={record.id}
                  style={{
                    background: colors.inputBg,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '10px',
                    padding: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div 
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        background: record.mode === 'email' ? colors.primaryLight : 'rgba(16, 185, 129, 0.12)',
                        color: record.mode === 'email' ? colors.primary : colors.success,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      {record.mode === 'email' ? <Mail size={20} /> : <Zap size={20} />}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: colors.textPrimary }}>
                          {record.targetRole}
                        </span>
                        <span style={{ fontSize: '13px', color: colors.textSecondary }}>
                          na {record.companyName}
                        </span>
                        <span 
                          style={{
                            background: colors.surface,
                            border: `1px solid ${colors.border}`,
                            color: colors.textSecondary,
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: 600
                          }}
                        >
                          {record.destination}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px', fontSize: '12px', color: colors.textMuted }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <MapPin size={13} style={{ color: colors.primary }} />
                          {record.region}
                        </span>
                        <span>•</span>
                        <span>{record.date}</span>
                      </div>
                      {record.detailsSnippet && (
                        <div style={{ fontSize: '11px', color: colors.textSecondary, marginTop: '6px', fontStyle: 'italic' }}>
                          "{record.detailsSnippet}"
                        </div>
                      )}
                    </div>
                  </div>

                  <span 
                    style={{
                      background: 'rgba(16, 185, 129, 0.15)',
                      color: colors.success,
                      border: '1px solid #10b981',
                      padding: '4px 12px',
                      borderRadius: '14px',
                      fontSize: '11px',
                      fontWeight: 700
                    }}
                  >
                    {record.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CVAutoDispatcher;
