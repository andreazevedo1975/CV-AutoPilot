// FIX: Implement the History component to display AI generation history, resolving a name collision with the browser's built-in 'History' object by naming the component 'HistoryView'.
import React from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { GenerationHistoryItem } from '../types';

const HistoryView: React.FC = () => {
    const [history] = useLocalStorage<GenerationHistoryItem[]>('generationHistory', []);

    if (history.length === 0) {
        return (
            <div style={styles.container}>
                <h1 style={styles.header}>Histórico de Gerações</h1>
                <p>Nenhum histórico ainda. Use as Ferramentas de IA para gerar conteúdo.</p>
            </div>
        );
    }
    
    return (
        <div style={styles.container}>
            <h1 style={styles.header}>Histórico de Gerações</h1>
            <ul style={styles.list}>
                {history.map((item) => (
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
                ))}
            </ul>
        </div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    container: { maxWidth: '800px' },
    header: { color: '#333' },
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
        color: '#333',
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
};

export default HistoryView;