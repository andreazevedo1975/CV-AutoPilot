// FIX: Implement the AITools component to provide AI-powered assistance for job applications.
import React, { useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { CV, GenerationHistoryItem } from '../types';
import { optimizeCV, generateCoverLetter } from '../services/geminiService';

type Tool = 'cv' | 'cover-letter';

const AITools: React.FC = () => {
    const [activeTool, setActiveTool] = useState<Tool>('cv');
    const [cvs] = useLocalStorage<CV[]>('cvs', []);
    const [history, setHistory] = useLocalStorage<GenerationHistoryItem[]>('generationHistory', []);

    const [selectedCvId, setSelectedCvId] = useState<string>('');
    const [jobDescription, setJobDescription] = useState('');
    const [output, setOutput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        if (!selectedCvId || !jobDescription) {
            setError('Por favor, selecione um currículo e forneça a descrição da vaga.');
            return;
        }
        
        const selectedCv = cvs.find(cv => cv.id === selectedCvId);
        if (!selectedCv) {
            setError('Currículo selecionado não encontrado.');
            return;
        }

        setIsLoading(true);
        setError('');
        setOutput('');

        try {
            let result;
            if (activeTool === 'cv') {
                result = await optimizeCV(selectedCv.content, jobDescription);
            } else {
                result = await generateCoverLetter(selectedCv.content, jobDescription);
            }
            setOutput(result);
            
            const historyItem: GenerationHistoryItem = {
                id: new Date().toISOString(),
                type: activeTool === 'cv' ? 'Otimização de Currículo' : 'Carta de Apresentação',
                inputCv: selectedCv.content,
                inputJobDescription: jobDescription,
                output: result,
                timestamp: new Date().toISOString(),
            };
            setHistory([historyItem, ...history]);

        } catch (e) {
            setError('Ocorreu um erro ao gerar o conteúdo.');
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div style={styles.container}>
            <h1 style={styles.header}>Ferramentas de IA</h1>
            <div style={styles.tabs}>
                <button onClick={() => setActiveTool('cv')} style={activeTool === 'cv' ? styles.activeTab : styles.tab}>Otimizador de Currículo</button>
                <button onClick={() => setActiveTool('cover-letter')} style={activeTool === 'cover-letter' ? styles.activeTab : styles.tab}>Gerador de Carta de Apresentação</button>
            </div>
            
            <div style={styles.toolContainer}>
                <select value={selectedCvId} onChange={e => setSelectedCvId(e.target.value)} style={styles.select}>
                    <option value="">Selecione um Currículo</option>
                    {cvs.map(cv => <option key={cv.id} value={cv.id}>{cv.name}</option>)}
                </select>
                <textarea 
                    value={jobDescription} 
                    onChange={e => setJobDescription(e.target.value)} 
                    placeholder="Cole a descrição da vaga aqui..."
                    style={styles.textarea}
                    rows={10}
                />
                <button onClick={handleSubmit} disabled={isLoading} style={styles.button}>
                    {isLoading ? 'Gerando...' : (activeTool === 'cv' ? 'Otimizar Currículo' : 'Gerar Carta de Apresentação')}
                </button>
                {error && <p style={styles.error}>{error}</p>}
                {output && (
                    <div style={styles.outputContainer}>
                        <h2>Resultado</h2>
                        <pre style={styles.outputPre}>{output}</pre>
                    </div>
                )}
            </div>
        </div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    container: { maxWidth: '800px' },
    header: { color: '#333' },
    tabs: { marginBottom: '20px' },
    tab: { padding: '10px 20px', border: '1px solid #ccc', background: '#f0f0f0', cursor: 'pointer', fontSize: '16px' },
    activeTab: { padding: '10px 20px', border: '1px solid #1967d2', background: '#1967d2', color: '#fff', cursor: 'pointer', fontSize: '16px' },
    toolContainer: { display: 'flex', flexDirection: 'column', gap: '15px' },
    select: { padding: '10px', fontSize: '16px', borderRadius: '4px', border: '1px solid #ccc' },
    textarea: { padding: '10px', fontSize: '16px', borderRadius: '4px', border: '1px solid #ccc', minHeight: '150px' },
    button: { padding: '10px 20px', fontSize: '16px', color: '#fff', backgroundColor: '#1967d2', border: 'none', borderRadius: '4px', cursor: 'pointer' },
    error: { color: 'red' },
    outputContainer: { marginTop: '20px', padding: '20px', backgroundColor: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px' },
    outputPre: { whiteSpace: 'pre-wrap', wordWrap: 'break-word', background: '#f8f8f8', padding: '15px', borderRadius: '4px' },
};

export default AITools;