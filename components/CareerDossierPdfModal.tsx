import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, 
  X, 
  Download, 
  Eye, 
  Sparkles, 
  CheckCircle2, 
  FileDown, 
  Briefcase, 
  Mail, 
  BarChart3, 
  Palette, 
  Layers, 
  RefreshCw,
  Sliders,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { CV, Application, HistoryItem, GenerationHistoryItem, ApplicationStatus } from '../types';
import { 
  downloadCareerDossierPdf, 
  generateCareerDossierPdfBlob, 
  CareerDossierOptions 
} from '../services/careerDossierPdfService';

interface CareerDossierPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  colors: any;
  onShowToast?: (msg: string) => void;
  preselectedHistoryItem?: GenerationHistoryItem | null;
}

export const CareerDossierPdfModal: React.FC<CareerDossierPdfModalProps> = ({
  isOpen,
  onClose,
  colors,
  onShowToast,
  preselectedHistoryItem,
}) => {
  const [cvs] = useLocalStorage<CV[]>('cvs', []);
  const [applications] = useLocalStorage<Application[]>('applications', []);
  const [history] = useLocalStorage<HistoryItem[]>('generationHistory', []);

  // Filter cover letters and CV generations from history
  const historyCoverLetters = useMemo(() => {
    return (history || []).filter(
      (item): item is GenerationHistoryItem => 
        !('leads' in item) && item.type === 'Carta de Apresentação'
    );
  }, [history]);

  const historyCvOptimizations = useMemo(() => {
    return (history || []).filter(
      (item): item is GenerationHistoryItem => 
        !('leads' in item) && item.type === 'Otimização de Currículo'
    );
  }, [history]);

  // Modal Configuration States
  const [selectedCvSource, setSelectedCvSource] = useState<'saved_cv' | 'history_cv'>('saved_cv');
  const [selectedCvId, setSelectedCvId] = useState<string>('');
  const [selectedHistoryCvId, setSelectedHistoryCvId] = useState<string>('');

  const [selectedCoverLetterSource, setSelectedCoverLetterSource] = useState<'history' | 'custom' | 'none'>('history');
  const [selectedCoverLetterId, setSelectedCoverLetterId] = useState<string>('');
  const [customCoverLetterText, setCustomCoverLetterText] = useState<string>('');
  const [coverLetterTitle, setCoverLetterTitle] = useState<string>('Carta de Apresentação Executiva');
  const [targetCompany, setTargetCompany] = useState<string>('');
  const [targetRole, setTargetRole] = useState<string>('');

  const [theme, setTheme] = useState<'bordeaux' | 'navy' | 'graphite' | 'emerald'>('bordeaux');
  const [includeCv, setIncludeCv] = useState<boolean>(true);
  const [includeCoverLetter, setIncludeCoverLetter] = useState<boolean>(true);
  const [includeApplicationsTable, setIncludeApplicationsTable] = useState<boolean>(true);
  const [includeKpis, setIncludeKpis] = useState<boolean>(true);
  const [customNotes, setCustomNotes] = useState<string>('');

  // Preview State
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'config' | 'preview'>('preview');

  // Initialize selections when modal opens or preselected history item changes
  useEffect(() => {
    if (!isOpen) {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      return;
    }

    // Default CV selection
    if (cvs.length > 0 && !selectedCvId) {
      setSelectedCvId(cvs[0].id);
    }

    // Preselected history item handling
    if (preselectedHistoryItem) {
      if (preselectedHistoryItem.type === 'Carta de Apresentação') {
        setSelectedCoverLetterSource('history');
        setSelectedCoverLetterId(preselectedHistoryItem.id);
        setCustomCoverLetterText(preselectedHistoryItem.output);
        setCoverLetterTitle('Carta de Apresentação Estratégica');
        // Extract company if in description
        if (preselectedHistoryItem.inputJobDescription) {
          const firstLine = preselectedHistoryItem.inputJobDescription.split('\n')[0];
          setTargetRole(firstLine.slice(0, 40));
        }
      } else if (preselectedHistoryItem.type === 'Otimização de Currículo') {
        setSelectedCvSource('history_cv');
        setSelectedHistoryCvId(preselectedHistoryItem.id);
      }
    } else {
      // Default latest cover letter if available
      if (historyCoverLetters.length > 0 && !selectedCoverLetterId) {
        setSelectedCoverLetterId(historyCoverLetters[0].id);
        setCustomCoverLetterText(historyCoverLetters[0].output);
      } else if (!customCoverLetterText && cvs.length > 0) {
        // Sample executive cover letter fallback
        const primaryCv = cvs[0];
        setCustomCoverLetterText(
          `Prezada Equipe de Liderança & Recrutamento,\n\nCom grande entusiasmo submeto meu Dossiê Executivo de Carreira para avaliação. Ao longo de minha trajetória consolidada em posições de alto impacto, tenho conduzido iniciativas estratégicas com foco rigoroso em entrega de valor mensurável, otimização de arquiteturas e liderança de times de alta performance.\n\nMinha atuação combina sólidas competências técnicas comprovadas com visão analítica e capacidade de interlocução com stakeholders C-Level. Conforme detalhado em meu currículo anexo, priorizo métricas quantificáveis de eficiência e inovação contínua.\n\nAgradeço a atenção e coloco-me à disposição para aprofundarmos como minha experiência e competências podem acelerar os objetivos estratégicos da organização.\n\nAtenciosamente,\n${primaryCv.name.replace(/^(Currículo\s*(?:de|-)?\s*)/i, '').trim() || 'Profissional Executivo'}`
        );
      }
    }
  }, [isOpen, preselectedHistoryItem, cvs, historyCoverLetters]);

  // Determine current active CV
  const activeCv: CV | null = useMemo(() => {
    if (selectedCvSource === 'saved_cv') {
      return cvs.find(c => c.id === selectedCvId) || (cvs.length > 0 ? cvs[0] : null);
    } else {
      const histItem = historyCvOptimizations.find(h => h.id === selectedHistoryCvId);
      if (histItem) {
        return {
          id: histItem.id,
          name: `Currículo Otimizado por IA (${new Date(histItem.timestamp).toLocaleDateString('pt-BR')})`,
          content: histItem.output || histItem.inputCv,
          yearsOfExperience: 5,
        };
      }
      return cvs.length > 0 ? cvs[0] : null;
    }
  }, [selectedCvSource, selectedCvId, selectedHistoryCvId, cvs, historyCvOptimizations]);

  // Determine active cover letter text
  const activeCoverLetterText: string = useMemo(() => {
    if (selectedCoverLetterSource === 'none') return '';
    if (selectedCoverLetterSource === 'custom') return customCoverLetterText;
    const histItem = historyCoverLetters.find(h => h.id === selectedCoverLetterId);
    return histItem ? histItem.output : customCoverLetterText;
  }, [selectedCoverLetterSource, selectedCoverLetterId, customCoverLetterText, historyCoverLetters]);

  // Build current dossier options
  const dossierOptions: CareerDossierOptions = useMemo(() => {
    return {
      cv: activeCv,
      coverLetterText: activeCoverLetterText,
      coverLetterTitle,
      targetCompany,
      targetRole,
      applications,
      theme,
      includeKpis,
      includeApplicationsTable,
      includeCoverLetter: includeCoverLetter && selectedCoverLetterSource !== 'none' && activeCoverLetterText.trim().length > 0,
      includeCv: includeCv && Boolean(activeCv),
      customNotes,
    };
  }, [
    activeCv,
    activeCoverLetterText,
    coverLetterTitle,
    targetCompany,
    targetRole,
    applications,
    theme,
    includeKpis,
    includeApplicationsTable,
    includeCoverLetter,
    selectedCoverLetterSource,
    includeCv,
    customNotes,
  ]);

  // Generate live preview blob URL
  const generatePreview = () => {
    setIsGenerating(true);
    try {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      const blob = generateCareerDossierPdfBlob(dossierOptions);
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
    } catch (err) {
      console.error('Falha ao gerar pré-visualização do Dossiê:', err);
      if (onShowToast) onShowToast('Erro ao renderizar pré-visualização do PDF.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Auto-regenerate preview when options change (with debounce)
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      generatePreview();
    }, 250);
    return () => clearTimeout(timer);
  }, [isOpen, dossierOptions]);

  // Direct download action
  const handleDownloadPdf = () => {
    try {
      downloadCareerDossierPdf(dossierOptions);
      if (onShowToast) {
        onShowToast('✓ Dossiê Executivo de Carreira consolidado em .PDF baixado com sucesso!');
      }
    } catch (err: any) {
      console.error('Erro ao baixar Dossiê:', err);
      if (onShowToast) onShowToast('Erro ao baixar Dossiê em PDF: ' + (err.message || 'Erro'));
    }
  };

  // Open in new browser tab for full-screen view or direct printing
  const handleOpenInNewTab = () => {
    if (previewUrl) {
      window.open(previewUrl, '_blank');
    } else {
      const blob = generateCareerDossierPdfBlob(dossierOptions);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(5px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1050,
      padding: '16px',
    }}>
      <div style={{
        backgroundColor: colors.surface,
        borderRadius: '16px',
        width: '100%',
        maxWidth: '1240px',
        height: '92vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
        border: `1px solid ${colors.border}`,
        overflow: 'hidden',
      }}>
        {/* Modal Top Header */}
        <div style={{
          padding: '16px 24px',
          borderBottom: `1px solid ${colors.border}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: colors.background,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: '#881337',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(136, 19, 55, 0.3)',
            }}>
              <Briefcase size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{
                  fontSize: '18px',
                  fontWeight: 800,
                  color: colors.textPrimary,
                  margin: 0,
                  letterSpacing: '-0.02em',
                }}>
                  Dossiê Executivo de Carreira
                </h2>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  backgroundColor: '#88133718',
                  color: '#881337',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  border: '1px solid #88133730',
                }}>
                  Consolidado em PDF
                </span>
              </div>
              <p style={{
                fontSize: '12px',
                color: colors.textSecondary,
                margin: '2px 0 0 0',
              }}>
                Combina currículo executivo, carta de apresentação personalizada e resumo auditado do pipeline de candidaturas em um único documento formal.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={handleOpenInNewTab}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                fontSize: '12px',
                fontWeight: 600,
                color: colors.textPrimary,
                backgroundColor: colors.surface,
                border: `1px solid ${colors.border}`,
                borderRadius: '8px',
                cursor: 'pointer',
              }}
              title="Abrir o PDF em tela cheia para impressão ou compartilhamento"
            >
              <ExternalLink size={14} />
              <span>Abrir / Imprimir</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 18px',
                fontSize: '13px',
                fontWeight: 700,
                color: '#ffffff',
                backgroundColor: '#881337',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                boxShadow: '0 2px 10px rgba(136, 19, 55, 0.35)',
              }}
              title="Baixar o Dossiê Executivo consolidado completo em formato .PDF"
            >
              <FileDown size={16} />
              <span>Baixar Dossiê (.PDF)</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: colors.textSecondary,
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Fechar janela"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Main Layout: Left Config Form + Right Live PDF Viewer */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '420px 1fr',
          flex: 1,
          overflow: 'hidden',
        }}>
          {/* Left Column: Dossier Configuration Controls */}
          <div style={{
            padding: '20px',
            overflowY: 'auto',
            borderRight: `1px solid ${colors.border}`,
            backgroundColor: colors.background,
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
          }}>
            {/* Quick Summary Pill Banner */}
            <div style={{
              padding: '12px 14px',
              backgroundColor: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: '10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Resumo da Composição do Dossiê:
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '6px', backgroundColor: includeCv ? '#eff6ff' : '#f1f5f9', color: includeCv ? '#1d4ed8' : '#94a3b8' }}>
                  📄 {includeCv ? (activeCv?.name.slice(0, 24) || 'Currículo Ativo') : 'Sem Currículo'}
                </span>
                <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '6px', backgroundColor: (includeCoverLetter && activeCoverLetterText) ? '#ecfdf5' : '#f1f5f9', color: (includeCoverLetter && activeCoverLetterText) ? '#047857' : '#94a3b8' }}>
                  ✉️ {includeCoverLetter && activeCoverLetterText ? 'Carta de Apresentação' : 'Sem Carta'}
                </span>
                <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '6px', backgroundColor: includeApplicationsTable ? '#fdf2f8' : '#f1f5f9', color: includeApplicationsTable ? '#be185d' : '#94a3b8' }}>
                  📊 {includeApplicationsTable ? `${applications.length} Candidaturas` : 'Sem Tabela'}
                </span>
              </div>
            </div>

            {/* Visual Color Palette Selection */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: colors.textPrimary, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <Palette size={14} color={colors.primary} />
                <span>Paleta de Cores Executiva:</span>
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                {[
                  { id: 'bordeaux', name: 'Bordeaux', color: '#881337', sub: 'Executivo' },
                  { id: 'navy', name: 'Azul Navy', color: '#1e3a8a', sub: 'Corporativo' },
                  { id: 'graphite', name: 'Grafite', color: '#1e293b', sub: 'Sóbrio' },
                  { id: 'emerald', name: 'Esmeralda', color: '#065f46', sub: 'Premium' },
                ].map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTheme(item.id as any)}
                    style={{
                      padding: '8px 6px',
                      borderRadius: '8px',
                      border: theme === item.id ? `2px solid ${item.color}` : `1px solid ${colors.border}`,
                      backgroundColor: theme === item.id ? `${item.color}14` : colors.surface,
                      cursor: 'pointer',
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', backgroundColor: item.color }} />
                    <span style={{ fontSize: '11px', fontWeight: 700, color: theme === item.id ? item.color : colors.textPrimary }}>
                      {item.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* SELECTION 1: Currículo Executivo */}
            <div style={{
              backgroundColor: colors.surface,
              padding: '14px',
              borderRadius: '10px',
              border: `1px solid ${colors.border}`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <label style={{ fontSize: '13px', fontWeight: 700, color: colors.textPrimary, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileText size={15} color="#2563eb" />
                  <span>1. Currículo a Incluir</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', cursor: 'pointer', color: colors.textSecondary }}>
                  <input
                    type="checkbox"
                    checked={includeCv}
                    onChange={(e) => setIncludeCv(e.target.checked)}
                  />
                  <span>Incluir no PDF</span>
                </label>
              </div>

              {includeCv && (
                <>
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setSelectedCvSource('saved_cv')}
                      style={{
                        flex: 1,
                        padding: '6px',
                        fontSize: '11px',
                        fontWeight: 600,
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: selectedCvSource === 'saved_cv' ? '#2563eb' : '#e2e8f0',
                        color: selectedCvSource === 'saved_cv' ? '#ffffff' : '#475569',
                        cursor: 'pointer',
                      }}
                    >
                      Currículos Salvos ({cvs.length})
                    </button>
                    {historyCvOptimizations.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedCvSource('history_cv')}
                        style={{
                          flex: 1,
                          padding: '6px',
                          fontSize: '11px',
                          fontWeight: 600,
                          borderRadius: '6px',
                          border: 'none',
                          backgroundColor: selectedCvSource === 'history_cv' ? '#2563eb' : '#e2e8f0',
                          color: selectedCvSource === 'history_cv' ? '#ffffff' : '#475569',
                          cursor: 'pointer',
                        }}
                      >
                        Otimizações IA ({historyCvOptimizations.length})
                      </button>
                    )}
                  </div>

                  {selectedCvSource === 'saved_cv' ? (
                    <select
                      value={selectedCvId}
                      onChange={(e) => setSelectedCvId(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        border: `1px solid ${colors.border}`,
                        backgroundColor: colors.background,
                        color: colors.textPrimary,
                        fontSize: '12px',
                        outline: 'none',
                      }}
                    >
                      {cvs.map(cv => (
                        <option key={cv.id} value={cv.id}>
                          {cv.name} {cv.yearsOfExperience ? `(${cv.yearsOfExperience} anos)` : ''}
                        </option>
                      ))}
                      {cvs.length === 0 && <option value="">Nenhum currículo cadastrado</option>}
                    </select>
                  ) : (
                    <select
                      value={selectedHistoryCvId}
                      onChange={(e) => setSelectedHistoryCvId(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        border: `1px solid ${colors.border}`,
                        backgroundColor: colors.background,
                        color: colors.textPrimary,
                        fontSize: '12px',
                        outline: 'none',
                      }}
                    >
                      {historyCvOptimizations.map(item => (
                        <option key={item.id} value={item.id}>
                          Otimização de {new Date(item.timestamp).toLocaleDateString('pt-BR')} ({item.output.slice(0, 30)}...)
                        </option>
                      ))}
                    </select>
                  )}
                </>
              )}
            </div>

            {/* SELECTION 2: Carta de Apresentação */}
            <div style={{
              backgroundColor: colors.surface,
              padding: '14px',
              borderRadius: '10px',
              border: `1px solid ${colors.border}`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <label style={{ fontSize: '13px', fontWeight: 700, color: colors.textPrimary, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Mail size={15} color="#059669" />
                  <span>2. Carta de Apresentação</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', cursor: 'pointer', color: colors.textSecondary }}>
                  <input
                    type="checkbox"
                    checked={includeCoverLetter}
                    onChange={(e) => setIncludeCoverLetter(e.target.checked)}
                  />
                  <span>Incluir no PDF</span>
                </label>
              </div>

              {includeCoverLetter && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => setSelectedCoverLetterSource('history')}
                      style={{
                        flex: 1,
                        padding: '5px',
                        fontSize: '11px',
                        fontWeight: 600,
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: selectedCoverLetterSource === 'history' ? '#059669' : '#e2e8f0',
                        color: selectedCoverLetterSource === 'history' ? '#ffffff' : '#475569',
                        cursor: 'pointer',
                      }}
                    >
                      Do Histórico ({historyCoverLetters.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedCoverLetterSource('custom')}
                      style={{
                        flex: 1,
                        padding: '5px',
                        fontSize: '11px',
                        fontWeight: 600,
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: selectedCoverLetterSource === 'custom' ? '#059669' : '#e2e8f0',
                        color: selectedCoverLetterSource === 'custom' ? '#ffffff' : '#475569',
                        cursor: 'pointer',
                      }}
                    >
                      Personalizar Texto
                    </button>
                  </div>

                  {selectedCoverLetterSource === 'history' && historyCoverLetters.length > 0 && (
                    <select
                      value={selectedCoverLetterId}
                      onChange={(e) => {
                        setSelectedCoverLetterId(e.target.value);
                        const found = historyCoverLetters.find(h => h.id === e.target.value);
                        if (found) setCustomCoverLetterText(found.output);
                      }}
                      style={{
                        width: '100%',
                        padding: '7px 10px',
                        borderRadius: '6px',
                        border: `1px solid ${colors.border}`,
                        backgroundColor: colors.background,
                        color: colors.textPrimary,
                        fontSize: '12px',
                        outline: 'none',
                      }}
                    >
                      {historyCoverLetters.map(item => (
                        <option key={item.id} value={item.id}>
                          Carta gerada em {new Date(item.timestamp).toLocaleDateString('pt-BR')} ({item.output.slice(0, 35)}...)
                        </option>
                      ))}
                    </select>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <input
                      type="text"
                      placeholder="Empresa Alvo (ex: Tech Corp)"
                      value={targetCompany}
                      onChange={(e) => setTargetCompany(e.target.value)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '6px',
                        border: `1px solid ${colors.border}`,
                        backgroundColor: colors.background,
                        color: colors.textPrimary,
                        fontSize: '12px',
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Cargo Alvo (ex: Tech Lead)"
                      value={targetRole}
                      onChange={(e) => setTargetRole(e.target.value)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '6px',
                        border: `1px solid ${colors.border}`,
                        backgroundColor: colors.background,
                        color: colors.textPrimary,
                        fontSize: '12px',
                      }}
                    />
                  </div>

                  <textarea
                    rows={4}
                    placeholder="Conteúdo da carta de apresentação executiva..."
                    value={selectedCoverLetterSource === 'custom' ? customCoverLetterText : activeCoverLetterText}
                    onChange={(e) => {
                      setCustomCoverLetterText(e.target.value);
                      setSelectedCoverLetterSource('custom');
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: `1px solid ${colors.border}`,
                      backgroundColor: colors.background,
                      color: colors.textPrimary,
                      fontSize: '11px',
                      lineHeight: 1.5,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              )}
            </div>

            {/* SELECTION 3: Resumo & Pipeline de Candidaturas */}
            <div style={{
              backgroundColor: colors.surface,
              padding: '14px',
              borderRadius: '10px',
              border: `1px solid ${colors.border}`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: 700, color: colors.textPrimary, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <BarChart3 size={15} color="#881337" />
                  <span>3. Resumo de Candidaturas</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', cursor: 'pointer', color: colors.textSecondary }}>
                  <input
                    type="checkbox"
                    checked={includeApplicationsTable}
                    onChange={(e) => setIncludeApplicationsTable(e.target.checked)}
                  />
                  <span>Incluir Tabela</span>
                </label>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: colors.textSecondary }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={includeKpis}
                    onChange={(e) => setIncludeKpis(e.target.checked)}
                  />
                  <span>Incluir KPIs de Mercado (Total, Entrevistas, Taxa de Resposta)</span>
                </label>
                <span style={{ fontSize: '11px', color: colors.textSecondary, marginTop: '2px' }}>
                  Total disponível no sistema: <strong>{applications.length}</strong> candidatura(s) registradas.
                </span>
              </div>
            </div>

            {/* Nota Executiva / Objetivo do Candidato */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: colors.textPrimary, display: 'block', marginBottom: '6px' }}>
                Nota Executiva / Objetivo de Carreira (Opcional):
              </label>
              <textarea
                rows={2}
                placeholder="Ex: Disponibilidade para início imediato, modelo híbrido ou remoto em São Paulo, foco em projetos de escala global..."
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: `1px solid ${colors.border}`,
                  backgroundColor: colors.surface,
                  color: colors.textPrimary,
                  fontSize: '11px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Bottom Refresh Button */}
            <button
              type="button"
              onClick={generatePreview}
              disabled={isGenerating}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px',
                borderRadius: '8px',
                backgroundColor: colors.surface,
                border: `1px solid ${colors.border}`,
                color: colors.primary,
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <RefreshCw size={14} className={isGenerating ? 'animate-spin' : ''} />
              <span>{isGenerating ? 'Atualizando Dossiê...' : 'Atualizar Pré-Visualização'}</span>
            </button>
          </div>

          {/* Right Column: Live PDF Document Viewer */}
          <div style={{
            backgroundColor: '#334155',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
          }}>
            {previewUrl ? (
              <iframe
                src={`${previewUrl}#toolbar=0&navpanes=0`}
                title="Pré-visualização do Dossiê Executivo de Carreira"
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                }}
              />
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: '#94a3b8',
                gap: '12px',
              }}>
                <RefreshCw size={36} className="animate-spin" />
                <span style={{ fontSize: '14px', fontWeight: 600 }}>
                  Compilando Dossiê Executivo de Carreira...
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
