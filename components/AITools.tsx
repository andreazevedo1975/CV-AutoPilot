// FIX: Implement the AITools component to provide AI-powered assistance for job applications.
import React, { useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { CV, GenerationHistoryItem, HistoryItem } from '../types';
import { optimizeCV, generateCoverLetter, enhancePhoto } from '../services/geminiService';

declare const jspdf: any;
declare const docx: any;

type Tool = 'cv' | 'cover-letter' | 'photo';

const AITools: React.FC = () => {
    const [activeTool, setActiveTool] = useState<Tool>('cv');
    const [cvs] = useLocalStorage<CV[]>('cvs', []);
    const [history, setHistory] = useLocalStorage<HistoryItem[]>('generationHistory', []);

    // State for CV and Cover Letter tools
    const [selectedCvId, setSelectedCvId] = useState<string>('');
    const [jobDescription, setJobDescription] = useState('');
    const [output, setOutput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // State for Photo Enhancement tool
    const [originalImage, setOriginalImage] = useState<{data: string, type: string} | null>(null);
    const [enhancedImage, setEnhancedImage] = useState<string | null>(null);
    const [isEnhancing, setIsEnhancing] = useState(false);
    const [imageError, setImageError] = useState('');


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
    
    const handleSaveAsPdf = () => {
        const { jsPDF } = jspdf;
        const doc = new jsPDF();
        
        const margin = 15;
        const pageWidth = doc.internal.pageSize.getWidth();
        const textLines = doc.splitTextToSize(output, pageWidth - margin * 2);
    
        doc.text(textLines, margin, margin);
        const fileName = activeTool === 'cv' ? 'curriculo-otimizado.pdf' : 'carta-de-apresentacao.pdf';
        doc.save(fileName);
    };
    
    const handleSaveAsDocx = () => {
        const paragraphs = output.split('\n').map(text => 
            new docx.Paragraph({
                children: [new docx.TextRun(text)],
            })
        );
    
        const doc = new docx.Document({
            sections: [{
                properties: {},
                children: paragraphs,
            }],
        });
    
        docx.Packer.toBlob(doc).then((blob: Blob) => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const fileName = activeTool === 'cv' ? 'curriculo-otimizado.docx' : 'carta-de-apresentacao.docx';
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        });
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 4 * 1024 * 1024) { // 4MB limit
                setImageError('O arquivo é muito grande. O limite é de 4MB.');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setOriginalImage({ data: reader.result as string, type: file.type });
                setEnhancedImage(null);
                setImageError('');
            };
            reader.onerror = () => setImageError('Falha ao ler o arquivo.');
            reader.readAsDataURL(file);
        }
    };

    const handleEnhance = async () => {
        if (!originalImage) {
            setImageError('Por favor, carregue uma imagem primeiro.');
            return;
        }
        setIsEnhancing(true);
        setImageError('');
        setEnhancedImage(null);
        try {
            const result = await enhancePhoto(originalImage.data, originalImage.type);
            setEnhancedImage(result);
        } catch (err) {
            setImageError('Ocorreu um erro ao tentar melhorar a foto.');
        } finally {
            setIsEnhancing(false);
        }
    };

    const handleDownloadEnhancedImage = () => {
        if (!enhancedImage) return;
        const link = document.createElement('a');
        link.href = enhancedImage;
        link.download = 'foto_profissional.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div style={styles.container}>
            <h1 style={styles.header}>Ferramentas de IA</h1>
            <div style={styles.tabs}>
                <button onClick={() => setActiveTool('cv')} style={activeTool === 'cv' ? styles.activeTab : styles.tab}>Otimizador de Currículo</button>
                <button onClick={() => setActiveTool('cover-letter')} style={activeTool === 'cover-letter' ? styles.activeTab : styles.tab}>Gerador de Carta de Apresentação</button>
                <button onClick={() => setActiveTool('photo')} style={activeTool === 'photo' ? styles.activeTab : styles.tab}>Melhoria de Foto</button>
            </div>
            
            <div style={styles.toolContainer}>
                {(activeTool === 'cv' || activeTool === 'cover-letter') && (
                    <>
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
                        <button onClick={handleSubmit} disabled={isLoading} style={isLoading ? styles.buttonDisabled : styles.button}>
                            {isLoading ? 'Gerando...' : (activeTool === 'cv' ? 'Otimizar Currículo' : 'Gerar Carta de Apresentação')}
                        </button>
                        {error && <p style={styles.error}>{error}</p>}
                        {output && (
                            <div style={styles.outputContainer}>
                                <div style={styles.outputHeader}>
                                    <h2 style={styles.subHeader}>Resultado</h2>
                                    <div style={styles.downloadButtons}>
                                        <button onClick={handleSaveAsPdf} style={styles.downloadButton}>Salvar como PDF</button>
                                        <button onClick={handleSaveAsDocx} style={styles.downloadButton}>Salvar como DOCX</button>
                                    </div>
                                </div>
                                <pre style={styles.outputPre}>{output}</pre>
                            </div>
                        )}
                    </>
                )}
                {activeTool === 'photo' && (
                    <>
                        <h2 style={{...styles.subHeader, border: 'none', marginTop: 0}}>Melhoria de Foto Profissional</h2>
                        <p style={{ color: '#555', marginBottom: '15px' }}>Carregue uma foto de perfil e a IA irá aprimorá-la para uso profissional, ajustando iluminação, contraste e substituindo o fundo.</p>
                        
                        <input type="file" accept="image/png, image/jpeg" onChange={handleImageUpload} style={styles.fileInput} id="photo-upload" />
                        <label htmlFor="photo-upload" style={styles.uploadButton}>
                            {originalImage ? 'Trocar Foto' : 'Escolher Foto'}
                        </label>

                        {imageError && <p style={styles.error}>{imageError}</p>}
                        
                        <div style={styles.imagePreviewContainer}>
                             {originalImage ? (
                                <div>
                                    <h3 style={styles.imageLabel}>Original</h3>
                                    <img src={originalImage.data} alt="Original" style={styles.imagePreview} />
                                </div>
                            ) : (
                                <div>
                                    <h3 style={styles.imageLabel}>Original</h3>
                                    <div style={{...styles.imagePreview, ...styles.placeholderPreview}}>
                                        <span>Aguardando imagem</span>
                                    </div>
                                </div>
                            )}
                            
                            {isEnhancing ? (
                                <div>
                                    <h3 style={styles.imageLabel}>Melhorada</h3>
                                    <div style={{...styles.imagePreview, ...styles.loadingContainer}}>
                                        <p>Aprimorando...</p>
                                    </div>
                                </div>
                            ) : enhancedImage ? (
                                <div>
                                    <h3 style={styles.imageLabel}>Melhorada</h3>
                                    <img src={enhancedImage} alt="Melhorada" style={styles.imagePreview} />
                                </div>
                            ) : (
                                <div>
                                    <h3 style={styles.imageLabel}>Melhorada</h3>
                                    <div style={{...styles.imagePreview, ...styles.placeholderPreview}}>
                                        <span>Resultado aparecerá aqui</span>
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        {originalImage && (
                            <button onClick={handleEnhance} disabled={isEnhancing} style={isEnhancing ? styles.buttonDisabled : styles.button}>
                                {isEnhancing ? 'Aprimorando...' : 'Melhorar Foto'}
                            </button>
                        )}
                        {enhancedImage && (
                            <button onClick={handleDownloadEnhancedImage} style={{...styles.downloadButton, width: '100%', marginTop: '10px', justifyContent: 'center'}}>
                                Baixar Foto Melhorada
                            </button>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    container: { maxWidth: '800px' },
    header: { color: '#1967d2' },
    subHeader: { color: '#1967d2' },
    tabs: { marginBottom: '20px', display: 'flex', flexWrap: 'wrap' },
    tab: { padding: '10px 20px', border: '1px solid #ccc', background: '#f0f0f0', cursor: 'pointer', fontSize: '16px', flex: '1 1 auto' },
    activeTab: { padding: '10px 20px', border: '1px solid #1967d2', background: '#1967d2', color: '#fff', cursor: 'pointer', fontSize: '16px', flex: '1 1 auto' },
    toolContainer: { display: 'flex', flexDirection: 'column', gap: '15px' },
    select: { padding: '10px', fontSize: '16px', borderRadius: '4px', border: '1px solid #ccc' },
    textarea: { padding: '10px', fontSize: '16px', borderRadius: '4px', border: '1px solid #ccc', minHeight: '150px' },
    button: { padding: '10px 20px', fontSize: '16px', color: '#fff', backgroundColor: '#1967d2', border: 'none', borderRadius: '4px', cursor: 'pointer' },
    buttonDisabled: { padding: '10px 20px', fontSize: '16px', color: '#fff', backgroundColor: '#9e9e9e', border: 'none', borderRadius: '4px', cursor: 'not-allowed' },
    error: { color: 'red' },
    outputContainer: { marginTop: '20px', padding: '20px', backgroundColor: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px' },
    outputHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
    downloadButtons: { display: 'flex', gap: '10px' },
    downloadButton: { padding: '8px 12px', fontSize: '14px', color: '#fff', backgroundColor: '#34a853', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center' },
    outputPre: { whiteSpace: 'pre-wrap', wordWrap: 'break-word', background: '#f8f8f8', padding: '15px', borderRadius: '4px' },
    fileInput: { display: 'none' },
    uploadButton: { display: 'inline-block', padding: '10px 20px', fontSize: '16px', color: '#fff', backgroundColor: '#1967d2', border: 'none', borderRadius: '4px', cursor: 'pointer', textAlign: 'center', width: 'fit-content' },
    imagePreviewContainer: { display: 'flex', justifyContent: 'center', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px', marginTop: '20px', marginBottom: '20px', width: '100%' },
    imagePreview: { width: '250px', height: '250px', borderRadius: '8px', border: '1px solid #ccc', objectFit: 'cover' },
    imageLabel: { textAlign: 'center', color: '#333', marginBottom: '5px' },
    placeholderPreview: { display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f2f5', color: '#999', textAlign: 'center' },
    loadingContainer: { display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f2f5', color: '#333', flexDirection: 'column' }
};

export default AITools;