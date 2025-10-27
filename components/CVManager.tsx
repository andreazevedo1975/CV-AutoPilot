// FIX: Implement the CVManager component to allow users to add and manage their CVs.
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { CV } from '../types';
import { analyzeCV } from '../services/geminiService';

// Declarations for libraries loaded via CDN
declare const mammoth: any;
declare const pdfjsLib: any;

const CVManager: React.FC = () => {
    const [cvs, setCvs] = useLocalStorage<CV[]>('cvs', []);
    const [cvName, setCvName] = useState('');
    const [cvContent, setCvContent] = useState('');
    const [analyzingId, setAnalyzingId] = useState<string | null>(null);
    const [analysisResults, setAnalysisResults] = useState<{ [cvId: string]: string }>({});
    const [error, setError] = useState<string | null>(null);
    const [uploadMessage, setUploadMessage] = useState<string>('Clique para carregar (.pdf, .docx) ou cole o texto abaixo');
    const [isAdding, setIsAdding] = useState(false);


    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Set CV name from filename, remove extension
        const fileName = file.name.replace(/\.[^/.]+$/, "");
        setCvName(fileName);
        setCvContent('');
        setUploadMessage(`Lendo arquivo: ${file.name}...`);

        const reader = new FileReader();

        const fileType = file.type;
        const isPdf = fileType === "application/pdf";
        const isDocx = fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

        if (isPdf) {
            pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js`;
            reader.onload = async (e) => {
                if (!e.target?.result) return;
                try {
                    const typedArray = new Uint8Array(e.target.result as ArrayBuffer);
                    const pdf = await pdfjsLib.getDocument(typedArray).promise;
                    let text = '';
                    for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        const textContent = await page.getTextContent();
                        text += textContent.items.map((item: any) => item.str).join(' ') + '\n';
                    }
                    setCvContent(text);
                    setUploadMessage(`Arquivo ${file.name} carregado com sucesso.`);
                } catch (error) {
                    console.error('Erro ao ler o arquivo PDF', error);
                    setCvContent('');
                    setUploadMessage('Erro ao ler o arquivo .pdf. Por favor, tente novamente ou cole o texto manually.');
                }
            };
            reader.readAsArrayBuffer(file);

        } else if (isDocx) {
            reader.onload = async (e) => {
                if (!e.target?.result) return;
                try {
                    const result = await mammoth.extractRawText({ arrayBuffer: e.target.result });
                    setCvContent(result.value);
                    setUploadMessage(`Arquivo ${file.name} carregado com sucesso.`);
                } catch (error) {
                    console.error('Erro ao ler o arquivo docx', error);
                    setCvContent('');
                    setUploadMessage('Erro ao ler o arquivo .docx. Por favor, tente novamente ou cole o texto manualmente.');
                }
            };
            reader.readAsArrayBuffer(file);
        } else {
            setCvContent('');
            setUploadMessage('Tipo de arquivo não suportado. Por favor, envie .pdf ou .docx.');
        }
        event.target.value = '';
    };

    const handleAnalyzeCv = async (cv: CV) => {
        setAnalyzingId(cv.id);
        setError(null);
        try {
            const result = await analyzeCV(cv.content);
            setAnalysisResults(prev => ({ ...prev, [cv.id]: result }));
        } catch (err) {
            setError('Ocorreu um erro ao tentar analisar o currículo. Tente novamente.');
            console.error(err);
        } finally {
            setAnalyzingId(null);
        }
    };
    
    const handleAddCv = async () => {
        if (!cvName || !cvContent) return;
        setIsAdding(true);
        const newCv: CV = {
            id: new Date().toISOString(),
            name: cvName,
            content: cvContent,
        };
        setCvs(prevCvs => [...prevCvs, newCv]);
        
        await handleAnalyzeCv(newCv);

        setCvName('');
        setCvContent('');
        setUploadMessage('Clique para carregar (.pdf, .docx) ou cole o texto abaixo');
        setIsAdding(false);
    };
    
    return (
        <div style={styles.container}>
            <h1 style={styles.header}>Gerenciador de Currículos</h1>
            
            <div style={styles.form}>
                <h2 style={styles.subHeader}>Adicionar Novo Currículo</h2>
                <label htmlFor="cv-upload" style={styles.uploadBox}>
                    <span style={styles.uploadLabel}>{uploadMessage}</span>
                    <input 
                        id="cv-upload"
                        type="file" 
                        accept=".pdf,application/pdf,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        onChange={handleFileChange} 
                        style={styles.fileInput}
                    />
                </label>
                <input style={styles.input} type="text" placeholder="Nome do Currículo (ex: 'Currículo de Engenheiro de Software')" value={cvName} onChange={(e) => setCvName(e.target.value)} />
                <textarea style={styles.textarea} placeholder="O conteúdo do seu currículo aparecerá aqui após o upload, ou você pode colá-lo diretamente..." value={cvContent} onChange={(e) => setCvContent(e.target.value)} rows={15}></textarea>
                <button style={isAdding ? styles.buttonDisabled : styles.button} onClick={handleAddCv} disabled={isAdding}>
                    {isAdding ? 'Salvando e Analisando...' : 'Salvar e Analisar Currículo'}
                </button>
            </div>

            <div style={styles.listContainer}>
                <h2 style={styles.subHeader}>Currículos Salvos</h2>
                {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
                {cvs.length === 0 ? <p>Nenhum currículo salvo ainda.</p> : (
                    <ul style={styles.list}>
                        {cvs.map(cv => (
                            <li key={cv.id} style={styles.listItem}>
                                <div style={styles.listItemHeader}>
                                    <strong style={styles.cvName}>{cv.name}</strong>
                                    <button 
                                        style={analyzingId === cv.id ? styles.analyzeButtonDisabled : styles.analyzeButton} 
                                        onClick={() => handleAnalyzeCv(cv)} 
                                        disabled={analyzingId === cv.id}
                                    >
                                        {analyzingId === cv.id ? 'Analisando...' : 'Analisar Novamente'}
                                    </button>
                                </div>
                                {analysisResults[cv.id] && (
                                    <div style={styles.analysisResult}>
                                        <ReactMarkdown
                                            components={{
                                                h1: ({node, ...props}) => <h3 style={{fontSize: '1.2em', marginTop: '1em'}} {...props} />,
                                                h2: ({node, ...props}) => <h4 style={{fontSize: '1.1em', marginTop: '1em'}} {...props} />,
                                                strong: ({node, ...props}) => <strong style={{fontWeight: 'bold'}} {...props} />,
                                                ul: ({node, ...props}) => <ul style={{paddingLeft: '20px', listStyle: 'disc'}} {...props} />,
                                                li: ({node, ...props}) => <li style={{marginBottom: '0.5em'}} {...props} />,
                                            }}
                                        >
                                            {analysisResults[cv.id]}
                                        </ReactMarkdown>
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    container: { maxWidth: '800px' },
    header: { color: '#1967d2' },
    subHeader: { color: '#1967d2', borderBottom: '1px solid #4a5568', paddingBottom: '10px', marginTop: '30px' },
    form: { display: 'flex', flexDirection: 'column', gap: '10px', padding: '20px', backgroundColor: '#2d3748', borderRadius: '8px', border: '1px solid #4a5568', },
    uploadBox: {
        border: '2px dashed #4a5568',
        borderRadius: '8px',
        padding: '20px',
        textAlign: 'center',
        cursor: 'pointer',
        backgroundColor: '#1a202c',
        marginBottom: '10px',
        transition: 'background-color 0.2s, border-color 0.2s',
    },
    uploadLabel: {
        color: '#a0aec0',
        fontWeight: 500,
    },
    fileInput: {
        display: 'none',
    },
    input: { padding: '10px', fontSize: '16px', borderRadius: '4px', border: '1px solid #4a5568', backgroundColor: '#1a202c', color: '#ffffff' },
    textarea: { padding: '10px', fontSize: '16px', borderRadius: '4px', border: '1px solid #4a5568', backgroundColor: '#1a202c', color: '#ffffff', minHeight: '200px' },
    button: { padding: '10px 20px', fontSize: '16px', color: '#fff', backgroundColor: '#1967d2', border: 'none', borderRadius: '4px', cursor: 'pointer' },
    buttonDisabled: {
        padding: '10px 20px',
        fontSize: '16px',
        color: '#a0aec0',
        backgroundColor: '#4a5568',
        border: 'none',
        borderRadius: '4px',
        cursor: 'not-allowed',
    },
    listContainer: { marginTop: '30px' },
    list: { listStyle: 'none', padding: 0 },
    listItem: { 
        padding: '15px', 
        backgroundColor: '#2d3748', 
        borderRadius: '8px', 
        border: '1px solid #4a5568', 
        marginBottom: '10px',
        transition: 'box-shadow 0.2s',
    },
    listItemHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cvName: {
        fontWeight: 'bold',
        color: '#1967d2',
        fontSize: '1.1em'
    },
    analyzeButton: {
        padding: '8px 12px',
        fontSize: '14px',
        fontWeight: 500,
        color: '#fff',
        backgroundColor: '#34a853',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
    },
    analyzeButtonDisabled: {
        padding: '8px 12px',
        fontSize: '14px',
        fontWeight: 500,
        color: '#a0aec0',
        backgroundColor: '#4a5568',
        border: 'none',
        borderRadius: '4px',
        cursor: 'not-allowed',
    },
    analysisResult: {
        marginTop: '15px',
        padding: '0 15px 15px 15px',
        borderTop: '1px solid #4a5568',
        lineHeight: 1.6,
        color: '#e2e8f0',
    }
};

export default CVManager;