// HistoryView Component - Enhanced with Executive Career Dossier (.PDF) Consolidation
import React, { useState, useContext, useEffect } from 'react';
import { 
  Briefcase, 
  FileDown, 
  FileText, 
  Sparkles as SparklesIcon, 
  Download as DownloadIcon, 
  CheckCircle2, 
  ChevronRight,
  Layers,
  Building,
  Mail,
  HardDrive,
  X
} from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { HistoryItem, GenerationHistoryItem, CV, Application } from '../types';
import { ThemeContext } from '../ThemeContext';
import { CareerDossierPdfModal } from './CareerDossierPdfModal';
import { OfflineDocumentsModal } from './OfflineDocumentsModal';
import { useOfflineDocuments } from '../hooks/useOfflineDocuments';

const HistoryView: React.FC = () => {
    const { colors } = useContext(ThemeContext);
    const styles = getStyles(colors);

    const [history] = useLocalStorage<HistoryItem[]>('generationHistory', []);
    const [cvs] = useLocalStorage<CV[]>('cvs', []);
    const [applications] = useLocalStorage<Application[]>('applications', []);

    // Dossier Modal State
    const [isDossierModalOpen, setIsDossierModalOpen] = useState(false);
    const [selectedDossierItem, setSelectedDossierItem] = useState<GenerationHistoryItem | null>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // Salvar para Leitura Offline (IndexedDB via Service Worker) State
    const { isSaved, toggleSaveHistory, offlineDocs } = useOfflineDocuments();
    const [isOfflineDocsModalOpen, setIsOfflineDocsModalOpen] = useState(false);

    // Auto-dismiss toast feedback
    useEffect(() => {
        if (toastMessage) {
            const timer = setTimeout(() => setToastMessage(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [toastMessage]);

    const handleExportTxt = () => {
        if (history.length === 0) return;
    
        const formattedHistory = history.map(item => {
            if ('leads' in item) {
                const leadsText = item.leads.map(lead => `  - ${lead.companyName}: ${lead.contactInfo} (${lead.notes})`).join('\n');
                return `
==================================================
Tipo: ${item.type}
Data: ${new Date(item.timestamp).toLocaleString()}
Termo de Busca: ${item.searchTerm}
Localização: ${item.location || 'N/A'}
==================================================

[Leads Encontrados]
-------------------
${leadsText}
`;
            } else { // GenerationHistoryItem
                 return `
==================================================
Tipo: ${item.type}
Data: ${new Date(item.timestamp).toLocaleString()}
==================================================

[Currículo de Entrada]
----------------------
${item.inputCv}

[Descrição da Vaga de Entrada]
------------------------------
${item.inputJobDescription}

[Resultado Gerado]
------------------
${item.output}
`;
            }
        }).join('\n\n');
    
        const blob = new Blob([formattedHistory], { type: 'text/plain;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `historico-cv-autopilot-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        setToastMessage('Histórico exportado com sucesso em .TXT');
    };

    const handleOpenDossier = (item?: GenerationHistoryItem) => {
        setSelectedDossierItem(item || null);
        setIsDossierModalOpen(true);
    };

    return (
        <div style={styles.container}>
            {/* Toast Feedback Banner */}
            {toastMessage && (
                <div style={styles.toast}>
                    <CheckCircle2 size={16} color={colors.primary} />
                    <span style={{ flex: 1 }}>{toastMessage}</span>
                    <button onClick={() => setToastMessage(null)} style={styles.toastClose}>&times;</button>
                </div>
            )}

            {/* Top Page Header */}
            <div style={styles.pageHeader}>
                <div>
                    <h1 style={styles.header}>Histórico de Gerações & Dossiê</h1>
                    <p style={styles.headerSubtitle}>
                        Acompanhe conteúdos gerados por IA, leads e gere o <strong>Dossiê Executivo de Carreira</strong> consolidado em PDF com currículo, cartas e candidaturas.
                    </p>
                </div>

                <div style={styles.headerActions}>
                    {/* Botão de Leitura Offline (IndexedDB / Workbox) */}
                    <button
                        type="button"
                        onClick={() => setIsOfflineDocsModalOpen(true)}
                        style={styles.offlineHeaderButton}
                        title="Consultar currículos e cartas de apresentação salvos para leitura offline no IndexedDB"
                    >
                        <HardDrive size={15} color="#10b981" />
                        <span>Leitura Offline ({offlineDocs.length})</span>
                    </button>

                    {/* PRIMARY ACTION: Gerar Dossiê Executivo de Carreira em PDF */}
                    <button
                        type="button"
                        onClick={() => handleOpenDossier()}
                        style={styles.dossierPrimaryButton}
                        title="Consolidar currículo, carta de apresentação e resumo das candidaturas em um PDF Executivo profissional"
                    >
                        <Briefcase size={16} />
                        <span>Dossiê Executivo de Carreira (.PDF)</span>
                        <span style={styles.dossierBadge}>Consolidado</span>
                    </button>

                    <button 
                        onClick={handleExportTxt} 
                        style={history.length === 0 ? styles.exportButtonDisabled : styles.exportButton} 
                        disabled={history.length === 0}
                        title="Exportar registros do histórico em arquivo de texto simples (.txt)"
                    >
                        <DownloadIcon size={14} />
                        <span>Exportar .TXT</span>
                    </button>
                </div>
            </div>

            {/* Executive Career Dossier Highlight Banner */}
            <div style={styles.dossierPromoBanner}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', flex: '1 1 500px' }}>
                    <div style={styles.dossierPromoIcon}>
                        <FileDown size={24} />
                    </div>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <strong style={{ fontSize: '15px', color: colors.textPrimary }}>
                                Dossiê Executivo de Carreira (Consolidação em PDF)
                            </strong>
                            <span style={styles.promoTag}>Novo Recurso</span>
                        </div>
                        <p style={{ margin: '4px 0 8px 0', fontSize: '13px', color: colors.textSecondary, lineHeight: 1.5 }}>
                            Gere um documento corporativo unificado de alto nível que combina o seu <strong>currículo formatado</strong>, <strong>carta de apresentação estratégica</strong> e <strong>tabela com resumo auditado de candidaturas ativas</strong> com KPIs de mercado.
                        </p>
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                            <span style={styles.kpiPill}>📄 {cvs.length} Currículo{cvs.length !== 1 ? 's' : ''} disponível{cvs.length !== 1 ? 'is' : ''}</span>
                            <span style={styles.kpiPill}>✉️ {history.filter(h => !('leads' in h) && h.type === 'Carta de Apresentação').length} Carta{history.filter(h => !('leads' in h) && h.type === 'Carta de Apresentação').length !== 1 ? 's' : ''} gerada{history.filter(h => !('leads' in h) && h.type === 'Carta de Apresentação').length !== 1 ? 's' : ''}</span>
                            <span style={styles.kpiPill}>📊 {applications.length} Candidatura{applications.length !== 1 ? 's' : ''} no radar</span>
                        </div>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => handleOpenDossier()}
                    style={styles.dossierBannerActionBtn}
                    title="Configurar e baixar o Dossiê Executivo de Carreira em PDF"
                >
                    <SparklesIcon size={15} />
                    <span>Configurar e Gerar Dossiê (.PDF)</span>
                </button>
            </div>

            {/* History Items List */}
            {history.length === 0 ? (
                <div style={styles.emptyState}>
                    <Layers size={44} color={colors.textSecondary} style={{ opacity: 0.6, margin: '0 auto 12px auto' }} />
                    <h3 style={{ margin: '0 0 6px 0', color: colors.textPrimary }}>Nenhum histórico registrado ainda</h3>
                    <p style={{ margin: '0 0 16px 0', color: colors.textSecondary, maxWidth: '520px', lineHeight: 1.5 }}>
                        Utilize o módulo de <strong>Ferramentas de IA</strong> para otimizar currículos e gerar cartas de apresentação personalizadas, ou gere o <strong>Dossiê Executivo de Carreira</strong> diretamente com seus dados já cadastrados.
                    </p>
                    <button
                        type="button"
                        onClick={() => handleOpenDossier()}
                        style={styles.dossierPrimaryButton}
                    >
                        <Briefcase size={16} />
                        <span>Gerar Dossiê com Dados Atuais</span>
                    </button>
                </div>
            ) : (
                <ul style={styles.list}>
                    {history.map((item) => {
                        if ('leads' in item) { // Type guard for LeadHistoryItem
                            return (
                                <li key={item.id} style={styles.listItem}>
                                    <div style={styles.itemHeader}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={styles.typeBadgeLead}>Busca de Leads</span>
                                            <strong style={styles.itemType}>{item.type}</strong>
                                        </div>
                                        <span style={styles.itemTimestamp}>{new Date(item.timestamp).toLocaleString('pt-BR')}</span>
                                    </div>
                                    <div style={styles.leadSearchInfo}>
                                        <span><strong>Termo:</strong> {item.searchTerm}</span>
                                        {item.location && <span><strong>Localização:</strong> {item.location}</span>}
                                        <span><strong>Total:</strong> {item.leads.length} leads</span>
                                    </div>
                                    <details>
                                        <summary style={styles.summary}>Ver {item.leads.length} Leads Encontrados</summary>
                                        <div style={styles.detailsContent}>
                                            <ul style={styles.leadList}>
                                                {item.leads.map((lead, index) => (
                                                    <li key={index} style={styles.leadListItem}>
                                                        <strong>{lead.companyName}</strong>
                                                        <p style={styles.contactInfo}>
                                                            <a href={lead.contactInfo.startsWith('http') ? lead.contactInfo : `mailto:${lead.contactInfo}`} target="_blank" rel="noopener noreferrer">
                                                                {lead.contactInfo}
                                                            </a>
                                                        </p>
                                                        <p style={styles.notes}><em>{lead.notes}</em></p>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </details>
                                </li>
                            );
                        } else { // GenerationHistoryItem
                            const isCoverLetter = item.type === 'Carta de Apresentação';
                            return (
                                <li key={item.id} style={styles.listItem}>
                                    <div style={styles.itemHeader}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                            <span style={isCoverLetter ? styles.typeBadgeLetter : styles.typeBadgeCv}>
                                                {isCoverLetter ? '✉️ Carta' : '📄 Currículo IA'}
                                            </span>
                                            <strong style={styles.itemType}>{item.type}</strong>
                                            {isSaved(item.id) && (
                                                <span style={styles.offlineSavedTag}>
                                                    <HardDrive size={11} /> Offline Pronto
                                                </span>
                                            )}
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                            {/* Action: Salvar para Leitura Offline (IndexedDB) */}
                                            <button
                                                type="button"
                                                onClick={async () => {
                                                    const res = await toggleSaveHistory(item);
                                                    setToastMessage(res.saved 
                                                        ? `${item.type} salva no IndexedDB para leitura offline!` 
                                                        : `${item.type} removida do modo offline.`
                                                    );
                                                }}
                                                style={{
                                                    ...styles.itemOfflineBtn,
                                                    backgroundColor: isSaved(item.id) ? 'rgba(16, 185, 129, 0.12)' : 'transparent',
                                                    borderColor: isSaved(item.id) ? '#10b981' : colors.border,
                                                    color: isSaved(item.id) ? '#10b981' : colors.textSecondary
                                                }}
                                                title={isSaved(item.id) ? "Disponível offline no IndexedDB (Clique para remover)" : "Salvar esta carta ou documento para leitura offline no IndexedDB"}
                                            >
                                                {isSaved(item.id) ? <CheckCircle2 size={12} color="#10b981" /> : <HardDrive size={12} />}
                                                <span>{isSaved(item.id) ? 'Salvo Offline' : 'Salvar Offline'}</span>
                                            </button>

                                            {/* Action: Incluir no Dossiê Executivo */}
                                            <button
                                                type="button"
                                                onClick={() => handleOpenDossier(item)}
                                                style={styles.itemDossierBtn}
                                                title={`Gerar Dossiê Executivo consolidado utilizando esta ${item.type.toLowerCase()}`}
                                            >
                                                <Briefcase size={12} />
                                                <span>Incluir no Dossiê PDF</span>
                                            </button>

                                            <span style={styles.itemTimestamp}>{new Date(item.timestamp).toLocaleString('pt-BR')}</span>
                                        </div>
                                    </div>

                                    <details>
                                        <summary style={styles.summary}>
                                            <span>Visualizar Conteúdo Completo</span>
                                            <span style={{ fontSize: '11px', fontWeight: 500, color: colors.textSecondary, marginLeft: '6px' }}>
                                                ({item.output.length} caracteres gerados)
                                            </span>
                                        </summary>
                                        <div style={styles.detailsContent}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                <h4 style={{ margin: 0, color: colors.textPrimary }}>Resultado da Geração por IA:</h4>
                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenDossier(item)}
                                                    style={styles.inlineDossierAction}
                                                >
                                                    <FileDown size={13} />
                                                    <span>Exportar Dossiê com este Conteúdo</span>
                                                </button>
                                            </div>
                                            <pre style={styles.preformatted}>{item.output}</pre>

                                            <h4 style={{ marginTop: '16px', color: colors.textSecondary, fontSize: '13px' }}>Vaga de Referência:</h4>
                                            <pre style={{ ...styles.preformatted, maxHeight: '120px', opacity: 0.85 }}>{item.inputJobDescription || 'Nenhuma descrição de vaga fornecida.'}</pre>
                                        </div>
                                    </details>
                                </li>
                            );
                        }
                    })}
                </ul>
            )}

            {/* Modal de Geração e Pré-visualização do Dossiê Executivo de Carreira */}
            <CareerDossierPdfModal
                isOpen={isDossierModalOpen}
                onClose={() => {
                    setIsDossierModalOpen(false);
                    setSelectedDossierItem(null);
                }}
                colors={colors}
                onShowToast={(msg) => setToastMessage(msg)}
                preselectedHistoryItem={selectedDossierItem}
            />

            {/* Modal de Leitura Offline (IndexedDB via Service Worker) */}
            <OfflineDocumentsModal
                isOpen={isOfflineDocsModalOpen}
                onClose={() => setIsOfflineDocsModalOpen(false)}
                colors={colors}
            />

            <footer style={styles.footer}>
                Copyright by André Azevedo • CV-AutoPilot Enterprise
            </footer>
        </div>
    );
};

const getStyles = (colors: any): { [key: string]: React.CSSProperties } => ({
    container: { maxWidth: '1200px', margin: '0 auto', position: 'relative' },
    pageHeader: { 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        flexWrap: 'wrap', 
        gap: '16px', 
        marginBottom: '20px' 
    },
    header: { 
        color: colors.textPrimary, 
        fontSize: '24px', 
        fontWeight: '800', 
        letterSpacing: '-0.02em', 
        margin: '0 0 6px 0' 
    },
    headerSubtitle: {
        color: colors.textSecondary,
        fontSize: '14px',
        margin: 0,
        maxWidth: '700px',
        lineHeight: 1.5,
    },
    headerActions: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        flexWrap: 'wrap',
    },
    offlineHeaderButton: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '9px 14px',
        fontSize: '13px',
        fontWeight: 600,
        color: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.08)',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
    },
    dossierPrimaryButton: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 18px',
        fontSize: '13px',
        fontWeight: 700,
        color: '#ffffff',
        backgroundColor: '#881337',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(136, 19, 55, 0.3)',
        transition: 'all 0.15s ease',
    },
    dossierBadge: {
        backgroundColor: '#ffffff28',
        color: '#ffffff',
        fontSize: '10px',
        fontWeight: 800,
        padding: '2px 6px',
        borderRadius: '10px',
        textTransform: 'uppercase',
    },
    exportButton: { 
        padding: '9px 16px', 
        fontSize: '13px', 
        fontWeight: 600,
        color: colors.textPrimary, 
        backgroundColor: colors.surface, 
        border: `1px solid ${colors.border}`, 
        borderRadius: '8px', 
        cursor: 'pointer', 
        display: 'flex', 
        alignItems: 'center',
        gap: '6px',
        transition: 'all 0.15s ease',
    },
    exportButtonDisabled: {
        padding: '9px 16px', 
        fontSize: '13px', 
        fontWeight: 600,
        color: colors.buttonDisabledText || '#94a3b8', 
        backgroundColor: colors.buttonDisabledBg || '#e2e8f0', 
        border: 'none', 
        borderRadius: '8px', 
        cursor: 'not-allowed',
        display: 'flex', 
        alignItems: 'center',
        gap: '6px',
    },
    dossierPromoBanner: {
        backgroundColor: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: '14px',
        padding: '18px 20px',
        marginBottom: '22px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: colors.shadowSm || '0 2px 8px rgba(0,0,0,0.04)',
        background: `linear-gradient(135deg, ${colors.surface} 0%, ${colors.surface} 70%, #88133708 100%)`,
    },
    dossierPromoIcon: {
        width: '44px',
        height: '44px',
        borderRadius: '12px',
        backgroundColor: '#88133714',
        color: '#881337',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    promoTag: {
        fontSize: '10px',
        fontWeight: 800,
        backgroundColor: '#10b98118',
        color: '#059669',
        padding: '2px 7px',
        borderRadius: '10px',
        textTransform: 'uppercase',
    },
    kpiPill: {
        fontSize: '11px',
        fontWeight: 600,
        color: colors.textSecondary,
        backgroundColor: colors.background,
        padding: '3px 8px',
        borderRadius: '6px',
        border: `1px solid ${colors.border}`,
    },
    dossierBannerActionBtn: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 18px',
        fontSize: '13px',
        fontWeight: 700,
        color: '#ffffff',
        backgroundColor: '#881337',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        boxShadow: '0 2px 10px rgba(136, 19, 55, 0.25)',
        whiteSpace: 'nowrap',
    },
    list: { listStyle: 'none', padding: 0, margin: 0 },
    listItem: { 
        backgroundColor: colors.surface, 
        border: `1px solid ${colors.border}`,
        borderRadius: '14px', 
        marginBottom: '16px',
        padding: '18px 20px',
        boxShadow: colors.shadow || '0 2px 10px rgba(0,0,0,0.03)',
        transition: 'all 0.15s ease',
    },
    itemHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '10px',
        marginBottom: '10px'
    },
    itemType: {
        fontSize: '16px',
        color: colors.textPrimary,
        fontWeight: '700',
    },
    typeBadgeLead: {
        fontSize: '11px',
        fontWeight: 700,
        padding: '2px 8px',
        borderRadius: '6px',
        backgroundColor: '#fef3c7',
        color: '#b45309',
    },
    typeBadgeLetter: {
        fontSize: '11px',
        fontWeight: 700,
        padding: '2px 8px',
        borderRadius: '6px',
        backgroundColor: '#ecfdf5',
        color: '#047857',
    },
    typeBadgeCv: {
        fontSize: '11px',
        fontWeight: 700,
        padding: '2px 8px',
        borderRadius: '6px',
        backgroundColor: '#eff6ff',
        color: '#1d4ed8',
    },
    itemDossierBtn: {
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        padding: '4px 10px',
        fontSize: '11px',
        fontWeight: 700,
        color: '#881337',
        backgroundColor: '#88133712',
        border: '1px solid #88133730',
        borderRadius: '6px',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
    },
    itemOfflineBtn: {
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '4px 9px',
        fontSize: '11px',
        fontWeight: 600,
        border: `1px solid ${colors.border}`,
        borderRadius: '6px',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
    },
    offlineSavedTag: {
        backgroundColor: 'rgba(16, 185, 129, 0.12)',
        color: '#10b981',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        padding: '2px 6px',
        borderRadius: '4px',
        fontSize: '10.5px',
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        whiteSpace: 'nowrap',
    },
    itemTimestamp: {
        fontSize: '12px',
        color: colors.textSecondary,
    },
    summary: {
        cursor: 'pointer',
        color: colors.primary,
        fontWeight: 'bold',
        fontSize: '13px',
        padding: '4px 0',
    },
    detailsContent: {
        marginTop: '12px',
        borderTop: `1px solid ${colors.border}`,
        paddingTop: '14px',
    },
    inlineDossierAction: {
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        padding: '4px 10px',
        fontSize: '11px',
        fontWeight: 700,
        color: '#ffffff',
        backgroundColor: '#881337',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
    },
    preformatted: {
        whiteSpace: 'pre-wrap',
        wordWrap: 'break-word',
        background: colors.background,
        padding: '14px',
        borderRadius: '8px',
        maxHeight: '260px',
        overflowY: 'auto',
        color: colors.textPrimary,
        fontSize: '12px',
        lineHeight: 1.6,
        border: `1px solid ${colors.border}`,
    },
    leadSearchInfo: {
        display: 'flex',
        gap: '20px',
        color: colors.textSecondary,
        fontSize: '13px',
        marginBottom: '10px',
        flexWrap: 'wrap',
    },
    leadList: {
        listStyle: 'none',
        padding: 0,
        margin: '6px 0 0 0',
    },
    leadListItem: {
        padding: '12px',
        backgroundColor: colors.background,
        borderRadius: '8px',
        marginBottom: '8px',
        borderLeft: `3px solid ${colors.primary}`,
    },
    contactInfo: { margin: '4px 0', color: colors.textPrimary, wordBreak: 'break-all', fontSize: '13px' },
    notes: { margin: '4px 0 0 0', color: colors.textSecondary, fontSize: '12px' },
    emptyState: {
        textAlign: 'center',
        padding: '48px 20px',
        backgroundColor: colors.surface,
        border: `1px dashed ${colors.border}`,
        borderRadius: '14px',
    },
    toast: {
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        backgroundColor: colors.surface,
        border: `1px solid ${colors.primary}`,
        borderRadius: '10px',
        padding: '12px 18px',
        boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        zIndex: 2000,
        color: colors.textPrimary,
        fontSize: '13px',
        fontWeight: 600,
        maxWidth: '450px',
    },
    toastClose: {
        background: 'none',
        border: 'none',
        fontSize: '18px',
        cursor: 'pointer',
        color: colors.textSecondary,
        marginLeft: '6px',
        padding: 0,
        lineHeight: 1,
    },
    footer: {
        marginTop: '40px',
        textAlign: 'center',
        fontSize: '13px',
        color: colors.textSecondary,
        paddingTop: '20px',
        borderTop: `1px solid ${colors.border}`
    }
});

export default HistoryView;
