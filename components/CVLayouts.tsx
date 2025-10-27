import React, { useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { CV, CVLayout } from '../types';
import { generateCVLayouts, applyCVLayout } from '../services/geminiService';

declare const jspdf: any;
declare const docx: any;

const CVLayouts: React.FC = () => {
    const [layouts, setLayouts] = useState<CVLayout[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [cvs] = useLocalStorage<CV[]>('cvs', []);
    
    const [selectedLayout, setSelectedLayout] = useState<CVLayout | null>(null);
    const [selectedCvId, setSelectedCvId] = useState<string>('');
    const [isApplying, setIsApplying] = useState(false);
    const [restructuredCv, setRestructuredCv] = useState<string>('');

    const handleGenerate = async () => {
        setIsLoading(true);
        setError(null);
        setLayouts([]);
        setRestructuredCv('');
        setSelectedLayout(null);
        try {
            const results = await generateCVLayouts();
            setLayouts(results);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleApplyClick = (layout: CVLayout) => {
        setSelectedLayout(layout);
        setRestructuredCv('');
        setSelectedCvId('');
    };

    const handleRestructure = async () => {
        if (!selectedCvId || !selectedLayout) {
            setError("Selecione um currículo para aplicar o layout.");
            return;
        }
        
        const selectedCv = cvs.find(cv => cv.id === selectedCvId);
        if (!selectedCv) {
            setError("Currículo não encontrado.");
            return;
        }

        setIsApplying(true);
        setError(null);
        try {
            const result = await applyCVLayout(selectedCv.content, selectedLayout);
            setRestructuredCv(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ocorreu um erro ao aplicar o layout.');
        } finally {
            setIsApplying(false);
        }
    };

    const handleSaveAsPdf = () => {
        const { jsPDF } = jspdf;
        const doc = new jsPDF();
        const margin = 15;
        const pageWidth = doc.internal.pageSize.getWidth();
        const textLines = doc.splitTextToSize(restructuredCv, pageWidth - margin * 2);
        doc.text(textLines, margin, margin);
        doc.save(`${selectedLayout?.name.replace(/\s+/g, '_') || 'curriculo'}_reestruturado.pdf`);
    };
    
    const handleSaveAsDocx = () => {
        const paragraphs = restructuredCv.split('\n').map(text => 
            new docx.Paragraph({ children: [new docx.TextRun(text)] })
        );
        const doc = new docx.Document({ sections: [{ children: paragraphs }] });
        docx.Packer.toBlob(doc).then((blob: Blob) => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${selectedLayout?.name.replace(/\s+/g, '_') || 'curriculo'}_reestruturado.docx`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        });
    };

    return (
        <div style={styles.container}>
            <h1 style={styles.header}>Layout de Currículos</h1>
            <p style={styles.description}>
                Gere sugestões de layouts modernos com a IA e aplique a estrutura a um de seus currículos salvos para criar uma versão otimizada e impactante.
            </p>

            <div style={styles.actionsContainer}>
                <button style={styles.button} onClick={handleGenerate} disabled={isLoading}>
                    {isLoading ? 'Gerando...' : 'Gerar Sugestões de Layouts'}
                </button>
            </div>

            {error && <p style={styles.error}>{error}</p>}
            
            {layouts.length > 0 && (
                <div style={styles.layoutsGrid}>
                    {layouts.map((layout, index) => (
                        <div key={index} style={styles.layoutCard}>
                            <h3 style={styles.cardHeader}>{layout.name}</h3>
                            <div style={styles.cardBody}>
                                <div style={styles.cardInfo}>
                                    <p style={styles.cardDescription}>{layout.description}</p>
                                    <ul style={styles.cardFeatures}>
                                        {layout.keyFeatures.map((feature, i) => <li key={i}>{feature}</li>)}
                                    </ul>
                                </div>
                                <pre style={styles.cardPreview}>{layout.previewContent}</pre>
                            </div>
                            <button style={styles.applyButton} onClick={() => handleApplyClick(layout)}>
                                Aplicar este Layout
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {selectedLayout && (
                <div style={styles.applySection}>
                    <h2 style={styles.subHeader}>Testar Layout: "{selectedLayout.name}"</h2>
                    <p>Selecione um de seus currículos salvos para reestruturar seu conteúdo com base neste layout.</p>
                    <div style={styles.applyControls}>
                        <select value={selectedCvId} onChange={e => setSelectedCvId(e.target.value)} style={styles.select}>
                            <option value="">Selecione um Currículo</option>
                            {cvs.map(cv => <option key={cv.id} value={cv.id}>{cv.name}</option>)}
                        </select>
                        <button onClick={handleRestructure} disabled={isApplying || !selectedCvId} style={isApplying ? styles.buttonDisabled : styles.button}>
                            {isApplying ? 'Reestruturando...' : 'Reestruturar Agora'}
                        </button>
                    </div>
                </div>
            )}

            {restructuredCv && (
                <div style={styles.outputContainer}>
                    <div style={styles.outputHeader}>
                        <h2 style={styles.subHeader}>Resultado do Currículo Reestruturado</h2>
                        <div style={styles.downloadButtons}>
                            <button onClick={handleSaveAsPdf} style={styles.downloadButton}>Salvar como PDF</button>
                            <button onClick={handleSaveAsDocx} style={styles.downloadButton}>Salvar como DOCX</button>
                        </div>
                    </div>
                    <pre style={styles.outputPre}>{restructuredCv}</pre>
                </div>
            )}
        </div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    container: { maxWidth: '900px' },
    header: { color: '#1967d2' },
    description: { color: '#a0aec0', marginBottom: '20px', lineHeight: 1.5 },
    subHeader: { color: '#1967d2', margin: 0 },
    actionsContainer: { marginBottom: '20px' },
    button: { padding: '12px 20px', fontSize: '16px', color: '#fff', backgroundColor: '#1967d2', border: 'none', borderRadius: '4px', cursor: 'pointer' },
    buttonDisabled: { padding: '12px 20px', fontSize: '16px', color: '#a0aec0', backgroundColor: '#4a5568', border: 'none', borderRadius: '4px', cursor: 'not-allowed' },
    error: { color: '#f56565', textAlign: 'center', marginTop: '10px' },
    layoutsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '20px',
        marginTop: '20px',
    },
    layoutCard: {
        backgroundColor: '#2d3748',
        border: '1px solid #4a5568',
        borderRadius: '8px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
    },
    cardHeader: { color: '#1967d2', marginTop: 0, borderBottom: '1px solid #4a5568', paddingBottom: '10px', marginBottom: '15px' },
    cardBody: {
        display: 'flex',
        gap: '20px',
        flexGrow: 1,
    },
    cardInfo: {
        flex: '1 1 60%',
        display: 'flex',
        flexDirection: 'column',
    },
    cardPreview: {
        backgroundColor: '#1a202c',
        border: '1px solid #4a5568',
        borderRadius: '4px',
        padding: '10px',
        fontSize: '12px',
        maxHeight: '250px',
        overflowY: 'auto',
        whiteSpace: 'pre-wrap',
        fontFamily: 'monospace',
        color: '#cbd5e0',
        margin: 0,
        flex: '1 1 40%',
    },
    cardDescription: { flexGrow: 1, color: '#e2e8f0', fontSize: '15px' },
    cardFeatures: { paddingLeft: '20px', color: '#a0aec0', fontSize: '14px', marginTop: '15px' },
    applyButton: { padding: '10px 15px', fontSize: '14px', color: '#fff', backgroundColor: '#34a853', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '15px', alignSelf: 'flex-start' },
    applySection: { marginTop: '30px', padding: '20px', backgroundColor: '#2c5282', borderRadius: '8px' },
    applyControls: { display: 'flex', gap: '10px', marginTop: '15px', alignItems: 'center' },
    select: { flexGrow: 1, padding: '10px', fontSize: '16px', borderRadius: '4px', border: '1px solid #4a5568', backgroundColor: '#1a202c', color: '#e2e8f0' },
    outputContainer: { marginTop: '30px', padding: '20px', backgroundColor: '#2d3748', border: '1px solid #4a5568', borderRadius: '8px' },
    outputHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
    downloadButtons: { display: 'flex', gap: '10px' },
    downloadButton: { padding: '8px 12px', fontSize: '14px', color: '#fff', backgroundColor: '#34a853', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center' },
    outputPre: { whiteSpace: 'pre-wrap', wordWrap: 'break-word', background: '#1a202c', color: '#e2e8f0', padding: '15px', borderRadius: '4px', maxHeight: '400px', overflowY: 'auto' },
};

export default CVLayouts;