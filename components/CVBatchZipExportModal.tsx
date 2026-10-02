// components/CVBatchZipExportModal.tsx - Modal Avançado para Exportação em Lote (.ZIP) de Múltiplos Perfis de Currículo
import React, { useState, useEffect, useMemo } from 'react';
import JSZip from 'jszip';
import { 
  Archive, 
  X, 
  CheckSquare, 
  Square, 
  CheckCircle2, 
  Loader2, 
  FileDown, 
  FileText, 
  Layers, 
  Folders, 
  FolderArchive, 
  FileCheck, 
  Settings2, 
  Sparkles,
  Download,
  ShieldCheck,
  Check,
  AlertCircle
} from 'lucide-react';
import { CV } from '../types';
import { 
  PdfThemeId, 
  ExecutivePdfOptions, 
  generateExecutiveCvPdfBlob 
} from '../services/cvPdfExportService';

export interface CVBatchZipExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  cvs: CV[];
  analysisResults: Record<string, string>;
  initialSelectedIds?: string[];
  colors: any;
  onShowToast?: (msg: string) => void;
}

export type ZipFolderStructure = 'by-profile' | 'by-format' | 'flat';

export const CVBatchZipExportModal: React.FC<CVBatchZipExportModalProps> = ({
  isOpen,
  onClose,
  cvs,
  analysisResults,
  initialSelectedIds = [],
  colors,
  onShowToast
}) => {
  // Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Package formatting configuration
  const [includePdf, setIncludePdf] = useState(true);
  const [pdfTheme, setPdfTheme] = useState<PdfThemeId>('bordeaux');
  const [includeTxt, setIncludeTxt] = useState(true);
  const [includeMd, setIncludeMd] = useState(true);
  const [includeAtsAudit, setIncludeAtsAudit] = useState(true);
  const [includeManifest, setIncludeManifest] = useState(true);
  const [folderStructure, setFolderStructure] = useState<ZipFolderStructure>('by-profile');
  
  // Custom ZIP filename
  const [zipFileName, setZipFileName] = useState('');
  
  // Search & filter within the modal
  const [filterSearch, setFilterSearch] = useState('');

  // Generation & progress state
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressStatus, setProgressStatus] = useState<string>('');
  const [generatedBlobUrl, setGeneratedBlobUrl] = useState<string | null>(null);
  const [generatedFileSize, setGeneratedFileSize] = useState<string | null>(null);
  const [exportComplete, setExportComplete] = useState(false);

  // Sync initial selection when modal opens
  useEffect(() => {
    if (isOpen) {
      const validInitial = initialSelectedIds.filter(id => cvs.some(c => c.id === id));
      // If nothing was selected before opening, default to selecting all CVs
      const nextSelected = validInitial.length > 0 ? validInitial : cvs.map(c => c.id);
      setSelectedIds(nextSelected);

      const dateStr = new Date().toISOString().slice(0, 10);
      setZipFileName(`Curriculos_Processados_Perfis_${dateStr}`);
      setFilterSearch('');
      setIsGenerating(false);
      setProgressPercent(0);
      setProgressStatus('');
      setGeneratedBlobUrl(null);
      setGeneratedFileSize(null);
      setExportComplete(false);
    }
  }, [isOpen, initialSelectedIds, cvs]);

  // Clean up object URL on unmount or close
  useEffect(() => {
    return () => {
      if (generatedBlobUrl) {
        URL.revokeObjectURL(generatedBlobUrl);
      }
    };
  }, [generatedBlobUrl]);

  // Filtered CVs according to search query
  const filteredCvs = useMemo(() => {
    if (!filterSearch.trim()) return cvs;
    const q = filterSearch.toLowerCase().trim();
    return cvs.filter(cv => 
      cv.name.toLowerCase().includes(q) || 
      (cv.yearsOfExperience && `${cv.yearsOfExperience} anos`.includes(q)) ||
      (cv.content && cv.content.toLowerCase().includes(q))
    );
  }, [cvs, filterSearch]);

  if (!isOpen) return null;

  // Selection helpers
  const handleToggleCv = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedIds(cvs.map(c => c.id));
  };

  const handleDeselectAll = () => {
    setSelectedIds([]);
  };

  const handleInvertSelection = () => {
    setSelectedIds(prev => {
      const currentSet = new Set(prev);
      return cvs.filter(c => !currentSet.has(c.id)).map(c => c.id);
    });
  };

  // Helper formatting functions
  const createCleanTxtContent = (cv: CV, analysis?: string): string => {
    const parts: string[] = [];
    parts.push(`======================================================================`);
    parts.push(`CV-AUTOPILOT ENTERPRISE • CURRÍCULO PROCESSADO & OTIMIZADO ATS`);
    parts.push(`Perfil / Versão: ${cv.name}`);
    if (cv.yearsOfExperience !== undefined && cv.yearsOfExperience !== null) {
      parts.push(`Experiência Declarada: ${cv.yearsOfExperience} ano(s)`);
    }
    if (cv.portfolioLinks && cv.portfolioLinks.length > 0) {
      parts.push(`Portfólio / Links Profissionais:`);
      cv.portfolioLinks.forEach(link => parts.push(`  - ${link}`));
    }
    if (cv.technicalSkills && cv.technicalSkills.length > 0) {
      parts.push(`Competências Técnicas (Hard Skills):`);
      parts.push(`  ${cv.technicalSkills.join(', ')}`);
    }
    if (cv.softSkills && cv.softSkills.length > 0) {
      parts.push(`Soft Skills (Competências Comportamentais):`);
      parts.push(`  ${cv.softSkills.join(', ')}`);
    }
    parts.push(`Data de Processamento: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`);
    parts.push(`======================================================================\n`);
    parts.push(cv.content || '');

    if (includeAtsAudit && analysis) {
      parts.push(`\n\n======================================================================`);
      parts.push(`PARECER TÉCNICO ATS & AUDITORIA DE INTELIGÊNCIA ARTIFICIAL:`);
      parts.push(`======================================================================\n`);
      parts.push(analysis);
    }
    return parts.join('\n');
  };

  const createCleanMdContent = (cv: CV, analysis?: string): string => {
    const parts: string[] = [];
    parts.push(`# ${cv.name}\n`);
    if (cv.yearsOfExperience !== undefined && cv.yearsOfExperience !== null) {
      parts.push(`**Experiência Profissional Declarada:** ${cv.yearsOfExperience} ano(s)  `);
    }
    if (cv.portfolioLinks && cv.portfolioLinks.length > 0) {
      parts.push(`**Links & Portfólio:**\n${cv.portfolioLinks.map(l => `- [${l}](${l})`).join('\n')}\n`);
    }
    if (cv.technicalSkills && cv.technicalSkills.length > 0) {
      parts.push(`**Competências Técnicas (Hard Skills):** ${cv.technicalSkills.join(', ')}  \n`);
    }
    if (cv.softSkills && cv.softSkills.length > 0) {
      parts.push(`**Soft Skills (Competências Comportamentais):** ${cv.softSkills.join(', ')}  \n`);
    }
    parts.push(`---\n\n## Conteúdo do Currículo\n\n${cv.content}\n`);
    if (includeAtsAudit && analysis) {
      parts.push(`\n---\n\n## Parecer de IA & Análise de Palavras-Chave ATS\n\n${analysis}\n`);
    }
    return parts.join('\n');
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // ZIP Generation Engine
  const handleGenerateZip = async () => {
    if (selectedIds.length === 0) {
      alert('Selecione pelo menos um perfil de currículo para exportar.');
      return;
    }

    if (!includePdf && !includeTxt && !includeMd && !includeAtsAudit) {
      alert('Selecione pelo menos um formato de arquivo (PDF, TXT, Markdown ou Parecer ATS) para incluir no pacote ZIP.');
      return;
    }

    setIsGenerating(true);
    setProgressPercent(5);
    setProgressStatus('Iniciando empacotamento ZIP...');
    setExportComplete(false);

    try {
      const zip = new JSZip();
      const selectedList = cvs.filter(c => selectedIds.includes(c.id));
      const totalItems = selectedList.length;

      // Prepare Manifest & Profile Index
      let manifestText = `======================================================================
CV-AUTOPILOT ENTERPRISE • PACOTE DE CURRÍCULOS E PERFIS PROFISSIONAIS
======================================================================
Data da Exportação: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}
Total de Perfis Incluídos: ${totalItems}
Organização de Pastas: ${
        folderStructure === 'by-profile' 
          ? 'Subpastas Individuais por Perfil (PDF + TXT + MD + Análise ATS)' 
          : folderStructure === 'by-format' 
          ? 'Pastas Separadas por Formato (/PDFs, /TXT_ATS, /Markdowns)' 
          : 'Arquivos na Raiz do Pacote'
      }
Tema do PDF Executivo: ${pdfTheme.toUpperCase()}

SUMÁRIO DOS PERFIS EXPORTADOS:
`;

      let tableOfProfiles: Array<{
        index: number;
        name: string;
        experienceYears?: number;
        hasAnalysis: boolean;
        linksCount: number;
      }> = [];

      // Process each selected resume
      for (let i = 0; i < totalItems; i++) {
        const cv = selectedList[i];
        const num = i + 1;
        const progressBase = 10 + Math.round((i / totalItems) * 75);
        setProgressPercent(progressBase);
        setProgressStatus(`Processando perfil ${num} de ${totalItems}: "${cv.name}"...`);

        const indexNum = String(num).padStart(2, '0');
        const safeName = cv.name
          .replace(/[/\\?%*:|"<>]/g, '')
          .trim()
          .replace(/\s+/g, '_') || `Perfil_${num}`;
        const folderName = `${indexNum}_${safeName}`;
        const analysis = analysisResults[cv.id];

        tableOfProfiles.push({
          index: num,
          name: cv.name,
          experienceYears: cv.yearsOfExperience,
          hasAnalysis: !!analysis,
          linksCount: cv.portfolioLinks ? cv.portfolioLinks.length : 0
        });

        manifestText += `\n[Perfil ${num}] ${cv.name}
  • Experiência: ${cv.yearsOfExperience !== undefined ? `${cv.yearsOfExperience} ano(s)` : 'Não declarada'}
  • Links / Portfólio: ${cv.portfolioLinks && cv.portfolioLinks.length > 0 ? cv.portfolioLinks.join(', ') : 'Nenhum'}
  • Diagnóstico de Inteligência Artificial ATS: ${analysis ? 'Presente e Otimizado' : 'Não auditado'}
  • Formatos incluídos: ${[
          includePdf ? 'PDF Executivo' : null,
          includeTxt ? 'TXT ATS' : null,
          includeMd ? 'Markdown' : null,
          includeAtsAudit && analysis ? 'Diagnóstico ATS' : null
        ].filter(Boolean).join(', ')}
`;

        // 1. Plain Text for ATS
        if (includeTxt) {
          const txtContent = createCleanTxtContent(cv, analysis);
          if (folderStructure === 'by-profile') {
            zip.folder(folderName)?.file(`${safeName}_ATS.txt`, txtContent);
          } else if (folderStructure === 'by-format') {
            zip.folder('TXT_Otimizados_ATS')?.file(`${indexNum}_${safeName}.txt`, txtContent);
          } else {
            zip.file(`${indexNum}_${safeName}.txt`, txtContent);
          }
        }

        // 2. Markdown File
        if (includeMd) {
          const mdContent = createCleanMdContent(cv, analysis);
          if (folderStructure === 'by-profile') {
            zip.folder(folderName)?.file(`${safeName}.md`, mdContent);
          } else if (folderStructure === 'by-format') {
            zip.folder('Markdowns_Estruturados')?.file(`${indexNum}_${safeName}.md`, mdContent);
          } else {
            zip.file(`${indexNum}_${safeName}.md`, mdContent);
          }
        }

        // 3. Executive PDF
        if (includePdf) {
          try {
            setProgressStatus(`Gerando PDF Executivo ${num}/${totalItems} (${pdfTheme})...`);
            const pdfBlob = generateExecutiveCvPdfBlob(cv, analysis, {
              theme: pdfTheme,
              includeAtsAudit: includeAtsAudit && !!analysis,
              includePortfolioLinks: true,
              spacing: 'normal'
            });
            const pdfBuffer = await pdfBlob.arrayBuffer();

            if (folderStructure === 'by-profile') {
              zip.folder(folderName)?.file(`${safeName}_Executivo.pdf`, pdfBuffer);
            } else if (folderStructure === 'by-format') {
              zip.folder('PDFs_Executivos')?.file(`${indexNum}_${safeName}.pdf`, pdfBuffer);
            } else {
              zip.file(`${indexNum}_${safeName}.pdf`, pdfBuffer);
            }
          } catch (pdfErr) {
            console.warn(`Erro ao gerar PDF para ${cv.name}:`, pdfErr);
          }
        }

        // 4. Standalone ATS Diagnostic File
        if (includeAtsAudit && analysis) {
          const atsHeader = `PARECER TÉCNICO ATS & AUDITORIA DE INTELIGÊNCIA ARTIFICIAL
Documento: ${cv.name}
Data: ${new Date().toLocaleDateString('pt-BR')}
======================================================================\n\n`;
          const atsContent = atsHeader + analysis;

          if (folderStructure === 'by-profile') {
            zip.folder(folderName)?.file(`Parecer_ATS_IA_${safeName}.txt`, atsContent);
          } else if (folderStructure === 'by-format') {
            zip.folder('Pareceres_ATS_IA')?.file(`${indexNum}_Parecer_ATS_${safeName}.txt`, atsContent);
          } else {
            zip.file(`${indexNum}_Parecer_ATS_${safeName}.txt`, atsContent);
          }
        }
      }

      // 5. Manifest & Readme
      if (includeManifest) {
        manifestText += `\n======================================================================
COMO UTILIZAR ESTE PACOTE DE PERFIS:
1. Arquivos [.pdf]: Ideais para envio por e-mail, entrevistas executivas e plataformas que exigem documento final formatado.
2. Arquivos [.txt]: 100% limpos e formatados para o algoritmo de parsing de ATS (Gupy, Kenoby, Workday, Taleo, Greenhouse). Copie e cole ou anexe sem risco de desformatação.
3. Arquivos [.md]: Ideais para documentação no GitHub, Notion ou editores de texto markdown.
4. Pareceres ATS: Avaliações automáticas por IA apontando aderência de palavras-chave e pontos fortes.

Gerado com tecnologia CV-AutoPilot Enterprise.
Copyright by André Azevedo.
======================================================================
`;
        zip.file('00_INDICE_E_MANIFESTO_DE_PERFIS.txt', manifestText);
        zip.file('profiles_metadata.json', JSON.stringify({
          exportedAt: new Date().toISOString(),
          totalProfiles: totalItems,
          profiles: tableOfProfiles
        }, null, 2));
      }

      setProgressPercent(90);
      setProgressStatus('Compactando pacote ZIP em memória...');

      const zipBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });

      const sizeStr = formatFileSize(zipBlob.size);
      setGeneratedFileSize(sizeStr);

      const url = URL.createObjectURL(zipBlob);
      setGeneratedBlobUrl(url);

      const safeZipName = (zipFileName.trim() || 'Curriculos_Perfis').replace(/[^a-zA-Z0-9À-ÿ_\-]/g, '_') + '.zip';

      // Auto-trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = safeZipName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setProgressPercent(100);
      setProgressStatus(`Pacote gerado com sucesso (${sizeStr})!`);
      setExportComplete(true);

      if (onShowToast) {
        onShowToast(`✓ Pacote ZIP com ${totalItems} perfil(is) baixado com sucesso!`);
      }
    } catch (err: any) {
      console.error('Falha ao gerar arquivo ZIP de currículos:', err);
      setProgressStatus('Erro ao empacotar arquivo ZIP: ' + (err.message || 'Erro inesperado'));
      if (onShowToast) {
        onShowToast('Erro ao exportar pacote ZIP. Tente novamente.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const styles = getModalStyles(colors);

  return (
    <div 
      className="responsive-modal-overlay"
      style={styles.backdrop} 
      onClick={(e) => {
        if (e.target === e.currentTarget && !isGenerating) onClose();
      }}
    >
      <div 
        className="responsive-modal-container"
        style={styles.modal}
      >
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerTitleGroup}>
            <div style={styles.headerIcon}>
              <Archive size={22} color={colors.primary} />
            </div>
            <div>
              <h2 style={styles.title}>Exportar Múltiplos Perfis em Arquivo .ZIP</h2>
              <p style={styles.subtitle}>
                Empacote diferentes versões de currículo em um único arquivo compactado com organização em pastas, PDF Executivo e arquivos ATS.
              </p>
            </div>
          </div>
          <button 
            type="button" 
            style={styles.closeBtn} 
            onClick={onClose} 
            disabled={isGenerating}
            title="Fechar janela"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body Grid */}
        <div style={styles.bodyGrid}>
          {/* Left Column: Profiles Selection List */}
          <div style={styles.profilesColumn}>
            <div style={styles.columnHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={18} color={colors.primary} />
                <h3 style={styles.sectionTitle}>
                  Selecione as Versões / Perfis
                </h3>
              </div>
              <span style={styles.selectionCounter}>
                {selectedIds.length} de {cvs.length} selecionados
              </span>
            </div>

            {/* Quick selection toolbar */}
            <div style={styles.quickSelectBar}>
              <button 
                type="button" 
                style={styles.textActionBtn} 
                onClick={handleSelectAll}
                disabled={isGenerating}
              >
                Selecionar Todos
              </button>
              <span style={{ color: colors.border }}>|</span>
              <button 
                type="button" 
                style={styles.textActionBtn} 
                onClick={handleDeselectAll}
                disabled={isGenerating}
              >
                Desmarcar Todos
              </button>
              <span style={{ color: colors.border }}>|</span>
              <button 
                type="button" 
                style={styles.textActionBtn} 
                onClick={handleInvertSelection}
                disabled={isGenerating}
              >
                Inverter
              </button>
            </div>

            {/* Search filter for large lists */}
            {cvs.length > 3 && (
              <div style={styles.searchBoxWrapper}>
                <input 
                  type="text"
                  placeholder="Filtrar perfis por cargo ou palavra-chave..."
                  value={filterSearch}
                  onChange={(e) => setFilterSearch(e.target.value)}
                  style={styles.filterInput}
                  disabled={isGenerating}
                />
              </div>
            )}

            {/* Scrollable list of CVs */}
            <div style={styles.cvScrollList}>
              {filteredCvs.length === 0 ? (
                <div style={styles.emptyFilter}>
                  <p style={{ margin: 0, fontSize: '13px', color: colors.textSecondary }}>
                    Nenhum perfil encontrado com "{filterSearch}".
                  </p>
                </div>
              ) : (
                filteredCvs.map((cv, index) => {
                  const isChecked = selectedIds.includes(cv.id);
                  const hasAudit = !!analysisResults[cv.id];

                  return (
                    <div 
                      key={cv.id} 
                      onClick={() => !isGenerating && handleToggleCv(cv.id)}
                      style={{
                        ...styles.cvItemCard,
                        borderColor: isChecked ? colors.primary : colors.border,
                        backgroundColor: isChecked ? (colors.primaryLight || 'rgba(136, 19, 55, 0.05)') : colors.surface,
                      }}
                    >
                      <div style={styles.checkboxWrapper}>
                        {isChecked ? (
                          <CheckSquare size={18} color={colors.primary} />
                        ) : (
                          <Square size={18} color={colors.textSecondary} />
                        )}
                      </div>

                      <div style={styles.cvItemInfo}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={styles.cvItemName}>{cv.name}</span>
                          {cv.yearsOfExperience !== undefined && cv.yearsOfExperience !== null && (
                            <span style={styles.cvExpPill}>
                              {cv.yearsOfExperience} ano{cv.yearsOfExperience !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>

                        <div style={styles.cvItemMeta}>
                          {hasAudit ? (
                            <span style={styles.auditStatusYes}>
                              <FileCheck size={12} /> Auditado com Parecer ATS
                            </span>
                          ) : (
                            <span style={styles.auditStatusNo}>
                              Conteúdo Base
                            </span>
                          )}
                          {cv.portfolioLinks && cv.portfolioLinks.length > 0 && (
                            <span style={styles.linksIndicator}>
                              • {cv.portfolioLinks.length} link{cv.portfolioLinks.length !== 1 ? 's' : ''}
                            </span>
                          )}
                          {((cv.technicalSkills?.length || 0) + (cv.softSkills?.length || 0)) > 0 && (
                            <span style={{ fontSize: '11px', color: '#2563eb', fontWeight: 600 }}>
                              • {((cv.technicalSkills?.length || 0) + (cv.softSkills?.length || 0))} skills
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Configuration & Formats */}
          <div style={styles.configColumn}>
            {/* Package File Name */}
            <div style={styles.configSection}>
              <label style={styles.configLabel}>
                Nome do Arquivo Compactado (.zip)
              </label>
              <div style={styles.zipInputWrapper}>
                <input 
                  type="text" 
                  value={zipFileName} 
                  onChange={(e) => setZipFileName(e.target.value)}
                  style={styles.zipInput}
                  disabled={isGenerating}
                  placeholder="Curriculos_Processados_Perfis"
                />
                <span style={styles.zipExtension}>.zip</span>
              </div>
            </div>

            {/* Included Formats */}
            <div style={styles.configSection}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Settings2 size={16} color={colors.primary} />
                <label style={styles.configLabel}>
                  Formatos de Arquivo Incluídos por Perfil
                </label>
              </div>

              <div style={styles.formatsList}>
                {/* PDF Format */}
                <label style={styles.formatCheckboxLabel}>
                  <input 
                    type="checkbox" 
                    checked={includePdf} 
                    onChange={(e) => setIncludePdf(e.target.checked)}
                    style={styles.checkboxInput}
                    disabled={isGenerating}
                  />
                  <div style={styles.formatInfo}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FileDown size={14} color={colors.primary} />
                      <strong style={styles.formatTitle}>PDF Executivo Profissional (.pdf)</strong>
                    </div>
                    <span style={styles.formatDescription}>
                      Design elegante executivo pronto para envio formal a diretores e recrutadores.
                    </span>
                  </div>
                </label>

                {/* PDF Theme Selector when PDF is included */}
                {includePdf && (
                  <div style={styles.pdfThemePicker}>
                    <span style={styles.themePickerLabel}>Tema de Cores do PDF Executivo:</span>
                    <div style={styles.themeGrid}>
                      {[
                        { id: 'bordeaux', label: 'Bordeaux Assinatura', color: '#881337' },
                        { id: 'navy', label: 'Corporate Navy', color: '#1e3a8a' },
                        { id: 'slate', label: 'Midnight Slate', color: '#0f172a' },
                        { id: 'emerald', label: 'Leadership Emerald', color: '#065f46' },
                      ].map(theme => (
                        <button
                          key={theme.id}
                          type="button"
                          onClick={() => setPdfTheme(theme.id as PdfThemeId)}
                          disabled={isGenerating}
                          style={{
                            ...styles.themeOptionBtn,
                            borderColor: pdfTheme === theme.id ? colors.primary : colors.border,
                            backgroundColor: pdfTheme === theme.id ? (colors.primaryLight || 'rgba(136, 19, 55, 0.08)') : colors.surface
                          }}
                        >
                          <span style={{ ...styles.themeColorDot, backgroundColor: theme.color }} />
                          <span style={{ fontSize: '12px', fontWeight: pdfTheme === theme.id ? 700 : 500 }}>
                            {theme.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* TXT Format */}
                <label style={styles.formatCheckboxLabel}>
                  <input 
                    type="checkbox" 
                    checked={includeTxt} 
                    onChange={(e) => setIncludeTxt(e.target.checked)}
                    style={styles.checkboxInput}
                    disabled={isGenerating}
                  />
                  <div style={styles.formatInfo}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FileText size={14} color="#059669" />
                      <strong style={styles.formatTitle}>Texto Puro Otimizado para ATS (.txt)</strong>
                    </div>
                    <span style={styles.formatDescription}>
                      100% legível por robôs de triagem (Gupy, Workday, Taleo, Greenhouse) sem quebra de caracteres.
                    </span>
                  </div>
                </label>

                {/* Markdown Format */}
                <label style={styles.formatCheckboxLabel}>
                  <input 
                    type="checkbox" 
                    checked={includeMd} 
                    onChange={(e) => setIncludeMd(e.target.checked)}
                    style={styles.checkboxInput}
                    disabled={isGenerating}
                  />
                  <div style={styles.formatInfo}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FileText size={14} color="#3b82f6" />
                      <strong style={styles.formatTitle}>Markdown Estruturado (.md)</strong>
                    </div>
                    <span style={styles.formatDescription}>
                      Ideal para documentação, perfis de desenvolvedores e portfólios no GitHub/Notion.
                    </span>
                  </div>
                </label>

                {/* ATS AI Audit */}
                <label style={styles.formatCheckboxLabel}>
                  <input 
                    type="checkbox" 
                    checked={includeAtsAudit} 
                    onChange={(e) => setIncludeAtsAudit(e.target.checked)}
                    style={styles.checkboxInput}
                    disabled={isGenerating}
                  />
                  <div style={styles.formatInfo}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Sparkles size={14} color="#d97706" />
                      <strong style={styles.formatTitle}>Auditoria & Parecer de IA ATS (.txt)</strong>
                    </div>
                    <span style={styles.formatDescription}>
                      Inclui diagnóstico com pontuação de aderência, palavras-chave e recomendações da IA.
                    </span>
                  </div>
                </label>

                {/* Manifest Index */}
                <label style={styles.formatCheckboxLabel}>
                  <input 
                    type="checkbox" 
                    checked={includeManifest} 
                    onChange={(e) => setIncludeManifest(e.target.checked)}
                    style={styles.checkboxInput}
                    disabled={isGenerating}
                  />
                  <div style={styles.formatInfo}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FolderArchive size={14} color={colors.primary} />
                      <strong style={styles.formatTitle}>Manifesto Geral de Perfis (README + JSON)</strong>
                    </div>
                    <span style={styles.formatDescription}>
                      Gera sumário com índice numérico de todos os perfis, links e instruções para os recrutadores.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Folder Structure Inside the ZIP */}
            <div style={styles.configSection}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Folders size={16} color={colors.primary} />
                <label style={styles.configLabel}>
                  Estrutura Interna de Pastas no ZIP
                </label>
              </div>

              <div style={styles.structureOptionsGrid}>
                {[
                  {
                    id: 'by-profile',
                    title: 'Pasta por Perfil',
                    desc: 'Ex: /01_Tech_Lead/ (contendo seu PDF, TXT e Markdown). Mantém cada cargo separado.',
                    recommended: true
                  },
                  {
                    id: 'by-format',
                    title: 'Pasta por Formato',
                    desc: 'Ex: /PDFs_Executivos/, /TXT_Otimizados_ATS/. Ideal para envio em massa.',
                    recommended: false
                  },
                  {
                    id: 'flat',
                    title: 'Raiz do Pacote',
                    desc: 'Todos os arquivos juntos na pasta principal numerados ordenadamente.',
                    recommended: false
                  }
                ].map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setFolderStructure(opt.id as ZipFolderStructure)}
                    disabled={isGenerating}
                    style={{
                      ...styles.structureBtn,
                      borderColor: folderStructure === opt.id ? colors.primary : colors.border,
                      backgroundColor: folderStructure === opt.id ? (colors.primaryLight || 'rgba(136, 19, 55, 0.08)') : colors.surface
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <strong style={{ fontSize: '13px', color: colors.textPrimary }}>
                        {opt.title}
                      </strong>
                      {opt.recommended && (
                        <span style={styles.recommendedBadge}>Recomendado</span>
                      )}
                    </div>
                    <span style={styles.structureDesc}>{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar & Status (Visible during or after generation) */}
        {(isGenerating || progressPercent > 0) && (
          <div style={styles.progressContainer}>
            <div style={styles.progressBarWrapper}>
              <div 
                style={{ 
                  ...styles.progressBarFill, 
                  width: `${progressPercent}%`,
                  backgroundColor: exportComplete ? '#10b981' : colors.primary
                }} 
              />
            </div>
            <div style={styles.progressTextRow}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {isGenerating ? (
                  <Loader2 size={15} className="animate-spin" color={colors.primary} />
                ) : exportComplete ? (
                  <CheckCircle2 size={16} color="#10b981" />
                ) : (
                  <AlertCircle size={15} color={colors.textSecondary} />
                )}
                <span style={styles.progressStatusText}>{progressStatus}</span>
              </div>
              <span style={styles.progressPercentText}>{progressPercent}%</span>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div style={styles.footer}>
          <div style={styles.footerLeft}>
            {generatedBlobUrl && (
              <a 
                href={generatedBlobUrl} 
                download={(zipFileName.trim() || 'Curriculos_Perfis') + '.zip'}
                style={styles.reDownloadLink}
              >
                <Download size={14} /> Baixar novamente ({generatedFileSize})
              </a>
            )}
          </div>

          <div style={styles.footerRight}>
            <button 
              type="button" 
              style={styles.cancelBtn} 
              onClick={onClose}
              disabled={isGenerating}
            >
              Fechar
            </button>

            <button 
              type="button" 
              style={selectedIds.length === 0 || isGenerating ? styles.generateBtnDisabled : styles.generateBtn}
              onClick={handleGenerateZip}
              disabled={selectedIds.length === 0 || isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Gerando Pacote .ZIP...</span>
                </>
              ) : (
                <>
                  <Archive size={16} />
                  <span>
                    Gerar e Baixar .ZIP {selectedIds.length > 0 ? `(${selectedIds.length} Perfis)` : ''}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const getModalStyles = (colors: any): { [key: string]: React.CSSProperties } => ({
  backdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '16px',
    backdropFilter: 'blur(3px)',
  },
  modal: {
    backgroundColor: colors.surface,
    borderRadius: '16px',
    width: '100%',
    maxWidth: '920px',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
    border: `1px solid ${colors.border}`,
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '18px 24px',
    borderBottom: `1px solid ${colors.border}`,
    backgroundColor: colors.surface,
  },
  headerTitleGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  headerIcon: {
    width: '42px',
    height: '42px',
    borderRadius: '10px',
    backgroundColor: colors.primaryLight || 'rgba(136, 19, 55, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  title: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: '-0.01em',
  },
  subtitle: {
    margin: '3px 0 0 0',
    fontSize: '13px',
    color: colors.textSecondary,
    maxWidth: '680px',
    lineHeight: 1.4,
  },
  closeBtn: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: colors.textSecondary,
    padding: '6px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bodyGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
    padding: '20px 24px',
    overflowY: 'auto',
    flex: 1,
  },
  profilesColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    borderRight: `1px solid ${colors.border}`,
    paddingRight: '18px',
  },
  columnHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    margin: 0,
    fontSize: '15px',
    fontWeight: '700',
    color: colors.textPrimary,
  },
  selectionCounter: {
    fontSize: '12px',
    fontWeight: '700',
    color: colors.primary,
    backgroundColor: colors.primaryLight || 'rgba(136, 19, 55, 0.08)',
    padding: '2px 8px',
    borderRadius: '10px',
  },
  quickSelectBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '12px',
  },
  textActionBtn: {
    background: 'none',
    border: 'none',
    padding: 0,
    color: colors.primary,
    fontWeight: '600',
    fontSize: '12px',
    cursor: 'pointer',
    textDecoration: 'underline',
  },
  searchBoxWrapper: {
    marginTop: '2px',
  },
  filterInput: {
    width: '100%',
    padding: '8px 12px',
    borderRadius: '8px',
    border: `1px solid ${colors.border}`,
    backgroundColor: colors.background,
    color: colors.textPrimary,
    fontSize: '12px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  cvScrollList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    maxHeight: '340px',
    overflowY: 'auto',
    paddingRight: '4px',
  },
  emptyFilter: {
    padding: '24px',
    textAlign: 'center',
  },
  cvItemCard: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    padding: '10px 12px',
    borderRadius: '10px',
    border: '1px solid',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  checkboxWrapper: {
    marginTop: '2px',
    flexShrink: 0,
  },
  cvItemInfo: {
    flex: 1,
    minWidth: 0,
  },
  cvItemName: {
    fontSize: '13px',
    fontWeight: '700',
    color: colors.textPrimary,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: 'block',
    maxWidth: '220px',
  },
  cvExpPill: {
    fontSize: '10px',
    fontWeight: '700',
    padding: '1px 6px',
    borderRadius: '4px',
    backgroundColor: colors.border,
    color: colors.textSecondary,
    flexShrink: 0,
  },
  cvItemMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: '4px',
    fontSize: '11px',
    color: colors.textSecondary,
  },
  auditStatusYes: {
    display: 'flex',
    alignItems: 'center',
    gap: '3px',
    color: '#059669',
    fontWeight: '600',
  },
  auditStatusNo: {
    color: colors.textSecondary,
  },
  linksIndicator: {
    color: colors.textSecondary,
  },
  configColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  configSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  configLabel: {
    fontSize: '13px',
    fontWeight: '700',
    color: colors.textPrimary,
  },
  zipInputWrapper: {
    display: 'flex',
    alignItems: 'center',
  },
  zipInput: {
    flex: 1,
    padding: '8px 12px',
    border: `1px solid ${colors.border}`,
    borderRight: 'none',
    borderTopLeftRadius: '8px',
    borderBottomLeftRadius: '8px',
    backgroundColor: colors.background,
    color: colors.textPrimary,
    fontSize: '13px',
    outline: 'none',
  },
  zipExtension: {
    padding: '8px 12px',
    backgroundColor: colors.border,
    color: colors.textSecondary,
    fontSize: '13px',
    fontWeight: '600',
    borderTopRightRadius: '8px',
    borderBottomRightRadius: '8px',
    border: `1px solid ${colors.border}`,
  },
  formatsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  formatCheckboxLabel: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    padding: '8px 10px',
    borderRadius: '8px',
    border: `1px solid ${colors.border}`,
    backgroundColor: colors.surface,
    cursor: 'pointer',
  },
  checkboxInput: {
    marginTop: '3px',
    cursor: 'pointer',
  },
  formatInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    flex: 1,
  },
  formatTitle: {
    fontSize: '12px',
    color: colors.textPrimary,
  },
  formatDescription: {
    fontSize: '11px',
    color: colors.textSecondary,
    lineHeight: 1.3,
  },
  pdfThemePicker: {
    marginLeft: '26px',
    padding: '8px 10px',
    borderRadius: '8px',
    backgroundColor: colors.background,
    border: `1px dashed ${colors.border}`,
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  themePickerLabel: {
    fontSize: '11px',
    fontWeight: '700',
    color: colors.textSecondary,
  },
  themeGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '6px',
  },
  themeOptionBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 8px',
    borderRadius: '6px',
    border: '1px solid',
    cursor: 'pointer',
    textAlign: 'left',
  },
  themeColorDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  structureOptionsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '6px',
  },
  structureBtn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid',
    cursor: 'pointer',
    textAlign: 'left',
  },
  recommendedBadge: {
    fontSize: '10px',
    fontWeight: '800',
    color: colors.primary,
    backgroundColor: colors.primaryLight || 'rgba(136, 19, 55, 0.1)',
    padding: '1px 6px',
    borderRadius: '4px',
    textTransform: 'uppercase',
  },
  structureDesc: {
    fontSize: '11px',
    color: colors.textSecondary,
    lineHeight: 1.3,
  },
  progressContainer: {
    padding: '12px 24px',
    backgroundColor: colors.background,
    borderTop: `1px solid ${colors.border}`,
  },
  progressBarWrapper: {
    width: '100%',
    height: '6px',
    backgroundColor: colors.border,
    borderRadius: '3px',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    transition: 'width 0.25s ease',
  },
  progressTextRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '6px',
  },
  progressStatusText: {
    fontSize: '12px',
    fontWeight: '600',
    color: colors.textPrimary,
  },
  progressPercentText: {
    fontSize: '12px',
    fontWeight: '700',
    color: colors.primary,
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 24px',
    borderTop: `1px solid ${colors.border}`,
    backgroundColor: colors.surface,
  },
  footerLeft: {
    display: 'flex',
    alignItems: 'center',
  },
  reDownloadLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    color: colors.primary,
    fontWeight: '700',
    textDecoration: 'none',
  },
  footerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  cancelBtn: {
    padding: '9px 16px',
    borderRadius: '8px',
    border: `1px solid ${colors.border}`,
    backgroundColor: 'transparent',
    color: colors.textPrimary,
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  generateBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: colors.primary,
    color: colors.textOnPrimary || '#ffffff',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 2px 10px rgba(136, 19, 55, 0.35)',
    transition: 'all 0.15s ease',
  },
  generateBtnDisabled: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    borderRadius: '8px',
    border: `1px solid ${colors.border}`,
    backgroundColor: colors.buttonDisabledBg || '#e2e8f0',
    color: colors.buttonDisabledText || '#94a3b8',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'not-allowed',
    opacity: 0.6,
  },
});
