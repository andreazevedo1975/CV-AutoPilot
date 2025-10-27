// FIX: Implement the History component to display AI generation history, resolving a name collision with the browser's built-in 'History' object by naming the component 'HistoryView'.
import React from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { HistoryItem } from '../types';
import { Download } from './icons';

const HistoryView: React.FC = () => {
    const [history] = useLocalStorage<HistoryItem[]>('generationHistory', []);

    const handleExport = () => {
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
    };

    return (
        <div style={styles.container}>
            <div style={styles.pageHeader}>
                <h1 style={styles.header}>Histórico de Gerações</h1>
                <button 
                    onClick={handleExport} 
                    style={history.length === 0 ? styles.exportButtonDisabled : styles.exportButton} 
                    disabled={history.length === 0}
                >
                    <Download />
                    Exportar Histórico
                </button>
            </div>
            {history.length === 0 ? (
                <p>Nenhum histórico ainda. Use as Ferramentas de IA para gerar conteúdo.</p>
            ) : (
                <ul style={styles.list}>
                    {history.map((item) => {
                        if ('leads' in item) { // Type guard for LeadHistoryItem
                            return (
                                <li key={item.id} style={styles.listItem}>
                                    <div style={styles.itemHeader}>
                                        <strong style={styles.itemType}>{item.type}</strong>
                                        <span style={styles.itemTimestamp}>{new Date(item.timestamp).toLocaleString()}</span>
                                    </div>
                                    <div style={styles.leadSearchInfo}>
                                        <span><strong>Termo:</strong> {item.searchTerm}</span>
                                        {item.location && <span><strong>Localização:</strong> {item.location}</span>}
                                    </div>
                                    <details>
                                        <summary style={styles.summary}>Ver {item.leads.length} Leads</summary>
                                        <div style={styles.detailsContent}>
                                            <ul style={styles.leadList}>
                                                {item.leads.map((lead, index) => (
                                                    <li key={index} style={styles.leadListItem}>
                                                        <strong>{lead.companyName}</strong>
                                                        <p style={styles.contactInfo}>
                                                            <a href={lead.contactInfo.startsWith('http') ? lead.contactInfo : `mailto:${lead.contactInfo}`} target="_blank" rel="noopener noreferrer">{lead.contactInfo}</a>
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
                            return (
                                <li key={item.id} style={styles.listItem}>
                                    <div style={styles.itemHeader}>
                                        <strong style={styles.itemType}>{item.type}</strong>
                                        <span style={styles.itemTimestamp}>{new Date(item.timestamp).toLocaleString()}</span>
                                    </div>
                                    <details>
                                        <summary style={styles.summary}>Ver Detalhes</summary>
                                        <div style={styles.detailsContent}>
                                            <h4>Currículo de Entrada:</h4>
                                            <pre style={styles.preformatted}>{item.inputCv}</pre>
                                            <h4>Descrição da Vaga de Entrada:</h4>
                                            <pre style={styles.preformatted}>{item.inputJobDescription}</pre>
                                            <h4>Resultado:</h4>
                                            <pre style={styles.preformatted}>{item.output}</pre>
                                        </div>
                                    </details>
                                </li>
                            );
                        }
                    })}
                </ul>
            )}
        </div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    container: { maxWidth: '800px' },
    pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
    header: { color: '#1967d2' },
    exportButton: { 
        padding: '10px 20px', 
        fontSize: '16px', 
        color: '#fff', 
        backgroundColor: '#1967d2', 
        border: 'none', 
        borderRadius: '4px', 
        cursor: 'pointer', 
        display: 'flex', 
        alignItems: 'center',
    },
    exportButtonDisabled: {
        padding: '10px 20px', 
        fontSize: '16px', 
        color: '#fff', 
        backgroundColor: '#9e9e9e',
        border: 'none', 
        borderRadius: '4px', 
        cursor: 'not-allowed',
        display: 'flex', 
        alignItems: 'center',
    },
    list: { listStyle: 'none', padding: 0 },
    listItem: { 
        backgroundColor: '#fff', 
        border: '1px solid #e0e0e0',
        borderRadius: '8px', 
        marginBottom: '15px',
        padding: '15px',
    },
    itemHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '10px'
    },
    itemType: {
        fontSize: '18px',
        color: '#1967d2',
        fontWeight: 'bold',
    },
    itemTimestamp: {
        fontSize: '14px',
        color: '#777',
    },
    summary: {
        cursor: 'pointer',
        color: '#1967d2',
        fontWeight: 'bold',
    },
    detailsContent: {
        marginTop: '15px',
        borderTop: '1px solid #eee',
        paddingTop: '15px',
    },
    preformatted: {
        whiteSpace: 'pre-wrap',
        wordWrap: 'break-word',
        background: '#f8f8f8',
        padding: '15px',
        borderRadius: '4px',
        maxHeight: '200px',
        overflowY: 'auto',
    },
    leadSearchInfo: {
        display: 'flex',
        gap: '20px',
        color: '#555',
        marginBottom: '10px'
    },
    leadList: {
        listStyle: 'none',
        padding: 0
    },
    leadListItem: {
        padding: '10px',
        backgroundColor: '#f8f8f8',
        borderRadius: '4px',
        marginBottom: '8px',
        borderLeft: '3px solid #1967d2'
    },
    contactInfo: { margin: '5px 0', color: '#333', wordBreak: 'break-all' },
    notes: { margin: '5px 0', color: '#666', fontSize: '14px' },
};

export default HistoryView;