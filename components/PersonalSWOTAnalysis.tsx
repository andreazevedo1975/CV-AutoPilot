import React, { useState, useEffect, useContext, useMemo, useRef } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  TrendingUp, 
  Zap, 
  Target, 
  FileText, 
  CheckCircle2, 
  Download, 
  Copy, 
  Sparkles, 
  RefreshCw, 
  Briefcase, 
  Layers, 
  Activity, 
  Check, 
  Calendar, 
  Award,
  ChevronRight,
  Filter,
  BarChart3,
  HelpCircle,
  Clock,
  ArrowUpRight,
  User,
  Search
} from 'lucide-react';
import { ThemeContext } from '../App';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { 
  Application, 
  ApplicationStatus, 
  CV, 
  GenerationHistoryItem, 
  InterviewSessionRecord,
  PersonalSWOTAnalysisResult,
  PersonalSWOTItem,
  CrossSWOTStrategy,
  PersonalSWOTActionPlanTask
} from '../types';
import { generatePersonalSWOTAnalysis } from '../services/geminiService';
import { exportPersonalSWOTPdf } from '../services/personalSwotPdfService';

interface PersonalSWOTAnalysisProps {
  onNavigateToCVManager?: () => void;
  onNavigateToApplications?: () => void;
}

export const PersonalSWOTAnalysis: React.FC<PersonalSWOTAnalysisProps> = ({
  onNavigateToCVManager,
  onNavigateToApplications
}) => {
  const { colors, theme } = useContext(ThemeContext);

  // Dados reais armazenados no aplicativo
  const [applications, setApplications] = useLocalStorage<Application[]>('applications', []);
  const [cvs, setCvs] = useLocalStorage<CV[]>('cvs', []);
  const [generationHistory] = useLocalStorage<GenerationHistoryItem[]>('generationHistory', []);
  const [interviewSessions] = useLocalStorage<InterviewSessionRecord[]>('interview_performance_history_v1', []);
  const [storedUserName, setStoredUserName] = useLocalStorage<string>('userName', '');

  // Estado da Análise SWOT
  const [swotResult, setSwotResult] = useLocalStorage<PersonalSWOTAnalysisResult | null>('personal_swot_analysis_v1', null);
  const [completedTaskIds, setCompletedTaskIds] = useLocalStorage<string[]>('swot_action_plan_completed_tasks_v1', []);

  // Filtros e controles de entrada
  const [selectedCvId, setSelectedCvId] = useState<string>('all');
  const [targetRoleInput, setTargetRoleInput] = useState<string>(() => {
    if (applications.length > 0 && applications[0].jobTitle) {
      return applications[0].jobTitle;
    }
    if (cvs.length > 0) {
      return cvs[0].name.replace(/curr[ií]culo/gi, '').trim() || 'Especialista / Liderança';
    }
    return 'Especialista / Gestor de Carreira';
  });
  const [candidateNameInput, setCandidateNameInput] = useState<string>(storedUserName || 'Profissional Executivo');
  const [strategicGoalInput, setStrategicGoalInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'matrix' | 'cross' | 'action_plan' | 'ats_pitch'>('matrix');
  const [filterImpact, setFilterImpact] = useState<'all' | 'critical' | 'high'>('all');
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [isConfigExpanded, setIsConfigExpanded] = useState<boolean>(false);

  // Se o usuário ainda não tiver nenhuma análise salva, gerar automaticamente a primeira análise uma única vez
  const hasAutoRunRef = useRef(false);
  useEffect(() => {
    if (!swotResult && !hasAutoRunRef.current) {
      hasAutoRunRef.current = true;
      handleRunSWOTAnalysis(false);
    }
  }, []);

  // Agregações de dados rápidos para os badges
  const pipelineMetrics = useMemo(() => {
    const total = applications.length;
    const interviews = applications.filter(a => a.status === ApplicationStatus.Entrevistando || a.status === ApplicationStatus.Oferta).length;
    const rejected = applications.filter(a => a.status === ApplicationStatus.Rejeitado).length;
    const ghosting = applications.filter(a => a.status === ApplicationStatus.Ignorado).length;
    const conversion = total > 0 ? Math.round((interviews / total) * 100) : 0;
    const ghostingRatio = total > 0 ? Math.round((ghosting / total) * 100) : 0;
    return { total, interviews, rejected, ghosting, conversion, ghostingRatio };
  }, [applications]);

  // Executar a análise com IA / Heurística
  const handleRunSWOTAnalysis = async (forceWithAi = true) => {
    setIsLoading(true);
    try {
      const activeCv = selectedCvId !== 'all' ? cvs.find(c => c.id === selectedCvId) : undefined;
      const filteredCvs = activeCv ? [activeCv] : cvs;

      const result = await generatePersonalSWOTAnalysis({
        candidateName: candidateNameInput || 'Profissional Executivo',
        targetRole: targetRoleInput || 'Posição de Liderança / Especialista',
        applications,
        cvs: filteredCvs,
        activeCvId: activeCv?.id,
        generationHistory,
        interviewSessions,
        focusNotes: strategicGoalInput
      });

      setSwotResult(result);
    } catch (error) {
      console.error('Erro ao gerar análise SWOT:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Carregar dados de exemplo realistas de pipeline caso o usuário deseje visualizar uma demonstração completa
  const handleLoadSampleScenario = () => {
    const sampleApps: Application[] = [
      {
        id: 'sample-app-1',
        jobTitle: 'Senior Full Stack Engineer / Tech Lead',
        companyName: 'Nubank',
        dateApplied: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString().split('T')[0],
        status: ApplicationStatus.Entrevistando,
        salaryExpectation: 'R$ 22.000',
        location: 'Remoto (Brasil)',
        notes: 'Feedback positivo na entrevista com RH. Alinhamento de cultura e liderança técnica. Marcada conversa técnica com Diretor de Engenharia.'
      },
      {
        id: 'sample-app-2',
        jobTitle: 'Staff Software Architect',
        companyName: 'Mercado Livre',
        dateApplied: new Date(Date.now() - 1000 * 60 * 60 * 24 * 18).toISOString().split('T')[0],
        status: ApplicationStatus.Rejeitado,
        salaryExpectation: 'R$ 25.000',
        location: 'São Paulo - Híbrido',
        notes: 'Descarte silencioso após teste automatizado de algoritmos. Possível incompatibilidade na exigência de certificação GoLang.'
      },
      {
        id: 'sample-app-3',
        jobTitle: 'Principal Engineer',
        companyName: 'Itaú Unibanco',
        dateApplied: new Date(Date.now() - 1000 * 60 * 60 * 24 * 25).toISOString().split('T')[0],
        status: ApplicationStatus.Ignorado,
        salaryExpectation: 'R$ 24.000',
        location: 'Híbrido SP',
        notes: 'Inscrição via Gupy. Sem feedback há mais de 20 dias (Ghosting típico de triagem inicial).'
      },
      {
        id: 'sample-app-4',
        jobTitle: 'Tech Lead Cloud & DevOps',
        companyName: 'Stone',
        dateApplied: new Date(Date.now() - 1000 * 60 * 60 * 24 * 35).toISOString().split('T')[0],
        status: ApplicationStatus.Entrevistando,
        salaryExpectation: 'R$ 21.000',
        location: 'Remoto',
        notes: 'Aprovado na primeira fase. Elogiaram experiência com arquitetura distribuída e métricas de redução de latência.'
      },
      {
        id: 'sample-app-5',
        jobTitle: 'Senior Engineering Manager',
        companyName: 'QuintoAndar',
        dateApplied: new Date(Date.now() - 1000 * 60 * 60 * 24 * 40).toISOString().split('T')[0],
        status: ApplicationStatus.Rejeitado,
        salaryExpectation: 'R$ 26.000',
        location: 'Remoto',
        notes: 'Feedback que buscavam alguém com maior ênfase em gestão de pessoas do que foco técnico.'
      },
      {
        id: 'sample-app-6',
        jobTitle: 'Tech Specialist / Full Stack',
        companyName: 'PicPay',
        dateApplied: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString().split('T')[0],
        status: ApplicationStatus.Oferta,
        salaryExpectation: 'R$ 23.000',
        location: 'Remoto',
        notes: 'Oferta recebida formalmente! Excelente pacote de benefícios e bônus anual.'
      }
    ];

    setApplications(sampleApps);
    setTargetRoleInput('Senior Full Stack Engineer / Tech Lead');
    setCandidateNameInput(storedUserName || 'André Azevedo (Candidato Executivo)');

    setTimeout(() => {
      handleRunSWOTAnalysis(false);
    }, 100);
  };

  // Alternar conclusão de tarefa no checklist do plano de ação
  const handleToggleTask = (taskId: string) => {
    setCompletedTaskIds(prev => 
      prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
    );
  };

  // Exportar PDF
  const handleExportPdf = () => {
    if (!swotResult) return;
    exportPersonalSWOTPdf({
      swot: swotResult,
      candidateName: candidateNameInput,
      targetRole: targetRoleInput,
      themeColorHex: colors.primary
    });
  };

  // Copiar resumo em formato Markdown para clipboard
  const handleCopyMarkdown = () => {
    if (!swotResult) return;
    let md = `# Análise SWOT Pessoal de Carreira - ${swotResult.candidateName}\n`;
    md += `**Cargo Alvo:** ${swotResult.targetRole} | **Data:** ${new Date(swotResult.generatedAt).toLocaleDateString('pt-BR')}\n\n`;
    md += `## Diagnóstico Geral\n${swotResult.executiveSummary}\n\n`;
    md += `### Métricas de Pipeline\n`;
    md += `- Saúde Geral: ${swotResult.metrics.overallHealthScore}/100\n`;
    md += `- Competitividade: ${swotResult.metrics.competitivenessIndex}%\n`;
    md += `- Conversão em Entrevistas: ${swotResult.metrics.conversionRate}%\n`;
    md += `- Vulnerabilidade ATS: ${swotResult.metrics.atsVulnerabilityScore}%\n\n`;

    md += `## 1. Forças (Strengths)\n`;
    swotResult.strengths.forEach(s => {
      md += `### ${s.title}\n${s.description}\n- *Evidência:* ${s.evidenceSource}\n- *Ação Tática:* ${s.strategicAction}\n\n`;
    });

    md += `## 2. Fraquezas (Weaknesses)\n`;
    swotResult.weaknesses.forEach(w => {
      md += `### ${w.title}\n${w.description}\n- *Evidência:* ${w.evidenceSource}\n- *Ação Tática:* ${w.strategicAction}\n\n`;
    });

    md += `## 3. Oportunidades (Opportunities)\n`;
    swotResult.opportunities.forEach(o => {
      md += `### ${o.title}\n${o.description}\n- *Evidência:* ${o.evidenceSource}\n- *Ação Tática:* ${o.strategicAction}\n\n`;
    });

    md += `## 4. Ameaças (Threats)\n`;
    swotResult.threats.forEach(t => {
      md += `### ${t.title}\n${t.description}\n- *Evidência:* ${t.evidenceSource}\n- *Ação Tática:* ${t.strategicAction}\n\n`;
    });

    md += `## Estratégias Cruzadas (SO, WO, ST, WT)\n`;
    swotResult.crossStrategies.forEach(c => {
      md += `### [${c.quadrant}] ${c.title}\n${c.description}\n- Prioridade: ${c.priority} | ROI: ${c.expectedROI}\n`;
      c.tacticalSteps.forEach(step => md += `  - ${step}\n`);
      md += '\n';
    });

    navigator.clipboard.writeText(md);
    setCopyFeedback('Matriz SWOT copiada em formato Markdown!');
    setTimeout(() => setCopyFeedback(null), 3000);
  };

  // Cálculo de progresso do checklist
  const allTasksCount = useMemo(() => {
    if (!swotResult?.actionPlan) return 0;
    return swotResult.actionPlan.reduce((acc, phase) => acc + phase.tasks.length, 0);
  }, [swotResult]);

  const completedCount = useMemo(() => {
    if (!swotResult?.actionPlan) return 0;
    return swotResult.actionPlan.reduce((acc, phase) => {
      return acc + phase.tasks.filter(t => completedTaskIds.includes(t.id)).length;
    }, 0);
  }, [swotResult, completedTaskIds]);

  const progressPercent = allTasksCount > 0 ? Math.round((completedCount / allTasksCount) * 100) : 0;

  // Filtragem de itens por nível de impacto
  const filterItems = (items: PersonalSWOTItem[]) => {
    if (filterImpact === 'all') return items;
    if (filterImpact === 'critical') return items.filter(i => i.impactLevel === 'critical');
    return items.filter(i => i.impactLevel === 'critical' || i.impactLevel === 'high');
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1440px', margin: '0 auto', color: colors.textPrimary }}>
      
      {/* ============================================================ */}
      {/* TOPO EXECUTIVO: TÍTULO, SUBTÍTULO E BARRA DE STATUS         */}
      {/* ============================================================ */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        marginBottom: '20px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: `linear-gradient(135deg, ${colors.primary} 0%, #be123c 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 16px rgba(136, 19, 55, 0.3)'
            }}>
              <CompassIcon size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
                  Análise SWOT Pessoal de Carreira
                </h1>
                <span style={{
                  padding: '3px 8px',
                  borderRadius: '100px',
                  fontSize: '11px',
                  fontWeight: 700,
                  backgroundColor: `${colors.primary}20`,
                  color: colors.primary,
                  border: `1px solid ${colors.primary}40`,
                  textTransform: 'uppercase'
                }}>
                  Inteligência Estratégica IA
                </span>
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: colors.textSecondary }}>
                Diagnóstico de Forças, Fraquezas, Oportunidades e Ameaças cruzando seu histórico real de candidaturas e currículos.
              </p>
            </div>
          </div>
        </div>

        {/* Botões de Ação Principal */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => handleRunSWOTAnalysis(true)}
            disabled={isLoading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              borderRadius: '8px',
              backgroundColor: colors.primary,
              color: '#ffffff',
              border: 'none',
              fontWeight: 700,
              fontSize: '13px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 10px rgba(136, 19, 55, 0.3)',
              opacity: isLoading ? 0.7 : 1,
              transition: 'all 0.2s ease'
            }}
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            {isLoading ? 'Auditando Pipeline com IA...' : 'Atualizar SWOT com IA'}
          </button>

          <button
            onClick={handleExportPdf}
            disabled={!swotResult}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 14px',
              borderRadius: '8px',
              backgroundColor: colors.surfaceElevated,
              color: colors.textPrimary,
              border: `1px solid ${colors.headerBorder}`,
              fontWeight: 600,
              fontSize: '13px',
              cursor: !swotResult ? 'not-allowed' : 'pointer',
              opacity: !swotResult ? 0.5 : 1
            }}
            title="Exportar Relatório Executivo Completo em PDF A4"
          >
            <Download size={16} />
            Exportar PDF
          </button>

          <button
            onClick={handleCopyMarkdown}
            disabled={!swotResult}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 14px',
              borderRadius: '8px',
              backgroundColor: colors.surfaceElevated,
              color: colors.textPrimary,
              border: `1px solid ${colors.headerBorder}`,
              fontWeight: 600,
              fontSize: '13px',
              cursor: !swotResult ? 'not-allowed' : 'pointer',
              opacity: !swotResult ? 0.5 : 1
            }}
            title="Copiar estrutura em texto formatado para anotações"
          >
            {copyFeedback ? <Check size={16} style={{ color: colors.success }} /> : <Copy size={16} />}
            {copyFeedback ? 'Copiado!' : 'Copiar'}
          </button>

          <button
            onClick={() => setIsConfigExpanded(!isConfigExpanded)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 12px',
              borderRadius: '8px',
              backgroundColor: isConfigExpanded ? `${colors.primary}18` : colors.surfaceElevated,
              color: isConfigExpanded ? colors.primary : colors.textSecondary,
              border: `1px solid ${isConfigExpanded ? colors.primary : colors.headerBorder}`,
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer'
            }}
            title="Ajustar dados do candidato e parâmetros de análise"
          >
            <Filter size={16} />
            Calibrar Foco
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* DRAWER / PAINEL DE CONFIGURAÇÃO DE ENTRADA                  */}
      {/* ============================================================ */}
      {isConfigExpanded && (
        <div style={{
          backgroundColor: colors.surfaceElevated,
          border: `1px solid ${colors.headerBorder}`,
          borderRadius: '12px',
          padding: '18px 20px',
          marginBottom: '20px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: colors.textPrimary, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <SlidersIcon size={16} style={{ color: colors.primary }} />
              Calibração de Dados de Entrada da Auditoria SWOT
            </span>
            <button
              onClick={handleLoadSampleScenario}
              style={{
                background: 'none',
                border: 'none',
                color: colors.primary,
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                textDecoration: 'underline'
              }}
            >
              <Sparkles size={13} />
              Carregar Cenário Demonstrativo Executivo
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: colors.textSecondary, marginBottom: '5px' }}>
                Nome do Candidato
              </label>
              <input
                type="text"
                value={candidateNameInput}
                onChange={(e) => {
                  setCandidateNameInput(e.target.value);
                  setStoredUserName(e.target.value);
                }}
                placeholder="Ex: Dra. Valéria / André Azevedo"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '7px',
                  backgroundColor: colors.inputBg,
                  color: colors.inputText,
                  border: `1px solid ${colors.headerBorder}`,
                  fontSize: '13px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: colors.textSecondary, marginBottom: '5px' }}>
                Cargo / Especialidade Alvo
              </label>
              <input
                type="text"
                value={targetRoleInput}
                onChange={(e) => setTargetRoleInput(e.target.value)}
                placeholder="Ex: Tech Lead / Arquiteto de Software"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '7px',
                  backgroundColor: colors.inputBg,
                  color: colors.inputText,
                  border: `1px solid ${colors.headerBorder}`,
                  fontSize: '13px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: colors.textSecondary, marginBottom: '5px' }}>
                Currículo Base a Analisar
              </label>
              <select
                value={selectedCvId}
                onChange={(e) => setSelectedCvId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '7px',
                  backgroundColor: colors.inputBg,
                  color: colors.inputText,
                  border: `1px solid ${colors.headerBorder}`,
                  fontSize: '13px',
                  boxSizing: 'border-box'
                }}
              >
                <option value="all">Todos os Currículos Registrados ({cvs.length})</option>
                {cvs.map(cv => (
                  <option key={cv.id} value={cv.id}>
                    {cv.name} ({cv.yearsOfExperience ? `${cv.yearsOfExperience} anos` : 'Geral'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: colors.textSecondary, marginBottom: '5px' }}>
                Objetivo Estratégico Prioritário (Opcional)
              </label>
              <input
                type="text"
                value={strategicGoalInput}
                onChange={(e) => setStrategicGoalInput(e.target.value)}
                placeholder="Ex: Aumentar conversão para vagas remotas em dólar"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '7px',
                  backgroundColor: colors.inputBg,
                  color: colors.inputText,
                  border: `1px solid ${colors.headerBorder}`,
                  fontSize: '13px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* CARDS DE MÉTRICAS KPI E INTEGRAÇÃO COM PIPELINE REAL        */}
      {/* ============================================================ */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '14px',
        marginBottom: '22px'
      }}>
        {/* Saúde Geral */}
        <div style={{
          backgroundColor: colors.surfaceElevated,
          border: `1px solid ${colors.headerBorder}`,
          borderRadius: '10px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: colors.textSecondary }}>Saúde Geral de Carreira</span>
            <Activity size={18} style={{ color: colors.success }} />
          </div>
          <div style={{ marginTop: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span style={{ fontSize: '28px', fontWeight: 800, color: colors.textPrimary }}>
                {swotResult?.metrics.overallHealthScore ?? 75}
              </span>
              <span style={{ fontSize: '13px', color: colors.textSecondary }}>/ 100</span>
            </div>
            <div style={{ width: '100%', height: '6px', backgroundColor: `${colors.success}20`, borderRadius: '3px', marginTop: '6px', overflow: 'hidden' }}>
              <div style={{
                width: `${swotResult?.metrics.overallHealthScore ?? 75}%`,
                height: '100%',
                backgroundColor: colors.success,
                borderRadius: '3px'
              }} />
            </div>
          </div>
          <span style={{ fontSize: '11px', color: colors.textSecondary, marginTop: '8px' }}>
            Score integrado de conversão e ativos
          </span>
        </div>

        {/* Competitividade */}
        <div style={{
          backgroundColor: colors.surfaceElevated,
          border: `1px solid ${colors.headerBorder}`,
          borderRadius: '10px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: colors.textSecondary }}>Índice de Competitividade</span>
            <Target size={18} style={{ color: '#3b82f6' }} />
          </div>
          <div style={{ marginTop: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span style={{ fontSize: '28px', fontWeight: 800, color: colors.textPrimary }}>
                {swotResult?.metrics.competitivenessIndex ?? 82}%
              </span>
            </div>
            <div style={{ width: '100%', height: '6px', backgroundColor: '#3b82f620', borderRadius: '3px', marginTop: '6px', overflow: 'hidden' }}>
              <div style={{
                width: `${swotResult?.metrics.competitivenessIndex ?? 82}%`,
                height: '100%',
                backgroundColor: '#3b82f6',
                borderRadius: '3px'
              }} />
            </div>
          </div>
          <span style={{ fontSize: '11px', color: colors.textSecondary, marginTop: '8px' }}>
            {cvs.length} currículos e portfólios avaliados
          </span>
        </div>

        {/* Conversão em Entrevistas */}
        <div style={{
          backgroundColor: colors.surfaceElevated,
          border: `1px solid ${colors.headerBorder}`,
          borderRadius: '10px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: colors.textSecondary }}>Conversão em Entrevistas</span>
            <Briefcase size={18} style={{ color: colors.primary }} />
          </div>
          <div style={{ marginTop: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={{ fontSize: '28px', fontWeight: 800, color: colors.textPrimary }}>
                {pipelineMetrics.conversion}%
              </span>
              <span style={{ fontSize: '12px', color: colors.primary, fontWeight: 600 }}>
                ({pipelineMetrics.interviews} de {pipelineMetrics.total})
              </span>
            </div>
            <div style={{ width: '100%', height: '6px', backgroundColor: `${colors.primary}20`, borderRadius: '3px', marginTop: '6px', overflow: 'hidden' }}>
              <div style={{
                width: `${Math.min(100, pipelineMetrics.conversion * 2.5)}%`,
                height: '100%',
                backgroundColor: colors.primary,
                borderRadius: '3px'
              }} />
            </div>
          </div>
          <span style={{ fontSize: '11px', color: colors.textSecondary, marginTop: '8px' }}>
            {pipelineMetrics.total === 0 ? 'Sem dados de candidaturas ainda' : `${pipelineMetrics.rejected} negativas mapeadas`}
          </span>
        </div>

        {/* Vulnerabilidade ATS */}
        <div style={{
          backgroundColor: colors.surfaceElevated,
          border: `1px solid ${colors.headerBorder}`,
          borderRadius: '10px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: colors.textSecondary }}>Vulnerabilidade ATS / Ghosting</span>
            <AlertTriangle size={18} style={{ color: '#f43f5e' }} />
          </div>
          <div style={{ marginTop: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={{ fontSize: '28px', fontWeight: 800, color: colors.textPrimary }}>
                {swotResult?.metrics.atsVulnerabilityScore ?? 35}%
              </span>
              <span style={{ fontSize: '12px', color: '#f43f5e', fontWeight: 600 }}>
                ({pipelineMetrics.ghostingRatio}% ghosting)
              </span>
            </div>
            <div style={{ width: '100%', height: '6px', backgroundColor: '#f43f5e20', borderRadius: '3px', marginTop: '6px', overflow: 'hidden' }}>
              <div style={{
                width: `${swotResult?.metrics.atsVulnerabilityScore ?? 35}%`,
                height: '100%',
                backgroundColor: '#f43f5e',
                borderRadius: '3px'
              }} />
            </div>
          </div>
          <span style={{ fontSize: '11px', color: colors.textSecondary, marginTop: '8px' }}>
            Risco de descarte em filtros Gupy/Workday
          </span>
        </div>
      </div>

      {/* ============================================================ */}
      {/* SUMÁRIO DIAGNÓSTICO EXECUTIVO 360°                           */}
      {/* ============================================================ */}
      {swotResult?.executiveSummary && (
        <div style={{
          backgroundColor: `${colors.primary}0c`,
          border: `1px solid ${colors.primary}35`,
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '22px',
          display: 'flex',
          gap: '14px',
          alignItems: 'flex-start'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            backgroundColor: `${colors.primary}20`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: colors.primary,
            flexShrink: 0,
            marginTop: '2px'
          }}>
            <Sparkles size={18} />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '14px', fontWeight: 700, color: colors.textPrimary }}>
              Diagnóstico Estratégico 360° do Perfil
            </h3>
            <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.6', color: colors.textSecondary }}>
              {swotResult.executiveSummary}
            </p>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* NAVEGAÇÃO DE ABAS DO MÓDULO                                 */}
      {/* ============================================================ */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: `1px solid ${colors.headerBorder}`,
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab('matrix')}
            style={{
              padding: '10px 18px',
              fontSize: '13px',
              fontWeight: 700,
              backgroundColor: activeTab === 'matrix' ? `${colors.primary}18` : 'transparent',
              color: activeTab === 'matrix' ? colors.primary : colors.textSecondary,
              border: 'none',
              borderBottom: activeTab === 'matrix' ? `2px solid ${colors.primary}` : '2px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <BarChart3 size={16} />
            Matriz SWOT (4 Quadrantes)
          </button>

          <button
            onClick={() => setActiveTab('cross')}
            style={{
              padding: '10px 18px',
              fontSize: '13px',
              fontWeight: 700,
              backgroundColor: activeTab === 'cross' ? `${colors.primary}18` : 'transparent',
              color: activeTab === 'cross' ? colors.primary : colors.textSecondary,
              border: 'none',
              borderBottom: activeTab === 'cross' ? `2px solid ${colors.primary}` : '2px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Layers size={16} />
            Estratégias Cruzadas (SO • WO • ST • WT)
          </button>

          <button
            onClick={() => setActiveTab('action_plan')}
            style={{
              padding: '10px 18px',
              fontSize: '13px',
              fontWeight: 700,
              backgroundColor: activeTab === 'action_plan' ? `${colors.primary}18` : 'transparent',
              color: activeTab === 'action_plan' ? colors.primary : colors.textSecondary,
              border: 'none',
              borderBottom: activeTab === 'action_plan' ? `2px solid ${colors.primary}` : '2px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Calendar size={16} />
            Plano de Ação Tático ({progressPercent}% Concluído)
          </button>

          <button
            onClick={() => setActiveTab('ats_pitch')}
            style={{
              padding: '10px 18px',
              fontSize: '13px',
              fontWeight: 700,
              backgroundColor: activeTab === 'ats_pitch' ? `${colors.primary}18` : 'transparent',
              color: activeTab === 'ats_pitch' ? colors.primary : colors.textSecondary,
              border: 'none',
              borderBottom: activeTab === 'ats_pitch' ? `2px solid ${colors.primary}` : '2px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Award size={16} />
            Blindagem ATS & Pitch
          </button>
        </div>

        {/* Filtro de Impacto (visível na aba matriz) */}
        {activeTab === 'matrix' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingBottom: '6px' }}>
            <span style={{ fontSize: '12px', color: colors.textSecondary, fontWeight: 600 }}>Filtrar Impacto:</span>
            {(['all', 'critical', 'high'] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => setFilterImpact(lvl)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 600,
                  backgroundColor: filterImpact === lvl ? colors.primary : colors.surfaceElevated,
                  color: filterImpact === lvl ? '#ffffff' : colors.textSecondary,
                  border: `1px solid ${colors.headerBorder}`,
                  cursor: 'pointer'
                }}
              >
                {lvl === 'all' ? 'Todos' : lvl === 'critical' ? 'Apenas Críticos' : 'Alta / Crítica'}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* ABA 1: MATRIZ SWOT VISUAL (4 QUADRANTES)                    */}
      {/* ============================================================ */}
      {activeTab === 'matrix' && swotResult && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
          gap: '20px'
        }}>
          {/* QUADRANTE 1: FORÇAS (STRENGTHS) */}
          <div style={{
            backgroundColor: colors.surfaceElevated,
            borderRadius: '12px',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
            overflow: 'hidden'
          }}>
            <div style={{
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              borderBottom: '1px solid rgba(16, 185, 129, 0.25)',
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={20} style={{ color: '#10b981' }} />
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#10b981' }}>
                  FORÇAS (STRENGTHS)
                </h3>
              </div>
              <span style={{
                padding: '2px 8px',
                borderRadius: '100px',
                fontSize: '11px',
                fontWeight: 700,
                backgroundColor: 'rgba(16, 185, 129, 0.2)',
                color: '#10b981'
              }}>
                {swotResult.strengths.length} Mapeadas
              </span>
            </div>

            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {filterItems(swotResult.strengths).map((item) => (
                <SWOTItemCard key={item.id} item={item} accentColor="#10b981" colors={colors} />
              ))}
            </div>
          </div>

          {/* QUADRANTE 2: FRAQUEZAS (WEAKNESSES) */}
          <div style={{
            backgroundColor: colors.surfaceElevated,
            borderRadius: '12px',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
            overflow: 'hidden'
          }}>
            <div style={{
              backgroundColor: 'rgba(244, 63, 94, 0.12)',
              borderBottom: '1px solid rgba(244, 63, 94, 0.25)',
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={20} style={{ color: '#f43f5e' }} />
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#f43f5e' }}>
                  FRAQUEZAS (WEAKNESSES)
                </h3>
              </div>
              <span style={{
                padding: '2px 8px',
                borderRadius: '100px',
                fontSize: '11px',
                fontWeight: 700,
                backgroundColor: 'rgba(244, 63, 94, 0.2)',
                color: '#f43f5e'
              }}>
                {swotResult.weaknesses.length} Gargalos
              </span>
            </div>

            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {filterItems(swotResult.weaknesses).map((item) => (
                <SWOTItemCard key={item.id} item={item} accentColor="#f43f5e" colors={colors} />
              ))}
            </div>
          </div>

          {/* QUADRANTE 3: OPORTUNIDADES (OPPORTUNITIES) */}
          <div style={{
            backgroundColor: colors.surfaceElevated,
            borderRadius: '12px',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
            overflow: 'hidden'
          }}>
            <div style={{
              backgroundColor: 'rgba(59, 130, 246, 0.12)',
              borderBottom: '1px solid rgba(59, 130, 246, 0.25)',
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={20} style={{ color: '#3b82f6' }} />
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#3b82f6' }}>
                  OPORTUNIDADES (OPPORTUNITIES)
                </h3>
              </div>
              <span style={{
                padding: '2px 8px',
                borderRadius: '100px',
                fontSize: '11px',
                fontWeight: 700,
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                color: '#3b82f6'
              }}>
                {swotResult.opportunities.length} Alavancas
              </span>
            </div>

            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {filterItems(swotResult.opportunities).map((item) => (
                <SWOTItemCard key={item.id} item={item} accentColor="#3b82f6" colors={colors} />
              ))}
            </div>
          </div>

          {/* QUADRANTE 4: AMEAÇAS (THREATS) */}
          <div style={{
            backgroundColor: colors.surfaceElevated,
            borderRadius: '12px',
            border: '1px solid rgba(168, 85, 247, 0.3)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
            overflow: 'hidden'
          }}>
            <div style={{
              backgroundColor: 'rgba(168, 85, 247, 0.12)',
              borderBottom: '1px solid rgba(168, 85, 247, 0.25)',
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Zap size={20} style={{ color: '#a855f7' }} />
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#a855f7' }}>
                  AMEAÇAS (THREATS)
                </h3>
              </div>
              <span style={{
                padding: '2px 8px',
                borderRadius: '100px',
                fontSize: '11px',
                fontWeight: 700,
                backgroundColor: 'rgba(168, 85, 247, 0.2)',
                color: '#a855f7'
              }}>
                {swotResult.threats.length} Riscos
              </span>
            </div>

            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {filterItems(swotResult.threats).map((item) => (
                <SWOTItemCard key={item.id} item={item} accentColor="#a855f7" colors={colors} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* ABA 2: ESTRATÉGIAS CRUZADAS (MATRIZ SO, WO, ST, WT)         */}
      {/* ============================================================ */}
      {activeTab === 'cross' && swotResult && (
        <div>
          <div style={{ marginBottom: '16px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 6px 0' }}>
              Matriz Cruzada de Ação Estratégica (Metodologia Clássica de Carreira)
            </h2>
            <p style={{ margin: 0, fontSize: '13px', color: colors.textSecondary }}>
              Cruzamento sistemático entre fatores internos (Forças e Fraquezas) e fatores externos de mercado (Oportunidades e Ameaças) para definir sua postura competitiva.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '18px' }}>
            {swotResult.crossStrategies.map((strat) => {
              const quadrantBadgeColor = 
                strat.quadrant === 'SO' ? '#10b981' :
                strat.quadrant === 'WO' ? '#3b82f6' :
                strat.quadrant === 'ST' ? '#f59e0b' : '#f43f5e';

              return (
                <div
                  key={strat.id}
                  style={{
                    backgroundColor: colors.surfaceElevated,
                    borderRadius: '12px',
                    border: `1px solid ${colors.headerBorder}`,
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.05)'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 800,
                        backgroundColor: `${quadrantBadgeColor}20`,
                        color: quadrantBadgeColor,
                        border: `1px solid ${quadrantBadgeColor}40`
                      }}>
                        {strat.quadrantName}
                      </span>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: colors.textSecondary }}>
                        {strat.priority}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 10px 0', color: colors.textPrimary }}>
                      {strat.title}
                    </h3>

                    <p style={{ fontSize: '13px', color: colors.textSecondary, lineHeight: '1.6', margin: '0 0 14px 0' }}>
                      {strat.description}
                    </p>

                    <div style={{ marginBottom: '14px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: colors.textPrimary, textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                        Passos Táticos Executáveis:
                      </span>
                      <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: colors.textSecondary, lineHeight: '1.7' }}>
                        {strat.tacticalSteps.map((step, idx) => (
                          <li key={idx}>{step}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div style={{
                    backgroundColor: `${colors.primary}0a`,
                    borderTop: `1px solid ${colors.primary}20`,
                    padding: '10px 12px',
                    borderRadius: '8px',
                    marginTop: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <TrendingUp size={16} style={{ color: colors.primary, flexShrink: 0 }} />
                    <span style={{ fontSize: '11px', color: colors.textPrimary, fontWeight: 600 }}>
                      Retorno Projetado (ROI): {strat.expectedROI}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* ABA 3: PLANO DE AÇÃO TÁTICO PRIORIZADO (CHECKLIST COM PROGRESSO) */}
      {/* ============================================================ */}
      {activeTab === 'action_plan' && swotResult && (
        <div>
          <div style={{
            backgroundColor: colors.surfaceElevated,
            borderRadius: '12px',
            border: `1px solid ${colors.headerBorder}`,
            padding: '18px 22px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px'
          }}>
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: 800, margin: '0 0 4px 0' }}>
                Cronograma de Ação Estratégica (90 Dias de Tração)
              </h2>
              <p style={{ margin: 0, fontSize: '13px', color: colors.textSecondary }}>
                Tarefas divididas por horizonte temporal. Marque as caixas para salvar o progresso da sua evolução.
              </p>
            </div>

            <div style={{ minWidth: '220px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                <span>Progresso Executivo:</span>
                <span style={{ color: colors.primary }}>{completedCount} de {allTasksCount} tarefas ({progressPercent}%)</span>
              </div>
              <div style={{ width: '100%', height: '8px', backgroundColor: `${colors.primary}20`, borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{
                  width: `${progressPercent}%`,
                  height: '100%',
                  backgroundColor: colors.primary,
                  borderRadius: '4px',
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
            {swotResult.actionPlan.map((phase, pIdx) => (
              <div
                key={pIdx}
                style={{
                  backgroundColor: colors.surfaceElevated,
                  borderRadius: '12px',
                  border: `1px solid ${colors.headerBorder}`,
                  overflow: 'hidden'
                }}
              >
                <div style={{
                  backgroundColor: `${colors.primary}12`,
                  borderBottom: `1px solid ${colors.headerBorder}`,
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: colors.textPrimary }}>
                      {phase.timeframe}
                    </h3>
                    <span style={{ fontSize: '12px', color: colors.textSecondary, marginTop: '2px', display: 'block' }}>
                      Foco: {phase.focus}
                    </span>
                  </div>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '6px',
                    backgroundColor: colors.surface,
                    color: colors.textPrimary,
                    border: `1px solid ${colors.headerBorder}`
                  }}>
                    {phase.tasks.filter(t => completedTaskIds.includes(t.id)).length}/{phase.tasks.length} Realizadas
                  </span>
                </div>

                <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {phase.tasks.map((task) => {
                    const isDone = completedTaskIds.includes(task.id);
                    return (
                      <div
                        key={task.id}
                        onClick={() => handleToggleTask(task.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '12px',
                          padding: '12px 14px',
                          borderRadius: '8px',
                          backgroundColor: isDone ? `${colors.success}0c` : colors.surface,
                          border: `1px solid ${isDone ? `${colors.success}35` : colors.headerBorder}`,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '5px',
                          border: `2px solid ${isDone ? colors.success : colors.textSecondary}`,
                          backgroundColor: isDone ? colors.success : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ffffff',
                          flexShrink: 0,
                          marginTop: '2px'
                        }}>
                          {isDone && <Check size={14} />}
                        </div>

                        <div style={{ flex: 1 }}>
                          <span style={{
                            fontSize: '13px',
                            color: isDone ? colors.textSecondary : colors.textPrimary,
                            textDecoration: isDone ? 'line-through' : 'none',
                            lineHeight: '1.5',
                            display: 'block'
                          }}>
                            {task.text}
                          </span>
                        </div>

                        <span style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          textTransform: 'uppercase',
                          backgroundColor: task.impact === 'crítica' ? 'rgba(244, 63, 94, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                          color: task.impact === 'crítica' ? '#f43f5e' : '#3b82f6'
                        }}>
                          {task.impact}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* ABA 4: BLINDAGEM CONTRA ATS & ELEVATOR PITCH REESTRUTURADO  */}
      {/* ============================================================ */}
      {activeTab === 'ats_pitch' && swotResult && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
          
          {/* Elevator Pitch Executivo */}
          <div style={{
            backgroundColor: colors.surfaceElevated,
            borderRadius: '12px',
            border: `1px solid ${colors.headerBorder}`,
            padding: '22px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.05)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Award size={20} style={{ color: colors.primary }} />
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>
                Elevator Pitch de Posicionamento (30 Segundos)
              </h3>
            </div>
            <p style={{ fontSize: '13px', color: colors.textSecondary, marginBottom: '14px' }}>
              Texto de apresentação executiva reformulado a partir das forças e diferenciais identificados na SWOT. Ideal para o "Sobre" do LinkedIn ou introdução de entrevistas.
            </p>

            <div style={{
              backgroundColor: colors.inputBg,
              border: `1px solid ${colors.headerBorder}`,
              borderRadius: '8px',
              padding: '16px',
              position: 'relative'
            }}>
              <p style={{
                margin: 0,
                fontSize: '13px',
                lineHeight: '1.7',
                color: colors.inputText,
                fontStyle: 'italic'
              }}>
                "{swotResult.pitchPositioningStatement}"
              </p>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(swotResult.pitchPositioningStatement);
                  setCopyFeedback('Pitch copiado!');
                  setTimeout(() => setCopyFeedback(null), 2500);
                }}
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  background: 'none',
                  border: 'none',
                  color: colors.primary,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '11px',
                  fontWeight: 600
                }}
              >
                <Copy size={13} />
                Copiar Pitch
              </button>
            </div>
          </div>

          {/* Recomendações Críticas para Vencer o ATS */}
          <div style={{
            backgroundColor: colors.surfaceElevated,
            borderRadius: '12px',
            border: `1px solid ${colors.headerBorder}`,
            padding: '22px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.05)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <ShieldCheck size={20} style={{ color: colors.success }} />
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>
                5 Regras de Ouro para Blindagem Contra Filtros de ATS
              </h3>
            </div>
            <p style={{ fontSize: '13px', color: colors.textSecondary, marginBottom: '14px' }}>
              Diretrizes indispensáveis para evitar descarte automático pelos algoritmos da Gupy, Workday, Taleo e Greenhouse.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {swotResult.atsRecommendations.map((rec, rIdx) => (
                <div
                  key={rIdx}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    backgroundColor: colors.surface,
                    border: `1px solid ${colors.headerBorder}`
                  }}
                >
                  <span style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    backgroundColor: `${colors.success}20`,
                    color: colors.success,
                    fontSize: '11px',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {rIdx + 1}
                  </span>
                  <span style={{ fontSize: '12px', color: colors.textPrimary, lineHeight: '1.5' }}>
                    {rec}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* RODAPÉ DO MÓDULO COM ATALHOS RÁPIDOS                         */}
      {/* ============================================================ */}
      <div style={{
        marginTop: '32px',
        paddingTop: '18px',
        borderTop: `1px solid ${colors.headerBorder}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <span style={{ fontSize: '12px', color: colors.textSecondary }}>
          CV-AutoPilot Enterprise • Análise SWOT Pessoal orientada a dados reais de conversão e métricas de mercado.
        </span>

        <div style={{ display: 'flex', gap: '10px' }}>
          {onNavigateToCVManager && (
            <button
              onClick={onNavigateToCVManager}
              style={{
                background: 'none',
                border: 'none',
                color: colors.primary,
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <FileText size={14} />
              Ajustar Currículo no Gerenciador
            </button>
          )}

          {onNavigateToApplications && (
            <button
              onClick={onNavigateToApplications}
              style={{
                background: 'none',
                border: 'none',
                color: colors.primary,
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Briefcase size={14} />
              Ver Pipeline de Candidaturas
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Componente auxiliar para renderizar cada card de item da Matriz SWOT
interface SWOTItemCardProps {
  item: PersonalSWOTItem;
  accentColor: string;
  colors: any;
}

const SWOTItemCard: React.FC<SWOTItemCardProps> = ({ item, accentColor, colors }) => {
  return (
    <div style={{
      backgroundColor: colors.surface,
      borderRadius: '8px',
      border: `1px solid ${colors.headerBorder}`,
      padding: '14px',
      borderLeft: `4px solid ${accentColor}`,
      boxShadow: '0 1px 4px rgba(0,0,0,0.02)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
        <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: colors.textPrimary }}>
          {item.title}
        </h4>
        <span style={{
          fontSize: '10px',
          fontWeight: 800,
          textTransform: 'uppercase',
          padding: '2px 6px',
          borderRadius: '4px',
          backgroundColor: item.impactLevel === 'critical' ? 'rgba(244, 63, 94, 0.15)' : 'rgba(100, 116, 139, 0.15)',
          color: item.impactLevel === 'critical' ? '#f43f5e' : colors.textSecondary
        }}>
          {item.impactLevel}
        </span>
      </div>

      <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: colors.textSecondary, lineHeight: '1.5' }}>
        {item.description}
      </p>

      {/* Evidência real do histórico */}
      <div style={{
        fontSize: '11px',
        color: colors.textSecondary,
        backgroundColor: colors.surfaceElevated,
        padding: '6px 8px',
        borderRadius: '6px',
        marginBottom: '10px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}>
        <span style={{ fontWeight: 700, color: colors.textPrimary }}>Evidência:</span>
        <span>{item.evidenceSource}</span>
      </div>

      {/* Ação Tática Recomendada */}
      <div style={{
        fontSize: '12px',
        fontWeight: 600,
        color: accentColor,
        backgroundColor: `${accentColor}0e`,
        padding: '8px 10px',
        borderRadius: '6px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '6px'
      }}>
        <ArrowUpRight size={15} style={{ flexShrink: 0, marginTop: '2px' }} />
        <span>{item.strategicAction}</span>
      </div>

      {/* Tags */}
      {item.tags && item.tags.length > 0 && (
        <div style={{ display: 'flex', gap: '5px', marginTop: '8px', flexWrap: 'wrap' }}>
          {item.tags.map((tag, tIdx) => (
            <span
              key={tIdx}
              style={{
                fontSize: '10px',
                padding: '1px 6px',
                borderRadius: '4px',
                backgroundColor: colors.surfaceElevated,
                color: colors.textSecondary,
                border: `1px solid ${colors.headerBorder}`
              }}
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

// Ícone de bússola estilizado
const CompassIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
  </svg>
);

// Ícone de Sliders
const SlidersIcon: React.FC<{ size?: number; style?: React.CSSProperties }> = ({ size = 20, style }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    style={style}
  >
    <line x1="4" y1="21" x2="4" y2="14" />
    <line x1="4" y1="10" x2="4" y2="3" />
    <line x1="12" y1="21" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12" y2="3" />
    <line x1="20" y1="21" x2="20" y2="16" />
    <line x1="20" y1="12" x2="20" y2="3" />
    <line x1="1" y1="14" x2="7" y2="14" />
    <line x1="9" y1="8" x2="15" y2="8" />
    <line x1="17" y1="16" x2="23" y2="16" />
  </svg>
);

export default PersonalSWOTAnalysis;
