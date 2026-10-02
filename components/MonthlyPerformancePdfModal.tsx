// components/MonthlyPerformancePdfModal.tsx
// Modal executivo para visualização, impressão e download do PDF de Resumo Mensal de Desempenho
import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  X, 
  Download, 
  Printer, 
  CheckCircle2, 
  Sparkles, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Briefcase,
  Share2,
  Eye,
  RefreshCw
} from 'lucide-react';
import { MonthlyCareerMetric } from './CareerInsights';
import { Application } from '../types';
import { 
  buildMonthlyPerformancePdfDoc, 
  downloadMonthlyPerformancePdf, 
  printMonthlyPerformancePdf, 
  MonthlyPerformancePdfOptions 
} from '../services/monthlyPerformancePdfService';

interface MonthlyPerformancePdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  colors: any;
  monthlyData: MonthlyCareerMetric[];
  kpiMetrics: {
    totalInterviews: number;
    totalNegatives: number;
    totalResponses: number;
    overallRatio: number;
    totalNetTraction: number;
    momInterviewsChange: number;
    momNegativesChange: number;
    bestMonth: MonthlyCareerMetric | null;
    ratioText: string;
  };
  diagnosis: {
    headline: string;
    badge: string;
    tone: string;
    analysis: string;
    recommendation: string;
  };
  timeframeMonths: number;
  isBenchmarkData: boolean;
  applications: Application[];
  onShowToast?: (msg: string) => void;
}

export const MonthlyPerformancePdfModal: React.FC<MonthlyPerformancePdfModalProps> = ({
  isOpen,
  onClose,
  colors,
  monthlyData,
  kpiMetrics,
  diagnosis,
  timeframeMonths,
  isBenchmarkData,
  applications,
  onShowToast,
}) => {
  const [candidateName, setCandidateName] = useState<string>('Profissional Executivo');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [activePreviewTab, setActivePreviewTab] = useState<'summary' | 'pdf'>('summary');
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);

  // Generate PDF blob preview
  useEffect(() => {
    if (!isOpen) {
      if (previewBlobUrl) {
        URL.revokeObjectURL(previewBlobUrl);
        setPreviewBlobUrl(null);
      }
      return;
    }

    try {
      const doc = buildMonthlyPerformancePdfDoc({
        monthlyData,
        kpiMetrics,
        diagnosis,
        timeframeMonths,
        isBenchmarkData,
        applications,
        candidateName,
      });

      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      setPreviewBlobUrl(url);
    } catch (e) {
      console.error('Erro ao gerar preview do PDF mensal:', e);
    }
  }, [isOpen, candidateName, monthlyData, kpiMetrics, diagnosis, timeframeMonths, isBenchmarkData, applications]);

  if (!isOpen) return null;

  const showFeedback = (msg: string) => {
    setFeedbackSuccess(msg);
    if (onShowToast) onShowToast(msg);
    setTimeout(() => setFeedbackSuccess(null), 3500);
  };

  const handleDownload = () => {
    setIsGenerating(true);
    try {
      const fileName = `resumo-mensal-candidaturas-${timeframeMonths}M-${new Date().toISOString().split('T')[0]}.pdf`;
      downloadMonthlyPerformancePdf(
        {
          monthlyData,
          kpiMetrics,
          diagnosis,
          timeframeMonths,
          isBenchmarkData,
          applications,
          candidateName,
        },
        fileName
      );
      showFeedback('PDF baixado e salvo com sucesso no seu dispositivo!');
    } catch (err) {
      console.error('Erro ao baixar PDF:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    try {
      printMonthlyPerformancePdf({
        monthlyData,
        kpiMetrics,
        diagnosis,
        timeframeMonths,
        isBenchmarkData,
        applications,
        candidateName,
      });
      showFeedback('Diálogo de impressão aberto no navegador.');
    } catch (err) {
      console.error('Erro ao imprimir PDF:', err);
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
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: '16px',
          width: '100%',
          maxWidth: '820px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.45)',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: `1px solid ${colors.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: colors.surfaceHover || '#f8fafc',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: 'rgba(136, 19, 55, 0.12)',
                color: colors.primary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FileText size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3
                  style={{
                    margin: 0,
                    fontSize: '18px',
                    fontWeight: 800,
                    color: colors.textPrimary,
                    letterSpacing: '-0.02em',
                  }}
                >
                  Resumo Mensal de Desempenho em PDF
                </h3>
                <span
                  style={{
                    fontSize: '10.5px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '10px',
                    backgroundColor: isBenchmarkData ? 'rgba(136, 19, 55, 0.12)' : 'rgba(5, 150, 105, 0.12)',
                    color: isBenchmarkData ? colors.primary : '#059669',
                    border: `1px solid ${isBenchmarkData ? colors.primary : '#059669'}40`,
                  }}
                >
                  {isBenchmarkData ? 'Benchmark de Mercado' : 'Seus Dados Reais'}
                </span>
              </div>
              <p style={{ margin: '2px 0 0 0', fontSize: '12.5px', color: colors.textSecondary }}>
                Gere, imprima ou salve o relatório consolidado de <strong>Entrevistas vs Negativas</strong> dos últimos {timeframeMonths} meses.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: colors.textSecondary,
              padding: '4px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Feedback Message Banner */}
        {feedbackSuccess && (
          <div
            style={{
              margin: '12px 24px 0 24px',
              padding: '10px 14px',
              borderRadius: '8px',
              backgroundColor: '#ecfdf5',
              border: '1px solid #a7f3d0',
              color: '#065f46',
              fontSize: '12.5px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <CheckCircle2 size={16} color="#059669" />
            <span>{feedbackSuccess}</span>
          </div>
        )}

        {/* Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Candidate Customization & Mode Switch */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '12px',
              padding: '14px',
              borderRadius: '10px',
              backgroundColor: colors.background,
              border: `1px solid ${colors.border}`,
            }}
          >
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: colors.textSecondary,
                  marginBottom: '4px',
                  textTransform: 'uppercase',
                }}
              >
                Nome no Cabeçalho do Relatório:
              </label>
              <input
                type="text"
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                placeholder="Ex: Seu Nome Completo"
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  fontSize: '12.5px',
                  borderRadius: '6px',
                  border: `1px solid ${colors.border}`,
                  backgroundColor: colors.surface,
                  color: colors.textPrimary,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: colors.textSecondary,
                  marginBottom: '6px',
                  textTransform: 'uppercase',
                }}
              >
                Visualização do Documento:
              </span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => setActivePreviewTab('summary')}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    padding: '6px 10px',
                    fontSize: '11.5px',
                    fontWeight: activePreviewTab === 'summary' ? 700 : 500,
                    borderRadius: '6px',
                    border: activePreviewTab === 'summary' ? `1px solid ${colors.primary}` : `1px solid ${colors.border}`,
                    backgroundColor: activePreviewTab === 'summary' ? `${colors.primary}15` : colors.surface,
                    color: activePreviewTab === 'summary' ? colors.primary : colors.textSecondary,
                    cursor: 'pointer',
                  }}
                >
                  <Activity size={13} />
                  <span>Resumo Executivo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActivePreviewTab('pdf')}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    padding: '6px 10px',
                    fontSize: '11.5px',
                    fontWeight: activePreviewTab === 'pdf' ? 700 : 500,
                    borderRadius: '6px',
                    border: activePreviewTab === 'pdf' ? `1px solid ${colors.primary}` : `1px solid ${colors.border}`,
                    backgroundColor: activePreviewTab === 'pdf' ? `${colors.primary}15` : colors.surface,
                    color: activePreviewTab === 'pdf' ? colors.primary : colors.textSecondary,
                    cursor: 'pointer',
                  }}
                >
                  <Eye size={13} />
                  <span>Prévia do PDF</span>
                </button>
              </div>
            </div>
          </div>

          {/* Tab 1: Executive Summary Preview */}
          {activePreviewTab === 'summary' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* KPIs 4-Card Preview */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: '10px',
                }}
              >
                <div
                  style={{
                    padding: '12px',
                    borderRadius: '10px',
                    backgroundColor: colors.background,
                    border: `1px solid ${colors.border}`,
                    textAlign: 'center',
                  }}
                >
                  <span style={{ fontSize: '10.5px', fontWeight: 700, color: colors.textSecondary }}>ENTREVISTAS</span>
                  <div style={{ fontSize: '22px', fontWeight: 900, color: '#059669', margin: '2px 0' }}>
                    {kpiMetrics.totalInterviews}
                  </div>
                  <span style={{ fontSize: '10px', color: colors.textSecondary }}>
                    {kpiMetrics.momInterviewsChange >= 0 ? '+' : ''}{kpiMetrics.momInterviewsChange} vs mês ant.
                  </span>
                </div>

                <div
                  style={{
                    padding: '12px',
                    borderRadius: '10px',
                    backgroundColor: colors.background,
                    border: `1px solid ${colors.border}`,
                    textAlign: 'center',
                  }}
                >
                  <span style={{ fontSize: '10.5px', fontWeight: 700, color: colors.textSecondary }}>NEGATIVAS</span>
                  <div style={{ fontSize: '22px', fontWeight: 900, color: '#dc2626', margin: '2px 0' }}>
                    {kpiMetrics.totalNegatives}
                  </div>
                  <span style={{ fontSize: '10px', color: colors.textSecondary }}>
                    {kpiMetrics.momNegativesChange >= 0 ? '+' : ''}{kpiMetrics.momNegativesChange} vs mês ant.
                  </span>
                </div>

                <div
                  style={{
                    padding: '12px',
                    borderRadius: '10px',
                    backgroundColor: colors.background,
                    border: `1px solid ${colors.border}`,
                    textAlign: 'center',
                  }}
                >
                  <span style={{ fontSize: '10.5px', fontWeight: 700, color: colors.textSecondary }}>SALDO LÍQUIDO</span>
                  <div
                    style={{
                      fontSize: '22px',
                      fontWeight: 900,
                      color: kpiMetrics.totalNetTraction >= 0 ? '#059669' : '#dc2626',
                      margin: '2px 0',
                    }}
                  >
                    {kpiMetrics.totalNetTraction > 0 ? '+' : ''}{kpiMetrics.totalNetTraction}
                  </div>
                  <span style={{ fontSize: '10px', color: colors.textSecondary }}>Tração do Funil</span>
                </div>

                <div
                  style={{
                    padding: '12px',
                    borderRadius: '10px',
                    backgroundColor: colors.background,
                    border: `1px solid ${colors.border}`,
                    textAlign: 'center',
                  }}
                >
                  <span style={{ fontSize: '10.5px', fontWeight: 700, color: colors.textSecondary }}>TAXA FAVORÁVEL</span>
                  <div style={{ fontSize: '22px', fontWeight: 900, color: colors.primary, margin: '2px 0' }}>
                    {kpiMetrics.overallRatio}%
                  </div>
                  <span style={{ fontSize: '10px', color: colors.textSecondary }}>{kpiMetrics.ratioText}</span>
                </div>
              </div>

              {/* Diagnosis box */}
              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: '10px',
                  backgroundColor: colors.surfaceHover || '#f8fafc',
                  border: `1px solid ${colors.border}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <strong style={{ fontSize: '13px', color: colors.primary }}>
                    {diagnosis.headline}
                  </strong>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: colors.primary,
                      backgroundColor: 'rgba(136, 19, 55, 0.1)',
                      padding: '2px 8px',
                      borderRadius: '8px',
                    }}
                  >
                    {diagnosis.badge}
                  </span>
                </div>
                <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: colors.textSecondary, lineHeight: 1.45 }}>
                  {diagnosis.analysis}
                </p>
                <div style={{ fontSize: '11.5px', color: colors.textPrimary, borderTop: `1px solid ${colors.border}`, paddingTop: '6px' }}>
                  <strong>Recomendação:</strong> {diagnosis.recommendation}
                </div>
              </div>

              {/* Monthly breakdown mini-table */}
              <div
                style={{
                  border: `1px solid ${colors.border}`,
                  borderRadius: '10px',
                  overflow: 'hidden',
                  backgroundColor: colors.surface,
                }}
              >
                <div
                  style={{
                    padding: '10px 14px',
                    backgroundColor: colors.surfaceHover || '#f1f5f9',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: colors.textPrimary,
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>Meses que constarão no PDF ({monthlyData.length} meses)</span>
                  <span>Saldo Líquido</span>
                </div>
                <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
                  {monthlyData.map((m) => (
                    <div
                      key={m.monthKey}
                      style={{
                        padding: '8px 14px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '12px',
                        borderBottom: `1px solid ${colors.border}`,
                      }}
                    >
                      <span style={{ fontWeight: 600, color: colors.textPrimary }}>{m.fullMonthName}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <span style={{ color: '#059669', fontWeight: 600 }}>{m.interviewsCount} entrevistas</span>
                        <span style={{ color: '#dc2626', fontWeight: 600 }}>{m.negativesCount} negativas</span>
                        <strong
                          style={{
                            color: m.netTraction >= 0 ? '#059669' : '#dc2626',
                            minWidth: '35px',
                            textAlign: 'right',
                          }}
                        >
                          {m.netTraction > 0 ? `+${m.netTraction}` : m.netTraction}
                        </strong>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Tab 2: Embedded PDF Preview */
            <div
              style={{
                width: '100%',
                height: '420px',
                borderRadius: '10px',
                overflow: 'hidden',
                border: `1px solid ${colors.border}`,
                backgroundColor: '#1e293b',
              }}
            >
              {previewBlobUrl ? (
                <iframe
                  src={previewBlobUrl}
                  title="Prévia do PDF Mensal"
                  style={{ width: '100%', height: '100%', border: 'none' }}
                />
              ) : (
                <div
                  style={{
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#94a3b8',
                    fontSize: '13px',
                  }}
                >
                  <RefreshCw size={18} className="animate-spin" style={{ marginRight: '8px' }} />
                  Carregando prévia do PDF...
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions: Print & Download */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: `1px solid ${colors.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
            backgroundColor: colors.surfaceHover || '#f8fafc',
          }}
        >
          <div style={{ fontSize: '11.5px', color: colors.textSecondary }}>
            📄 Formato A4 Corporativo • Otimizado para impressão e anexo executivo
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 14px',
                fontSize: '12.5px',
                fontWeight: 600,
                borderRadius: '8px',
                border: `1px solid ${colors.border}`,
                backgroundColor: colors.surface,
                color: colors.textSecondary,
                cursor: 'pointer',
              }}
            >
              Fechar
            </button>

            <button
              type="button"
              onClick={handlePrint}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                fontSize: '12.5px',
                fontWeight: 700,
                borderRadius: '8px',
                border: `1.5px solid ${colors.primary}`,
                backgroundColor: colors.surface,
                color: colors.primary,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              title="Abrir diálogo de impressão do navegador"
            >
              <Printer size={15} />
              <span>Imprimir Relatório</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              disabled={isGenerating}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 18px',
                fontSize: '12.5px',
                fontWeight: 700,
                borderRadius: '8px',
                border: 'none',
                backgroundColor: colors.primary,
                color: '#ffffff',
                cursor: isGenerating ? 'not-allowed' : 'pointer',
                boxShadow: '0 2px 8px rgba(136, 19, 55, 0.3)',
                transition: 'all 0.15s ease',
              }}
              title="Salvar arquivo PDF no computador ou celular"
            >
              <Download size={15} />
              <span>Salvar PDF (Download)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthlyPerformancePdfModal;
