import React, { useState, useContext, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { CV, JobMatchAnalysis, JobAdjustmentSuggestion, JobAlignmentKeyword } from '../types';
import { analyzeJobAlignment } from '../services/geminiService';
import { ThemeContext } from '../ThemeContext';
import { 
  Sparkles, 
  Target, 
  CheckCircleIcon, 
  AlertTriangle, 
  Copy, 
  Download, 
  FileText, 
  Briefcase, 
  BuildingIcon, 
  TrendingUpIcon, 
  Clock, 
  Trash, 
  RefreshCw,
  Zap,
  ArrowRight,
  ShieldCheck,
  Check,
  AwardIcon
} from './icons';

interface JobMatchAnalyzerProps {
  onNavigateToTailoredCV?: (jobDescription: string, jobTitle: string) => void;
  initialJobDescription?: string;
  initialJobTitle?: string;
  initialCompany?: string;
}

// Preset real-world job descriptions for quick 1-click testing
const PRESET_JOBS = [
  {
    title: 'Tech Lead / Arquiteto Fullstack Sênior',
    company: 'Fintech Escala Latam',
    description: `Sobre a vaga:
Buscamos um Tech Lead / Arquiteto de Software Sênior para liderar nossos squads de pagamentos instantâneos e core banking.

Responsabilidades:
- Liderar tecnicamente a arquitetura de microsserviços distribuídos de alta volumetria (1M+ transações/dia).
- Definir padrões técnicos e guiar boas práticas de engenharia de software (DDD, TDD, Clean Architecture).
- Mentorear engenheiros plenos e seniores, elevando a maturidade técnica do time.
- Garantir observabilidade, resiliência e segurança de dados conforme normas de conformidade financeira (PCI-DSS, LGPD).

Requisitos Mandatórios:
- Domínio avançado em Node.js / TypeScript e ecossistema React.
- Vivência sólida com arquitetura em Nuvem (AWS ou GCP): Kubernetes, Docker, Terraform, SQS/Kafka e Redis.
- Experiência comprovada em bancos de dados relacionais (PostgreSQL) e NoSQL.
- Capacidade de comunicar decisões arquiteturais a stakeholders técnicos e de negócio.

Diferenciais:
- Certificações em Cloud (AWS Solutions Architect / GCP Professional).
- Vivência em ambiente bancário, pagamentos ou fintechs de alto crescimento.
- Familiaridade com esteiras de CI/CD automatizadas e práticas de DevSecOps.`
  },
  {
    title: 'Gerente de Produto Sênior (Senior PM)',
    company: 'SaaS Enterprise B2B',
    description: `Sobre a oportunidade:
Estamos contratando um(a) Senior Product Manager para liderar a evolução de nossa plataforma analítica B2B com foco em retenção e expansão de receita (NRR).

O que você fará:
- Definir a estratégia e o roadmap do produto, alinhando prioridades da empresa aos anseios dos clientes corporativos.
- Conduzir discovery contínuo, entrevistas com usuários C-Level e testes de hipóteses de validação de valor.
- Acompanhar métricas de produto (NPS, Churn, CAC, LTV, Adoção de Funcionalidades) e correlacioná-las a metas de receita.
- Liderar squad multidisciplinar (designers, engenheiros e dados) em rituais ágeis (Scrum/Kanban).

Requisitos:
- Experiência prévia comprovada gerindo produtos SaaS B2B de médio/grande porte.
- Forte mentalidade analítica baseada em dados (SQL intermediário, Mixpanel, Amplitude ou PowerBI).
- Excelente habilidade de comunicação interpessoal, facilitação e gestão de stakeholders complexos.
- Inglês avançado para reuniões com clientes internacionais e comitês executivos.

Diferenciais:
- Experiência em modelos de precificação e estratégias de Product-Led Growth (PLG).
- Conhecimento em integrações via API REST e webhooks enterprise.`
  },
  {
    title: 'Especialista em RH & People Analytics',
    company: 'Grupo Corporativo Nacional',
    description: `Sobre a vaga:
Buscamos um Especialista em Recursos Humanos com forte viés em People Analytics e Atração de Talentos Estratégicos.

Principais atribuições:
- Estruturar e monitorar indicadores estratégicos de RH (Turnover, Absenteísmo, Time-to-Hire, Custo por Contratação, eNPS).
- Liderar projetos de recrutamento e seleção para posições de liderança e tecnologia utilizando sistemas ATS (Gupy, Greenhouse, Workday).
- Desenvolver dashboards interativos de People Analytics em Power BI ou Tableau para apresentação à diretoria executiva.
- Propor ações de melhoria contínua na jornada do colaborador, desde a atração até o offboarding.

Requisitos:
- Formação superior completa em Administração, Psicologia, Gestão de RH ou áreas correlatas.
- Domínio em análise de dados aplicados a RH, Excel avançado e ferramentas de BI.
- Experiência sólida em processos seletivos de ponta a ponta e implantação de programas de employer branding.
- Conhecimento profundo em metodologias ágeis aplicadas a RH e legislação trabalhista brasileira.

Diferenciais:
- Pós-graduação ou certificação em People Analytics, Data Science ou Gestão Estratégica de Pessoas.
- Experiência anterior em consultorias de RH ou empresas com cultura de dados orientada a resultados.`
  }
];

export const JobMatchAnalyzer: React.FC<JobMatchAnalyzerProps> = ({ 
  onNavigateToTailoredCV,
  initialJobDescription = '',
  initialJobTitle = '',
  initialCompany = ''
}) => {
  const { colors, theme } = useContext(ThemeContext);
  const [cvs] = useLocalStorage<CV[]>('cvs', []);
  const [selectedCvId, setSelectedCvId] = useState<string>('');
  const [customCvContent, setCustomCvContent] = useState<string>('');
  const [useCustomCv, setUseCustomCv] = useState<boolean>(false);

  // Job Description Inputs
  const [jobDescription, setJobDescription] = useState<string>(initialJobDescription);
  const [targetRole, setTargetRole] = useState<string>(initialJobTitle);
  const [companyName, setCompanyName] = useState<string>(initialCompany);

  // Execution states
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisStepIndex, setAnalysisStepIndex] = useState<number>(0);
  const [analysisResult, setAnalysisResult] = useState<JobMatchAnalysis | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // UI tabs and controls
  const [activeTab, setActiveTab] = useState<'overview' | 'suggestions' | 'keywords' | 'gaps' | 'interview'>('overview');
  const [keywordFilter, setKeywordFilter] = useState<'all' | 'matched' | 'missing' | 'partial'>('all');
  const [completedQuickWins, setCompletedQuickWins] = useState<Record<number, boolean>>({});
  const [copySuccess, setCopySuccess] = useState<boolean>(false);

  // Local storage for history of analyses
  const [analysisHistory, setAnalysisHistory] = useLocalStorage<JobMatchAnalysis[]>('job_match_history', []);
  const [showHistory, setShowHistory] = useState<boolean>(false);

  // Auto-select first CV if available
  useEffect(() => {
    if (cvs.length > 0 && !selectedCvId && !useCustomCv) {
      setSelectedCvId(cvs[0].id);
    }
  }, [cvs, selectedCvId, useCustomCv]);

  // Animated steps during analysis
  const loadingSteps = [
    'Lendo e processando descrição da vaga...',
    'Varrendo competências, ferramentas e requisitos ATS...',
    'Auditando estrutura e realizações do seu currículo...',
    'Calculando compatibilidade nos 4 pilares de aderência...',
    'Formulando sugestões de ajuste na Fórmula XYZ...'
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isAnalyzing) {
      setAnalysisStepIndex(0);
      interval = setInterval(() => {
        setAnalysisStepIndex(prev => (prev < loadingSteps.length - 1 ? prev + 1 : prev));
      }, 1800);
    }
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  // Determine current active CV content
  const activeCvContent = useCustomCv
    ? customCvContent
    : (cvs.find(c => c.id === selectedCvId)?.content || '');

  const activeCvName = useCustomCv
    ? 'Currículo Customizado'
    : (cvs.find(c => c.id === selectedCvId)?.name || 'Currículo Selecionado');

  // Handle Paste from Clipboard
  const handlePasteClipboard = async () => {
    try {
      if (navigator.clipboard) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setJobDescription(text);
        }
      }
    } catch (err) {
      console.warn("Clipboard access not granted or unavailable", err);
    }
  };

  // Apply a preset
  const handleApplyPreset = (preset: typeof PRESET_JOBS[0]) => {
    setJobDescription(preset.description);
    setTargetRole(preset.title);
    setCompanyName(preset.company);
  };

  // Execute Analysis
  const handleRunAnalysis = async () => {
    if (!jobDescription.trim()) {
      setErrorMsg("Por favor, cole ou digite a descrição da vaga (Job Description).");
      return;
    }
    if (!activeCvContent.trim()) {
      setErrorMsg("Por favor, selecione ou informe o conteúdo do seu currículo para comparação.");
      return;
    }

    setErrorMsg(null);
    setIsAnalyzing(true);

    try {
      const result = await analyzeJobAlignment(
        activeCvContent,
        jobDescription,
        targetRole.trim() || undefined,
        companyName.trim() || undefined
      );

      result.cvNameAnalyzed = activeCvName;
      setAnalysisResult(result);
      setCompletedQuickWins({});
      setActiveTab('overview');

      // Save to history (keep last 15)
      setAnalysisHistory(prev => {
        const updated = [result, ...(prev.filter(item => item.id !== result.id))];
        return updated.slice(0, 15);
      });
    } catch (err: any) {
      console.error("Erro na análise de vaga:", err);
      setErrorMsg(err.message || "Erro ao analisar o alinhamento com a vaga. Verifique sua conexão e tente novamente.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Copy Analysis Report in clean Markdown
  const handleCopyReport = () => {
    if (!analysisResult) return;

    const report = `# Relatório de Alinhamento & Análise de Vaga - CV-AutoPilot
**Cargo Alvo:** ${analysisResult.jobTitle}
**Empresa:** ${analysisResult.companyName || 'Empresa Contratante'}
**Índice Geral de Compatibilidade:** ${analysisResult.overallMatchScore}%
**Veredito:** ${analysisResult.executiveVerdict}

## Resumo Diagnóstico
${analysisResult.verdictSummary}

## Pilares de Compatibilidade
- Hard Skills & Stack: ${analysisResult.alignmentPillars.hardSkillsScore}%
- Senioridade & Escopo: ${analysisResult.alignmentPillars.seniorityScore}%
- Formação & Certificações: ${analysisResult.alignmentPillars.educationScore}%
- Métricas & Impacto (Fórmula XYZ): ${analysisResult.alignmentPillars.businessImpactScore}%

## Pontos Fortes Alinhados
${analysisResult.matchedStrengths.map(s => `- ${s}`).join('\n')}

## Vulnerabilidades & Gaps
${analysisResult.criticalGaps.map(g => `- ${g}`).join('\n')}

## Sugestões de Ajuste & Fórmula XYZ
${analysisResult.adjustmentSuggestions.map(s => `### [${s.priority}] ${s.section}
**Diagnóstico:** ${s.diagnosis}
**Ação:** ${s.actionableStep}
${s.beforeExample ? `*Antes:* ${s.beforeExample}` : ''}
${s.afterExample ? `*Depois (Fórmula XYZ):* ${s.afterExample}` : ''}
`).join('\n')}

## Perguntas Prováveis na Entrevista
${analysisResult.interviewAnticipatedQuestions.map(q => `- **Pergunta:** ${q.question}
  *Motivo:* ${q.whyItWillBeAsked}
  *Estratégia:* ${q.suggestedAnswerStrategy}`).join('\n\n')}
`;

    navigator.clipboard.writeText(report);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2500);
  };

  // Export report as file download
  const handleDownloadReport = () => {
    if (!analysisResult) return;
    const content = `# Relatório de Alinhamento - ${analysisResult.jobTitle}\nData: ${new Date(analysisResult.timestamp).toLocaleString()}\n\n${analysisResult.verdictSummary}\n`;
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Analise_Vaga_${analysisResult.jobTitle.replace(/[^a-zA-Z0-9]/g, '_')}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Toggle quick win check
  const toggleQuickWin = (index: number) => {
    setCompletedQuickWins(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // Helper color for scores
  const getScoreColor = (score: number) => {
    if (score >= 80) return colors.success || '#059669';
    if (score >= 60) return '#d97706'; // amber
    return colors.danger || '#dc2626';
  };

  const getScoreBadgeText = (score: number) => {
    if (score >= 85) return 'Altíssimo Potencial ATS';
    if (score >= 70) return 'Boa Aderência (Ajustes Recomendados)';
    if (score >= 50) return 'Aderência Parcial (Gaps Relevantes)';
    return 'Baixa Aderência (Reestruturação Mandatória)';
  };

  // Filtered keywords
  const filteredKeywords = analysisResult?.keywordsAnalysis.filter(kw => {
    if (keywordFilter === 'all') return true;
    return kw.status === keywordFilter;
  }) || [];

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', paddingBottom: '60px' }}>
      {/* Header Banner */}
      <div 
        style={{
          backgroundColor: colors.surface,
          borderRadius: '16px',
          border: `1px solid ${colors.border}`,
          padding: 'clamp(14px, 2.5vw, 26px)',
          marginBottom: '20px',
          boxShadow: colors.shadow || '0 4px 20px rgba(0,0,0,0.06)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: '1 1 auto' }}>
            <div 
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #881337 0%, #4c0519 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 4px 12px rgba(136, 19, 55, 0.3)',
                flexShrink: 0
              }}
            >
              <Target size={22} style={{ marginRight: 0 }} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <h1 style={{ fontSize: 'clamp(17px, 2.2vw, 23px)', fontWeight: 800, color: colors.textPrimary, margin: 0, letterSpacing: '-0.02em', wordBreak: 'break-word' }}>
                  Analista de Vagas & Compatibilidade IA
                </h1>
                <span 
                  style={{
                    backgroundColor: colors.primaryLight || 'rgba(136, 19, 55, 0.1)',
                    color: colors.primary,
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '20px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    flexShrink: 0
                  }}
                >
                  Gemini 3.8 Flash
                </span>
              </div>
              <p style={{ margin: '4px 0 0 0', color: colors.textSecondary, fontSize: 'clamp(12px, 1.1vw, 13.5px)', lineHeight: 1.5, wordBreak: 'break-word' }}>
                Cole a descrição da vaga (Job Description) e execute uma auditoria instantânea de aderência aos requisitos ATS, com índice percentual, matriz de keywords e reescrita de conquistas na Fórmula XYZ.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {analysisHistory.length > 0 && (
              <button
                onClick={() => setShowHistory(!showHistory)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 15px',
                  borderRadius: '10px',
                  border: `1px solid ${colors.border}`,
                  backgroundColor: showHistory ? (colors.primaryLight || 'rgba(136,19,55,0.08)') : colors.background,
                  color: colors.textPrimary,
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <Clock size={16} />
                Histórico ({analysisHistory.length})
              </button>
            )}
            {analysisResult && (
              <button
                onClick={() => {
                  setAnalysisResult(null);
                  setJobDescription('');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 15px',
                  borderRadius: '10px',
                  border: `1px solid ${colors.border}`,
                  backgroundColor: colors.background,
                  color: colors.textSecondary,
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <RefreshCw size={14} />
                Nova Análise
              </button>
            )}
          </div>
        </div>

        {/* Saved Analyses History Drawer */}
        {showHistory && analysisHistory.length > 0 && (
          <div 
            style={{
              marginTop: '16px',
              padding: '16px',
              backgroundColor: colors.background,
              borderRadius: '12px',
              border: `1px solid ${colors.border}`
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: colors.textPrimary, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Análises Recentes Armazenadas
              </span>
              <button 
                onClick={() => setAnalysisHistory([])}
                style={{ background: 'none', border: 'none', color: colors.danger, fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Trash size={13} /> Limpar Histórico
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '10px' }}>
              {analysisHistory.map(item => (
                <div
                  key={item.id}
                  onClick={() => {
                    setAnalysisResult(item);
                    setShowHistory(false);
                  }}
                  style={{
                    padding: '12px',
                    borderRadius: '10px',
                    backgroundColor: colors.surface,
                    border: `1px solid ${colors.border}`,
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'border-color 0.2s'
                  }}
                >
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontWeight: 700, fontSize: '13px', color: colors.textPrimary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.jobTitle}
                    </div>
                    <div style={{ fontSize: '11px', color: colors.textSecondary }}>
                      {item.companyName || 'Empresa'} • {new Date(item.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                  <span 
                    style={{
                      fontSize: '13px',
                      fontWeight: 800,
                      color: getScoreColor(item.overallMatchScore),
                      padding: '4px 8px',
                      borderRadius: '8px',
                      backgroundColor: `${getScoreColor(item.overallMatchScore)}15`
                    }}
                  >
                    {item.overallMatchScore}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Dual Workspace: Left = Inputs & Configuration | Right = Live Analysis Results */}
      <div style={{ display: 'grid', gridTemplateColumns: analysisResult ? '400px 1fr' : '1fr', gap: '24px' }}>
        {/* Input Configuration Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Step 1: Base CV Selection */}
          <div 
            style={{
              backgroundColor: colors.surface,
              borderRadius: '14px',
              border: `1px solid ${colors.border}`,
              padding: '20px',
              boxShadow: colors.shadowSm || '0 2px 8px rgba(0,0,0,0.04)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span 
                  style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    backgroundColor: colors.primary,
                    color: colors.textOnPrimary,
                    fontSize: '12px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  1
                </span>
                <label style={{ fontSize: '14px', fontWeight: 700, color: colors.textPrimary }}>
                  Currículo do Candidato
                </label>
              </div>

              <button
                type="button"
                onClick={() => setUseCustomCv(!useCustomCv)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: colors.primary,
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                {useCustomCv ? 'Usar Currículo Salvo' : 'Digitar / Colar Outro CV'}
              </button>
            </div>

            {!useCustomCv ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <select
                  value={selectedCvId}
                  onChange={(e) => setSelectedCvId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    fontSize: '14px',
                    borderRadius: '10px',
                    border: `1px solid ${colors.border}`,
                    backgroundColor: colors.inputBg,
                    color: colors.inputText,
                    outline: 'none',
                    fontWeight: 500
                  }}
                  disabled={cvs.length === 0}
                >
                  {cvs.length === 0 ? (
                    <option value="">Nenhum currículo salvo encontrado</option>
                  ) : (
                    cvs.map(cv => (
                      <option key={cv.id} value={cv.id}>
                        {cv.name} ({cv.content.length} caracteres)
                      </option>
                    ))
                  )}
                </select>

                {cvs.length > 0 && selectedCvId && (
                  <div style={{ fontSize: '12px', color: colors.textSecondary, display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                    <ShieldCheck size={14} color={colors.success} />
                    Currículo ativo pronto para auditoria algorítmica.
                  </div>
                )}

                {cvs.length === 0 && (
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: colors.danger }}>
                    Você não possui currículos cadastrados. Alterne para "Digitar / Colar Outro CV" acima.
                  </p>
                )}
              </div>
            ) : (
              <div>
                <textarea
                  value={customCvContent}
                  onChange={(e) => setCustomCvContent(e.target.value)}
                  placeholder="Cole aqui o texto completo do currículo (Resumo, Experiências, Formação, Stacks)..."
                  rows={6}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    fontSize: '13px',
                    borderRadius: '10px',
                    border: `1px solid ${colors.border}`,
                    backgroundColor: colors.inputBg,
                    color: colors.inputText,
                    outline: 'none',
                    lineHeight: 1.5,
                    resize: 'vertical'
                  }}
                />
                <div style={{ fontSize: '11px', color: colors.textSecondary, marginTop: '4px', textAlign: 'right' }}>
                  {customCvContent.length} caracteres informados
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Job Description Input */}
          <div 
            style={{
              backgroundColor: colors.surface,
              borderRadius: '14px',
              border: `1px solid ${colors.border}`,
              padding: '20px',
              boxShadow: colors.shadowSm || '0 2px 8px rgba(0,0,0,0.04)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span 
                  style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    backgroundColor: colors.primary,
                    color: colors.textOnPrimary,
                    fontSize: '12px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  2
                </span>
                <label style={{ fontSize: '14px', fontWeight: 700, color: colors.textPrimary }}>
                  Descrição da Vaga (Job Description)
                </label>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={handlePasteClipboard}
                  style={{
                    background: 'none',
                    border: `1px solid ${colors.border}`,
                    borderRadius: '8px',
                    padding: '4px 8px',
                    color: colors.primary,
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  title="Colar da Área de Transferência"
                >
                  <Copy size={12} /> Colar
                </button>
                {jobDescription && (
                  <button
                    type="button"
                    onClick={() => {
                      setJobDescription('');
                      setTargetRole('');
                      setCompanyName('');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: colors.textSecondary,
                      fontSize: '11px',
                      cursor: 'pointer'
                    }}
                  >
                    Limpar
                  </button>
                )}
              </div>
            </div>

            {/* Quick Test Presets */}
            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: colors.textSecondary, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Exemplos de Vagas Reais para Teste Imediato:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {PRESET_JOBS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    style={{
                      padding: '5px 9px',
                      borderRadius: '8px',
                      fontSize: '11px',
                      fontWeight: 600,
                      backgroundColor: colors.background,
                      color: colors.textPrimary,
                      border: `1px solid ${colors.border}`,
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    ⚡ {preset.title.split('/')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Textarea for Job Description */}
            <div style={{ position: 'relative' }}>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Cole aqui o anúncio ou descrição da vaga com atribuições, requisitos obrigatórios, diferenciais e perfil desejado..."
                rows={analysisResult ? 8 : 12}
                style={{
                  width: '100%',
                  padding: '14px',
                  fontSize: '13px',
                  borderRadius: '10px',
                  border: `1px solid ${colors.border}`,
                  backgroundColor: colors.inputBg,
                  color: colors.inputText,
                  outline: 'none',
                  lineHeight: 1.5,
                  resize: 'vertical'
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: colors.textSecondary, marginTop: '4px' }}>
                <span>Recomendado: mínimo de 150 caracteres para precisão</span>
                <span>{jobDescription.length} caracteres</span>
              </div>
            </div>

            {/* Optional Metadata fields */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: colors.textSecondary, display: 'block', marginBottom: '4px' }}>
                  Cargo Alvo (Opcional)
                </label>
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="Ex: Tech Lead / Arquiteto"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '13px',
                    borderRadius: '8px',
                    border: `1px solid ${colors.border}`,
                    backgroundColor: colors.inputBg,
                    color: colors.inputText,
                    outline: 'none'
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: colors.textSecondary, display: 'block', marginBottom: '4px' }}>
                  Empresa (Opcional)
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Ex: Nubank, Itaú, Ambev"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '13px',
                    borderRadius: '8px',
                    border: `1px solid ${colors.border}`,
                    backgroundColor: colors.inputBg,
                    color: colors.inputText,
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div 
                style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(220, 38, 38, 0.1)',
                  border: `1px solid ${colors.danger || '#dc2626'}`,
                  color: colors.danger || '#dc2626',
                  fontSize: '12px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <AlertTriangle size={16} />
                {errorMsg}
              </div>
            )}

            {/* Run Analysis Action Button */}
            <button
              type="button"
              onClick={handleRunAnalysis}
              disabled={isAnalyzing || !jobDescription.trim()}
              style={{
                width: '100%',
                padding: '14px 20px',
                fontSize: '15px',
                fontWeight: 700,
                color: colors.textOnPrimary,
                backgroundColor: colors.primary,
                border: 'none',
                borderRadius: '10px',
                cursor: (isAnalyzing || !jobDescription.trim()) ? 'not-allowed' : 'pointer',
                opacity: (isAnalyzing || !jobDescription.trim()) ? 0.6 : 1,
                boxShadow: '0 4px 14px rgba(136, 19, 55, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                transition: 'all 0.2s'
              }}
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  <span>Analisando Alinhamento...</span>
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  <span>Analisar Alinhamento com IA</span>
                </>
              )}
            </button>

            {/* Loading Steps Indicator */}
            {isAnalyzing && (
              <div 
                style={{
                  padding: '14px',
                  borderRadius: '10px',
                  backgroundColor: colors.background,
                  border: `1px solid ${colors.border}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div 
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      backgroundColor: colors.primary,
                      boxShadow: `0 0 8px ${colors.primary}`
                    }}
                  />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: colors.textPrimary }}>
                    {loadingSteps[analysisStepIndex]}
                  </span>
                </div>
                <div 
                  style={{
                    height: '4px',
                    borderRadius: '2px',
                    backgroundColor: colors.border,
                    overflow: 'hidden'
                  }}
                >
                  <div 
                    style={{
                      height: '100%',
                      width: `${((analysisStepIndex + 1) / loadingSteps.length) * 100}%`,
                      backgroundColor: colors.primary,
                      transition: 'width 0.4s ease'
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Live Analysis Results Column */}
        {analysisResult && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Top Score & Executive Verdict Header Card */}
            <div 
              style={{
                backgroundColor: colors.surface,
                borderRadius: '16px',
                border: `1px solid ${colors.border}`,
                padding: '24px',
                boxShadow: colors.shadow || '0 4px 20px rgba(0,0,0,0.06)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
                {/* Score Dial & Badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <div 
                    style={{
                      width: '105px',
                      height: '105px',
                      borderRadius: '50%',
                      border: `6px solid ${getScoreColor(analysisResult.overallMatchScore)}`,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: `${getScoreColor(analysisResult.overallMatchScore)}10`,
                      flexShrink: 0
                    }}
                  >
                    <span style={{ fontSize: '32px', fontWeight: 900, color: getScoreColor(analysisResult.overallMatchScore), lineHeight: 1 }}>
                      {analysisResult.overallMatchScore}%
                    </span>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: colors.textSecondary, textTransform: 'uppercase', marginTop: '2px' }}>
                      Match ATS
                    </span>
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span 
                        style={{
                          fontSize: '12px',
                          fontWeight: 800,
                          padding: '3px 10px',
                          borderRadius: '12px',
                          backgroundColor: `${getScoreColor(analysisResult.overallMatchScore)}20`,
                          color: getScoreColor(analysisResult.overallMatchScore)
                        }}
                      >
                        {getScoreBadgeText(analysisResult.overallMatchScore)}
                      </span>
                      <span style={{ fontSize: '12px', color: colors.textSecondary }}>
                        Senioridade: <strong>{analysisResult.seniorityRequired}</strong>
                      </span>
                    </div>

                    <h2 style={{ fontSize: '20px', fontWeight: 800, color: colors.textPrimary, margin: '6px 0 4px 0' }}>
                      {analysisResult.jobTitle}
                    </h2>
                    <div style={{ fontSize: '13px', color: colors.textSecondary, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <BuildingIcon size={14} />
                      {analysisResult.companyName || 'Empresa Contratante'}
                      <span>•</span>
                      <span>CV Base: <strong>{analysisResult.cvNameAnalyzed || 'Seu Currículo'}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Quick Action Toolbar */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    onClick={handleCopyReport}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      border: `1px solid ${colors.border}`,
                      backgroundColor: copySuccess ? (colors.success || '#059669') : colors.background,
                      color: copySuccess ? '#ffffff' : colors.textPrimary,
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {copySuccess ? <Check size={14} /> : <Copy size={14} />}
                    {copySuccess ? 'Copiado!' : 'Copiar Relatório'}
                  </button>

                  <button
                    onClick={handleDownloadReport}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      border: `1px solid ${colors.border}`,
                      backgroundColor: colors.background,
                      color: colors.textPrimary,
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <Download size={14} />
                    Exportar
                  </button>

                  {onNavigateToTailoredCV && (
                    <button
                      onClick={() => onNavigateToTailoredCV(jobDescription, analysisResult.jobTitle)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 14px',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: colors.primary,
                        color: colors.textOnPrimary,
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      <Sparkles size={14} />
                      Otimizar Currículo Sob Medida
                    </button>
                  )}
                </div>
              </div>

              {/* Executive Summary Diagnosis */}
              <div 
                style={{
                  marginTop: '18px',
                  padding: '14px 18px',
                  borderRadius: '12px',
                  backgroundColor: colors.background,
                  border: `1px solid ${colors.border}`,
                  fontSize: '13px',
                  lineHeight: 1.6,
                  color: colors.textPrimary
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: '4px', color: colors.primary, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AwardIcon size={16} />
                  Diagnóstico do Analista Executivo:
                </div>
                {analysisResult.verdictSummary}
              </div>

              {/* The 4 Core Compatibility Pillars */}
              <div 
                style={{
                  marginTop: '20px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '12px'
                }}
              >
                {/* Pillar 1: Hard Skills */}
                <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: colors.background, border: `1px solid ${colors.border}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 600, color: colors.textSecondary }}>Hard Skills & Stack</span>
                    <strong style={{ color: getScoreColor(analysisResult.alignmentPillars.hardSkillsScore) }}>
                      {analysisResult.alignmentPillars.hardSkillsScore}%
                    </strong>
                  </div>
                  <div style={{ height: '6px', borderRadius: '3px', backgroundColor: colors.border, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${analysisResult.alignmentPillars.hardSkillsScore}%`, backgroundColor: getScoreColor(analysisResult.alignmentPillars.hardSkillsScore) }} />
                  </div>
                </div>

                {/* Pillar 2: Seniority */}
                <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: colors.background, border: `1px solid ${colors.border}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 600, color: colors.textSecondary }}>Senioridade & Liderança</span>
                    <strong style={{ color: getScoreColor(analysisResult.alignmentPillars.seniorityScore) }}>
                      {analysisResult.alignmentPillars.seniorityScore}%
                    </strong>
                  </div>
                  <div style={{ height: '6px', borderRadius: '3px', backgroundColor: colors.border, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${analysisResult.alignmentPillars.seniorityScore}%`, backgroundColor: getScoreColor(analysisResult.alignmentPillars.seniorityScore) }} />
                  </div>
                </div>

                {/* Pillar 3: Education & Certifications */}
                <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: colors.background, border: `1px solid ${colors.border}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 600, color: colors.textSecondary }}>Formação & Certificações</span>
                    <strong style={{ color: getScoreColor(analysisResult.alignmentPillars.educationScore) }}>
                      {analysisResult.alignmentPillars.educationScore}%
                    </strong>
                  </div>
                  <div style={{ height: '6px', borderRadius: '3px', backgroundColor: colors.border, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${analysisResult.alignmentPillars.educationScore}%`, backgroundColor: getScoreColor(analysisResult.alignmentPillars.educationScore) }} />
                  </div>
                </div>

                {/* Pillar 4: Business Impact */}
                <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: colors.background, border: `1px solid ${colors.border}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 600, color: colors.textSecondary }}>Impacto & Métricas XYZ</span>
                    <strong style={{ color: getScoreColor(analysisResult.alignmentPillars.businessImpactScore) }}>
                      {analysisResult.alignmentPillars.businessImpactScore}%
                    </strong>
                  </div>
                  <div style={{ height: '6px', borderRadius: '3px', backgroundColor: colors.border, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${analysisResult.alignmentPillars.businessImpactScore}%`, backgroundColor: getScoreColor(analysisResult.alignmentPillars.businessImpactScore) }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Wins Checklist (Actionable in 15 mins) */}
            {analysisResult.quickWins.length > 0 && (
              <div 
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: '14px',
                  border: `1px solid ${colors.border}`,
                  padding: '18px 22px',
                  boxShadow: colors.shadowSm || '0 2px 8px rgba(0,0,0,0.04)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <Zap size={18} color="#eab308" />
                  <h3 style={{ fontSize: '15px', fontWeight: 800, color: colors.textPrimary, margin: 0 }}>
                    Ajustes Rápidos de Alto Impacto (Quick Wins antes de enviar)
                  </h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {analysisResult.quickWins.map((win, idx) => (
                    <div 
                      key={idx}
                      onClick={() => toggleQuickWin(idx)}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        backgroundColor: completedQuickWins[idx] ? (colors.successLight || 'rgba(5, 150, 105, 0.08)') : colors.background,
                        border: `1px solid ${completedQuickWins[idx] ? (colors.success || '#059669') : colors.border}`,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div 
                        style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '4px',
                          border: `2px solid ${completedQuickWins[idx] ? (colors.success || '#059669') : colors.textSecondary}`,
                          backgroundColor: completedQuickWins[idx] ? (colors.success || '#059669') : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ffffff',
                          flexShrink: 0,
                          marginTop: '2px'
                        }}
                      >
                        {completedQuickWins[idx] && <Check size={12} />}
                      </div>
                      <span 
                        style={{
                          fontSize: '13px',
                          color: colors.textPrimary,
                          lineHeight: 1.4,
                          textDecoration: completedQuickWins[idx] ? 'line-through' : 'none',
                          opacity: completedQuickWins[idx] ? 0.75 : 1
                        }}
                      >
                        {win}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Analysis Navigation Tabs */}
            <div style={{ display: 'flex', gap: '4px', borderBottom: `1px solid ${colors.border}`, paddingBottom: '2px', overflowX: 'auto' }}>
              <button
                onClick={() => setActiveTab('overview')}
                style={{
                  padding: '10px 18px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderBottom: activeTab === 'overview' ? `3px solid ${colors.primary}` : '3px solid transparent',
                  color: activeTab === 'overview' ? colors.primary : colors.textSecondary,
                  fontWeight: activeTab === 'overview' ? 700 : 500,
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap'
                }}
              >
                <TrendingUpIcon size={16} /> Visão Geral & Pilares
              </button>

              <button
                onClick={() => setActiveTab('suggestions')}
                style={{
                  padding: '10px 18px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderBottom: activeTab === 'suggestions' ? `3px solid ${colors.primary}` : '3px solid transparent',
                  color: activeTab === 'suggestions' ? colors.primary : colors.textSecondary,
                  fontWeight: activeTab === 'suggestions' ? 700 : 500,
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap'
                }}
              >
                <Sparkles size={16} /> Sugestões & Fórmula XYZ ({analysisResult.adjustmentSuggestions.length})
              </button>

              <button
                onClick={() => setActiveTab('keywords')}
                style={{
                  padding: '10px 18px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderBottom: activeTab === 'keywords' ? `3px solid ${colors.primary}` : '3px solid transparent',
                  color: activeTab === 'keywords' ? colors.primary : colors.textSecondary,
                  fontWeight: activeTab === 'keywords' ? 700 : 500,
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap'
                }}
              >
                <FileText size={16} /> Keywords ATS ({analysisResult.keywordsAnalysis.length})
              </button>

              <button
                onClick={() => setActiveTab('gaps')}
                style={{
                  padding: '10px 18px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderBottom: activeTab === 'gaps' ? `3px solid ${colors.primary}` : '3px solid transparent',
                  color: activeTab === 'gaps' ? colors.primary : colors.textSecondary,
                  fontWeight: activeTab === 'gaps' ? 700 : 500,
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap'
                }}
              >
                <ShieldCheck size={16} /> Diferenciais vs. Gaps
              </button>

              <button
                onClick={() => setActiveTab('interview')}
                style={{
                  padding: '10px 18px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderBottom: activeTab === 'interview' ? `3px solid ${colors.primary}` : '3px solid transparent',
                  color: activeTab === 'interview' ? colors.primary : colors.textSecondary,
                  fontWeight: activeTab === 'interview' ? 700 : 500,
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap'
                }}
              >
                <Briefcase size={16} /> Perguntas na Entrevista ({analysisResult.interviewAnticipatedQuestions.length})
              </button>
            </div>

            {/* TAB CONTENT 1: Overview & Strengths */}
            {activeTab === 'overview' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {/* Strengths */}
                <div 
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: '14px',
                    border: `1px solid ${colors.border}`,
                    padding: '20px',
                    boxShadow: colors.shadowSm || 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                    <CheckCircleIcon size={18} color={colors.success || '#059669'} />
                    <h3 style={{ fontSize: '15px', fontWeight: 800, color: colors.textPrimary, margin: 0 }}>
                      Pontos Fortes de Alinhamento
                    </h3>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {analysisResult.matchedStrengths.map((str, idx) => (
                      <div 
                        key={idx}
                        style={{
                          padding: '12px 14px',
                          borderRadius: '10px',
                          backgroundColor: colors.background,
                          border: `1px solid ${colors.border}`,
                          fontSize: '13px',
                          color: colors.textPrimary,
                          lineHeight: 1.5,
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '10px'
                        }}
                      >
                        <span style={{ color: colors.success || '#059669', fontWeight: 800 }}>✓</span>
                        <span>{str}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Gaps */}
                <div 
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: '14px',
                    border: `1px solid ${colors.border}`,
                    padding: '20px',
                    boxShadow: colors.shadowSm || 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                    <AlertTriangle size={18} color={colors.danger || '#dc2626'} />
                    <h3 style={{ fontSize: '15px', fontWeight: 800, color: colors.textPrimary, margin: 0 }}>
                      Gaps Críticos & Vulnerabilidades ATS
                    </h3>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {analysisResult.criticalGaps.map((gap, idx) => (
                      <div 
                        key={idx}
                        style={{
                          padding: '12px 14px',
                          borderRadius: '10px',
                          backgroundColor: colors.background,
                          border: `1px solid ${colors.border}`,
                          fontSize: '13px',
                          color: colors.textPrimary,
                          lineHeight: 1.5,
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '10px'
                        }}
                      >
                        <span style={{ color: colors.danger || '#dc2626', fontWeight: 800 }}>⚠</span>
                        <span>{gap}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT 2: Suggestions & XYZ Formula */}
            {activeTab === 'suggestions' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {analysisResult.adjustmentSuggestions.map((sug, idx) => (
                  <div 
                    key={idx}
                    style={{
                      backgroundColor: colors.surface,
                      borderRadius: '14px',
                      border: `1px solid ${colors.border}`,
                      padding: '20px',
                      boxShadow: colors.shadowSm || 'none'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span 
                          style={{
                            fontSize: '11px',
                            fontWeight: 800,
                            padding: '3px 8px',
                            borderRadius: '6px',
                            backgroundColor: sug.priority === 'Crítica' ? 'rgba(220, 38, 38, 0.15)' : 'rgba(217, 119, 6, 0.15)',
                            color: sug.priority === 'Crítica' ? (colors.danger || '#dc2626') : '#d97706',
                            textTransform: 'uppercase'
                          }}
                        >
                          Prioridade {sug.priority}
                        </span>
                        <strong style={{ fontSize: '14px', color: colors.textPrimary }}>
                          Seção: {sug.section}
                        </strong>
                      </div>
                    </div>

                    <div style={{ fontSize: '13px', color: colors.textSecondary, marginBottom: '12px', lineHeight: 1.5 }}>
                      <strong>Diagnóstico:</strong> {sug.diagnosis}
                    </div>

                    <div style={{ fontSize: '13px', color: colors.textPrimary, marginBottom: '14px', lineHeight: 1.5 }}>
                      <strong>Ação Recomendada:</strong> {sug.actionableStep}
                    </div>

                    {/* Before vs After Comparison */}
                    {(sug.beforeExample || sug.afterExample) && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
                        {sug.beforeExample && (
                          <div 
                            style={{
                              padding: '12px',
                              borderRadius: '8px',
                              backgroundColor: 'rgba(220, 38, 38, 0.05)',
                              border: '1px solid rgba(220, 38, 38, 0.2)'
                            }}
                          >
                            <div style={{ fontSize: '11px', fontWeight: 700, color: colors.danger, textTransform: 'uppercase', marginBottom: '4px' }}>
                              ❌ Antes (Vago / Sem Métricas)
                            </div>
                            <div style={{ fontSize: '12px', color: colors.textPrimary, fontStyle: 'italic', lineHeight: 1.4 }}>
                              "{sug.beforeExample}"
                            </div>
                          </div>
                        )}

                        {sug.afterExample && (
                          <div 
                            style={{
                              padding: '12px',
                              borderRadius: '8px',
                              backgroundColor: 'rgba(5, 150, 105, 0.06)',
                              border: '1px solid rgba(5, 150, 105, 0.25)'
                            }}
                          >
                            <div style={{ fontSize: '11px', fontWeight: 700, color: colors.success, textTransform: 'uppercase', marginBottom: '4px' }}>
                              ✨ Depois (Fórmula XYZ da Google)
                            </div>
                            <div style={{ fontSize: '12px', color: colors.textPrimary, fontWeight: 500, lineHeight: 1.4 }}>
                              "{sug.afterExample}"
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* TAB CONTENT 3: Keywords Matrix */}
            {activeTab === 'keywords' && (
              <div 
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: '14px',
                  border: `1px solid ${colors.border}`,
                  padding: '20px',
                  boxShadow: colors.shadowSm || 'none'
                }}
              >
                {/* Keyword Filters */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: colors.textPrimary }}>
                    Palavras-Chave Obrigatórias & Relevância nos Filtros ATS
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    {(['all', 'matched', 'missing', 'partial'] as const).map(f => (
                      <button
                        key={f}
                        onClick={() => setKeywordFilter(f)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 600,
                          border: `1px solid ${colors.border}`,
                          backgroundColor: keywordFilter === f ? colors.primary : colors.background,
                          color: keywordFilter === f ? colors.textOnPrimary : colors.textSecondary,
                          cursor: 'pointer'
                        }}
                      >
                        {f === 'all' && 'Todas'}
                        {f === 'matched' && '✓ Presentes no CV'}
                        {f === 'missing' && '⚠️ Ausentes'}
                        {f === 'partial' && '⚡ Parciais'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Keywords Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                  {filteredKeywords.map((kw, idx) => (
                    <div 
                      key={idx}
                      style={{
                        padding: '14px',
                        borderRadius: '10px',
                        backgroundColor: colors.background,
                        border: `1px solid ${colors.border}`,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 800, fontSize: '14px', color: colors.textPrimary }}>
                          {kw.keyword}
                        </span>
                        <span 
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '10px',
                            backgroundColor: kw.status === 'matched' ? 'rgba(5, 150, 105, 0.15)' : (kw.status === 'missing' ? 'rgba(220, 38, 38, 0.15)' : 'rgba(217, 119, 6, 0.15)'),
                            color: kw.status === 'matched' ? colors.success : (kw.status === 'missing' ? colors.danger : '#d97706')
                          }}
                        >
                          {kw.status === 'matched' ? '✓ Presente' : (kw.status === 'missing' ? '✗ Ausente' : '⚡ Parcial')}
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: '6px', fontSize: '11px', color: colors.textSecondary }}>
                        <span>{kw.category}</span>
                        <span>•</span>
                        <span>Relevância: <strong>{kw.importance}</strong></span>
                      </div>

                      {kw.recommendation && (
                        <div style={{ fontSize: '12px', color: colors.textPrimary, marginTop: '4px', lineHeight: 1.4 }}>
                          💡 {kw.recommendation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB CONTENT 4: Differentials vs Gaps Deep Dive */}
            {activeTab === 'gaps' && (
              <div 
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: '14px',
                  border: `1px solid ${colors.border}`,
                  padding: '24px',
                  boxShadow: colors.shadowSm || 'none'
                }}
              >
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: colors.textPrimary, margin: '0 0 16px 0' }}>
                  Matriz Comparativa de Competitividade
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: 700, color: colors.success, margin: '0 0 10px 0' }}>
                      O que garante sua aprovação para a próxima fase:
                    </h4>
                    <ul style={{ margin: 0, paddingLeft: '20px', color: colors.textPrimary, fontSize: '13px', lineHeight: 1.6 }}>
                      {analysisResult.matchedStrengths.map((str, i) => (
                        <li key={i} style={{ marginBottom: '8px' }}>{str}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: 700, color: colors.danger, margin: '0 0 10px 0' }}>
                      Pontos que geram risco de reprovação ou questionamento:
                    </h4>
                    <ul style={{ margin: 0, paddingLeft: '20px', color: colors.textPrimary, fontSize: '13px', lineHeight: 1.6 }}>
                      {analysisResult.criticalGaps.map((gap, i) => (
                        <li key={i} style={{ marginBottom: '8px' }}>{gap}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT 5: Anticipated Interview Questions */}
            {activeTab === 'interview' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div 
                  style={{
                    padding: '16px 20px',
                    borderRadius: '12px',
                    backgroundColor: colors.surface,
                    border: `1px solid ${colors.border}`
                  }}
                >
                  <h3 style={{ fontSize: '15px', fontWeight: 800, color: colors.textPrimary, margin: '0 0 4px 0' }}>
                    Perguntas Prováveis da Banca Baseadas nos Seus Gaps
                  </h3>
                  <p style={{ margin: 0, fontSize: '13px', color: colors.textSecondary }}>
                    Recrutadores e gestores técnicos investigarão exatamente as lacunas entre a vaga e seu histórico. Prepare estas respostas com antecedência.
                  </p>
                </div>

                {analysisResult.interviewAnticipatedQuestions.map((q, idx) => (
                  <div 
                    key={idx}
                    style={{
                      backgroundColor: colors.surface,
                      borderRadius: '14px',
                      border: `1px solid ${colors.border}`,
                      padding: '20px',
                      boxShadow: colors.shadowSm || 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span 
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          backgroundColor: colors.primary,
                          color: colors.textOnPrimary,
                          fontSize: '12px',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {idx + 1}
                      </span>
                      <strong style={{ fontSize: '15px', color: colors.textPrimary }}>
                        "{q.question}"
                      </strong>
                    </div>

                    <div style={{ fontSize: '12px', color: colors.textSecondary, marginBottom: '10px', paddingLeft: '32px' }}>
                      <strong>Por que será perguntada:</strong> {q.whyItWillBeAsked}
                    </div>

                    <div 
                      style={{
                        marginLeft: '32px',
                        padding: '12px 14px',
                        borderRadius: '8px',
                        backgroundColor: colors.background,
                        border: `1px solid ${colors.border}`,
                        fontSize: '13px',
                        color: colors.textPrimary,
                        lineHeight: 1.5
                      }}
                    >
                      <strong style={{ color: colors.primary }}>🎯 Estratégia de Resposta STAR:</strong> {q.suggestedAnswerStrategy}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default JobMatchAnalyzer;
