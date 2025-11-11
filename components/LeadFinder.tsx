import React, { useState, useContext } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Lead, HistoryItem, LeadHistoryItem, EmailTemplate, CV } from '../types';
import { findLeads } from '../services/geminiService';
import { ThemeContext } from '../App';
import { Copy, Pencil, Trash, Download } from './icons';

type JobType = 'Todos' | 'Presencial' | 'Home Office' | 'Híbrido';
type SearchSource = 'empresas' | 'sociais';

const genericDomains = new Set([
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com',
    'icloud.com', 'protonmail.com', 'zoho.com', 'mail.com', 'gmx.com',
    'live.com', 'msn.com', 'uol.com.br', 'bol.com.br', 'terra.com.br',
    'ig.com.br'
]);

const isValidEmail = (email: string): boolean => {
    if (!email) return false;

    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(String(email).toLowerCase())) {
        return false;
    }

    const domain = email.substring(email.lastIndexOf('@') + 1);
    if (genericDomains.has(domain.toLowerCase())) {
        return false;
    }

    return true;
};

const LeadFinder: React.FC = () => {
    const { colors } = useContext(ThemeContext);
    const styles = getStyles(colors);

    // Search State
    const [jobTitle, setJobTitle] = useState('');
    const [location, setLocation] = useState('');
    const [skills, setSkills] = useState('');
    const [jobType, setJobType] = useState<JobType>('Todos');
    const [searchSource, setSearchSource] = useState<SearchSource>('empresas');
    const [leads, setLeads] = useState<Lead[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSaved, setIsSaved] = useState(false);
    const [copiedContact, setCopiedContact] = useState<string | null>(null);
    
    // Data from Storage
    const [, setHistory] = useLocalStorage<HistoryItem[]>('generationHistory', []);
    const [cvs] = useLocalStorage<CV[]>('cvs', []);
    const [templates, setTemplates] = useLocalStorage<EmailTemplate[]>('emailTemplates', []);
    const [userName, setUserName] = useLocalStorage<string>('userName', '');

    // State for Template Manager & Compose Modal
    const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | {name: string, body: string}>({ name: '', body: '' });
    const [isComposeModalOpen, setIsComposeModalOpen] = useState(false);
    const [composingEmailFor, setComposingEmailFor] = useState<Lead | null>(null);
    const [emailBody, setEmailBody] = useState('');
    const [selectedCvId, setSelectedCvId] = useState('');


    const handleSearch = async () => {
        if (!jobTitle) {
            setError('Por favor, insira um cargo desejado.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setLeads([]);
        setIsSaved(false);

        try {
            const results = await findLeads(jobTitle, location, jobType, searchSource, skills);
            setLeads(results);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveToHistory = () => {
        if (leads.length === 0 || isSaved) return;
        const historyItem: LeadHistoryItem = {
            id: new Date().toISOString(), type: 'Busca de Leads', searchTerm: jobTitle,
            location: location, leads: leads, timestamp: new Date().toISOString(),
        };
        setHistory(prevHistory => [historyItem, ...prevHistory]);
        setIsSaved(true);
    };

    const handleExportLeadsCSV = () => {
        if (leads.length === 0) return;

        const headers = ['Empresa', 'Contato', 'Notas'];

        const escapeCSV = (field: string | undefined | null): string => {
            if (field === undefined || field === null) return '';
            const str = String(field);
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };

        const csvRows = [
            headers.join(','),
            ...leads.map(lead => [
                escapeCSV(lead.companyName),
                escapeCSV(lead.contactInfo),
                escapeCSV(lead.notes)
            ].join(','))
        ];

        const csvString = csvRows.join('\n');
        const blob = new Blob([`\uFEFF${csvString}`], { type: 'text/csv;charset=utf-8;' });

        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `leads_${jobTitle.replace(/\s+/g, '_') || 'busca'}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopiedContact(text);
            setTimeout(() => setCopiedContact(null), 2500);
        });
    };

    // Template Manager Logic
    const handleEditTemplateClick = (template: EmailTemplate) => {
        setEditingTemplate(template);
    };
    
    const handleSaveTemplate = () => {
        if (!editingTemplate.name || !editingTemplate.body) return;
        if ('id' in editingTemplate) { // Editing existing
            setTemplates(templates.map(t => t.id === editingTemplate.id ? editingTemplate as EmailTemplate : t));
        } else { // Creating new
            setTemplates([...templates, { ...editingTemplate, id: Date.now().toString() }]);
        }
        setEditingTemplate({ name: '', body: '' }); // Reset form
    };

    const handleDeleteTemplate = (id: string) => {
        setTemplates(templates.filter(t => t.id !== id));
         if ('id' in editingTemplate && editingTemplate.id === id) {
            setEditingTemplate({ name: '', body: '' });
        }
    };

    // Compose Modal Logic
    const openComposeModal = (lead: Lead) => {
        setComposingEmailFor(lead);
        setEmailBody('');
        setSelectedCvId('');
        setIsComposeModalOpen(true);
    };

    const replacePlaceholders = (body: string) => {
        return body
            .replace(/\[empresa\]/gi, composingEmailFor?.companyName || '')
            .replace(/\[cargo\]/gi, jobTitle || '')
            .replace(/\[meu_nome\]/gi, userName || '[Seu Nome]');
    };

    const handleSelectTemplate = (templateId: string) => {
        const template = templates.find(t => t.id === templateId);
        if (template) {
            setEmailBody(replacePlaceholders(template.body));
        } else {
            setEmailBody('');
        }
    };
    
    const handleGenerateMailto = () => {
        if (!composingEmailFor) return;
        const subject = encodeURIComponent(`Candidatura para ${jobTitle} - ${userName || '[Seu Nome]'}`);
        const body = encodeURIComponent(emailBody);
        window.location.href = `mailto:${composingEmailFor.contactInfo}?subject=${subject}&body=${body}`;
        setIsComposeModalOpen(false);
    };

    const jobTitlePlaceholder = searchSource === 'empresas' 
        ? "Cargo Desejado (ex: Desenvolvedor Frontend)" 
        : "Cargo ou Hashtag (ex: Vagas Desenvolvedor, #vagasti)";

    const selectedCvContent = cvs.find(cv => cv.id === selectedCvId)?.content;

    return (
        <div style={styles.container}>
            <div style={styles.pageHeader}>
                <h1 style={styles.header}>Buscador de Leads</h1>
            </div>
            <p style={styles.description}>
                Encontre contatos públicos de empresas, posts em redes sociais ou hashtags para prospecção ativa. A IA buscará e-mails de RH, páginas de carreira ou links relevantes, respeitando a privacidade (LGPD).
            </p>

            <div style={styles.form}>
                <div style={styles.inputGroup}>
                    <input style={styles.input} type="text" placeholder={jobTitlePlaceholder} value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
                    <input style={styles.input} type="text" placeholder="Habilidades Desejadas (ex: React, Node.js)" value={skills} onChange={(e) => setSkills(e.target.value)} />
                    <input style={styles.input} type="text" placeholder="Localização (ex: São Paulo) (Opcional)" value={location} onChange={(e) => setLocation(e.target.value)} />
                </div>
                <div style={styles.filterContainer}>
                    <div style={styles.filterGroup}>
                        <label style={styles.label} htmlFor="job-type-select">Tipo de Vaga</label>
                        <select
                            id="job-type-select"
                            style={styles.select}
                            value={jobType}
                            onChange={(e) => setJobType(e.target.value as JobType)}
                        >
                            <option value="Todos">Todos</option>
                            <option value="Presencial">Presencial</option>
                            <option value="Home Office">Home Office</option>
                            <option value="Híbrido">Híbrido</option>
                        </select>
                    </div>
                    <div style={styles.filterGroup}>
                        <label style={styles.label} htmlFor="search-source-select">Fonte da Busca</label>
                        <select
                            id="search-source-select"
                            style={styles.select}
                            value={searchSource}
                            onChange={(e) => setSearchSource(e.target.value as SearchSource)}
                        >
                            <option value="empresas">Empresas (RH e Carreiras)</option>
                            <option value="sociais">Redes Sociais (Posts e Hashtags)</option>
                        </select>
                    </div>
                </div>
                <button style={styles.button} onClick={handleSearch} disabled={isLoading}>
                    {isLoading ? 'Buscando...' : 'Buscar Leads'}
                </button>
            </div>

            <div style={styles.templateManagerContainer}>
                <h2 style={styles.subHeader}>Gerenciador de Modelos de E-mail</h2>
                <p style={styles.description}>Crie e gerencie modelos para agilizar o contato com os leads. Use os placeholders [empresa], [cargo] e [meu_nome] para personalizar suas mensagens.</p>
                
                <div style={styles.templateGrid}>
                    <div style={styles.templateForm}>
                        <h3 style={styles.formHeader}>{'id' in editingTemplate ? 'Editar Modelo' : 'Criar Novo Modelo'}</h3>
                        <label style={styles.label}>Seu Nome (para [meu_nome])</label>
                        <input style={styles.input} value={userName} onChange={e => setUserName(e.target.value)} placeholder="Seu Nome Completo" />
                        
                        <label style={styles.label}>Nome do Modelo</label>
                        <input style={styles.input} placeholder="Ex: Vaga Frontend React" value={editingTemplate.name} onChange={e => setEditingTemplate({...editingTemplate, name: e.target.value})} />
                        
                        <label style={styles.label}>Corpo do Modelo</label>
                        <textarea style={styles.textarea} placeholder="Olá [empresa], ..." value={editingTemplate.body} onChange={e => setEditingTemplate({...editingTemplate, body: e.target.value})} rows={8} />

                        <div style={styles.formActions}>
                            <button style={styles.button} onClick={handleSaveTemplate}>Salvar Modelo</button>
                            { 'id' in editingTemplate && (
                                <button style={styles.secondaryButton} onClick={() => setEditingTemplate({ name: '', body: '' })}>Cancelar Edição</button>
                            )}
                        </div>
                    </div>
                    
                    <div style={styles.templateListContainer}>
                         <h3 style={styles.formHeader}>Modelos Salvos</h3>
                         {templates.length === 0 ? <p>Nenhum modelo salvo.</p> : (
                            <ul style={styles.templateList}>
                                {templates.map(t => (
                                    <li key={t.id} style={styles.templateListItem}>
                                        <span>{t.name}</span>
                                        <div style={styles.templateItemActions}>
                                            <button style={styles.iconButton} onClick={() => handleEditTemplateClick(t)} title="Editar"><Pencil /></button>
                                            <button style={styles.iconButton} onClick={() => handleDeleteTemplate(t.id)} title="Excluir"><Trash /></button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>

            {error && <p style={styles.error}>{error}</p>}

            {leads.length > 0 && (
                <div style={styles.resultsContainer}>
                    <div style={styles.resultsHeader}>
                         <h2 style={styles.subHeader}>Resultados da Busca</h2>
                         <div style={styles.resultActions}>
                            <button style={isSaved ? styles.saveButtonSaved : styles.saveButton} onClick={handleSaveToHistory} disabled={isSaved}>
                               {isSaved ? 'Salvo no Histórico' : 'Salvar no Histórico'}
                           </button>
                            <button 
                                onClick={handleExportLeadsCSV}
                                style={leads.length === 0 ? styles.exportButtonDisabled : styles.exportButton}
                                disabled={leads.length === 0}
                            >
                                <Download />
                                Exportar para CSV
                            </button>
                         </div>
                    </div>
                    <ul style={styles.list}>
                        {leads.map((lead, index) => (
                            <li key={index} style={styles.listItem}>
                                <div style={styles.leadInfo}>
                                    <strong>{lead.companyName}</strong>
                                    <p style={styles.contactInfo}>
                                        <a href={lead.contactInfo.startsWith('http') ? lead.contactInfo : (isValidEmail(lead.contactInfo) ? `mailto:${lead.contactInfo}` : '#')}
                                            target="_blank" rel="noopener noreferrer" style={{color: colors.primary}}>{lead.contactInfo}</a>
                                    </p>
                                    <p style={styles.notes}><em>{lead.notes}</em></p>
                                </div>
                                <div style={styles.leadActions}>
                                    <button style={copiedContact === lead.contactInfo ? styles.copyButtonSuccess : styles.copyButton} onClick={() => handleCopy(lead.contactInfo)}>
                                        <Copy /> {copiedContact === lead.contactInfo ? 'Copiado!' : 'Copiar'}
                                    </button>
                                    {isValidEmail(lead.contactInfo) && (
                                        <button style={styles.emailButton} onClick={() => openComposeModal(lead)}>Enviar E-mail</button>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            
            {isComposeModalOpen && composingEmailFor && (
                 <div style={styles.modalBackdrop}>
                    <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <h2>Enviar E-mail para {composingEmailFor.companyName}</h2>
                        <p>Para: {composingEmailFor.contactInfo}</p>
                        <div style={styles.modalSection}>
                             <select style={styles.select} onChange={e => handleSelectTemplate(e.target.value)}>
                                <option value="">Selecionar Modelo (Opcional)</option>
                                {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                            <textarea style={styles.textarea} value={emailBody} onChange={e => setEmailBody(e.target.value)} rows={10} placeholder="Escreva seu e-mail aqui..." />
                        </div>
                         <div style={styles.modalSection}>
                            <label>Anexar Currículo (para referência)</label>
                            <select style={styles.select} value={selectedCvId} onChange={e => setSelectedCvId(e.target.value)}>
                                <option value="">Selecione um Currículo</option>
                                {cvs.map(cv => <option key={cv.id} value={cv.id}>{cv.name}</option>)}
                            </select>
                            {selectedCvContent && <pre style={styles.cvPreview}>{selectedCvContent}</pre>}
                        </div>
                        <div style={styles.modalActions}>
                            <button style={styles.button} onClick={handleGenerateMailto}>Abrir no Cliente de E-mail</button>
                            <button style={styles.secondaryButton} onClick={() => setIsComposeModalOpen(false)}>Cancelar</button>
                        </div>
                    </div>
                </div>
            )}

             <footer style={styles.footer}>
                Copyright by André Azevedo
            </footer>
        </div>
    );
};

const getStyles = (colors): { [key: string]: React.CSSProperties } => ({
    container: { maxWidth: '800px' },
    pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    header: { color: colors.primary },
    description: { color: colors.textSecondary, marginBottom: '20px', lineHeight: 1.5 },
    subHeader: { color: colors.primary, margin: 0 },
    form: { display: 'flex', flexDirection: 'column', gap: '15px', padding: '20px', backgroundColor: colors.surface, borderRadius: '8px', border: `1px solid ${colors.border}` },
    inputGroup: { display: 'flex', flexDirection: 'column', gap: '10px' },
    input: { padding: '12px', fontSize: '16px', borderRadius: '4px', border: `1px solid ${colors.border}`, backgroundColor: colors.inputBg, color: colors.inputText, width: '100%', boxSizing: 'border-box' },
    textarea: { padding: '12px', fontSize: '16px', borderRadius: '4px', border: `1px solid ${colors.border}`, backgroundColor: colors.inputBg, color: colors.inputText, width: '100%', boxSizing: 'border-box' },
    select: { padding: '12px', fontSize: '16px', borderRadius: '4px', border: `1px solid ${colors.border}`, backgroundColor: colors.inputBg, color: colors.inputText, width: '100%', boxSizing: 'border-box' },
    filterContainer: { display: 'flex', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' },
    filterGroup: { display: 'flex', flexDirection: 'column', gap: '5px', flex: '1 1 200px' },
    label: { fontSize: '14px', fontWeight: 500, color: colors.textSecondary, marginLeft: '2px', marginBottom: '4px' },
    button: { padding: '12px 20px', fontSize: '16px', color: colors.textOnPrimary, backgroundColor: colors.primary, border: 'none', borderRadius: '4px', cursor: 'pointer' },
    secondaryButton: { padding: '12px 20px', fontSize: '16px', color: colors.textPrimary, backgroundColor: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '4px', cursor: 'pointer' },
    error: { color: '#f56565', textAlign: 'center', marginTop: '10px' },
    resultsContainer: { marginTop: '30px' },
    resultsHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' },
    resultActions: { display: 'flex', gap: '10px' },
    saveButton: { padding: '10px 15px', fontSize: '14px', color: colors.textOnPrimary, backgroundColor: colors.primary, border: 'none', borderRadius: '4px', cursor: 'pointer' },
    saveButtonSaved: { padding: '10px 15px', fontSize: '14px', color: colors.buttonDisabledText, backgroundColor: colors.buttonDisabledBg, border: 'none', borderRadius: '4px', cursor: 'not-allowed' },
    exportButton: {
        padding: '10px 15px',
        fontSize: '14px',
        fontWeight: 500,
        color: colors.primary,
        backgroundColor: 'transparent',
        border: `1px solid ${colors.primary}`,
        borderRadius: '4px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
    },
    exportButtonDisabled: {
        padding: '10px 15px',
        fontSize: '14px',
        fontWeight: 500,
        color: colors.buttonDisabledText,
        backgroundColor: colors.buttonDisabledBg,
        border: 'none',
        borderRadius: '4px',
        cursor: 'not-allowed',
        display: 'flex',
        alignItems: 'center',
    },
    list: { listStyle: 'none', padding: 0 },
    listItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', backgroundColor: colors.surface, borderRadius: '8px', border: `1px solid ${colors.border}`, marginBottom: '10px', flexWrap: 'wrap', gap: '10px' },
    leadInfo: { flex: '1 1 300px' },
    contactInfo: { margin: '5px 0', color: colors.textPrimary, wordBreak: 'break-all' },
    notes: { margin: '5px 0', color: colors.textSecondary, fontSize: '14px' },
    leadActions: { display: 'flex', gap: '10px', alignItems: 'center' },
    copyButton: { padding: '8px 12px', fontSize: '14px', color: colors.primary, backgroundColor: 'transparent', border: `1px solid ${colors.primary}`, borderRadius: '4px', cursor: 'pointer', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '5px' },
    copyButtonSuccess: { padding: '8px 12px', fontSize: '14px', color: colors.textOnPrimary, backgroundColor: colors.success, border: `1px solid ${colors.success}`, borderRadius: '4px', cursor: 'pointer', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '5px' },
    emailButton: { padding: '8px 12px', fontSize: '14px', color: colors.textOnPrimary, backgroundColor: colors.primary, border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '500' },
    // Template Manager Styles
    templateManagerContainer: { marginTop: '30px', padding: '20px', backgroundColor: colors.surface, borderRadius: '8px', border: `1px solid ${colors.border}` },
    templateGrid: { display: 'grid', gridTemplateColumns: '1fr', gap: '25px', marginTop: '15px', '@media (min-width: 768px)': { gridTemplateColumns: '1fr 1fr' } },
    templateForm: { display: 'flex', flexDirection: 'column', gap: '10px' },
    formHeader: { color: colors.primary, marginTop: 0, marginBottom: '10px', fontSize: '18px', borderBottom: `1px solid ${colors.border}`, paddingBottom: '8px' },
    formActions: { display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' },
    templateListContainer: {},
    templateList: { listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' },
    templateListItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: colors.background, borderRadius: '4px', border: `1px solid ${colors.border}` },
    templateItemActions: { display: 'flex', gap: '5px' },
    iconButton: { background: 'none', border: 'none', cursor: 'pointer', color: colors.textSecondary, padding: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    // Modal Styles
    modalBackdrop: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    modalContent: { backgroundColor: colors.background, padding: '25px', borderRadius: '8px', width: '90%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' },
    modalSection: { marginBottom: '20px', borderBottom: `1px solid ${colors.border}`, paddingBottom: '20px' },
    modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' },
    cvPreview: { maxHeight: '150px', overflowY: 'auto', backgroundColor: colors.surface, padding: '10px', borderRadius: '4px', border: `1px solid ${colors.border}`, whiteSpace: 'pre-wrap', fontSize: '12px' },
    footer: { marginTop: '40px', textAlign: 'center', fontSize: '14px', color: colors.textSecondary, paddingTop: '20px', borderTop: `1px solid ${colors.border}` }
});

export default LeadFinder;