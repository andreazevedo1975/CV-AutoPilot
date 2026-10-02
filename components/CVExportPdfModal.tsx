// components/CVExportPdfModal.tsx - Modal de Exportação e Pré-visualização do Currículo em PDF Executivo
import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileDown, 
  X, 
  Eye, 
  Sparkles, 
  CheckCircle2, 
  Printer, 
  Palette, 
  ShieldCheck, 
  ExternalLink,
  Loader2,
  FileCheck,
  User,
  Briefcase,
  GraduationCap
} from 'lucide-react';
import { CV } from '../types';
import { 
  PdfThemeId, 
  ExecutivePdfOptions, 
  generateExecutiveCvPdfBlob, 
  downloadExecutiveCvPdf,
  parseCvToStructured
} from '../services/cvPdfExportService';

interface CVExportPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  cv: CV | null;
  analysis?: string;
  colors: any;
  onShowToast?: (msg: string) => void;
}

export const CVExportPdfModal: React.FC<CVExportPdfModalProps> = ({
  isOpen,
  onClose,
  cv,
  analysis,
  colors,
  onShowToast
}) => {
  const [selectedTheme, setSelectedTheme] = useState<PdfThemeId>('bordeaux');
  const [includeAtsAudit, setIncludeAtsAudit] = useState<boolean>(true);
  const [includePortfolioLinks, setIncludePortfolioLinks] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);

  // Parse structured data for summary pills
  const structuredData = useMemo(() => {
    if (!cv) return null;
    return parseCvToStructured(cv);
  }, [cv]);

  // Generate / update preview PDF Blob URL
  useEffect(() => {
    if (!isOpen || !cv) {
      if (previewBlobUrl) {
        URL.revokeObjectURL(previewBlobUrl);
        setPreviewBlobUrl(null);
      }
      return;
    }

    try {
      setIsGenerating(true);
      const options: ExecutivePdfOptions = {
        theme: selectedTheme,
        includeAtsAudit: includeAtsAudit && !!analysis,
        includePortfolioLinks,
        spacing: 'normal'
      };

      const blob = generateExecutiveCvPdfBlob(cv, analysis, options);
      const url = URL.createObjectURL(blob);
      setPreviewBlobUrl(prev => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
    } catch (err) {
      console.error('Erro ao gerar pré-visualização do PDF:', err);
    } finally {
      setIsGenerating(false);
    }

    return () => {
      // cleanup on unmount
    };
  }, [isOpen, cv, selectedTheme, includeAtsAudit, includePortfolioLinks, analysis]);

  if (!isOpen || !cv) return null;

  const handleDownload = () => {
    try {
      downloadExecutiveCvPdf(
        cv, 
        analysis, 
        {
          theme: selectedTheme,
          includeAtsAudit: includeAtsAudit && !!analysis,
          includePortfolioLinks
        }
      );
      if (onShowToast) {
        onShowToast(`✓ Currículo Executivo "${cv.name}" exportado em PDF com sucesso!`);
      }
      onClose();
    } catch (err) {
      console.error('Erro ao baixar PDF:', err);
      if (onShowToast) {
        onShowToast('Erro ao exportar PDF. Tente novamente.');
      }
    }
  };

  const handleOpenInNewTab = () => {
    if (previewBlobUrl) {
      window.open(previewBlobUrl, '_blank');
    }
  };

  return (
    <div style={styles.backdrop} onClick={onClose}>
      <div 
        style={{
          ...styles.modalContainer,
          backgroundColor: colors.surfaceElevated || colors.surface,
          borderColor: colors.border
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ ...styles.modalHeader, borderColor: colors.border }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              ...styles.iconBadge,
              backgroundColor: colors.primaryLight || 'rgba(136, 19, 55, 0.1)',
              color: colors.primary
            }}>
              <FileDown size={20} />
            </div>
            <div>
              <h3 style={{ ...styles.modalTitle, color: colors.textPrimary }}>
                Exportar Currículo em PDF Executivo
              </h3>
              <p style={{ ...styles.modalSubtitle, color: colors.textSecondary }}>
                Formatação corporativa de alto impacto com design executivo e conformidade ATS
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            style={{ ...styles.closeBtn, color: colors.textSecondary }}
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body: Two columns layout (Options & Live Preview) */}
        <div style={styles.modalBody}>
          {/* Left Column: Configuration & Metadata */}
          <div style={styles.leftCol}>
            {/* Candidate Summary Card */}
            <div style={{ ...styles.summaryCard, borderColor: colors.border, backgroundColor: colors.background }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <User size={15} color={colors.primary} />
                <strong style={{ fontSize: '13px', color: colors.textPrimary }}>
                  {structuredData?.candidateName || cv.name}
                </strong>
              </div>
              <p style={{ fontSize: '12px', color: colors.textSecondary, margin: '0 0 10px 0', lineHeight: 1.4 }}>
                {structuredData?.headline || 'Currículo Profissional'}
              </p>

              {/* Badges metrics */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {cv.yearsOfExperience !== undefined && cv.yearsOfExperience !== null && (
                  <span style={{ ...styles.pillBadge, backgroundColor: colors.primaryLight || 'rgba(136, 19, 55, 0.1)', color: colors.primary }}>
                    <Briefcase size={11} style={{ marginRight: '4px' }} />
                    {cv.yearsOfExperience} anos exp
                  </span>
                )}
                {structuredData?.experiences && structuredData.experiences.length > 0 && (
                  <span style={{ ...styles.pillBadge, backgroundColor: 'rgba(15, 23, 42, 0.08)', color: colors.textPrimary }}>
                    {structuredData.experiences.length} experiências
                  </span>
                )}
                {structuredData?.skills && structuredData.skills.length > 0 && (
                  <span style={{ ...styles.pillBadge, backgroundColor: 'rgba(15, 23, 42, 0.08)', color: colors.textPrimary }}>
                    {structuredData.skills.length} competências
                  </span>
                )}
                {analysis && (
                  <span style={{ ...styles.pillBadge, backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#059669' }}>
                    <ShieldCheck size={11} style={{ marginRight: '3px' }} />
                    Auditado por IA
                  </span>
                )}
              </div>
            </div>

            {/* Theme Selector */}
            <div style={styles.optionSection}>
              <label style={{ ...styles.optionLabel, color: colors.textPrimary }}>
                <Palette size={14} color={colors.primary} />
                <span>Estilo Visual Executivo:</span>
              </label>

              <div style={styles.themeGrid}>
                {/* Bordeaux */}
                <button
                  type="button"
                  onClick={() => setSelectedTheme('bordeaux')}
                  style={{
                    ...styles.themeCard,
                    borderColor: selectedTheme === 'bordeaux' ? colors.primary : colors.border,
                    backgroundColor: selectedTheme === 'bordeaux' ? (colors.primaryLight || 'rgba(136, 19, 55, 0.08)') : colors.background
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ ...styles.colorDot, backgroundColor: '#881337' }}></span>
                    <strong style={{ fontSize: '12px', color: colors.textPrimary }}>Executivo Bordeaux</strong>
                  </div>
                  <span style={{ fontSize: '10px', color: colors.textSecondary }}>Assinatura CV-AutoPilot</span>
                </button>

                {/* Corporate Navy */}
                <button
                  type="button"
                  onClick={() => setSelectedTheme('navy')}
                  style={{
                    ...styles.themeCard,
                    borderColor: selectedTheme === 'navy' ? '#1e3a8a' : colors.border,
                    backgroundColor: selectedTheme === 'navy' ? 'rgba(30, 58, 138, 0.08)' : colors.background
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ ...styles.colorDot, backgroundColor: '#1e3a8a' }}></span>
                    <strong style={{ fontSize: '12px', color: colors.textPrimary }}>Corporate Navy</strong>
                  </div>
                  <span style={{ fontSize: '10px', color: colors.textSecondary }}>Clássico Multinacional</span>
                </button>

                {/* Midnight Slate */}
                <button
                  type="button"
                  onClick={() => setSelectedTheme('slate')}
                  style={{
                    ...styles.themeCard,
                    borderColor: selectedTheme === 'slate' ? '#0f172a' : colors.border,
                    backgroundColor: selectedTheme === 'slate' ? 'rgba(15, 23, 42, 0.08)' : colors.background
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ ...styles.colorDot, backgroundColor: '#0f172a' }}></span>
                    <strong style={{ fontSize: '12px', color: colors.textPrimary }}>Midnight Slate</strong>
                  </div>
                  <span style={{ fontSize: '10px', color: colors.textSecondary }}>Minimalista Moderno</span>
                </button>

                {/* Emerald */}
                <button
                  type="button"
                  onClick={() => setSelectedTheme('emerald')}
                  style={{
                    ...styles.themeCard,
                    borderColor: selectedTheme === 'emerald' ? '#065f46' : colors.border,
                    backgroundColor: selectedTheme === 'emerald' ? 'rgba(6, 95, 70, 0.08)' : colors.background
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ ...styles.colorDot, backgroundColor: '#065f46' }}></span>
                    <strong style={{ fontSize: '12px', color: colors.textPrimary }}>Leadership Emerald</strong>
                  </div>
                  <span style={{ fontSize: '10px', color: colors.textSecondary }}>Liderança & ESG</span>
                </button>
              </div>
            </div>

            {/* Checkbox Options */}
            <div style={styles.optionSection}>
              <span style={{ ...styles.optionLabel, color: colors.textPrimary }}>
                <span>Conteúdo & Estrutura:</span>
              </span>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                <label style={styles.checkboxRow}>
                  <input
                    type="checkbox"
                    checked={includePortfolioLinks}
                    onChange={(e) => setIncludePortfolioLinks(e.target.checked)}
                    style={{ accentColor: colors.primary, cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '12px', color: colors.textPrimary }}>
                    Incluir Links Profissionais (LinkedIn, GitHub e Portfólio interativos)
                  </span>
                </label>

                {analysis && (
                  <label style={styles.checkboxRow}>
                    <input
                      type="checkbox"
                      checked={includeAtsAudit}
                      onChange={(e) => setIncludeAtsAudit(e.target.checked)}
                      style={{ accentColor: colors.primary, cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '12px', color: colors.textPrimary }}>
                      Incluir Quadro de Auditoria Técnica ATS & Parecer de IA
                    </span>
                  </label>
                )}
              </div>
            </div>

            {/* ATS Compliance Guarantee Box */}
            <div style={{ ...styles.infoBox, backgroundColor: colors.background, borderColor: colors.border }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <FileCheck size={16} color={colors.primary} style={{ marginTop: '2px', flexShrink: 0 }} />
                <div style={{ fontSize: '11px', color: colors.textSecondary, lineHeight: 1.45 }}>
                  <strong style={{ color: colors.textPrimary, display: 'block', marginBottom: '2px' }}>
                    Padrão Internacional ATS-Friendly
                  </strong>
                  Este documento utiliza fontes helvéticas vetorizadas e hierarquia semântica com layout em fluxo, garantindo leitura perfeita por robôs de triagem (Gupy, Workday, Taleo, Greenhouse) e impressão executiva impecável.
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Live PDF Document Preview */}
          <div style={styles.rightCol}>
            <div style={{ ...styles.previewHeader, borderColor: colors.border }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: colors.textPrimary, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Eye size={14} color={colors.primary} />
                Pré-visualização do PDF Executivo
              </span>
              {previewBlobUrl && (
                <button
                  type="button"
                  onClick={handleOpenInNewTab}
                  style={styles.openTabBtn}
                  title="Abrir PDF em nova aba para visualização em tela cheia ou impressão"
                >
                  <ExternalLink size={12} />
                  <span>Expandir</span>
                </button>
              )}
            </div>

            <div style={{ ...styles.previewFrameWrapper, borderColor: colors.border }}>
              {isGenerating ? (
                <div style={styles.previewLoading}>
                  <Loader2 size={28} color={colors.primary} className="animate-spin" />
                  <span style={{ fontSize: '12px', color: colors.textSecondary, marginTop: '8px' }}>
                    Renderizando layout executivo...
                  </span>
                </div>
              ) : previewBlobUrl ? (
                <iframe
                  src={`${previewBlobUrl}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`}
                  title="Pré-visualização do Currículo em PDF"
                  style={styles.previewIframe}
                />
              ) : (
                <div style={styles.previewLoading}>
                  <span style={{ fontSize: '12px', color: colors.textSecondary }}>
                    Nenhum documento carregado.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div style={{ ...styles.modalFooter, borderColor: colors.border }}>
          <button
            type="button"
            onClick={onClose}
            style={{ ...styles.cancelBtn, borderColor: colors.border, color: colors.textPrimary }}
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleOpenInNewTab}
            disabled={!previewBlobUrl}
            style={{ ...styles.secondaryActionBtn, borderColor: colors.border, color: colors.textPrimary }}
          >
            <Printer size={15} />
            <span>Imprimir / Abrir Nova Aba</span>
          </button>

          <button
            type="button"
            onClick={handleDownload}
            disabled={isGenerating}
            style={{
              ...styles.primaryDownloadBtn,
              backgroundColor: colors.primary,
              color: colors.textOnPrimary
            }}
          >
            <FileDown size={16} />
            <span>Baixar PDF Executivo</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  backdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1100,
    padding: '16px'
  },
  modalContainer: {
    width: '100%',
    maxWidth: '960px',
    maxHeight: '92vh',
    borderRadius: '16px',
    border: '1px solid',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
    overflow: 'hidden',
    animation: 'fadeIn 0.2s ease-out'
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '18px 24px',
    borderBottom: '1px solid'
  },
  iconBadge: {
    width: '38px',
    height: '38px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  modalTitle: {
    margin: 0,
    fontSize: '17px',
    fontWeight: 800,
    letterSpacing: '-0.01em'
  },
  modalSubtitle: {
    margin: '2px 0 0 0',
    fontSize: '12px'
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '6px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalBody: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '20px',
    padding: '20px 24px',
    overflowY: 'auto',
    maxHeight: 'calc(92vh - 150px)'
  },
  leftCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  rightCol: {
    display: 'flex',
    flexDirection: 'column'
  },
  summaryCard: {
    padding: '14px',
    borderRadius: '12px',
    border: '1px solid'
  },
  pillBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '3px 8px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 700
  },
  optionSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  optionLabel: {
    fontSize: '12px',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  themeGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '10px',
    marginTop: '6px'
  },
  themeCard: {
    padding: '10px 12px',
    borderRadius: '10px',
    border: '1.5px solid',
    cursor: 'pointer',
    textAlign: 'left',
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
    transition: 'all 0.15s ease'
  },
  colorDot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    display: 'inline-block',
    flexShrink: 0
  },
  checkboxRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer'
  },
  infoBox: {
    padding: '12px',
    borderRadius: '10px',
    border: '1px solid',
    marginTop: '4px'
  },
  previewHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: '8px',
    borderBottom: '1px solid',
    marginBottom: '10px'
  },
  openTabBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '11px',
    fontWeight: 600,
    background: 'none',
    border: 'none',
    color: '#0a66c2',
    cursor: 'pointer',
    padding: 0
  },
  previewFrameWrapper: {
    height: '420px',
    borderRadius: '10px',
    border: '1px solid',
    overflow: 'hidden',
    backgroundColor: '#334155',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  previewLoading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
    backgroundColor: '#ffffff',
    width: '100%',
    height: '100%'
  },
  previewIframe: {
    width: '100%',
    height: '100%',
    border: 'none',
    backgroundColor: '#ffffff'
  },
  modalFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '10px',
    padding: '14px 24px',
    borderTop: '1px solid',
    flexWrap: 'wrap'
  },
  cancelBtn: {
    padding: '9px 16px',
    borderRadius: '8px',
    border: '1px solid',
    fontSize: '13px',
    fontWeight: 600,
    backgroundColor: 'transparent',
    cursor: 'pointer'
  },
  secondaryActionBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '9px 16px',
    borderRadius: '8px',
    border: '1px solid',
    fontSize: '13px',
    fontWeight: 600,
    backgroundColor: 'transparent',
    cursor: 'pointer'
  },
  primaryDownloadBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '9px 20px',
    borderRadius: '8px',
    border: 'none',
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 2px 10px rgba(136, 19, 55, 0.35)',
    transition: 'all 0.15s ease'
  }
};
