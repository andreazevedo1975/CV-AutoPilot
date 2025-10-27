// FIX: Implement the AITools component to provide AI-powered assistance for job applications.
import React, { useState, useContext } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { CV, GenerationHistoryItem, HistoryItem, CVLayout } from '../types';
import { optimizeCV, generateCoverLetter, enhancePhoto, generateCVLayouts, applyCVLayout } from '../services/geminiService';
import { ThemeContext } from '../App';

declare const jspdf: any;
declare const docx: any;

type Tool = 'cv' | 'cover-letter' | 'photo' | 'layouts';

const AITools: React.FC = () => {
    const { colors } = useContext(ThemeContext);
    const styles = getStyles(colors);

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

    // State for CV Layouts tool
    const [layouts, setLayouts] = useState<CVLayout[]>([]);
    const [isGeneratingLayouts, setIsGeneratingLayouts] = useState(false);
    const [layoutError, setLayoutError] = useState<string | null>(null);
    const [selectedLayout, setSelectedLayout] = useState<CVLayout | null>(null);
    const [selectedCvIdForLayout, setSelectedCvIdForLayout] = useState<string>('');
    const [isApplyingLayout, setIsApplyingLayout] = useState(false);
    const [restructuredCv, setRestructuredCv] = useState<string>('');


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
    
    const handleSaveAsPdf = (content: string, baseFileName: string) => {
        if (!content) return;
        const { jsPDF } = jspdf;
        const doc = new jsPDF({
            unit: 'pt',
            format: 'a4'
        });
        
        doc.setTextColor(40);
        doc.setFontSize(11);

        const margin = 40;
        const pageWidth = doc.internal.pageSize.getWidth();
        const textLines = doc.splitTextToSize(content, pageWidth - margin * 2);

        doc.text(textLines, margin, margin);
        doc.save(`${baseFileName}.pdf`);
    };
    
    const handleSaveAsDocx = (content: string, baseFileName: string) => {
        if (!content) return;
        const paragraphs = content.split('\n').map(text => 
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
            a.download = `${baseFileName}.docx`;
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

    // Handlers for CV Layouts tool
    const handleGenerateLayouts = async () => {
        setIsGeneratingLayouts(true);
        setLayoutError(null);
        setLayouts([]);
        setRestructuredCv('');
        setSelectedLayout(null);
        try {
            const results = await generateCVLayouts();
            setLayouts(results);
        } catch (err) {
            setLayoutError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.');
        } finally {
            setIsGeneratingLayouts(false);
        }
    };

    const handleLayoutApplyClick = (layout: CVLayout) => {
        setSelectedLayout(layout);
        setRestructuredCv('');
        setSelectedCvIdForLayout('');
    };

    const handleRestructureCv = async () => {
        if (!selectedCvIdForLayout || !selectedLayout) {
            setLayoutError("Selecione um currículo para aplicar o layout.");
            return;
        }
        
        const selectedCv = cvs.find(cv => cv.id === selectedCvIdForLayout);
        if (!selectedCv) {
            setLayoutError("Currículo não encontrado.");
            return;
        }

        setIsApplyingLayout(true);
        setLayoutError(null);
        try {
            const result = await applyCVLayout(selectedCv.content, selectedLayout);
            setRestructuredCv(result);
        } catch (err) {
            setLayoutError(err instanceof Error ? err.message : 'Ocorreu um erro ao aplicar o layout.');
        } finally {
            setIsApplyingLayout(false);
        }
    };

    return (
        <div style={styles.container}>
            <h1 style={styles.header}>Ferramentas de IA</h1>
            <div style={styles.tabs}>
                <button onClick={() => setActiveTool('cv')} style={activeTool === 'cv' ? styles.activeTab : styles.tab}>Otimizador de Currículo</button>
                <button onClick={() => setActiveTool('cover-letter')} style={activeTool === 'cover-letter' ? styles.activeTab : styles.tab}>Gerador de Carta de Apresentação</button>
                <button onClick={() => setActiveTool('photo')} style={activeTool === 'photo' ? styles.activeTab : styles.tab}>Melhoria de Foto</button>
                <button onClick={() => setActiveTool('layouts')} style={activeTool === 'layouts' ? styles.activeTab : styles.tab}>Layout de Currículos</button>
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
                                        <button onClick={() => handleSaveAsPdf(output, activeTool === 'cv' ? 'curriculo-otimizado' : 'carta-de-apresentacao')} style={styles.downloadButton}>Salvar como PDF</button>
                                        <button onClick={() => handleSaveAsDocx(output, activeTool === 'cv' ? 'curriculo-otimizado' : 'carta-de-apresentacao')} style={styles.downloadButton}>Salvar como DOCX</button>
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
                        <p style={styles.layoutDescription}>Carregue uma foto de perfil e a IA irá aprimorá-la para uso profissional, ajustando iluminação, contraste e substituindo o fundo.</p>
                        
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
                 {activeTool === 'layouts' && (
                    <div>
                        <h2 style={{...styles.subHeader, border: 'none', marginTop: 0}}>Layout de Currículos</h2>
                        <p style={styles.layoutDescription}>
                            Gere sugestões de layouts modernos com a IA e aplique a estrutura a um de seus currículos salvos para criar uma versão otimizada e impactante.
                        </p>

                        <div style={styles.layoutActionsContainer}>
                            <button style={styles.button} onClick={handleGenerateLayouts} disabled={isGeneratingLayouts}>
                                {isGeneratingLayouts ? 'Gerando...' : 'Gerar Sugestões de Layouts'}
                            </button>
                        </div>

                        {layoutError && <p style={styles.error}>{layoutError}</p>}
                        
                        {layouts.length > 0 && (
                            <div style={styles.layoutsGrid}>
                                {layouts.map((layout, index) => (
                                    <div key={index} style={styles.layoutCard}>
                                        <h3 style={styles.layoutCardHeader}>{layout.name}</h3>
                                        <div style={styles.layoutCardBody}>
                                            <div style={styles.layoutCardInfo}>
                                                <p style={styles.layoutCardDescription}>{layout.description}</p>
                                                <ul style={styles.layoutCardFeatures}>
                                                    {layout.keyFeatures.map((feature, i) => <li key={i}>{feature}</li>)}
                                                </ul>
                                            </div>
                                            <pre style={styles.layoutCardPreview}>{layout.previewContent}</pre>
                                        </div>
                                        <button style={styles.layoutApplyButton} onClick={() => handleLayoutApplyClick(layout)}>
                                            Aplicar este Layout
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {selectedLayout && (
                            <div style={styles.layoutApplySection}>
                                <h2 style={styles.subHeader}>Testar Layout: "{selectedLayout.name}"</h2>
                                <p>Selecione um de seus currículos salvos para reestruturar seu conteúdo com base neste layout.</p>
                                <div style={styles.layoutApplyControls}>
                                    <select value={selectedCvIdForLayout} onChange={e => setSelectedCvIdForLayout(e.target.value)} style={styles.layoutSelect}>
                                        <option value="">Selecione um Currículo</option>
                                        {cvs.map(cv => <option key={cv.id} value={cv.id}>{cv.name}</option>)}
                                    </select>
                                    <button onClick={handleRestructureCv} disabled={isApplyingLayout || !selectedCvIdForLayout} style={isApplyingLayout ? styles.buttonDisabled : styles.button}>
                                        {isApplyingLayout ? 'Reestruturando...' : 'Reestruturar Agora'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {restructuredCv && (
                            <div style={styles.outputContainer}>
                                <div style={styles.outputHeader}>
                                    <h2 style={styles.subHeader}>Resultado do Currículo Reestruturado</h2>
                                    <div style={styles.downloadButtons}>
                                        <button onClick={() => handleSaveAsPdf(restructuredCv, `${selectedLayout?.name.replace(/\s+/g, '_') || 'curriculo'}_reestruturado`)} style={styles.downloadButton}>Salvar como PDF</button>
                                        <button onClick={() => handleSaveAsDocx(restructuredCv, `${selectedLayout?.name.replace(/\s+/g, '_') || 'curriculo'}_reestruturado`)} style={styles.downloadButton}>Salvar como DOCX</button>
                                    </div>
                                </div>
                                <pre style={styles.outputPre}>{restructuredCv}</pre>
                            </div>
                        )}
                    </div>
                )}
            </div>
            <footer style={styles.footer}>
                Copyright by André Azevedo
            </footer>
        </div>
    );
};

const getStyles = (colors): { [key: string]: React.CSSProperties } => ({
    container: { maxWidth: '900px' },
    header: { color: colors.primary },
    subHeader: { color: colors.primary },
    tabs: { marginBottom: '20px', display: 'flex', flexWrap: 'wrap' },
    tab: { padding: '10px 20px', border: `1px solid ${colors.border}`, background: 'transparent', color: colors.textSecondary, cursor: 'pointer', fontSize: '16px', flex: '1 1 auto' },
    activeTab: { padding: '10px 20px', border: `1px solid ${colors.primary}`, background: colors.primary, color: colors.textOnPrimary, cursor: 'pointer', fontSize: '16px', flex: '1 1 auto' },
    toolContainer: { display: 'flex', flexDirection: 'column', gap: '15px' },
    select: { padding: '10px', fontSize: '16px', borderRadius: '4px', border: `1px solid ${colors.border}`, backgroundColor: colors.inputBg, color: colors.inputText },
    textarea: { padding: '10px', fontSize: '16px', borderRadius: '4px', border: `1px solid ${colors.border}`, backgroundColor: colors.inputBg, color: colors.inputText, minHeight: '150px' },
    button: { padding: '10px 20px', fontSize: '16px', color: colors.textOnPrimary, backgroundColor: colors.primary, border: 'none', borderRadius: '4px', cursor: 'pointer' },
    buttonDisabled: { padding: '10px 20px', fontSize: '16px', color: colors.buttonDisabledText, backgroundColor: colors.buttonDisabledBg, border: 'none', borderRadius: '4px', cursor: 'not-allowed' },
    error: { color: '#f56565' },
    outputContainer: { marginTop: '20px', padding: '20px', backgroundColor: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '8px' },
    outputHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
    downloadButtons: { display: 'flex', gap: '10px' },
    downloadButton: { padding: '8px 12px', fontSize: '14px', color: colors.textOnPrimary, backgroundColor: colors.success, border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center' },
    outputPre: { whiteSpace: 'pre-wrap', wordWrap: 'break-word', background: colors.background, color: colors.textPrimary, padding: '15px', borderRadius: '4px', maxHeight: '400px', overflowY: 'auto' },
    fileInput: { display: 'none' },
    uploadButton: { display: 'inline-block', padding: '10px 20px', fontSize: '16px', color: colors.textOnPrimary, backgroundColor: colors.primary, border: 'none', borderRadius: '4px', cursor: 'pointer', textAlign: 'center', width: 'fit-content' },
    imagePreviewContainer: { display: 'flex', justifyContent: 'center', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px', marginTop: '20px', marginBottom: '20px', width: '100%' },
    imagePreview: { width: '250px', height: '250px', borderRadius: '8px', border: `1px solid ${colors.border}`, objectFit: 'cover' },
    imageLabel: { textAlign: 'center', color: colors.textSecondary, marginBottom: '5px' },
    placeholderPreview: { display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, color: colors.textSecondary, textAlign: 'center' },
    loadingContainer: { display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, color: colors.textPrimary, flexDirection: 'column' },
    // Styles for Layout Tool
    layoutDescription: { color: colors.textSecondary, marginBottom: '20px', lineHeight: 1.5 },
    layoutActionsContainer: { marginBottom: '20px' },
    layoutsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '20px',
        marginTop: '20px',
    },
    layoutCard: {
        backgroundColor: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: '8px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
    },
    layoutCardHeader: { color: colors.primary, marginTop: 0, borderBottom: `1px solid ${colors.border}`, paddingBottom: '10px', marginBottom: '15px' },
    layoutCardBody: {
        display: 'flex',
        gap: '20px',
        flexGrow: 1,
    },
    layoutCardInfo: {
        flex: '1 1 60%',
        display: 'flex',
        flexDirection: 'column',
    },
    layoutCardPreview: {
        backgroundColor: colors.background,
        border: `1px solid ${colors.border}`,
        borderRadius: '4px',
        padding: '10px',
        fontSize: '12px',
        maxHeight: '250px',
        overflowY: 'auto',
        whiteSpace: 'pre-wrap',
        fontFamily: 'monospace',
        color: colors.textSecondary,
        margin: 0,
        flex: '1 1 40%',
    },
    layoutCardDescription: { flexGrow: 1, color: colors.textPrimary, fontSize: '15px' },
    layoutCardFeatures: { paddingLeft: '20px', color: colors.textSecondary, fontSize: '14px', marginTop: '15px' },
    layoutApplyButton: { padding: '10px 15px', fontSize: '14px', color: colors.textOnPrimary, backgroundColor: colors.success, border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '15px', alignSelf: 'flex-start' },
    layoutApplySection: { marginTop: '30px', padding: '20px', backgroundColor: colors.primary, color: colors.textOnPrimary, borderRadius: '8px' },
    layoutApplyControls: { display: 'flex', gap: '10px', marginTop: '15px', alignItems: 'center' },
    layoutSelect: { flexGrow: 1, padding: '10px', fontSize: '16px', borderRadius: '4px', border: `1px solid ${colors.border}`, backgroundColor: colors.inputBg, color: colors.inputText },
    footer: {
        marginTop: '40px',
        textAlign: 'center',
        fontSize: '14px',
        color: colors.textSecondary,
        paddingTop: '20px',
        borderTop: `1px solid ${colors.border}`
    }
});

export default AITools;