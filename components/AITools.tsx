import React, { useState, useContext, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { CV, GenerationHistoryItem, CVLayout } from '../types';
import { generateContentForJob, generateCVLayoutSuggestions, applyCVLayout } from '../services/geminiService';
import { ThemeContext } from '../App';
import { Copy, Download } from './icons';

type GenerationType = 'cv' | 'cover-letter';
type ActiveTab = 'generator' | 'layouts';

const getLayoutCardStyles = (colors): { [key: string]: React.CSSProperties } => ({
    card: { backgroundColor: colors.background, border: `1px solid ${colors.border}`, borderRadius: '8px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' },
    cardHeader: { color: colors.primary, margin: 0, fontSize: '1.2em' },
    cardDescription: { margin: 0, color: colors.textSecondary, fontSize: '0.9em' },
    cardSubHeader: { color: colors.textPrimary, fontWeight: 'bold', fontSize: '0.9em', marginTop: '10px' },
    cardList: { margin: 0, paddingLeft: '20px', color: colors.textSecondary, fontSize: '0.9em' },
    cardPreview: { whiteSpace: 'pre-wrap', wordBreak: 'break-all', backgroundColor: colors.surface, padding: '10px', borderRadius: '4px', border: `1px solid ${colors.border}`, fontSize: '0.8em', maxHeight: '150px', overflowY: 'auto' },
    applySection: { marginTop: '15px', borderTop: `1px solid ${colors.border}`, paddingTop: '15px', display: 'flex', flexDirection: 'column', gap: '10px' },
    select: { padding: '10px', fontSize: '16px', borderRadius: '4px', border: `1px solid ${colors.border}`, backgroundColor: colors.inputBg, color: colors.inputText, width: '100%' },
    button: { padding: '10px 15px', fontSize: '16px', color: colors.textOnPrimary, backgroundColor: colors.success, border: 'none', borderRadius: '4px', cursor: 'pointer' },
    buttonDisabled: { padding: '10px 15px', fontSize: '16px', color: colors.buttonDisabledText, backgroundColor: colors.buttonDisabledBg, border: 'none', borderRadius: '4px', cursor: 'not-allowed' },
});

const getStyles = (colors): { [key: string]: React.CSSProperties } => ({
    container: { maxWidth: '800px' },
    header: { color: colors.primary },
    description: { color: colors.textSecondary, marginBottom: '20px', lineHeight: 1.5 },
    subHeader: { color: colors.primary, borderBottom: `1px solid ${colors.border}`, paddingBottom: '10px', marginTop: '30px' },
    form: { display: 'flex', flexDirection: 'column', gap: '15px', padding: '20px', backgroundColor: colors.surface, borderRadius: '8px', border: `1px solid ${colors.border}`, borderTopLeftRadius: 0 },
    inputGroup: { display: 'flex', flexDirection: 'column', gap: '5px' },
    label: { fontSize: '14px', fontWeight: 500, color: colors.textSecondary },
    select: { padding: '10px', fontSize: '16px', borderRadius: '4px', border: `1px solid ${colors.border}`, backgroundColor: colors.inputBg, color: colors.inputText },
    textarea: { padding: '10px', fontSize: '16px', borderRadius: '4px', border: `1px solid ${colors.border}`, backgroundColor: colors.inputBg, color: colors.inputText, minHeight: '150px' },
    button: { padding: '12px 20px', fontSize: '16px', color: colors.textOnPrimary, backgroundColor: colors.primary, border: 'none', borderRadius: '4px', cursor: 'pointer' },
    buttonDisabled: { padding: '12px 20px', fontSize: '16px', color: colors.buttonDisabledText, backgroundColor: colors.buttonDisabledBg, border: 'none', borderRadius: '4px', cursor: 'not-allowed' },
    error: { color: '#f56565', textAlign: 'center', marginTop: '10px' },
    resultContainer: { marginTop: '30px' },
    resultHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
    resultActions: { display: 'flex', gap: '10px' },
    actionButton: { padding: '8px 12px', fontSize: '14px', color: colors.primary, backgroundColor: 'transparent', border: `1px solid ${colors.primary}`, borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' },
    actionButtonSuccess: { padding: '8px 12px', fontSize: '14px', color: colors.textOnPrimary, backgroundColor: colors.success, border: `1px solid ${colors.success}`, borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' },
    resultContent: { whiteSpace: 'pre-wrap', wordWrap: 'break-word', background: colors.surface, padding: '15px', borderRadius: '8px', border: `1px solid ${colors.border}`, maxHeight: '400px', overflowY: 'auto', color: colors.textPrimary },
    tabs: { display: 'flex' },
    tab: { padding: '10px 20px', cursor: 'pointer', backgroundColor: colors.surface, border: `1px solid ${colors.border}`, borderBottom: 'none', borderRight: 'none', color: colors.textSecondary, fontWeight: 500 },
    tabActive: { padding: '10px 20px', cursor: 'pointer', backgroundColor: colors.surface, border: `1px solid ${colors.border}`, borderBottom: `2px solid ${colors.primary}`, color: colors.primary, fontWeight: 'bold' },
    layoutsGrid: { display: 'grid', gridTemplateColumns: '1fr', gap: '20px', marginTop: '20px' },
    colorCustomizationSection: { marginTop: '20px', padding: '15px', backgroundColor: colors.background, borderRadius: '8px', border: `1px solid ${colors.border}` },
    customizationHeader: { color: colors.primary, marginTop: 0, fontSize: '1.1em' },
    colorPickerContainer: { display: 'flex', gap: '20px', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', paddingTop: '10px' },
    colorPickerWrapper: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' },
    colorInput: { width: '50px', height: '30px', border: 'none', cursor: 'pointer', backgroundColor: 'transparent' },
    footer: { marginTop: '40px', textAlign: 'center', fontSize: '14px', color: colors.textSecondary, paddingTop: '20px', borderTop: `1px solid ${colors.border}` }
});

const LayoutCard: React.FC<{
    layout: CVLayout,
    onApply: () => void,
    cvs: CV[],
    selectedCvId: string,
    onSelectCv: (id: string) => void,
    isLoading: boolean
}> = ({ layout, onApply, cvs, selectedCvId, onSelectCv, isLoading }) => {
    const { colors } = useContext(ThemeContext);
    const cardStyles = getLayoutCardStyles(colors);
    
    return (
        <div style={cardStyles.card}>
            <h3 style={cardStyles.cardHeader}>{layout.name}</h3>
            <p style={cardStyles.cardDescription}>{layout.description}</p>
            <strong style={cardStyles.cardSubHeader}>Pontos-Chave:</strong>
            <ul style={cardStyles.cardList}>
                {layout.keyFeatures.map((feature, i) => <li key={i}>{feature}</li>)}
            </ul>
            <strong style={cardStyles.cardSubHeader}>Pré-visualização da Estrutura:</strong>
            <pre style={cardStyles.cardPreview}>{layout.previewContent}</pre>
            <div style={cardStyles.applySection}>
                 <select style={cardStyles.select} value={selectedCvId} onChange={(e) => onSelectCv(e.target.value)} disabled={cvs.length === 0}>
                    <option value="">{cvs.length > 0 ? 'Selecione um CV para aplicar' : 'Nenhum currículo salvo'}</option>
                    {cvs.map(cv => <option key={cv.id} value={cv.id}>{cv.name}</option>)}
                </select>
                <button style={isLoading ? cardStyles.buttonDisabled : cardStyles.button} onClick={onApply} disabled={isLoading || !selectedCvId}>
                    {isLoading ? 'Aplicando...' : 'Reestruturar Agora'}
                </button>
            </div>
        </div>
    );
}

const ResultDisplay: React.FC<{
    text: string, 
    onCopy: () => void, 
    isCopied: boolean, 
    onDownload: () => void, 
    title?: string,
    titleColor?: string,
    textColor?: string,
    backgroundColor?: string
}> = ({ text, onCopy, isCopied, onDownload, title = "Resultado", titleColor, textColor, backgroundColor }) => {
    const { colors } = useContext(ThemeContext);
    const styles = getStyles(colors);
    
    const renderStyledContent = () => {
        if (!text) return null;
        const parts = text.split(/(##.*?##)/g).filter(part => part);
        return (
            <div style={{...styles.resultContent, backgroundColor: backgroundColor, color: textColor, whiteSpace: 'normal', padding: '25px', lineHeight: 1.6 }}>
                {parts.map((part, index) => {
                    if (part.startsWith('##') && part.endsWith('##')) {
                        return <h3 key={index} style={{ color: titleColor, margin: '1.2em 0 0.5em 0', fontSize: '1.15em', fontWeight: 'bold' }}>{part.slice(2, -2).trim()}</h3>;
                    }
                    return <p key={index} style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{part}</p>;
                })}
            </div>
        );
    };

    return (
        <div style={styles.resultContainer}>
            <div style={styles.resultHeader}>
                <h2 style={{...styles.subHeader, border: 'none', marginTop: 0 }}>{title}</h2>
                <div style={styles.resultActions}>
                    <button style={isCopied ? styles.actionButtonSuccess : styles.actionButton} onClick={onCopy}>
                        <Copy />
                        {isCopied ? 'Copiado!' : 'Copiar Texto'}
                    </button>
                    <button style={styles.actionButton} onClick={onDownload}>
                        <Download />
                        Baixar .txt
                    </button>
                </div>
            </div>
            {titleColor && textColor && backgroundColor ? renderStyledContent() : <pre style={styles.resultContent}>{text}</pre>}
        </div>
    );
};

const AITools: React.FC = () => {
    const { colors } = useContext(ThemeContext);
    const styles = getStyles(colors);

    // Common State
    const [cvs] = useLocalStorage<CV[]>('cvs', []);
    const [history, setHistory] = useLocalStorage<GenerationHistoryItem[]>('generationHistory', []);
    const [activeTab, setActiveTab] = useState<ActiveTab>('generator');

    // Generator Tab State
    const [generationType, setGenerationType] = useState<GenerationType>('cv');
    const [selectedCvId, setSelectedCvId] = useState<string>('');
    const [jobDescription, setJobDescription] = useState<string>('');
    const [result, setResult] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isCopied, setIsCopied] = useState(false);

    // Layouts Tab State
    const [layouts, setLayouts] = useState<CVLayout[]>([]);
    const [isGeneratingLayouts, setIsGeneratingLayouts] = useState(false);
    const [selectedCvForLayoutId, setSelectedCvForLayoutId] = useState<string>('');
    const [isApplyingLayout, setIsApplyingLayout] = useState(false);
    const [restructuredCv, setRestructuredCv] = useState<string>('');
    const [layoutError, setLayoutError] = useState<string | null>(null);
    const [isRestructuredCopied, setIsRestructuredCopied] = useState(false);
    const [titleColor, setTitleColor] = useState(colors.primary);
    const [textColor, setTextColor] = useState(colors.textPrimary);
    const [backgroundColor, setBackgroundColor] = useState(colors.surface);
    
    useEffect(() => {
        setTitleColor(colors.primary);
        setTextColor(colors.textPrimary);
        setBackgroundColor(colors.surface);
    }, [colors]);

    const handleGenerate = async () => {
        if (!selectedCvId || !jobDescription) {
            setError('Por favor, selecione um currículo e insira a descrição da vaga.');
            return;
        }

        const selectedCv = cvs.find(cv => cv.id === selectedCvId);
        if (!selectedCv) {
            setError('Currículo selecionado não encontrado.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setResult('');

        try {
            const generatedText = await generateContentForJob(
                selectedCv.content,
                jobDescription,
                generationType
            );
            setResult(generatedText);

            const newHistoryItem: GenerationHistoryItem = {
                id: new Date().toISOString(),
                type: generationType === 'cv' ? 'Otimização de Currículo' : 'Carta de Apresentação',
                inputCv: selectedCv.content,
                inputJobDescription: jobDescription,
                output: generatedText,
                timestamp: new Date().toISOString(),
            };
            setHistory([newHistoryItem, ...history]);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = (text: string, setCopied: (isCopied: boolean) => void) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const handleDownload = (text: string, type: 'cv' | 'cover-letter' | 'layout') => {
        const fileType = type === 'cv' ? 'CV_Otimizado' : type === 'cover-letter' ? 'Carta_de_Apresentacao' : 'CV_Reestruturado';
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${fileType}_${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleGenerateLayouts = async () => {
        setIsGeneratingLayouts(true);
        setLayoutError(null);
        setLayouts([]);
        setRestructuredCv('');

        try {
            const suggestions = await generateCVLayoutSuggestions();
            setLayouts(suggestions.map(s => ({ ...s, id: Math.random().toString(36).substr(2, 9) })));
        } catch (err) {
            setLayoutError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.');
        } finally {
            setIsGeneratingLayouts(false);
        }
    };
    
    const handleApplyLayout = async (layout: CVLayout) => {
        if (!selectedCvForLayoutId) {
            setLayoutError('Por favor, selecione um currículo para aplicar o layout.');
            return;
        }

        const selectedCv = cvs.find(cv => cv.id === selectedCvForLayoutId);
        if (!selectedCv) {
            setLayoutError('Currículo selecionado não encontrado.');
            return;
        }

        setIsApplyingLayout(true);
        setLayoutError(null);
        setRestructuredCv('');

        try {
            const newContent = await applyCVLayout(selectedCv.content, layout);
            setRestructuredCv(newContent);
        } catch (err) {
            setLayoutError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.');
        } finally {
            setIsApplyingLayout(false);
        }
    };


    const renderGeneratorTab = () => (
        <>
            <div style={styles.form}>
                <h2 style={styles.subHeader}>Gerador de Conteúdo</h2>
                <div style={styles.inputGroup}>
                    <label style={styles.label}>O que você quer gerar?</label>
                    <select style={styles.select} value={generationType} onChange={(e) => setGenerationType(e.target.value as GenerationType)}>
                        <option value="cv">Otimização de Currículo</option>
                        <option value="cover-letter">Carta de Apresentação</option>
                    </select>
                </div>
                <div style={styles.inputGroup}>
                    <label style={styles.label}>Selecione um Currículo</label>
                    <select style={styles.select} value={selectedCvId} onChange={(e) => setSelectedCvId(e.target.value)} disabled={cvs.length === 0}>
                        <option value="">{cvs.length > 0 ? 'Selecione um currículo...' : 'Nenhum currículo salvo.'}</option>
                        {cvs.map(cv => <option key={cv.id} value={cv.id}>{cv.name}</option>)}
                    </select>
                </div>
                <div style={styles.inputGroup}>
                    <label style={styles.label}>Cole a Descrição da Vaga</label>
                    <textarea style={styles.textarea} rows={10} placeholder="Cole aqui a descrição completa da vaga..." value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} />
                </div>
                <button style={isLoading ? styles.buttonDisabled : styles.button} onClick={handleGenerate} disabled={isLoading || !selectedCvId || !jobDescription}>
                    {isLoading ? 'Gerando...' : `Gerar ${generationType === 'cv' ? 'Otimização' : 'Carta'}`}
                </button>
            </div>
            {error && <p style={styles.error}>{error}</p>}
            {result && <ResultDisplay text={result} onCopy={() => handleCopy(result, setIsCopied)} isCopied={isCopied} onDownload={() => handleDownload(result, generationType)} />}
        </>
    );

    const renderLayoutsTab = () => {
        return (
            <div style={styles.form}>
                <h2 style={styles.subHeader}>Layouts de Currículo</h2>
                <p style={styles.description}>
                    Gere sugestões de layouts com IA para encontrar a estrutura perfeita para seu perfil. Depois, aplique o layout escolhido a um de seus currículos salvos para uma reestruturação automática.
                </p>
                <button style={isGeneratingLayouts ? styles.buttonDisabled : styles.button} onClick={handleGenerateLayouts} disabled={isGeneratingLayouts}>
                    {isGeneratingLayouts ? 'Gerando Ideias...' : 'Gerar Sugestões de Layout com IA'}
                </button>

                {isGeneratingLayouts && <p style={{ textAlign: 'center', margin: '10px 0' }}>Buscando inspiração...</p>}
                {layoutError && <p style={styles.error}>{layoutError}</p>}

                {layouts.length > 0 && (
                    <div style={styles.layoutsGrid}>
                        {layouts.map(layout => (
                            <LayoutCard
                                key={layout.id}
                                layout={layout}
                                onApply={() => handleApplyLayout(layout)}
                                cvs={cvs}
                                selectedCvId={selectedCvForLayoutId}
                                onSelectCv={setSelectedCvForLayoutId}
                                isLoading={isApplyingLayout}
                            />
                        ))}
                    </div>
                )}
                
                {restructuredCv && (
                    <>
                        <div style={styles.colorCustomizationSection}>
                            <h3 style={styles.customizationHeader}>Personalização de Cores</h3>
                            <div style={styles.colorPickerContainer}>
                                <div style={styles.colorPickerWrapper}>
                                    <label style={styles.label} htmlFor="titleColor">Cor do Título</label>
                                    <input id="titleColor" type="color" value={titleColor} onChange={(e) => setTitleColor(e.target.value)} style={styles.colorInput} />
                                </div>
                                <div style={styles.colorPickerWrapper}>
                                    <label style={styles.label} htmlFor="textColor">Cor do Texto</label>
                                    <input id="textColor" type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} style={styles.colorInput} />
                                </div>
                                <div style={styles.colorPickerWrapper}>
                                    <label style={styles.label} htmlFor="bgColor">Cor de Fundo</label>
                                    <input id="bgColor" type="color" value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)} style={styles.colorInput} />
                                </div>
                            </div>
                        </div>
                        <ResultDisplay 
                            text={restructuredCv} 
                            onCopy={() => handleCopy(restructuredCv, setIsRestructuredCopied)} 
                            isCopied={isRestructuredCopied} 
                            onDownload={() => handleDownload(restructuredCv, 'layout')} 
                            title="Pré-visualização do Currículo"
                            titleColor={titleColor}
                            textColor={textColor}
                            backgroundColor={backgroundColor}
                        />
                    </>
                )}
            </div>
        )
    };
    

    return (
        <div style={styles.container}>
            <h1 style={styles.header}>Ferramentas de IA</h1>
            <p style={styles.description}>
                Potencialize sua candidatura. Use a IA para otimizar seu CV, gerar cartas de apresentação ou reestruturar seu currículo com layouts profissionais.
            </p>

            <div style={styles.tabs}>
                <button style={activeTab === 'generator' ? styles.tabActive : styles.tab} onClick={() => setActiveTab('generator')}>Otimização de CV/Carta</button>
                <button style={activeTab === 'layouts' ? styles.tabActive : styles.tab} onClick={() => setActiveTab('layouts')}>Layouts de Currículo</button>
            </div>

            {activeTab === 'generator' ? renderGeneratorTab() : renderLayoutsTab()}

             <footer style={styles.footer}>
                Copyright by André Azevedo
            </footer>
        </div>
    );
};

export default AITools;