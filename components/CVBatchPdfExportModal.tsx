// components/CVBatchPdfExportModal.tsx - Modal de Exportação em Lote de Currículos em Arquivo PDF Único
import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileDown, 
  X, 
  CheckSquare, 
  Square, 
  CheckCircle2, 
  Loader2, 
  FileText, 
  Layers, 
  Eye, 
  Palette, 
  ShieldCheck, 
  ArrowUp, 
  ArrowDown, 
  ExternalLink,
  Sparkles,
  Download,
  AlertCircle
} from 'lucide-react';
import { CV } from '../types';
import { 
  ExecutiveBatchPdfOptions, 
  generateBatchExecutiveCvPdfBlob, 
  downloadBatchExecutiveCvPdf 
} from '../services/cvBatchPdfService';
import { PdfThemeId } from '../services/cvPdfExportService';

export interface CVBatchPdfExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  cvs: CV[];
  analysisResults: Record<string, string>;
  initialSelectedIds?: string[];
  colors: any;
  onShowToast?: (msg: string) => void;
}

export const CVBatchPdfExportModal: React.FC<CVBatchPdfExportModalProps> = ({
  isOpen,
  onClose,
  cvs,
  analysisResults,
  initialSelectedIds = [],
  colors,
  onShowToast
}) => {
  // Ordered list of selected CVs
  const [orderedCvs, setOrderedCvs] = useState<CV[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Configuration options
  const [selectedTheme, setSelectedTheme] = useState<PdfThemeId>('bordeaux');
  const [dossierTitle, setDossierTitle] = useState('Dossiê Consolidado de Perfis Profissionais');
  const [dossierSubtitle, setDossierSubtitle] = useState('Coletânea Executiva de Currículos Processados & Otimizados ATS');
  const [candidateName, setCandidateName] = useState('');
  const [customNotes, setCustomNotes] = useState('');
  const [includeCoverPage, setIncludeCoverPage] = useState(true);
  const [includeTableOfContents, setIncludeTableOfContents] = useState(true);
  const [includeAtsAudit, setIncludeAtsAudit] = useState(true);
  const [includePortfolioLinks, setIncludePortfolioLinks] = useState(true);

  // Preview & generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [previewPageCount, setPreviewPageCount] = useState<number>(0);
  const [previewFileSize, setPreviewFileSize] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'config' | 'preview'>('config');

  // Sync initial selection when modal opens
  useEffect(() => {
    if (isOpen) {
      const validInitial = initialSelectedIds.filter(id => cvs.some(c => c.id === id));
      const targetIds = validInitial.length > 0 ? validInitial : cvs.map(c => c.id);
      
      setSelectedIds(targetIds);
      
      // Order cvs based on targetIds
      const selectedList = cvs.filter(c => targetIds.includes(c.id));
      const unselectedList = cvs.filter(c => !targetIds.includes(c.id));
      setOrderedCvs([...selectedList, ...unselectedList]);

      // Preset candidate name from first selected CV if empty
      if (selectedList.length > 0) {
        const firstName = selectedList[0].name.replace(/^curr[íi]culo\s*(de)?\s*/i, '').trim();
        setCandidateName(firstName);
      }

      setDossierTitle('Dossiê Consolidado de Perfis Profissionais');
      setDossierSubtitle('Coletânea Executiva de Currículos Processados & Otimizados ATS');
      setActiveTab('config');
    }
  }, [isOpen, initialSelectedIds, cvs]);

  // Clean up preview Blob URL
  useEffect(() => {
    return () => {
      if (previewBlobUrl) {
        URL.revokeObjectURL(previewBlobUrl);
      }
    };
  }, [previewBlobUrl]);

  // Currently active selected CVs in custom order
  const activeSelectedCvs = useMemo(() => {
    return orderedCvs.filter(c => selectedIds.includes(c.id));
  }, [orderedCvs, selectedIds]);

  // Toggle selection of a single CV
  const handleToggleSelect = (cvId: string) => {
    setSelectedIds(prev => 
      prev.includes(cvId) ? prev.filter(id => id !== cvId) : [...prev, cvId]
    );
  };

  // Select all or deselect all
  const handleToggleSelectAll = () => {
    if (selectedIds.length === cvs.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(cvs.map(c => c.id));
    }
  };

  // Reordering helpers
  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    setOrderedCvs(prev => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[index - 1];
      next[index - 1] = temp;
      return next;
    });
  };

  const handleMoveDown = (index: number) => {
    if (index >= orderedCvs.length - 1) return;
    setOrderedCvs(prev => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[index + 1];
      next[index + 1] = temp;
      return next;
    });
  };

  // Build Options Object
  const buildOptions = (): ExecutiveBatchPdfOptions => ({
    theme: selectedTheme,
    dossierTitle,
    dossierSubtitle,
    candidateName,
    customNotes,
    includeCoverPage,
    includeTableOfContents,
    includeAtsAudit,
    includePortfolioLinks,
    spacing: 'normal'
  });

  // Generate Preview Blob
  const handleGeneratePreview = async () => {
    if (activeSelectedCvs.length === 0) return;
    setIsGenerating(true);
    try {
      const options = buildOptions();
      const blob = generateBatchExecutiveCvPdfBlob(activeSelectedCvs, analysisResults, options);
      
      const sizeKb = (blob.size / 1024).toFixed(1);
      const sizeMb = (blob.size / (1024 * 1024)).toFixed(2);
      setPreviewFileSize(blob.size > 1024 * 1024 ? `${sizeMb} MB` : `${sizeKb} KB`);

      const url = URL.createObjectURL(blob);
      if (previewBlobUrl) {
        URL.revokeObjectURL(previewBlobUrl);
      }
      setPreviewBlobUrl(url);
      setActiveTab('preview');
    } catch (err) {
      console.error('Erro ao gerar prévia do PDF em lote:', err);
      if (onShowToast) onShowToast('Erro ao gerar prévia do PDF. Tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Download Action
  const handleDownload = () => {
    if (activeSelectedCvs.length === 0) {
      if (onShowToast) onShowToast('Selecione pelo menos um currículo para exportar em PDF.');
      return;
    }

    try {
      setIsGenerating(true);
      const options = buildOptions();
      downloadBatchExecutiveCvPdf(activeSelectedCvs, analysisResults, options);
      if (onShowToast) {
        onShowToast(`✓ ${activeSelectedCvs.length} currículo(s) consolidado(s) e exportado(s) em arquivo único (.PDF)!`);
      }
      onClose();
    } catch (err) {
      console.error('Erro ao baixar PDF em lote:', err);
      if (onShowToast) onShowToast('Erro ao exportar PDF único.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 2500,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '920px',
        maxHeight: '92vh',
        backgroundColor: colors.surface || '#ffffff',
        borderRadius: '18px',
        border: `1.5px solid ${colors.borderFocus || '#881337'}`,
        color: colors.textPrimary || '#1f2937',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        margin: 'auto'
      }}>
        {/* HEADER DO MODAL */}
        <div style={{
          padding: '20px 24px',
          borderBottom: `1px solid ${colors.border}`,
          backgroundColor: colors.background,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #881337 0%, #be123c 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 12px rgba(136, 19, 55, 0.35)',
              flexShrink: 0
            }}>
              <FileDown size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: colors.textPrimary }}>
                  Exportar Currículos em Arquivo Único (PDF)
                </h3>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  backgroundColor: 'rgba(136, 19, 55, 0.12)',
                  color: '#881337',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  border: '1px solid rgba(136, 19, 55, 0.25)'
                }}>
                  Dossiê Consolidado
                </span>
              </div>
              <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: colors.textSecondary }}>
                Unifique múltiplos perfis e versões de currículo em um documento PDF corporativo contínuo com capa e sumário
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: colors.textSecondary,
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        {/* NAVEGAÇÃO DE ABAS: CONFIGURAÇÃO vs. PRÉ-VISUALIZAÇÃO */}
        <div style={{
          display: 'flex',
          borderBottom: `1px solid ${colors.border}`,
          backgroundColor: colors.surface,
          padding: '0 24px'
        }}>
          <button
            type="button"
            onClick={() => setActiveTab('config')}
            style={{
              padding: '12px 18px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'config' ? `2.5px solid ${colors.primary || '#881337'}` : '2.5px solid transparent',
              color: activeTab === 'config' ? colors.primary : colors.textSecondary,
              fontSize: '13.5px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Layers size={16} />
            <span>Configuração & Seleção ({activeSelectedCvs.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (!previewBlobUrl) {
                handleGeneratePreview();
              } else {
                setActiveTab('preview');
              }
            }}
            disabled={activeSelectedCvs.length === 0}
            style={{
              padding: '12px 18px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'preview' ? `2.5px solid ${colors.primary || '#881337'}` : '2.5px solid transparent',
              color: activeTab === 'preview' ? colors.primary : colors.textSecondary,
              fontSize: '13.5px',
              fontWeight: 700,
              cursor: activeSelectedCvs.length === 0 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              opacity: activeSelectedCvs.length === 0 ? 0.5 : 1
            }}
          >
            <Eye size={16} />
            <span>Visualizar Prévia do PDF</span>
            {previewFileSize && (
              <span style={{
                fontSize: '10px',
                padding: '1px 6px',
                borderRadius: '8px',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                color: '#059669',
                fontWeight: 800
              }}>
                {previewFileSize}
              </span>
            )}
          </button>
        </div>

        {/* CORPO DO MODAL */}
        <div style={{
          padding: '20px 24px',
          overflowY: 'auto',
          maxHeight: '62vh',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          {activeTab === 'config' ? (
            <>
              {/* SEÇÃO 1: SELEÇÃO E ORDENAÇÃO DOS CURRÍCULOS */}
              <div style={{
                padding: '16px',
                borderRadius: '14px',
                backgroundColor: colors.background,
                border: `1px solid ${colors.border}`
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Layers size={17} color={colors.primary} />
                    <span style={{ fontSize: '13.5px', fontWeight: 800, color: colors.textPrimary }}>
                      Currículos para Incluir no Arquivo Único:
                    </span>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      backgroundColor: colors.primaryLight,
                      color: colors.primary,
                      padding: '2px 8px',
                      borderRadius: '10px'
                    }}>
                      {activeSelectedCvs.length} de {cvs.length} selecionados
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleToggleSelectAll}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: colors.primary,
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    {selectedIds.length === cvs.length ? (
                      <>
                        <Square size={14} />
                        <span>Desmarcar Todos</span>
                      </>
                    ) : (
                      <>
                        <CheckSquare size={14} />
                        <span>Selecionar Todos</span>
                      </>
                    )}
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {orderedCvs.map((cv, idx) => {
                    const isSelected = selectedIds.includes(cv.id);
                    const hasAnalysis = !!analysisResults[cv.id];

                    return (
                      <div
                        key={cv.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          borderRadius: '10px',
                          border: `1px solid ${isSelected ? (colors.primaryHover || '#be123c') : colors.border}`,
                          backgroundColor: isSelected ? (colors.surface || '#ffffff') : 'transparent',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                          <button
                            type="button"
                            onClick={() => handleToggleSelect(cv.id)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              color: isSelected ? colors.primary : colors.textMuted,
                              padding: 0,
                              display: 'flex',
                              alignItems: 'center'
                            }}
                          >
                            {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                          </button>

                          <div style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '6px',
                            backgroundColor: isSelected ? colors.primaryLight : colors.border,
                            color: isSelected ? colors.primary : colors.textMuted,
                            fontSize: '11px',
                            fontWeight: 800,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            {idx + 1}
                          </div>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              fontSize: '13px',
                              fontWeight: isSelected ? 700 : 500,
                              color: isSelected ? colors.textPrimary : colors.textSecondary,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              {cv.name}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: colors.textMuted }}>
                              {cv.yearsOfExperience && <span>{cv.yearsOfExperience} ano(s) de exp.</span>}
                              {hasAnalysis && (
                                <span style={{ color: '#059669', fontWeight: 600 }}>• Parecer ATS disponível</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Botões de reordenação */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <button
                            type="button"
                            onClick={() => handleMoveUp(idx)}
                            disabled={idx === 0}
                            style={{
                              padding: '4px 6px',
                              borderRadius: '6px',
                              border: `1px solid ${colors.border}`,
                              background: colors.surface,
                              color: idx === 0 ? colors.textMuted : colors.textPrimary,
                              cursor: idx === 0 ? 'not-allowed' : 'pointer',
                              opacity: idx === 0 ? 0.4 : 1
                            }}
                            title="Mover currículo para cima no documento consolidado"
                          >
                            <ArrowUp size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveDown(idx)}
                            disabled={idx === orderedCvs.length - 1}
                            style={{
                              padding: '4px 6px',
                              borderRadius: '6px',
                              border: `1px solid ${colors.border}`,
                              background: colors.surface,
                              color: idx === orderedCvs.length - 1 ? colors.textMuted : colors.textPrimary,
                              cursor: idx === orderedCvs.length - 1 ? 'not-allowed' : 'pointer',
                              opacity: idx === orderedCvs.length - 1 ? 0.4 : 1
                            }}
                            title="Mover currículo para baixo no documento consolidado"
                          >
                            <ArrowDown size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SEÇÃO 2: TEMA VISUAL DO PDF */}
              <div style={{
                padding: '16px',
                borderRadius: '14px',
                backgroundColor: colors.background,
                border: `1px solid ${colors.border}`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <Palette size={17} color={colors.primary} />
                  <span style={{ fontSize: '13.5px', fontWeight: 800, color: colors.textPrimary }}>
                    Padrão Visual Executivo (Cores do Dossiê):
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                  {[
                    { id: 'bordeaux', name: 'Executivo Bordeaux', hex: '#881337', sub: 'Assinatura CV-AutoPilot' },
                    { id: 'navy', name: 'Corporate Navy', hex: '#1e3a8a', sub: 'Institucional & Finanças' },
                    { id: 'slate', name: 'Midnight Minimalist', hex: '#0f172a', sub: 'Tecnologia & Inovação' },
                    { id: 'emerald', name: 'Leadership Emerald', hex: '#065f46', sub: 'Sustentabilidade & Gestão' }
                  ].map(themeItem => {
                    const isSelected = selectedTheme === themeItem.id;
                    return (
                      <button
                        key={themeItem.id}
                        type="button"
                        onClick={() => setSelectedTheme(themeItem.id as PdfThemeId)}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '10px',
                          border: isSelected ? `2px solid ${themeItem.hex}` : `1px solid ${colors.border}`,
                          backgroundColor: colors.surface,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          cursor: 'pointer',
                          textAlign: 'left',
                          boxShadow: isSelected ? '0 2px 8px rgba(0,0,0,0.08)' : 'none'
                        }}
                      >
                        <div style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          backgroundColor: themeItem.hex,
                          flexShrink: 0,
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        }} />
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 700, color: colors.textPrimary }}>
                            {themeItem.name}
                          </div>
                          <div style={{ fontSize: '10.5px', color: colors.textMuted }}>
                            {themeItem.sub}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SEÇÃO 3: TÍTULOS E IDENTIFICAÇÃO DO DOCUMENTO */}
              <div style={{
                padding: '16px',
                borderRadius: '14px',
                backgroundColor: colors.background,
                border: `1px solid ${colors.border}`,
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '14px'
              }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: colors.textSecondary, marginBottom: '6px' }}>
                    TÍTULO PRINCIPAL DO DOSSIÊ:
                  </label>
                  <input
                    type="text"
                    value={dossierTitle}
                    onChange={e => setDossierTitle(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: `1px solid ${colors.borderFocus || '#881337'}`,
                      backgroundColor: colors.surface,
                      color: colors.inputText,
                      fontSize: '13px',
                      fontWeight: 600,
                      outline: 'none'
                    }}
                    placeholder="Ex: Dossiê de Perfis de Liderança Técnica"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: colors.textSecondary, marginBottom: '6px' }}>
                    NOME DO CANDIDATO / TITULAR:
                  </label>
                  <input
                    type="text"
                    value={candidateName}
                    onChange={e => setCandidateName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: `1px solid ${colors.borderFocus || '#881337'}`,
                      backgroundColor: colors.surface,
                      color: colors.inputText,
                      fontSize: '13px',
                      fontWeight: 600,
                      outline: 'none'
                    }}
                    placeholder="Nome que constará na capa oficial"
                  />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: colors.textSecondary, marginBottom: '6px' }}>
                    MENSAGEM EXECUTIVA OU OBJETIVO (OPCIONAL NA CAPA):
                  </label>
                  <input
                    type="text"
                    value={customNotes}
                    onChange={e => setCustomNotes(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: `1px solid ${colors.borderFocus || '#881337'}`,
                      backgroundColor: colors.surface,
                      color: colors.inputText,
                      fontSize: '13px',
                      fontWeight: 500,
                      outline: 'none'
                    }}
                    placeholder="Ex: Compilação de currículos para processos seletivos e apresentações executivas."
                  />
                </div>
              </div>

              {/* SEÇÃO 4: SEÇÕES E METADADOS INCLUSOS */}
              <div style={{
                padding: '16px',
                borderRadius: '14px',
                backgroundColor: colors.background,
                border: `1px solid ${colors.border}`,
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '12px'
              }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12.5px', fontWeight: 600, color: colors.textPrimary }}>
                  <input
                    type="checkbox"
                    checked={includeCoverPage}
                    onChange={e => setIncludeCoverPage(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: colors.primary }}
                  />
                  <span>Incluir Capa Executiva</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12.5px', fontWeight: 600, color: colors.textPrimary }}>
                  <input
                    type="checkbox"
                    checked={includeTableOfContents}
                    disabled={!includeCoverPage}
                    onChange={e => setIncludeTableOfContents(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: colors.primary }}
                  />
                  <span>Sumário com Páginas Iniciais</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12.5px', fontWeight: 600, color: colors.textPrimary }}>
                  <input
                    type="checkbox"
                    checked={includeAtsAudit}
                    onChange={e => setIncludeAtsAudit(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: colors.primary }}
                  />
                  <span>Incluir Parecer / Auditoria ATS</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12.5px', fontWeight: 600, color: colors.textPrimary }}>
                  <input
                    type="checkbox"
                    checked={includePortfolioLinks}
                    onChange={e => setIncludePortfolioLinks(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: colors.primary }}
                  />
                  <span>Incluir Links de Portfólio</span>
                </label>
              </div>
            </>
          ) : (
            /* ABA DE PRÉ-VISUALIZAÇÃO DO PDF */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 14px',
                borderRadius: '10px',
                backgroundColor: colors.background,
                border: `1px solid ${colors.border}`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: colors.textPrimary }}>
                  <CheckCircle2 size={16} color="#059669" />
                  <span>Pré-visualização do Documento Consolidado</span>
                  {previewFileSize && <span style={{ color: colors.textMuted }}>• Tamanho: {previewFileSize}</span>}
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  {previewBlobUrl && (
                    <a
                      href={previewBlobUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        backgroundColor: colors.surface,
                        border: `1px solid ${colors.border}`,
                        color: colors.primary,
                        fontSize: '11.5px',
                        fontWeight: 700,
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                    >
                      <ExternalLink size={13} />
                      <span>Abrir em Nova Aba</span>
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={handleGeneratePreview}
                    disabled={isGenerating}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      backgroundColor: colors.primary,
                      border: 'none',
                      color: '#ffffff',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      cursor: isGenerating ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    {isGenerating ? <Loader2 size={13} className="animate-spin" /> : <Eye size={13} />}
                    <span>Atualizar Prévia</span>
                  </button>
                </div>
              </div>

              {previewBlobUrl ? (
                <div style={{
                  width: '100%',
                  height: '480px',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  border: `1px solid ${colors.border}`
                }}>
                  <iframe
                    src={`${previewBlobUrl}#toolbar=0&navpanes=0`}
                    title="Prévia do PDF Consolidado"
                    style={{ width: '100%', height: '100%', border: 'none' }}
                  />
                </div>
              ) : (
                <div style={{
                  padding: '40px 20px',
                  textAlign: 'center',
                  backgroundColor: colors.background,
                  borderRadius: '12px',
                  border: `1px solid ${colors.border}`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <Loader2 size={32} className="animate-spin" color={colors.primary} />
                  <span style={{ fontSize: '14px', fontWeight: 600, color: colors.textSecondary }}>
                    Gerando pré-visualização do PDF consolidado...
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RODAPÉ DO MODAL (AÇÕES) */}
        <div style={{
          padding: '16px 24px',
          borderTop: `1px solid ${colors.border}`,
          backgroundColor: colors.background,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: colors.textMuted }}>
            <ShieldCheck size={16} color="#059669" />
            <span>Padrão Corporativo • Compatibilidade ATS 99% • Arquivo Único .PDF</span>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '9px 18px',
                borderRadius: '10px',
                border: `1px solid ${colors.border}`,
                backgroundColor: 'transparent',
                color: colors.textSecondary,
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Cancelar
            </button>

            {activeTab === 'config' && (
              <button
                type="button"
                onClick={handleGeneratePreview}
                disabled={activeSelectedCvs.length === 0 || isGenerating}
                style={{
                  padding: '9px 16px',
                  borderRadius: '10px',
                  border: `1px solid ${colors.borderFocus || '#881337'}`,
                  backgroundColor: colors.surface,
                  color: colors.primary,
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: activeSelectedCvs.length === 0 || isGenerating ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {isGenerating ? <Loader2 size={15} className="animate-spin" /> : <Eye size={15} />}
                <span>Ver Prévia</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleDownload}
              disabled={activeSelectedCvs.length === 0 || isGenerating}
              style={{
                padding: '9px 20px',
                borderRadius: '10px',
                border: 'none',
                background: 'linear-gradient(135deg, #881337 0%, #be123c 100%)',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 700,
                cursor: activeSelectedCvs.length === 0 || isGenerating ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(136, 19, 55, 0.35)',
                opacity: activeSelectedCvs.length === 0 ? 0.6 : 1
              }}
            >
              {isGenerating ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Gerando PDF Único...</span>
                </>
              ) : (
                <>
                  <Download size={15} />
                  <span>Gerar e Baixar PDF Único ({activeSelectedCvs.length})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
