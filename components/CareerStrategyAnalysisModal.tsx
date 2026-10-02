import React, { useState } from 'react';
import {
  Compass,
  X,
  Sparkles,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  CheckCircle2,
  Copy,
  Check,
  RefreshCw,
  FileText,
  Target,
  Users,
  ShieldCheck,
  Calendar,
  Layers,
  ChevronRight,
  ExternalLink,
  HelpCircle,
  Clock,
  Briefcase
} from 'lucide-react';
import { CareerStrategyAnalysisResult } from '../types';

interface CareerStrategyAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  colors: any;
  analysis: CareerStrategyAnalysisResult | null;
  isLoading: boolean;
  onRefresh: () => void;
}

export const CareerStrategyAnalysisModal: React.FC<CareerStrategyAnalysisModalProps> = ({
  isOpen,
  onClose,
  colors,
  analysis,
  isLoading,
  onRefresh
}) => {
  const [activeTab, setActiveTab] = useState<'patterns' | 'cv-tactics' | 'targeting' | 'plan-30' | 'ats'>('patterns');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopySummary = () => {
    if (!analysis) return;
    const { overallDiagnosis, rejectionPatterns, cvTacticalAdjustments, targetingTacticalAdjustments, actionPlan30Days } = analysis;

    let text = `========================================================\n`;
    text += `CV-AUTOPILOT: ANÁLISE DE ESTRATÉGIA & DIAGNÓSTICO DE NEGATIVAS\n`;
    text += `========================================================\n\n`;
    text += `DIAGNÓSTICO: ${overallDiagnosis.headline}\n`;
    text += `ESTÁGIO: ${overallDiagnosis.stageVerdict} (Score: ${overallDiagnosis.funnelEfficiencyScore}/100)\n`;
    text += `GARGALO PRINCIPAL: ${overallDiagnosis.primaryBottleneck}\n\n`;
    text += `RESUMO EXECUTIVO:\n${overallDiagnosis.summaryText}\n\n`;

    text += `--------------------------------------------------------\n`;
    text += `PADRÕES DETECTADOS NAS NEGATIVAS:\n`;
    text += `--------------------------------------------------------\n`;
    rejectionPatterns.forEach((p, idx) => {
      text += `[${idx + 1}] ${p.patternType} (Severidade: ${p.severity.toUpperCase()})\n`;
      text += `Observação: ${p.observation}\n`;
      if (p.affectedCompaniesSample && p.affectedCompaniesSample.length > 0) {
        text += `Empresas afetadas: ${p.affectedCompaniesSample.join(', ')}\n`;
      }
      text += `Correção Tática: ${p.suggestedCorrection}\n\n`;
    });

    text += `--------------------------------------------------------\n`;
    text += `AJUSTES TÁTICOS NO CURRÍCULO (CV):\n`;
    text += `--------------------------------------------------------\n`;
    cvTacticalAdjustments.forEach((cv, idx) => {
      text += `[${idx + 1}] ${cv.title} [Impacto: ${cv.impact.toUpperCase()}]\n`;
      text += `Problema: ${cv.problemIdentified}\n`;
      text += `Ação: ${cv.solutionAction}\n`;
      if (cv.exampleOrTemplate) {
        text += `Exemplo / Modelo: ${cv.exampleOrTemplate}\n`;
      }
      text += `\n`;
    });

    text += `--------------------------------------------------------\n`;
    text += `AJUSTES NO FOCO DAS CANDIDATURAS:\n`;
    text += `--------------------------------------------------------\n`;
    targetingTacticalAdjustments.forEach((t, idx) => {
      text += `[${idx + 1}] ${t.title} [Impacto: ${t.impact.toUpperCase()}]\n`;
      text += `Problema: ${t.problemIdentified}\n`;
      text += `Ação: ${t.solutionAction}\n`;
      if (t.exampleOrTemplate) {
        text += `Exemplo: ${t.exampleOrTemplate}\n`;
      }
      text += `\n`;
    });

    text += `--------------------------------------------------------\n`;
    text += `PLANO TÁTICO DE 30 DIAS:\n`;
    text += `--------------------------------------------------------\n`;
    actionPlan30Days.forEach(w => {
      text += `${w.week}: ${w.focus}\n`;
      w.tasks.forEach(task => {
        text += `  • ${task}\n`;
      });
      text += `\n`;
    });

    text += `Gerado pelo CV-AutoPilot com IA Gemini 3.8 Flash em ${new Date().toLocaleDateString('pt-BR')}.\n`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case 'critical':
        return { label: 'Impacto Crítico', bg: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', border: 'rgba(239, 68, 68, 0.25)' };
      case 'high':
        return { label: 'Alto Impacto', bg: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', border: 'rgba(245, 158, 11, 0.25)' };
      default:
        return { label: 'Médio Impacto', bg: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6', border: 'rgba(59, 130, 246, 0.25)' };
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'high':
        return { label: 'Severidade Alta', bg: 'rgba(239, 68, 68, 0.12)', color: '#ef4444' };
      case 'medium':
        return { label: 'Severidade Média', bg: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' };
      default:
        return { label: 'Severidade Baixa', bg: 'rgba(16, 185, 129, 0.12)', color: '#10b981' };
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          backgroundColor: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: '16px',
          width: '100%',
          maxWidth: '920px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden',
          color: colors.textPrimary
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: `1px solid ${colors.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: colors.surfaceHover || 'rgba(136, 19, 55, 0.03)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                backgroundColor: 'rgba(136, 19, 55, 0.12)',
                color: colors.primary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: `1px solid ${colors.border}`
              }}
            >
              <Compass style={{ width: '22px', height: '22px' }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: colors.textPrimary }}>
                  Análise de Estratégia de Candidaturas
                </h3>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(136, 19, 55, 0.15)',
                    color: colors.primary,
                    border: `1px solid ${colors.border}`
                  }}
                >
                  IA Gemini 3.8 Flash
                </span>
              </div>
              <p style={{ margin: '3px 0 0 0', fontSize: '12.5px', color: colors.textSecondary }}>
                Exame algorítmico do padrão mensal de negativas, diagnóstico de gargalos e ajustes táticos
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 12px',
                fontSize: '12px',
                fontWeight: 600,
                borderRadius: '8px',
                border: `1px solid ${colors.border}`,
                backgroundColor: colors.surface,
                color: colors.textSecondary,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s ease'
              }}
              title="Executar nova auditoria com a IA"
            >
              <RefreshCw style={{ width: '13px', height: '13px', animation: isLoading ? 'spin 1s linear infinite' : 'none' }} />
              <span>{isLoading ? 'Analisando...' : 'Re-analisar'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                border: `1px solid ${colors.border}`,
                backgroundColor: 'transparent',
                color: colors.textSecondary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <X style={{ width: '18px', height: '18px' }} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '22px 24px' }}>
          {isLoading ? (
            <div
              style={{
                padding: '60px 20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '16px',
                textAlign: 'center'
              }}
            >
              <div
                style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '50%',
                  border: `3px solid rgba(136, 19, 55, 0.2)`,
                  borderTopColor: colors.primary,
                  animation: 'spin 1s linear infinite'
                }}
              />
              <div>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: 700, color: colors.textPrimary }}>
                  Examinando o Padrão Mensal de Negativas com IA...
                </h4>
                <p style={{ margin: 0, fontSize: '13px', color: colors.textSecondary, maxWidth: '440px' }}>
                  Cruzando empresas com histórico de descarte, detectando gargalos em filtros ATS e elaborando plano tático de ajustes no currículo e segmentação.
                </p>
              </div>
            </div>
          ) : !analysis ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <p style={{ color: colors.textSecondary }}>Nenhuma análise disponível no momento.</p>
              <button
                type="button"
                onClick={onRefresh}
                style={{
                  marginTop: '12px',
                  padding: '8px 18px',
                  borderRadius: '8px',
                  backgroundColor: colors.primary,
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '13px',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Iniciar Análise de Estratégia
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Executive Diagnosis Hero Card */}
              <div
                style={{
                  padding: '18px 20px',
                  borderRadius: '12px',
                  backgroundColor: colors.surfaceHover || 'rgba(136, 19, 55, 0.04)',
                  border: `1px solid ${colors.border}`,
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        backgroundColor: 'rgba(136, 19, 55, 0.12)',
                        color: colors.primary,
                        border: `1px solid ${colors.border}`
                      }}
                    >
                      {analysis.overallDiagnosis.stageVerdict}
                    </span>
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        color: analysis.overallDiagnosis.rejectionVelocityTrend === 'improving' ? '#10b981' : analysis.overallDiagnosis.rejectionVelocityTrend === 'deteriorating' ? '#ef4444' : '#3b82f6'
                      }}
                    >
                      {analysis.overallDiagnosis.rejectionVelocityTrend === 'improving' ? (
                        <>
                          <TrendingUp style={{ width: '13px', height: '13px' }} />
                          <span>Trajetória em Melhora</span>
                        </>
                      ) : analysis.overallDiagnosis.rejectionVelocityTrend === 'deteriorating' ? (
                        <>
                          <TrendingDown style={{ width: '13px', height: '13px' }} />
                          <span>Atenção a Gargalos</span>
                        </>
                      ) : (
                        <>
                          <span>Taxa Estável</span>
                        </>
                      )}
                    </span>
                  </div>

                  {/* Funnel Efficiency Meter */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '11px', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Eficiência do Funil
                      </div>
                      <div style={{ fontSize: '15px', fontWeight: 800, color: colors.textPrimary }}>
                        {analysis.overallDiagnosis.funnelEfficiencyScore}%
                      </div>
                    </div>
                    <div
                      style={{
                        width: '70px',
                        height: '7px',
                        backgroundColor: 'rgba(148, 163, 184, 0.2)',
                        borderRadius: '4px',
                        overflow: 'hidden'
                      }}
                    >
                      <div
                        style={{
                          width: `${analysis.overallDiagnosis.funnelEfficiencyScore}%`,
                          height: '100%',
                          backgroundColor: analysis.overallDiagnosis.funnelEfficiencyScore >= 60 ? '#10b981' : analysis.overallDiagnosis.funnelEfficiencyScore >= 40 ? '#f59e0b' : colors.primary,
                          borderRadius: '4px'
                        }}
                      />
                    </div>
                  </div>
                </div>

                <h4 style={{ margin: '0 0 8px 0', fontSize: '17px', fontWeight: 700, color: colors.textPrimary }}>
                  {analysis.overallDiagnosis.headline}
                </h4>

                <p style={{ margin: '0 0 14px 0', fontSize: '13.5px', color: colors.textSecondary, lineHeight: 1.55 }}>
                  {analysis.overallDiagnosis.summaryText}
                </p>

                {/* Primary Bottleneck Callout */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '9px 13px',
                    backgroundColor: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    borderRadius: '8px',
                    fontSize: '12.5px',
                    color: colors.textPrimary
                  }}
                >
                  <AlertTriangle style={{ width: '16px', height: '16px', color: '#ef4444', flexShrink: 0 }} />
                  <div>
                    <strong style={{ color: '#ef4444' }}>Gargalo Crítico Identificado: </strong>
                    <span>{analysis.overallDiagnosis.primaryBottleneck}</span>
                  </div>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  borderBottom: `1px solid ${colors.border}`,
                  paddingBottom: '2px',
                  overflowX: 'auto'
                }}
              >
                {[
                  { id: 'patterns', label: 'Padrões de Negativas', count: analysis.rejectionPatterns.length, icon: AlertTriangle },
                  { id: 'cv-tactics', label: 'Ajustes no Currículo (CV)', count: analysis.cvTacticalAdjustments.length, icon: FileText },
                  { id: 'targeting', label: 'Foco das Candidaturas', count: analysis.targetingTacticalAdjustments.length, icon: Target },
                  { id: 'plan-30', label: 'Plano 30 Dias', count: analysis.actionPlan30Days.length, icon: Calendar },
                  { id: 'ats', label: 'Checklist ATS', count: analysis.atsOptimizationTips.length, icon: ShieldCheck }
                ].map(tab => {
                  const isActive = activeTab === tab.id;
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id as any)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 14px',
                        fontSize: '12.5px',
                        fontWeight: isActive ? 700 : 500,
                        color: isActive ? colors.primary : colors.textSecondary,
                        backgroundColor: isActive ? 'rgba(136, 19, 55, 0.08)' : 'transparent',
                        border: 'none',
                        borderBottom: isActive ? `2px solid ${colors.primary}` : '2px solid transparent',
                        borderRadius: '6px 6px 0 0',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <Icon style={{ width: '14px', height: '14px' }} />
                      <span>{tab.label}</span>
                      {tab.count !== undefined && (
                        <span
                          style={{
                            fontSize: '10.5px',
                            fontWeight: 700,
                            padding: '1px 6px',
                            borderRadius: '10px',
                            backgroundColor: isActive ? colors.primary : colors.surfaceHover || '#e2e8f0',
                            color: isActive ? '#ffffff' : colors.textSecondary
                          }}
                        >
                          {tab.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Tab Content 1: Padrões de Negativas */}
              {activeTab === 'patterns' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ fontSize: '13px', color: colors.textSecondary }}>
                    A IA examinou as empresas que geraram recusa e identificou os seguintes padrões recorrentes de descarte:
                  </div>

                  {analysis.rejectionPatterns.map((pat, idx) => {
                    const sev = getSeverityBadge(pat.severity);
                    return (
                      <div
                        key={idx}
                        style={{
                          padding: '16px',
                          borderRadius: '10px',
                          border: `1px solid ${colors.border}`,
                          backgroundColor: colors.surface
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span
                              style={{
                                width: '22px',
                                height: '22px',
                                borderRadius: '50%',
                                backgroundColor: 'rgba(136, 19, 55, 0.1)',
                                color: colors.primary,
                                fontSize: '11px',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              {idx + 1}
                            </span>
                            <h5 style={{ margin: 0, fontSize: '14.5px', fontWeight: 700, color: colors.textPrimary }}>
                              {pat.patternType}
                            </h5>
                          </div>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '6px',
                              backgroundColor: sev.bg,
                              color: sev.color
                            }}
                          >
                            {sev.label}
                          </span>
                        </div>

                        <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: colors.textSecondary, lineHeight: 1.5 }}>
                          {pat.observation}
                        </p>

                        {pat.affectedCompaniesSample && pat.affectedCompaniesSample.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                            <span style={{ fontSize: '11.5px', fontWeight: 600, color: colors.textSecondary }}>
                              Empresas com esse perfil:
                            </span>
                            {pat.affectedCompaniesSample.map((comp, cIdx) => (
                              <span
                                key={cIdx}
                                style={{
                                  fontSize: '11px',
                                  padding: '2px 7px',
                                  borderRadius: '4px',
                                  backgroundColor: colors.surfaceHover || '#f1f5f9',
                                  border: `1px solid ${colors.border}`,
                                  color: colors.textPrimary
                                }}
                              >
                                {comp}
                              </span>
                            ))}
                          </div>
                        )}

                        <div
                          style={{
                            padding: '10px 12px',
                            borderRadius: '8px',
                            backgroundColor: 'rgba(16, 185, 129, 0.06)',
                            border: '1px solid rgba(16, 185, 129, 0.2)',
                            fontSize: '12.5px',
                            color: colors.textPrimary,
                            display: 'flex',
                            gap: '8px'
                          }}
                        >
                          <CheckCircle2 style={{ width: '15px', height: '15px', color: '#10b981', flexShrink: 0, marginTop: '2px' }} />
                          <div>
                            <strong style={{ color: '#059669' }}>Ação Corretiva Recomendada: </strong>
                            <span>{pat.suggestedCorrection}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Tab Content 2: Ajustes Táticos no Currículo */}
              {activeTab === 'cv-tactics' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ fontSize: '13px', color: colors.textSecondary }}>
                    Mudanças cirúrgicas recomendadas no seu currículo para superar filtros de recrutadores e algoritmos ATS:
                  </div>

                  {analysis.cvTacticalAdjustments.map((adj, idx) => {
                    const imp = getImpactBadge(adj.impact);
                    return (
                      <div
                        key={adj.id || idx}
                        style={{
                          padding: '16px',
                          borderRadius: '10px',
                          border: `1px solid ${colors.border}`,
                          backgroundColor: colors.surface
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '8px' }}>
                          <h5 style={{ margin: 0, fontSize: '14.5px', fontWeight: 700, color: colors.textPrimary }}>
                            {adj.title}
                          </h5>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '6px',
                              backgroundColor: imp.bg,
                              color: imp.color,
                              border: `1px solid ${imp.border}`
                            }}
                          >
                            {imp.label}
                          </span>
                        </div>

                        <div style={{ marginBottom: '10px', fontSize: '13px' }}>
                          <span style={{ fontWeight: 600, color: colors.textSecondary }}>Problema diagnosticado: </span>
                          <span style={{ color: colors.textPrimary }}>{adj.problemIdentified}</span>
                        </div>

                        <div style={{ marginBottom: '10px', fontSize: '13px' }}>
                          <span style={{ fontWeight: 600, color: colors.textSecondary }}>Ação no CV: </span>
                          <span style={{ color: colors.textPrimary }}>{adj.solutionAction}</span>
                        </div>

                        {adj.exampleOrTemplate && (
                          <div
                            style={{
                              padding: '10px 12px',
                              borderRadius: '8px',
                              backgroundColor: colors.surfaceHover || '#f8fafc',
                              border: `1px dashed ${colors.border}`,
                              fontSize: '12.5px',
                              fontFamily: 'monospace',
                              color: colors.textPrimary,
                              lineHeight: 1.45
                            }}
                          >
                            <span style={{ fontWeight: 700, color: colors.primary, fontFamily: 'inherit', display: 'block', marginBottom: '4px' }}>
                              Modelo de Aplicação Prática:
                            </span>
                            {adj.exampleOrTemplate}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Tab Content 3: Ajustes no Foco das Candidaturas */}
              {activeTab === 'targeting' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ fontSize: '13px', color: colors.textSecondary }}>
                    Ajustes estratégicos no modo de seleção de vagas, timing de inscrição e canais de contato:
                  </div>

                  {analysis.targetingTacticalAdjustments.map((t, idx) => {
                    const imp = getImpactBadge(t.impact);
                    return (
                      <div
                        key={t.id || idx}
                        style={{
                          padding: '16px',
                          borderRadius: '10px',
                          border: `1px solid ${colors.border}`,
                          backgroundColor: colors.surface
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '8px' }}>
                          <h5 style={{ margin: 0, fontSize: '14.5px', fontWeight: 700, color: colors.textPrimary }}>
                            {t.title}
                          </h5>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '6px',
                              backgroundColor: imp.bg,
                              color: imp.color,
                              border: `1px solid ${imp.border}`
                            }}
                          >
                            {imp.label}
                          </span>
                        </div>

                        <div style={{ marginBottom: '8px', fontSize: '13px' }}>
                          <span style={{ fontWeight: 600, color: colors.textSecondary }}>Gargalo no Funil: </span>
                          <span style={{ color: colors.textPrimary }}>{t.problemIdentified}</span>
                        </div>

                        <div style={{ marginBottom: '10px', fontSize: '13px' }}>
                          <span style={{ fontWeight: 600, color: colors.textSecondary }}>Estratégia Recomendada: </span>
                          <span style={{ color: colors.textPrimary }}>{t.solutionAction}</span>
                        </div>

                        {t.exampleOrTemplate && (
                          <div
                            style={{
                              padding: '10px 12px',
                              borderRadius: '8px',
                              backgroundColor: 'rgba(136, 19, 55, 0.04)',
                              border: `1px solid ${colors.border}`,
                              fontSize: '12.5px',
                              color: colors.textPrimary,
                              lineHeight: 1.45
                            }}
                          >
                            <span style={{ fontWeight: 700, color: colors.primary, display: 'block', marginBottom: '3px' }}>
                              Exemplo de Execução:
                            </span>
                            {t.exampleOrTemplate}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Tab Content 4: Plano Tático 30 Dias */}
              {activeTab === 'plan-30' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ fontSize: '13px', color: colors.textSecondary }}>
                    Roteiro estruturado semana a semana para reverter negativas e alavancar a taxa de entrevistas nos próximos 30 dias:
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
                    {analysis.actionPlan30Days.map((weekPlan, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '16px',
                          borderRadius: '10px',
                          border: `1px solid ${colors.border}`,
                          backgroundColor: colors.surface,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${colors.border}`, paddingBottom: '8px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 800, color: colors.primary }}>
                            {weekPlan.week}
                          </span>
                          <Clock style={{ width: '13px', height: '13px', color: colors.textSecondary }} />
                        </div>

                        <div style={{ fontSize: '13px', fontWeight: 700, color: colors.textPrimary }}>
                          {weekPlan.focus}
                        </div>

                        <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12.5px', color: colors.textSecondary, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {weekPlan.tasks.map((task, tIdx) => (
                            <li key={tIdx} style={{ lineHeight: 1.4 }}>
                              <span style={{ color: colors.textPrimary }}>{task}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab Content 5: Checklist ATS */}
              {activeTab === 'ats' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ fontSize: '13px', color: colors.textSecondary }}>
                    Diretrizes indispensáveis para evitar a rejeição automática por sistemas de rastreamento de candidatos (Workday, Taleo, Gupy, Lever):
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {analysis.atsOptimizationTips.map((tip, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '10px',
                          padding: '12px 14px',
                          borderRadius: '8px',
                          backgroundColor: colors.surfaceHover || '#f8fafc',
                          border: `1px solid ${colors.border}`,
                          fontSize: '13px',
                          color: colors.textPrimary
                        }}
                      >
                        <ShieldCheck style={{ width: '16px', height: '16px', color: '#10b981', flexShrink: 0, marginTop: '2px' }} />
                        <span style={{ lineHeight: 1.45 }}>{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: `1px solid ${colors.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            backgroundColor: colors.surfaceHover || 'rgba(136, 19, 55, 0.02)'
          }}
        >
          <div style={{ fontSize: '12px', color: colors.textSecondary }}>
            {analysis?.generatedAt && (
              <span>Auditoria gerada em {new Date(analysis.generatedAt).toLocaleString('pt-BR')}</span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={handleCopySummary}
              disabled={!analysis || isLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '8px',
                border: `1px solid ${colors.border}`,
                backgroundColor: colors.surface,
                color: colors.textPrimary,
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: !analysis || isLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {copied ? <Check style={{ width: '14px', height: '14px', color: '#10b981' }} /> : <Copy style={{ width: '14px', height: '14px' }} />}
              <span>{copied ? 'Diagnóstico Copiado!' : 'Copiar Diagnóstico Tático'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 18px',
                borderRadius: '8px',
                backgroundColor: colors.primary,
                color: '#ffffff',
                fontSize: '12.5px',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              Concluir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CareerStrategyAnalysisModal;
