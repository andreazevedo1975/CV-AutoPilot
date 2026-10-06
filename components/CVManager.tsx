// Senior CV Manager Component - Enterprise Resumes Management & Batch ZIP Export
import React, { useState, useContext, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import JSZip from 'jszip';
import { jsPDF } from 'jspdf';
import { 
  Archive, 
  CheckSquare, 
  Square, 
  FileText, 
  CheckCircle2, 
  Loader2, 
  DownloadCloud, 
  FileDown, 
  Sparkles as SparklesIcon,
  Layers,
  FileCheck,
  ShieldCheck,
  ShieldAlert,
  Database,
  RefreshCw,
  HardDrive,
  Cloud,
  Cpu,
  Users as UsersIcon,
  Tag as TagIcon,
  Code2,
  HeartHandshake,
  Plus as PlusIcon,
  X as XIcon,
  Check as CheckIcon,
  Target,
  Send
} from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { CV, CVLayout } from '../types';
import { 
  analyzeCV, 
  generateCVLayoutSuggestions, 
  applyCVLayout, 
  ParsedLinkedInProfile,
  extractSkillsFromCVText 
} from '../services/geminiService';
import { cvBackupService, BackupConfig } from '../services/cvBackupService';
import { backgroundSyncService } from '../services/backgroundSyncService';
import { useOfflineDocuments } from '../hooks/useOfflineDocuments';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { OfflineDocumentsModal } from './OfflineDocumentsModal';
import { CVBackupModal } from './CVBackupModal';
import { LinkedInImportModal } from './LinkedInImportModal';
import { CVExportPdfModal } from './CVExportPdfModal';
import { CVBatchZipExportModal } from './CVBatchZipExportModal';
import { CVBatchPdfExportModal } from './CVBatchPdfExportModal';
import { CVSkillsField } from './CVSkillsField';
import { 
  generateExecutiveCvPdfBlob, 
  downloadExecutiveCvPdf 
} from '../services/cvPdfExportService';
import { downloadBatchExecutiveCvPdf } from '../services/cvBatchPdfService';
import { ThemeContext } from '../ThemeContext';
import { Trash, Sparkles, Download, Copy } from './icons';

// Declarations for libraries loaded via CDN
declare const mammoth: any;
declare const pdfjsLib: any;

interface CVManagerProps {
    onNavigateToSWOT?: () => void;
    onNavigateToDispatcher?: () => void;
}

const CVManager: React.FC<CVManagerProps> = ({ onNavigateToSWOT, onNavigateToDispatcher }) => {
    const { colors } = useContext(ThemeContext);
    const styles = getStyles(colors);
    const isOnline = useOnlineStatus();

    const [cvs, setCvs] = useLocalStorage<CV[]>('cvs', []);
    const [cvName, setCvName] = useState('');
    const [cvContent, setCvContent] = useState('');
    const [yearsOfExperience, setYearsOfExperience] = useState<number | ''>('');
    const [portfolioLinks, setPortfolioLinks] = useState('');
    const [technicalSkills, setTechnicalSkills] = useState<string[]>([]);
    const [softSkills, setSoftSkills] = useState<string[]>([]);
    const [isExtractingSkills, setIsExtractingSkills] = useState(false);
    const [extractingCardSkillsId, setExtractingCardSkillsId] = useState<string | null>(null);
    const [cardNewSkillText, setCardNewSkillText] = useState<{ [cvId: string]: string }>({});
    const [cardNewSkillType, setCardNewSkillType] = useState<{ [cvId: string]: 'technical' | 'soft' }>({});
    const [analyzingId, setAnalyzingId] = useState<string | null>(null);
    const [analysisResults, setAnalysisResults] = useLocalStorage<{ [cvId: string]: string }>('cv_analysis_results', {});
    const [error, setError] = useState<string | null>(null);
    const [uploadMessage, setUploadMessage] = useState<string>('Clique para carregar (.pdf, .docx) ou cole o texto abaixo');
    const [isAdding, setIsAdding] = useState(false);

    // Multi-selection & Batch ZIP / Batch PDF Export State
    const [selectedCvIds, setSelectedCvIds] = useState<string[]>([]);
    const [isExportingZip, setIsExportingZip] = useState(false);
    const [showBatchZipModal, setShowBatchZipModal] = useState(false);
    const [showBatchPdfModal, setShowBatchPdfModal] = useState(false);
    const [isExportingBatchPdf, setIsExportingBatchPdf] = useState(false);
    const [cvSearchFilter, setCvSearchFilter] = useState('');
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // Auto-Backup & Data Safety State
    const [showBackupModal, setShowBackupModal] = useState(false);
    const [backupConfig, setBackupConfig] = useState<BackupConfig>(() => cvBackupService.getConfig());
    const [isAutoBackingUp, setIsAutoBackingUp] = useState(false);

    // Salvar para Leitura Offline (IndexedDB via Service Worker) State
    const { isSaved, toggleSaveCV, offlineDocs } = useOfflineDocuments();
    const [isOfflineDocsModalOpen, setIsOfflineDocsModalOpen] = useState(false);

    // LinkedIn Profile AI Import Modal State
    const [showLinkedInModal, setShowLinkedInModal] = useState(false);

    // Executive PDF Export Modal State
    const [pdfExportCv, setPdfExportCv] = useState<CV | null>(null);
    const [showPdfModal, setShowPdfModal] = useState(false);

    // Layout Modal State
    const [showLayoutModal, setShowLayoutModal] = useState(false);
    const [newlyCreatedCv, setNewlyCreatedCv] = useState<CV | null>(null);
    const [layouts, setLayouts] = useState<CVLayout[]>([]);
    const [isLoadingLayouts, setIsLoadingLayouts] = useState(false);
    const [isApplyingLayout, setIsApplyingLayout] = useState(false);
    const [appliedLayoutContent, setAppliedLayoutContent] = useState<string | null>(null);
    const [selectedLayoutName, setSelectedLayoutName] = useState<string>('');
    const [isCopied, setIsCopied] = useState(false);

    // Auto-dismiss toast feedback
    useEffect(() => {
        if (toastMessage) {
            const timer = setTimeout(() => setToastMessage(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [toastMessage]);

    // Keep selected IDs in sync with existing CVs
    useEffect(() => {
        const existingIds = new Set(cvs.map(c => c.id));
        setSelectedCvIds(prev => {
            const next = prev.filter(id => existingIds.has(id));
            if (next.length === prev.length && next.every((id, idx) => id === prev[idx])) {
                return prev;
            }
            return next;
        });
    }, [cvs]);

    // Automatic Backup on CV changes (immediate mode with debounce)
    useEffect(() => {
        const cfg = cvBackupService.getConfig();
        if (!cfg.enabled || cvs.length === 0) return;

        if (cfg.intervalMinutes === 0) {
            const timeoutId = setTimeout(async () => {
                try {
                    setIsAutoBackingUp(true);
                    await cvBackupService.performBackup(cvs, analysisResults, 'auto_change', cfg);
                } catch (err) {
                    console.warn('[CVManager] Falha no backup automático por alteração:', err);
                } finally {
                    setIsAutoBackingUp(false);
                }
            }, 1200);
            return () => clearTimeout(timeoutId);
        }
    }, [cvs, analysisResults]);

    // Periodic Background Auto-Backup
    useEffect(() => {
        const cfg = cvBackupService.getConfig();
        if (!cfg.enabled || cfg.intervalMinutes <= 0 || cvs.length === 0) return;

        const intervalMs = cfg.intervalMinutes * 60 * 1000;
        const timer = setInterval(async () => {
            try {
                setIsAutoBackingUp(true);
                await cvBackupService.performBackup(cvs, analysisResults, 'auto_interval', cfg);
                setBackupConfig(cvBackupService.getConfig());
            } catch (err) {
                console.warn('[CVManager] Falha no backup periódico:', err);
            } finally {
                setIsAutoBackingUp(false);
            }
        }, intervalMs);

        return () => clearInterval(timer);
    }, [cvs, analysisResults, backupConfig.enabled, backupConfig.intervalMinutes]);

    // Preservation on page close / unload
    useEffect(() => {
        const handleBeforeUnload = () => {
            const cfg = cvBackupService.getConfig();
            if (cfg.enabled && cfg.backupOnBeforeUnload && cvs.length > 0) {
                cvBackupService.performBackup(cvs, analysisResults, 'before_unload', cfg);
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [cvs, analysisResults]);

    // Handle restore from backup snapshot
    const handleRestoreFromBackup = (restoredCvs: CV[], restoredAnalysis: Record<string, string>) => {
        setCvs(restoredCvs);
        setAnalysisResults(restoredAnalysis);
        setSelectedCvIds(restoredCvs.map(c => c.id));
        setToastMessage(`✓ Restauração concluída! ${restoredCvs.length} currículo(s) restaurado(s) com sucesso.`);
    };

    // Quick Manual Backup Button Action
    const handleQuickBackup = async () => {
        if (cvs.length === 0) {
            setToastMessage('Adicione pelo menos um currículo para executar o backup.');
            return;
        }
        setIsAutoBackingUp(true);
        try {
            await cvBackupService.performBackup(cvs, analysisResults, 'manual');
            setBackupConfig(cvBackupService.getConfig());
            setToastMessage(`✓ Backup de segurança salvo no navegador com sucesso! (${cvs.length} currículos)`);
        } catch (err: any) {
            setToastMessage('Erro ao executar backup: ' + (err.message || 'Erro'));
        } finally {
            setIsAutoBackingUp(false);
        }
    };

    // Handler when LinkedIn profile is parsed by Gemini AI
    const handleLinkedInProfileImported = (profile: ParsedLinkedInProfile) => {
        setCvName(profile.cvName);
        setYearsOfExperience(profile.yearsOfExperience);
        setPortfolioLinks(profile.portfolioLinks.join('\n'));
        setCvContent(profile.cvContent);
        setToastMessage(`✓ Perfil do LinkedIn de "${profile.candidateName || profile.cvName}" processado com sucesso via IA!`);

        // Extrai automaticamente competências técnicas e soft skills do texto importado
        extractSkillsFromCVText(profile.cvContent).then(result => {
            setTechnicalSkills(result.technicalSkills);
            setSoftSkills(result.softSkills);
        }).catch(e => console.warn('Erro ao extrair competências do LinkedIn:', e));

        // Smooth scroll to the form for easy editing/review
        setTimeout(() => {
            const formSection = document.getElementById('add-cv-form-section');
            if (formSection) {
                formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 150);
    };

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
        const isPdf = fileType === "application/pdf" || file.name.toLowerCase().endsWith('.pdf');
        const isDocx = fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || file.name.toLowerCase().endsWith('.docx');

        if (isPdf) {
            if (typeof pdfjsLib !== 'undefined') {
                pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js`;
            }
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

                    // Auto-extrair competências do texto lido
                    extractSkillsFromCVText(text).then(result => {
                        setTechnicalSkills(result.technicalSkills);
                        setSoftSkills(result.softSkills);
                    }).catch(err => console.warn('Auto-extração de skills:', err));
                } catch (error) {
                    console.error('Erro ao ler o arquivo PDF', error);
                    setCvContent('');
                    setUploadMessage('Erro ao ler o arquivo .pdf. Por favor, tente novamente ou cole o texto manualmente.');
                }
            };
            reader.readAsArrayBuffer(file);

        } else if (isDocx) {
            reader.onload = async (e) => {
                if (!e.target?.result) return;
                try {
                    const result = await mammoth.extractRawText({ arrayBuffer: e.target.result });
                    const extractedText = result.value || '';
                    setCvContent(extractedText);
                    setUploadMessage(`Arquivo ${file.name} carregado com sucesso.`);

                    // Auto-extrair competências do docx
                    extractSkillsFromCVText(extractedText).then(res => {
                        setTechnicalSkills(res.technicalSkills);
                        setSoftSkills(res.softSkills);
                    }).catch(err => console.warn('Auto-extração de skills:', err));
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

    // Extração sob demanda para o formulário de novo currículo
    const handleExtractSkillsForNewCv = async () => {
        if (!cvContent || !cvContent.trim()) {
            setToastMessage('Insira ou carregue o conteúdo do currículo para extrair as competências.');
            return;
        }
        setIsExtractingSkills(true);
        try {
            const result = await extractSkillsFromCVText(cvContent);
            setTechnicalSkills(result.technicalSkills);
            setSoftSkills(result.softSkills);
            setToastMessage(`✓ ${result.technicalSkills.length} competências técnicas e ${result.softSkills.length} soft skills extraídas com sucesso via IA!`);
        } catch (err: any) {
            console.error("Erro ao extrair competências:", err);
            setToastMessage('Falha ao extrair competências. Tente novamente.');
        } finally {
            setIsExtractingSkills(false);
        }
    };

    // Extração sob demanda para um currículo já salvo na lista
    const handleExtractSkillsForSavedCv = async (cv: CV) => {
        setExtractingCardSkillsId(cv.id);
        try {
            const result = await extractSkillsFromCVText(cv.content);
            setCvs(prev => prev.map(c => {
                if (c.id === cv.id) {
                    return {
                        ...c,
                        technicalSkills: result.technicalSkills,
                        softSkills: result.softSkills,
                        skills: [...result.technicalSkills, ...result.softSkills]
                    };
                }
                return c;
            }));
            setToastMessage(`✓ ${result.technicalSkills.length} competências técnicas e ${result.softSkills.length} soft skills vinculadas a "${cv.name}"!`);
        } catch (err: any) {
            console.error("Erro ao extrair competências:", err);
            setToastMessage('Falha ao extrair competências para o currículo selecionado.');
        } finally {
            setExtractingCardSkillsId(null);
        }
    };

    // Remoção interativa de tag de um currículo já salvo
    const handleRemoveSkillFromSavedCv = (cvId: string, skillToRemove: string, type: 'technical' | 'soft') => {
        setCvs(prev => prev.map(c => {
            if (c.id === cvId) {
                const updatedTech = type === 'technical'
                    ? (c.technicalSkills || []).filter(s => s !== skillToRemove)
                    : (c.technicalSkills || []);
                const updatedSoft = type === 'soft'
                    ? (c.softSkills || []).filter(s => s !== skillToRemove)
                    : (c.softSkills || []);
                return {
                    ...c,
                    technicalSkills: updatedTech,
                    softSkills: updatedSoft,
                    skills: [...updatedTech, ...updatedSoft]
                };
            }
            return c;
        }));
        setToastMessage(`Competência "${skillToRemove}" removida do currículo.`);
    };

    // Adição interativa de tag em um currículo já salvo
    const handleAddSkillToSavedCv = (cvId: string) => {
        const text = (cardNewSkillText[cvId] || '').trim();
        const type = cardNewSkillType[cvId] || 'technical';
        if (!text) return;

        let added = false;
        setCvs(prev => prev.map(c => {
            if (c.id === cvId) {
                const currentTech = c.technicalSkills || [];
                const currentSoft = c.softSkills || [];

                if (type === 'technical') {
                    if (currentTech.some(s => s.toLowerCase() === text.toLowerCase())) {
                        setToastMessage(`A competência técnica "${text}" já está vinculada a este currículo.`);
                        return c;
                    }
                    const newTech = [...currentTech, text];
                    added = true;
                    return {
                        ...c,
                        technicalSkills: newTech,
                        skills: [...newTech, ...currentSoft]
                    };
                } else {
                    if (currentSoft.some(s => s.toLowerCase() === text.toLowerCase())) {
                        setToastMessage(`A soft skill "${text}" já está vinculada a este currículo.`);
                        return c;
                    }
                    const newSoft = [...currentSoft, text];
                    added = true;
                    return {
                        ...c,
                        softSkills: newSoft,
                        skills: [...currentTech, ...newSoft]
                    };
                }
            }
            return c;
        }));

        if (added) {
            setCardNewSkillText(prev => ({ ...prev, [cvId]: '' }));
            setToastMessage(`✓ Competência "${text}" adicionada com sucesso!`);
        }
    };

    const handleAnalyzeCv = async (cv: CV) => {
        setAnalyzingId(cv.id);
        setError(null);
        try {
            const result = await analyzeCV(cv.content);
            setAnalysisResults(prev => ({ ...prev, [cv.id]: result }));
            setToastMessage(`Análise ATS concluída com sucesso para "${cv.name}"!`);
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

        const linksArray = portfolioLinks.split('\n').filter(link => link.trim() !== '');
        let fullCvContent = cvContent;
        if (linksArray.length > 0) {
            fullCvContent += `\n\n--- Portfólio ---\n` + linksArray.join('\n');
        }

        const newCv: CV = {
            id: new Date().toISOString(),
            name: cvName,
            content: fullCvContent,
            yearsOfExperience: yearsOfExperience ? Number(yearsOfExperience) : undefined,
            portfolioLinks: linksArray.length > 0 ? linksArray : undefined,
            technicalSkills: technicalSkills.length > 0 ? technicalSkills : undefined,
            softSkills: softSkills.length > 0 ? softSkills : undefined,
            skills: [...technicalSkills, ...softSkills].length > 0 ? [...technicalSkills, ...softSkills] : undefined,
        };
        setCvs(prevCvs => [...prevCvs, newCv]);
        setSelectedCvIds(prev => [...prev, newCv.id]);
        setNewlyCreatedCv(newCv);
        
        // Registrar mutação de criação no Background Sync se estiver offline
        if (!isOnline) {
            backgroundSyncService.enqueueMutation(
                'CV_CREATE',
                newCv.id,
                newCv,
                `Novo currículo "${newCv.name}" criado offline`
            );
        }

        // Start analysis in background
        handleAnalyzeCv(newCv);

        setCvName('');
        setCvContent('');
        setYearsOfExperience('');
        setPortfolioLinks('');
        setTechnicalSkills([]);
        setSoftSkills([]);
        setUploadMessage('Clique para carregar (.pdf, .docx) ou cole o texto abaixo');
        setIsAdding(false);

        // Open Layout Modal automatically
        setShowLayoutModal(true);
        fetchLayoutSuggestions();
    };

    const fetchLayoutSuggestions = async () => {
        setIsLoadingLayouts(true);
        try {
            const suggestions = await generateCVLayoutSuggestions();
            setLayouts(suggestions.map(s => ({ ...s, id: Math.random().toString(36).substr(2, 9) })));
        } catch (err) {
            console.error("Failed to fetch layouts", err);
        } finally {
            setIsLoadingLayouts(false);
        }
    };

    const handleApplyLayout = async (layout: CVLayout) => {
        if (!newlyCreatedCv) return;
        setIsApplyingLayout(true);
        setSelectedLayoutName(layout.name);
        try {
            const result = await applyCVLayout(newlyCreatedCv.content, layout);
            setAppliedLayoutContent(result);
        } catch (err) {
            console.error("Failed to apply layout", err);
        } finally {
            setIsApplyingLayout(false);
        }
    };

    const handleSaveStyledCv = () => {
        if (!appliedLayoutContent || !newlyCreatedCv) return;
        
        const styledCv: CV = {
            ...newlyCreatedCv,
            id: new Date().toISOString(),
            name: `${newlyCreatedCv.name} (${selectedLayoutName})`,
            content: appliedLayoutContent,
            technicalSkills: newlyCreatedCv.technicalSkills,
            softSkills: newlyCreatedCv.softSkills,
            skills: newlyCreatedCv.skills,
        };
        
        setCvs(prev => [styledCv, ...prev]);
        setSelectedCvIds(prev => [styledCv.id, ...prev]);
        setShowLayoutModal(false);
        setAppliedLayoutContent(null);
        setNewlyCreatedCv(null);

        // Registrar mutação no Background Sync se estiver offline
        if (!isOnline) {
            backgroundSyncService.enqueueMutation(
                'CV_CREATE',
                styledCv.id,
                styledCv,
                `Currículo estilizado "${styledCv.name}" criado offline`
            );
        }

        handleAnalyzeCv(styledCv);
        setToastMessage(`Currículo estilizado com layout "${selectedLayoutName}" salvo com sucesso!`);
    };

    const handleCopy = () => {
        if (appliedLayoutContent) {
            navigator.clipboard.writeText(appliedLayoutContent);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }
    };

    const handleDownload = () => {
        if (appliedLayoutContent) {
            const blob = new Blob([appliedLayoutContent], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `CV_${selectedLayoutName.replace(/\s+/g, '_')}.txt`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }
    };

    const handleDeleteCv = (cvId: string) => {
        if (window.confirm('Tem certeza de que deseja excluir este currículo? Esta ação não pode ser desfeita.')) {
            setCvs(prevCvs => prevCvs.filter(cv => cv.id !== cvId));
            setSelectedCvIds(prev => prev.filter(id => id !== cvId));
            setAnalysisResults(prev => {
                const newResults = { ...prev };
                delete newResults[cvId];
                return newResults;
            });
            setToastMessage('Currículo excluído com sucesso.');
        }
    };

    // Selection Handlers
    const isAllSelected = cvs.length > 0 && selectedCvIds.length === cvs.length;

    const handleToggleSelectAll = () => {
        if (isAllSelected) {
            setSelectedCvIds([]);
        } else {
            setSelectedCvIds(cvs.map(c => c.id));
        }
    };

    const handleToggleSelectCv = (cvId: string) => {
        setSelectedCvIds(prev => 
            prev.includes(cvId) ? prev.filter(id => id !== cvId) : [...prev, cvId]
        );
    };

    // Filtered CVs for search query
    const displayedCvs = cvs.filter(cv => {
        if (!cvSearchFilter.trim()) return true;
        const q = cvSearchFilter.toLowerCase().trim();
        return cv.name.toLowerCase().includes(q) || (cv.content && cv.content.toLowerCase().includes(q));
    });

    // Document Format Helpers
    const createCvTextContent = (cv: CV, analysis?: string): string => {
        const parts: string[] = [];
        parts.push(`======================================================================`);
        parts.push(`CV-AUTOPILOT ENTERPRISE • CURRÍCULO PROCESSADO & OTIMIZADO ATS`);
        parts.push(`Documento: ${cv.name}`);
        if (cv.yearsOfExperience !== undefined && cv.yearsOfExperience !== null) {
            parts.push(`Experiência Declarada: ${cv.yearsOfExperience} ano(s)`);
        }
        if (cv.portfolioLinks && cv.portfolioLinks.length > 0) {
            parts.push(`Portfólio / Links:`);
            cv.portfolioLinks.forEach(link => parts.push(`  - ${link}`));
        }
        if (cv.technicalSkills && cv.technicalSkills.length > 0) {
            parts.push(`Competências Técnicas (Hard Skills):`);
            parts.push(`  ${cv.technicalSkills.join(', ')}`);
        }
        if (cv.softSkills && cv.softSkills.length > 0) {
            parts.push(`Soft Skills (Competências Comportamentais):`);
            parts.push(`  ${cv.softSkills.join(', ')}`);
        }
        parts.push(`Data de Processamento: ${new Date().toLocaleString('pt-BR')}`);
        parts.push(`======================================================================\n`);
        parts.push(cv.content || '');

        if (analysis) {
            parts.push(`\n\n======================================================================`);
            parts.push(`PARECER TÉCNICO ATS & AUDITORIA DE INTELIGÊNCIA ARTIFICIAL:`);
            parts.push(`======================================================================\n`);
            parts.push(analysis);
        }

        return parts.join('\n');
    };

    const createCvMarkdownContent = (cv: CV, analysis?: string): string => {
        const parts: string[] = [];
        parts.push(`# ${cv.name}\n`);
        if (cv.yearsOfExperience !== undefined && cv.yearsOfExperience !== null) {
            parts.push(`**Experiência Profissional:** ${cv.yearsOfExperience} ano(s)  `);
        }
        if (cv.portfolioLinks && cv.portfolioLinks.length > 0) {
            parts.push(`**Links & Portfólio:**\n${cv.portfolioLinks.map(l => `- [${l}](${l})`).join('\n')}\n`);
        }
        if (cv.technicalSkills && cv.technicalSkills.length > 0) {
            parts.push(`**Competências Técnicas (Hard Skills):** ${cv.technicalSkills.join(', ')}  \n`);
        }
        if (cv.softSkills && cv.softSkills.length > 0) {
            parts.push(`**Soft Skills (Competências Comportamentais):** ${cv.softSkills.join(', ')}  \n`);
        }
        parts.push(`---\n\n## Conteúdo do Currículo\n\n${cv.content}\n`);
        if (analysis) {
            parts.push(`\n---\n\n## Parecer de IA & Análise de Palavras-Chave ATS\n\n${analysis}\n`);
        }
        return parts.join('\n');
    };

    const createCvPdfBlob = (cv: CV, analysis?: string): Blob => {
        return generateExecutiveCvPdfBlob(cv, analysis, {
            theme: 'bordeaux',
            includeAtsAudit: true,
            includePortfolioLinks: true,
            spacing: 'normal'
        });
    };

    // Primary Batch ZIP Export Action
    const handleExportSelectedZip = async () => {
        if (selectedCvIds.length === 0) {
            setToastMessage('Selecione pelo menos um currículo para exportar em lote (.ZIP).');
            return;
        }

        setIsExportingZip(true);
        try {
            const zip = new JSZip();
            const selectedList = cvs.filter(c => selectedCvIds.includes(c.id));

            let manifestText = `CV-AUTOPILOT ENTERPRISE - PACOTE DE CURRÍCULOS PROCESSADOS (.ZIP)
======================================================================
Data da Exportação: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}
Total de Currículos Exportados: ${selectedList.length}

ESTRUTURA DO PACOTE (.ZIP):
Para cada currículo selecionado, disponibilizamos os formatos profissionais:
  • [.pdf] - Versão executiva pronta para envio formal aos recrutadores
  • [.txt] - Versão em texto puro, 100% otimizada para parsing de ATS (Gupy, Workday, Taleo, Greenhouse)
  • [.md]  - Versão em Markdown estruturado para edição e documentação
  • [Diagnóstico ATS] - Parecer completo de inteligência artificial (quando analisado)

LISTA DE CURRÍCULOS PROCESSADOS NESTE LOTE:
`;

            for (let i = 0; i < selectedList.length; i++) {
                const cv = selectedList[i];
                const indexNum = String(i + 1).padStart(2, '0');
                const safeName = cv.name.replace(/[^a-zA-Z0-9À-ÿ_\- ]/g, '').trim().replace(/\s+/g, '_') || `Curriculo_${i+1}`;
                const folderName = `${indexNum}_${safeName}`;
                const cvFolder = zip.folder(folderName);
                
                const analysis = analysisResults[cv.id];

                manifestText += `\n${i + 1}. ${cv.name}`;
                if (cv.yearsOfExperience) manifestText += ` [${cv.yearsOfExperience} anos exp]`;
                manifestText += analysis ? ' -> Com Parecer ATS IA' : ' -> Conteúdo Base';

                // 1. Plain text format
                const textContent = createCvTextContent(cv, analysis);
                cvFolder?.file(`${safeName}.txt`, textContent);

                // 2. Markdown format
                const mdContent = createCvMarkdownContent(cv, analysis);
                cvFolder?.file(`${safeName}.md`, mdContent);

                // 3. Executive PDF format
                try {
                    const pdfBlob = createCvPdfBlob(cv, analysis);
                    const pdfBuffer = await pdfBlob.arrayBuffer();
                    cvFolder?.file(`${safeName}.pdf`, pdfBuffer);
                } catch (pdfErr) {
                    console.warn(`Erro ao gerar PDF para ${cv.name}:`, pdfErr);
                }

                // 4. Standalone ATS Diagnostic if available
                if (analysis) {
                    cvFolder?.file(`Diagnostico_ATS_IA_${safeName}.txt`, analysis);
                }
            }

            manifestText += `\n\n======================================================================
Gerado com sucesso pelo CV-AutoPilot Enterprise.
Sistema de Otimização e Automação de Candidaturas ATS.
`;

            zip.file('README_MANIFESTO_EXPORTACAO.txt', manifestText);

            const zipBlob = await zip.generateAsync({ type: 'blob' });
            const url = URL.createObjectURL(zipBlob);
            const link = document.createElement('a');
            link.href = url;
            const dateStr = new Date().toISOString().slice(0, 10);
            link.download = `Curriculos_Processados_Lote_${dateStr}.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            setToastMessage(`✓ ${selectedList.length} currículo(s) processado(s) exportado(s) com sucesso em .ZIP!`);
        } catch (err) {
            console.error('Erro ao exportar currículos em ZIP:', err);
            setToastMessage('Erro ao gerar o arquivo ZIP. Tente novamente.');
        } finally {
            setIsExportingZip(false);
        }
    };

    // Single Download Helper
    const handleDownloadSingle = (cv: CV, format: 'txt' | 'pdf') => {
        const safeName = cv.name.replace(/[^a-zA-Z0-9À-ÿ_\- ]/g, '').trim().replace(/\s+/g, '_') || 'Curriculo';
        const analysis = analysisResults[cv.id];

        if (format === 'txt') {
            const text = createCvTextContent(cv, analysis);
            const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${safeName}.txt`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            setToastMessage(`Currículo "${cv.name}" baixado como .TXT`);
        } else {
            try {
                downloadExecutiveCvPdf(cv, analysis, {
                    theme: 'bordeaux',
                    includeAtsAudit: true,
                    includePortfolioLinks: true
                });
                setToastMessage(`✓ Currículo Executivo "${cv.name}" exportado em .PDF`);
            } catch (e) {
                console.error(e);
                setToastMessage('Erro ao gerar PDF do currículo.');
            }
        }
    };

    // Quick direct download for Batch PDF into single file
    const handleQuickDownloadBatchPdf = () => {
        if (selectedCvIds.length === 0) {
            setToastMessage('Selecione pelo menos um currículo para exportar em PDF único.');
            return;
        }
        setIsExportingBatchPdf(true);
        try {
            const selectedList = cvs.filter(c => selectedCvIds.includes(c.id));
            downloadBatchExecutiveCvPdf(selectedList, analysisResults, {
                theme: 'bordeaux',
                includeCoverPage: true,
                includeTableOfContents: true,
                includeAtsAudit: true,
                includePortfolioLinks: true
            });
            setToastMessage(`✓ ${selectedList.length} currículo(s) consolidado(s) e baixado(s) em arquivo único (.PDF)!`);
        } catch (err) {
            console.error('Erro ao baixar PDF único em lote:', err);
            setToastMessage('Erro ao gerar arquivo único em PDF.');
        } finally {
            setIsExportingBatchPdf(false);
        }
    };

    // Open Executive PDF Export Modal with live preview & customization
    const handleOpenExportPdfModal = (cv: CV) => {
        setPdfExportCv(cv);
        setShowPdfModal(true);
    };

    // Load Demo Processed Resumes
    const handleLoadSampleCvs = () => {
        const samples: CV[] = [
            {
                id: 'sample-cv-tech-lead',
                name: 'Currículo Tech Lead Full Stack & Cloud',
                yearsOfExperience: 8,
                portfolioLinks: ['https://github.com/techlead-demo', 'https://linkedin.com/in/techlead-demo'],
                technicalSkills: ['TypeScript', 'React', 'Node.js', 'Google Cloud Platform (GCP)', 'AWS', 'Docker', 'Kubernetes', 'CI/CD Pipelines', 'GraphQL', 'APIs RESTful', 'Arquitetura de Microsserviços', 'Prometheus & Grafana'],
                softSkills: ['Liderança Técnica & Mentoria', 'Comunicação Assertiva', 'Gestão de Pessoas', 'Resolução de Problemas Complexos', 'Visão Sistêmica'],
                skills: ['TypeScript', 'React', 'Node.js', 'Google Cloud Platform (GCP)', 'AWS', 'Docker', 'Kubernetes', 'CI/CD Pipelines', 'GraphQL', 'APIs RESTful', 'Arquitetura de Microsserviços', 'Prometheus & Grafana', 'Liderança Técnica & Mentoria', 'Comunicação Assertiva', 'Gestão de Pessoas', 'Resolução de Problemas Complexos', 'Visão Sistêmica'],
                content: `DADOS PESSOAIS
André Silva | andre.silva@emailcorp.com.br | (11) 98765-4321 | São Paulo - SP

RESUMO PROFISSIONAL
Tech Lead e Engenheiro de Software Sênior com 8 anos de experiência em arquiteturas resilientes, microsserviços Node.js/TypeScript, React 19, Google Cloud Platform e esteiras CI/CD automatizadas. Histórico comprovado de liderança técnica de equipes multidisciplinares com redução de 40% no tempo de deploy e aumento de 99.9% em SLA.

EXPERIÊNCIA PROFISSIONAL
• Tech Lead & Arquiteto Cloud | Fintech Inova (2022 - Atual)
  - Coordenação de equipe de 9 engenheiros em migração para arquitetura orientada a eventos.
  - Otimização de queries e custos de infraestrutura em nuvem, gerando economia de R$ 180.000/ano.
  - Implementação de padrões de observabilidade com Prometheus, Grafana e OpenTelemetry.

• Engenheiro de Software Sênior | Tech Solutions Brasil (2019 - 2022)
  - Desenvolvimento de APIs RESTful e GraphQL de alta concorrência atendendo 2M+ requisições/dia.
  - Mentoria técnica e implantação de testes automatizados com cobertura superior a 85%.

FORMAÇÃO & CERTIFICAÇÕES
• Bacharelado em Ciência da Computação - USP
• AWS Certified Solutions Architect & Google Cloud Professional Cloud Architect
• Idiomas: Português (Nativo), Inglês (Fluente / C2)`
            },
            {
                id: 'sample-cv-pmp',
                name: 'Currículo Gerente de Projetos & Transformação Digital (PMP)',
                yearsOfExperience: 10,
                portfolioLinks: ['https://linkedin.com/in/gerente-projetos-pmp'],
                technicalSkills: ['Gestão de Projetos (PMP / PMBOK)', 'Metodologias Ágeis (Scrum / Kanban)', 'Governança & Riscos', 'Jira & Confluence', 'Orçamento e ROI', 'SAFe® Practice'],
                softSkills: ['Articulação com Stakeholders C-Level', 'Negociação Estratégica', 'Liderança Inspiradora', 'Gestão de Conflitos', 'Adaptabilidade & Resiliência'],
                skills: ['Gestão de Projetos (PMP / PMBOK)', 'Metodologias Ágeis (Scrum / Kanban)', 'Governança & Riscos', 'Jira & Confluence', 'Orçamento e ROI', 'SAFe® Practice', 'Articulação com Stakeholders C-Level', 'Negociação Estratégica', 'Liderança Inspiradora', 'Gestão de Conflitos', 'Adaptabilidade & Resiliência'],
                content: `DADOS PESSOAIS
Mariana Albuquerque | mariana.pmp@emailcorp.com.br | (11) 97123-4567 | São Paulo - SP

RESUMO EXECUTIVO
Gerente de Projetos Sênior certificada PMP® e Agile Coach (CSM/CSPO) com mais de 10 anos de trajetória conduzindo portfólios estratégicos de até R$ 25M nas áreas financeiras e de tecnologia. Especialista em frameworks híbridos (Scrum, Kanban, PMBOK) e governança com stakeholders C-Level.

EXPERIÊNCIA PROFISSIONAL
• Gerente de Projetos Estratégicos | Banco Digital Alfa (2021 - Atual)
  - Liderança de 4 squads ágeis no lançamento de novo produto de pagamentos instantâneos (PIX PJ).
  - Redução do time-to-market em 35% através de automação de esteiras e ritos ágeis estruturados.
  
• Senior Project Manager | Consultoria Global de Negócios (2017 - 2021)
  - Gestão de transformação digital em clientes Fortune 500 com governança de riscos e orçamento.

CERTIFICAÇÕES
• Project Management Professional (PMP)® - PMI
• Certified ScrumMaster (CSM) & SAFe® Practice Consultant`
            },
            {
                id: 'sample-cv-ai-engineer',
                name: 'Currículo Especialista em Inteligência Artificial & LLMs',
                yearsOfExperience: 6,
                portfolioLinks: ['https://huggingface.co/exemplo-ai', 'https://github.com/exemplo-ai'],
                technicalSkills: ['Inteligência Artificial (IA / LLMs)', 'PyTorch / TensorFlow', 'LangChain & RAG', 'Python', 'Bancos de Vetores (Vector DB)', 'Google Gemini API', 'Machine Learning', 'Data Analytics / Pandas'],
                softSkills: ['Pensamento Crítico & Analítico', 'Criatividade & Inovação', 'Resolução de Problemas Complexos', 'Trabalho em Equipe & Colaboração'],
                skills: ['Inteligência Artificial (IA / LLMs)', 'PyTorch / TensorFlow', 'LangChain & RAG', 'Python', 'Bancos de Vetores (Vector DB)', 'Google Gemini API', 'Machine Learning', 'Data Analytics / Pandas', 'Pensamento Crítico & Analítico', 'Criatividade & Inovação', 'Resolução de Problemas Complexos', 'Trabalho em Equipe & Colaboração'],
                content: `DADOS PESSOAIS
Carlos Eduardo Santos | carlos.ai@emailcorp.com.br | (11) 96543-2109 | Campinas - SP

OBJETIVO & SÍNTESE
Especialista em Inteligência Artificial e Machine Learning com foco em LLMs, RAG avançado, fine-tuning e agentes autônomos. Mais de 6 anos construindo soluções de IA generativa em produção com PyTorch, LangChain, Google Gemini API e bancos de vetores em escala.

HISTÓRICO PROFISSIONAL
• Senior AI Engineer | DataLabs Brasil (2022 - Atual)
  - Desenvolvimento de agentes multimodais com recuperação semântica e latência sub-segundo.
  - Implementação de pipeline de avaliação de LLMs (benchmarks de acurácia e redução de alucinações).

• Machine Learning Engineer | BigData Corp (2018 - 2022)
  - Modelagem preditiva para detecção de fraudes em tempo real com economia direta de R$ 3.2M.

FORMAÇÃO ACADÊMICA
• Mestrado em Inteligência Artificial - UNICAMP
• Graduação em Engenharia de Computação - UNICAMP`
            }
        ];

        setCvs(samples);
        setAnalysisResults({
            'sample-cv-tech-lead': `### Avaliação ATS & Diagnóstico de Inteligência Artificial:
- **Compatibilidade ATS**: 96% (Excelente aderência a sistemas Gupy, Workday e Taleo)
- **Palavras-chave Identificadas**: Tech Lead, TypeScript, React 19, Google Cloud, CI/CD, Microsserviços, Observabilidade.
- **Pontos Fortes**: Métricas quantificáveis de impacto financeiro (R$ 180k/ano) e percentuais de SLA (99.9%).
- **Recomendação**: Adicionar certificações específicas de segurança para vagas de liderança executiva.`,
            'sample-cv-pmp': `### Avaliação ATS & Diagnóstico de Inteligência Artificial:
- **Compatibilidade ATS**: 94% (Forte índice para cargos de Diretoria e Gerência de PMO)
- **Palavras-chave Identificadas**: PMP, Scrum, Kanban, Stakeholders C-Level, Portfólio Estratégico, Time-to-Market.
- **Pontos Fortes**: Certificações de peso e experiência sólida em grandes players do mercado financeiro.`,
            'sample-cv-ai-engineer': `### Avaliação ATS & Diagnóstico de Inteligência Artificial:
- **Compatibilidade ATS**: 98% (Altíssima aderência ao mercado aquecido de IA e GenAI)
- **Palavras-chave Identificadas**: LLM, RAG, PyTorch, Gemini API, Agentes Multimodais, Fine-tuning.
- **Pontos Fortes**: Formação de excelência (Mestrado UNICAMP) e entrega de sistemas em produção com latência reduzida.`
        });
        setSelectedCvIds(['sample-cv-tech-lead', 'sample-cv-pmp', 'sample-cv-ai-engineer']);
        setToastMessage('3 currículos processados de demonstração carregados e selecionados!');
    };

    return (
        <div style={styles.container}>
            {/* Toast Feedback */}
            {toastMessage && (
                <div style={styles.toast}>
                    <CheckCircle2 size={18} color={colors.primary} />
                    <span style={{ flex: 1 }}>{toastMessage}</span>
                    <button onClick={() => setToastMessage(null)} style={styles.toastClose}>&times;</button>
                </div>
            )}

            <div style={styles.topHeaderBanner}>
                <div>
                    <h1 style={styles.header}>Gerenciador de Currículos</h1>
                    <p style={styles.headerDescription}>
                        Centralize, estruture e exporte múltiplos currículos processados em pacotes compactados .ZIP prontos para sistemas ATS e recrutadores com backup automático seguro.
                    </p>
                </div>
                <div style={styles.headerRightActions}>
                    {cvs.length > 0 && (
                        <div style={styles.headerQuickStats}>
                            <div style={styles.statBox}>
                                <span style={styles.statNumber}>{cvs.length}</span>
                                <span style={styles.statLabel}>Salvos</span>
                            </div>
                            <div style={styles.statBox}>
                                <span style={styles.statNumber}>{selectedCvIds.length}</span>
                                <span style={styles.statLabel}>Selecionados</span>
                            </div>
                        </div>
                    )}

                    {/* Botão de Configuração de Backup Automático & Segurança dos Dados */}
                    <button
                        type="button"
                        style={styles.headerBackupBtn}
                        onClick={() => setShowBackupModal(true)}
                        title="Configurar backup automático dos currículos processados no armazenamento local ou nuvem do navegador"
                    >
                        <ShieldCheck size={20} color={backupConfig.enabled ? (colors.success || '#10b981') : colors.textSecondary} />
                        <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '13px', fontWeight: 800, color: colors.textPrimary, lineHeight: 1.2 }}>
                                Backup Automático
                            </span>
                            <span style={{ 
                                fontSize: '11px', 
                                color: backupConfig.enabled ? (colors.success || '#059669') : colors.textSecondary, 
                                fontWeight: 700 
                            }}>
                                {backupConfig.enabled ? 'Ativo no Navegador' : 'Desativado'}
                            </span>
                        </div>
                    </button>
                </div>
            </div>
            
            <div id="add-cv-form-section" style={styles.form}>
                <div style={styles.formHeaderRow}>
                    <h2 style={{ ...styles.subHeader, border: 'none', margin: 0, paddingBottom: 0 }}>
                        Adicionar Novo Currículo
                    </h2>
                    {/* Botão de Importação de Perfil do LinkedIn */}
                    <button
                        type="button"
                        style={styles.linkedInImportBtn}
                        onClick={() => setShowLinkedInModal(true)}
                        title="Importar perfil do LinkedIn a partir de texto copiado e processar via IA"
                    >
                        <span style={styles.linkedInBadgeIcon}>in</span>
                        <span>Importar Perfil do LinkedIn (via IA)</span>
                    </button>
                </div>

                <div style={styles.uploadOptionsGrid}>
                    <label htmlFor="cv-upload" style={styles.uploadBoxFlex}>
                        <span style={styles.uploadLabel}>{uploadMessage}</span>
                        <input 
                            id="cv-upload"
                            type="file" 
                            accept=".pdf,application/pdf,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                            onChange={handleFileChange} 
                            style={styles.fileInput}
                        />
                    </label>

                    <button
                        type="button"
                        style={styles.linkedInCardActionBtn}
                        onClick={() => setShowLinkedInModal(true)}
                        title="Importar perfil do LinkedIn através de texto e estruturar campos via IA"
                    >
                        <div style={styles.linkedInCircleLogo}>in</div>
                        <div style={{ textAlign: 'left', flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <strong style={{ fontSize: '13px', color: '#0a66c2' }}>
                                    Importar do LinkedIn com IA
                                </strong>
                                <span style={styles.aiTagSmall}>Novo</span>
                            </div>
                            <span style={{ fontSize: '11px', color: colors.textSecondary, display: 'block', marginTop: '2px' }}>
                                Cole o texto do perfil para extrair cargo, resumo, anos de experiência e links via IA
                            </span>
                        </div>
                    </button>
                </div>

                <input style={styles.input} type="text" placeholder="Nome do Currículo (ex: 'Currículo de Engenheiro de Software')" value={cvName} onChange={(e) => setCvName(e.target.value)} />
                <input style={styles.input} type="number" placeholder="Anos de Experiência (Opcional)" value={yearsOfExperience} onChange={(e) => setYearsOfExperience(e.target.value === '' ? '' : parseInt(e.target.value, 10))} />
                <textarea style={{...styles.textarea, minHeight: '80px' }} placeholder="Links do Portfólio (um por linha, opcional - ex: LinkedIn, GitHub)" value={portfolioLinks} onChange={(e) => setPortfolioLinks(e.target.value)} rows={3}></textarea>
                <textarea style={styles.textarea} placeholder="O conteúdo do seu currículo aparecerá aqui após o upload ou importação do LinkedIn, ou você pode colá-lo diretamente..." value={cvContent} onChange={(e) => setCvContent(e.target.value)} rows={12}></textarea>
                
                {/* Campo de Extração Automática e Gerenciamento de Tags Interativas de Competências */}
                <CVSkillsField
                    technicalSkills={technicalSkills}
                    softSkills={softSkills}
                    onUpdateTechnicalSkills={setTechnicalSkills}
                    onUpdateSoftSkills={setSoftSkills}
                    cvText={cvContent}
                    onExtractSkills={handleExtractSkillsForNewCv}
                    isExtracting={isExtractingSkills}
                    colors={colors}
                    title="Competências & Habilidades (Hard Skills & Soft Skills)"
                />

                <button style={isAdding ? styles.buttonDisabled : styles.button} onClick={handleAddCv} disabled={isAdding}>
                    {isAdding ? 'Salvando e Analisando...' : 'Salvar e Analisar Currículo'}
                </button>
            </div>

            {/* Layout Suggestion Modal */}
            {showLayoutModal && (
                <div style={styles.modalBackdrop}>
                    <div style={styles.modalContent}>
                        <div style={styles.modalHeader}>
                            <h2 style={{...styles.subHeader, marginTop: 0, border: 'none'}}>Currículo Salvo! Vamos dar um visual profissional?</h2>
                            <button onClick={() => setShowLayoutModal(false)} style={styles.closeButton}>&times;</button>
                        </div>
                        
                        {!appliedLayoutContent ? (
                            <>
                                <p style={styles.modalDescription}>
                                    A IA pode reestruturar seu conteúdo em formatos profissionais. Selecione um estilo abaixo para aplicar automaticamente ao seu novo currículo.
                                </p>
                                {isLoadingLayouts ? (
                                    <div style={{textAlign: 'center', padding: '40px'}}>
                                        <Sparkles />
                                        <p>Gerando sugestões de layout...</p>
                                    </div>
                                ) : (
                                    <div style={styles.layoutGrid}>
                                        {layouts.map((layout, idx) => (
                                            <div key={idx} style={styles.layoutCard}>
                                                <h3 style={{marginTop: 0, color: colors.primary}}>{layout.name}</h3>
                                                <p style={{fontSize: '13px', color: colors.textSecondary}}>{layout.description}</p>
                                                <div style={styles.previewBox}>
                                                    <pre style={{fontSize: '10px', margin: 0}}>{layout.previewContent}</pre>
                                                </div>
                                                <button 
                                                    style={isApplyingLayout ? styles.buttonDisabled : styles.button} 
                                                    onClick={() => handleApplyLayout(layout)}
                                                    disabled={isApplyingLayout}
                                                >
                                                    {isApplyingLayout ? 'Aplicando...' : 'Aplicar Este Layout'}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div style={styles.resultContainer}>
                                <div style={styles.resultHeader}>
                                    <h3>Visualização: {selectedLayoutName}</h3>
                                    <div style={{display: 'flex', gap: '10px'}}>
                                        <button onClick={() => setAppliedLayoutContent(null)} style={styles.secondaryButton}>Voltar</button>
                                        <button onClick={handleSaveStyledCv} style={styles.button}>Salvar como Novo Currículo</button>
                                    </div>
                                </div>
                                <div style={styles.previewContent}>
                                    <pre style={{whiteSpace: 'pre-wrap', wordWrap: 'break-word'}}>{appliedLayoutContent}</pre>
                                </div>
                                <div style={styles.resultActions}>
                                    <button 
                                        style={styles.exportExecutivePdfBtn} 
                                        onClick={() => {
                                            if (newlyCreatedCv && appliedLayoutContent) {
                                                handleOpenExportPdfModal({
                                                    ...newlyCreatedCv,
                                                    content: appliedLayoutContent
                                                });
                                            }
                                        }}
                                        title="Exportar currículo reestruturado em PDF Executivo com formatação profissional"
                                    >
                                        <FileDown size={14} /> Exportar PDF Executivo
                                    </button>
                                    <button style={isCopied ? styles.successButton : styles.secondaryButton} onClick={handleCopy}>
                                        <Copy /> {isCopied ? 'Copiado' : 'Copiar Texto'}
                                    </button>
                                    <button style={styles.secondaryButton} onClick={handleDownload}>
                                        <Download /> Baixar .txt
                                    </button>
                                </div>
                            </div>
                        )}
                        <div style={{textAlign: 'right', marginTop: '15px'}}>
                             <button onClick={() => setShowLayoutModal(false)} style={{background: 'none', border: 'none', color: colors.textSecondary, cursor: 'pointer', textDecoration: 'underline'}}>
                                Pular esta etapa
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Resumes List & Batch Actions */}
            <div style={styles.listContainer}>
                <div style={styles.listSectionHeader}>
                    <div>
                        <h2 style={styles.listTitle}>
                            Currículos Salvos ({cvs.length})
                        </h2>
                        <p style={styles.listSubtitle}>
                            Selecione os currículos desejados e clique em <strong>'Exportar Selecionados'</strong> para baixar múltiplos currículos processados de uma só vez em arquivo .zip.
                        </p>
                    </div>

                    {cvs.length > 0 && (
                        <div style={styles.batchToolbar}>
                            {/* Botão de Disparador Automático de Currículo */}
                            {onNavigateToDispatcher && (
                                <button
                                    type="button"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '9px 13px',
                                        borderRadius: '8px',
                                        backgroundColor: 'rgba(16, 185, 129, 0.15)',
                                        color: colors.success,
                                        border: '1px solid #10b981',
                                        fontSize: '13px',
                                        fontWeight: 700,
                                        cursor: 'pointer'
                                    }}
                                    onClick={onNavigateToDispatcher}
                                    title="Disparo automático de currículo por e-mail formatado ou inserção por vaga e região"
                                >
                                    <Send size={15} />
                                    <span>Disparador de Currículo (IA)</span>
                                </button>
                            )}

                            {/* Botão de Análise SWOT Pessoal do Candidato */}
                            {onNavigateToSWOT && (
                                <button
                                    type="button"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '9px 13px',
                                        borderRadius: '8px',
                                        backgroundColor: `${colors.primary}18`,
                                        color: colors.primary,
                                        border: `1px solid ${colors.primary}40`,
                                        fontSize: '13px',
                                        fontWeight: 700,
                                        cursor: 'pointer'
                                    }}
                                    onClick={onNavigateToSWOT}
                                    title="Abrir Análise SWOT Pessoal de Carreira cruzando currículos e histórico"
                                >
                                    <Target size={15} />
                                    <span>Análise SWOT (IA)</span>
                                </button>
                            )}

                            {/* Botão de Importação do LinkedIn via IA */}
                            <button
                                type="button"
                                style={styles.linkedInToolbarBtn}
                                onClick={() => setShowLinkedInModal(true)}
                                title="Importar perfil do LinkedIn a partir de texto copiado e processar via IA"
                            >
                                <span style={styles.linkedInBadgeIcon}>in</span>
                                <span>Importar LinkedIn (IA)</span>
                            </button>

                            {/* Botão de Leitura Offline (IndexedDB / Workbox) */}
                            <button
                                type="button"
                                style={styles.offlineToolbarBtn}
                                onClick={() => setIsOfflineDocsModalOpen(true)}
                                title="Abrir painel de leitura offline e consultar currículos salvos no IndexedDB sem internet"
                            >
                                <HardDrive size={16} color="#10b981" />
                                <span>Leitura Offline ({offlineDocs.length})</span>
                            </button>

                            {/* Botão para Configurar Backup Automático no Gerenciador de Currículos */}
                            <button
                                type="button"
                                style={styles.backupToolbarBtn}
                                onClick={() => setShowBackupModal(true)}
                                title="Configurar o backup automático dos currículos processados no armazenamento local ou nuvem do navegador"
                            >
                                <ShieldCheck size={16} color={backupConfig.enabled ? (colors.success || '#10b981') : colors.textSecondary} />
                                <span>Configurar Backup</span>
                            </button>

                            {/* Botão de Backup Rápido Sob Demanda */}
                            <button
                                type="button"
                                style={isAutoBackingUp ? styles.quickBackupBtnDisabled : styles.quickBackupBtn}
                                onClick={handleQuickBackup}
                                disabled={isAutoBackingUp}
                                title="Executar backup imediato de todos os currículos no navegador"
                            >
                                <RefreshCw size={15} className={isAutoBackingUp ? 'animate-spin' : ''} />
                                <span>{isAutoBackingUp ? 'Salvando...' : 'Backup Agora'}</span>
                            </button>

                            <button 
                                style={styles.selectAllBtn}
                                onClick={handleToggleSelectAll}
                                title={isAllSelected ? "Desmarcar todos os currículos" : "Selecionar todos os currículos da lista"}
                            >
                                {isAllSelected ? <CheckSquare size={16} color={colors.primary} /> : <Square size={16} />}
                                <span>{isAllSelected ? 'Desmarcar Todos' : 'Selecionar Todos'}</span>
                            </button>

                            {/* Badge Indicador de Contagem na Barra de Ações */}
                            <AnimatePresence>
                                {selectedCvIds.length > 0 && (
                                    <motion.div
                                        key="toolbar-selection-count-badge"
                                        initial={{ opacity: 0, scale: 0.75, x: -6 }}
                                        animate={{ opacity: 1, scale: 1, x: 0 }}
                                        exit={{ opacity: 0, scale: 0.75, x: -6 }}
                                        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                                        style={styles.actionBarSelectionIndicator}
                                    >
                                        <CheckCircle2 size={14} color={colors.primary} />
                                        <AnimatePresence mode="popLayout">
                                            <motion.span
                                                key={`badge-count-${selectedCvIds.length}`}
                                                initial={{ scale: 0.4, opacity: 0, y: -4 }}
                                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                                exit={{ scale: 0.4, opacity: 0, y: 4 }}
                                                transition={{ type: 'spring', stiffness: 550, damping: 20 }}
                                                style={styles.actionBarCountPill}
                                            >
                                                {selectedCvIds.length}
                                            </motion.span>
                                        </AnimatePresence>
                                        <span style={styles.actionBarCountText}>
                                            {selectedCvIds.length === 1 ? '1 selecionado' : `${selectedCvIds.length} selecionados`}
                                        </span>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* BATCH ACTION 1: 'Exportar em PDF Único' */}
                            <button
                                style={selectedCvIds.length === 0 || isExportingBatchPdf ? styles.exportBatchPdfBtnDisabled : styles.exportBatchPdfBtn}
                                onClick={() => setShowBatchPdfModal(true)}
                                disabled={selectedCvIds.length === 0 || isExportingBatchPdf}
                                title="Exportar múltiplos currículos selecionados consolidados em um único arquivo PDF corporativo com capa e sumário"
                            >
                                <FileDown size={16} />
                                <span>Exportar em PDF Único</span>
                                <AnimatePresence mode="popLayout">
                                    {selectedCvIds.length > 0 && (
                                        <motion.span
                                            key={`badge-batch-pdf-${selectedCvIds.length}`}
                                            initial={{ scale: 0.3, opacity: 0, y: -4 }}
                                            animate={{ scale: 1, opacity: 1, y: 0 }}
                                            exit={{ scale: 0.3, opacity: 0 }}
                                            transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                                            style={styles.actionBtnCountBadge}
                                        >
                                            {selectedCvIds.length}
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </button>

                            {/* BATCH ACTION 2: 'Exportar Pacote .ZIP' */}
                            <button
                                style={selectedCvIds.length === 0 || isExportingZip ? styles.exportZipBtnDisabled : styles.exportZipBtn}
                                onClick={() => setShowBatchZipModal(true)}
                                disabled={selectedCvIds.length === 0 || isExportingZip}
                                title="Abrir painel para exportar múltiplos currículos selecionados em arquivo .zip com organização de perfis"
                            >
                                <Archive size={16} />
                                <span>Exportar .ZIP</span>
                                <AnimatePresence mode="popLayout">
                                    {selectedCvIds.length > 0 && (
                                        <motion.span
                                            key={`badge-batch-zip-${selectedCvIds.length}`}
                                            initial={{ scale: 0.3, opacity: 0, y: -4 }}
                                            animate={{ scale: 1, opacity: 1, y: 0 }}
                                            exit={{ scale: 0.3, opacity: 0 }}
                                            transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                                            style={styles.actionBtnCountBadge}
                                        >
                                            {selectedCvIds.length}
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </button>
                        </div>
                    )}
                </div>

                {/* Sticky/Floating Selection Notice Bar */}
                <AnimatePresence>
                    {cvs.length > 0 && selectedCvIds.length > 0 && (
                        <motion.div 
                            layout
                            initial={{ opacity: 0, y: -16, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -16, scale: 0.98 }}
                            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                            style={styles.selectionBar}
                        >
                            <div style={styles.selectionBarLeft}>
                                <div style={styles.selectionBadge}>
                                    <AnimatePresence mode="popLayout">
                                        <motion.span
                                            key={`count-indicator-${selectedCvIds.length}`}
                                            initial={{ scale: 0.4, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            exit={{ scale: 0.4, opacity: 0 }}
                                            transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                                            style={styles.selectionCounterPill}
                                        >
                                            {selectedCvIds.length}
                                        </motion.span>
                                    </AnimatePresence>
                                    <span>
                                        de {cvs.length} selecionado{selectedCvIds.length !== 1 ? 's' : ''} para exportação
                                    </span>
                                </div>
                                <span style={styles.selectionBarText}>
                                    Pronto para exportação em lote (PDF Único compilado ou pacote .ZIP)
                                </span>
                            </div>
                            <div style={styles.selectionBarRight}>
                                <button 
                                    style={styles.clearSelectionBtn}
                                    onClick={() => setSelectedCvIds([])}
                                >
                                    Limpar Seleção
                                </button>
                                {selectedCvIds.length === 1 && (
                                    <button
                                        style={styles.exportPdfBtnInline}
                                        onClick={() => {
                                            const singleCv = cvs.find(c => c.id === selectedCvIds[0]);
                                            if (singleCv) handleOpenExportPdfModal(singleCv);
                                        }}
                                        title="Visualizar e exportar o currículo selecionado em PDF Executivo Profissional"
                                    >
                                        <FileDown size={14} />
                                        <span>Exportar PDF Individual</span>
                                    </button>
                                )}

                                {/* Botões de Exportação em PDF Único (Arquivo Único) */}
                                <button 
                                    style={styles.exportBatchPdfBtnInline}
                                    onClick={() => setShowBatchPdfModal(true)}
                                    title="Configurar capa, ordem e exportar múltiplos currículos selecionados em arquivo PDF único"
                                >
                                    <FileDown size={14} />
                                    <span>Configurar PDF Único ({selectedCvIds.length})</span>
                                </button>
                                <button 
                                    style={styles.quickDownloadBatchPdfBtnInline}
                                    onClick={handleQuickDownloadBatchPdf}
                                    disabled={isExportingBatchPdf}
                                    title="Baixar diretamente com 1 clique o PDF único com todos os currículos selecionados"
                                >
                                    {isExportingBatchPdf ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                                    <span>Baixar PDF Único</span>
                                </button>

                                {/* Botões do Pacote ZIP */}
                                <button 
                                    style={styles.exportZipBtnInline}
                                    onClick={() => setShowBatchZipModal(true)}
                                    title="Configurar opções de empacotamento e exportar perfis selecionados em .zip"
                                >
                                    <Archive size={14} />
                                    <span>Pacote .ZIP</span>
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Search & Filter Bar for Resumes */}
                {cvs.length > 2 && (
                    <div style={styles.searchListFilterRow}>
                        <input 
                            type="text"
                            placeholder="Buscar versões de currículos por cargo, tecnologia ou perfil..."
                            value={cvSearchFilter}
                            onChange={(e) => setCvSearchFilter(e.target.value)}
                            style={styles.searchListFilterInput}
                        />
                        {cvSearchFilter && (
                            <button 
                                type="button" 
                                onClick={() => setCvSearchFilter('')}
                                style={styles.clearSearchBtn}
                            >
                                Limpar busca
                            </button>
                        )}
                    </div>
                )}

                {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
                
                {cvs.length === 0 ? (
                    <div style={styles.emptyState}>
                        <FileText size={48} color={colors.textSecondary} />
                        <h3 style={{ margin: '12px 0 6px 0', color: colors.textPrimary }}>Nenhum currículo salvo ainda</h3>
                        <p style={{ margin: '0 0 18px 0', color: colors.textSecondary, maxWidth: '520px', lineHeight: 1.5 }}>
                            Você pode carregar um currículo (.pdf/.docx) no formulário acima, restaurar um backup salvo anteriormente ou carregar exemplos demonstrativos para testar a seleção e exportação em .zip agora mesmo.
                        </p>
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
                            <button style={styles.loadSampleBtn} onClick={handleLoadSampleCvs}>
                                <SparklesIcon size={16} />
                                Carregar Exemplos de Demonstração (3 Currículos)
                            </button>
                            <button 
                                style={styles.emptyStateBackupBtn} 
                                onClick={() => setShowBackupModal(true)}
                                title="Configurar backup automático ou restaurar cópia de segurança"
                            >
                                <ShieldCheck size={16} />
                                Configurar / Restaurar Backup
                            </button>
                        </div>
                    </div>
                ) : (
                    <ul style={styles.list}>
                        {displayedCvs.map(cv => {
                            const isSelected = selectedCvIds.includes(cv.id);
                            return (
                                <motion.li 
                                    key={cv.id} 
                                    layout
                                    initial={{ opacity: 0, y: 14 }}
                                    animate={{
                                        opacity: 1,
                                        y: 0,
                                        scale: isSelected ? 1.01 : 1,
                                        borderColor: isSelected 
                                            ? colors.primary 
                                            : colors.border,
                                        boxShadow: isSelected 
                                            ? `0 12px 30px -4px rgba(136, 19, 55, 0.22), 0 0 0 2.5px ${colors.primary}` 
                                            : (colors.shadowSm || '0 2px 8px rgba(0,0,0,0.04)'),
                                        backgroundColor: isSelected 
                                            ? (colors.primaryLight || 'rgba(136, 19, 55, 0.06)') 
                                            : colors.surface
                                    }}
                                    whileHover={{
                                        scale: isSelected ? 1.014 : 1.004,
                                        boxShadow: isSelected 
                                            ? `0 16px 36px -4px rgba(136, 19, 55, 0.32), 0 0 0 3px ${colors.primary}` 
                                            : '0 6px 18px -3px rgba(0,0,0,0.08)'
                                    }}
                                    transition={{
                                        duration: 0.24,
                                        ease: [0.16, 1, 0.3, 1]
                                    }}
                                    style={{
                                        ...styles.listItem,
                                        position: 'relative',
                                        overflow: 'hidden',
                                        borderWidth: isSelected ? '2px' : '1px',
                                        borderStyle: 'solid'
                                    }}
                                >
                                    {/* Destaque Visual de Borda Selecionada Lateral com Animação Fluida */}
                                    <AnimatePresence>
                                        {isSelected && (
                                            <motion.div
                                                key={`selected-stripe-${cv.id}`}
                                                initial={{ scaleY: 0, opacity: 0 }}
                                                animate={{ scaleY: 1, opacity: 1 }}
                                                exit={{ scaleY: 0, opacity: 0 }}
                                                transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                                                style={{
                                                    position: 'absolute',
                                                    top: 0,
                                                    bottom: 0,
                                                    left: 0,
                                                    width: '6px',
                                                    background: `linear-gradient(180deg, ${colors.primary} 0%, ${colors.primaryHover || '#be123c'} 100%)`,
                                                    zIndex: 4,
                                                    borderRadius: '12px 0 0 12px',
                                                    boxShadow: `0 0 12px ${colors.primary}80`
                                                }}
                                            />
                                        )}
                                    </AnimatePresence>

                                    {/* Destaque Visual de Borda Selecionada Pulsante */}
                                    <AnimatePresence>
                                        {isSelected && (
                                            <motion.div
                                                key={`selected-glow-border-${cv.id}`}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: [0.35, 0.8, 0.35] }}
                                                exit={{ opacity: 0 }}
                                                transition={{ repeat: Infinity, duration: 2.8, ease: 'easeInOut' }}
                                                style={{
                                                    position: 'absolute',
                                                    inset: 0,
                                                    borderRadius: '10px',
                                                    border: `1.5px solid ${colors.primary}`,
                                                    pointerEvents: 'none',
                                                    zIndex: 1,
                                                    boxShadow: `inset 0 0 14px ${colors.primary}18`
                                                }}
                                            />
                                        )}
                                    </AnimatePresence>

                                    {/* Destaque Visual / Ribbon de Borda Selecionada */}
                                    <AnimatePresence>
                                        {isSelected && (
                                            <motion.div
                                                key={`selected-ribbon-${cv.id}`}
                                                initial={{ opacity: 0, y: -14, scale: 0.85 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: -14, scale: 0.85 }}
                                                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                                                style={{
                                                    position: 'absolute',
                                                    top: 0,
                                                    right: 0,
                                                    backgroundColor: colors.primary,
                                                    color: '#ffffff',
                                                    fontSize: '10px',
                                                    fontWeight: 800,
                                                    padding: '3px 12px',
                                                    borderBottomLeftRadius: '10px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '5px',
                                                    boxShadow: '0 2px 8px rgba(136, 19, 55, 0.35)',
                                                    zIndex: 2,
                                                    letterSpacing: '0.4px',
                                                    textTransform: 'uppercase'
                                                }}
                                            >
                                                <motion.div
                                                    initial={{ scale: 0, rotate: -35 }}
                                                    animate={{ scale: 1, rotate: 0 }}
                                                    transition={{ delay: 0.05, type: 'spring', stiffness: 600, damping: 20 }}
                                                >
                                                    <CheckCircle2 size={11} />
                                                </motion.div>
                                                <span>Selecionado para Exportação</span>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                    <div style={styles.listItemHeader}>
                                        <div style={styles.listItemInfoGroup}>
                                            {/* Selection Checkbox com Animação Fluida */}
                                            <motion.button 
                                                type="button"
                                                whileHover={{ scale: 1.15 }}
                                                whileTap={{ scale: 0.88 }}
                                                onClick={() => handleToggleSelectCv(cv.id)} 
                                                style={styles.checkboxBtn}
                                                title={isSelected ? "Desmarcar este currículo" : "Selecionar para exportar em PDF Único ou .ZIP"}
                                                aria-label={`Selecionar ${cv.name}`}
                                            >
                                                <AnimatePresence mode="wait" initial={false}>
                                                    {isSelected ? (
                                                        <motion.div
                                                            key="checked"
                                                            initial={{ scale: 0.4, rotate: -25 }}
                                                            animate={{ scale: 1, rotate: 0 }}
                                                            exit={{ scale: 0.4, rotate: 25 }}
                                                            transition={{ type: 'spring', stiffness: 600, damping: 22 }}
                                                        >
                                                            <CheckSquare size={20} color={colors.primary} />
                                                        </motion.div>
                                                    ) : (
                                                        <motion.div
                                                            key="unchecked"
                                                            initial={{ scale: 0.8 }}
                                                            animate={{ scale: 1 }}
                                                            exit={{ scale: 0.8 }}
                                                            transition={{ duration: 0.12 }}
                                                        >
                                                            <Square size={20} color={colors.textSecondary} />
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </motion.button>

                                            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                                                <strong style={styles.cvName}>{cv.name}</strong>
                                                {cv.yearsOfExperience !== undefined && cv.yearsOfExperience !== null && (
                                                    <span style={styles.experienceTag}>
                                                        {cv.yearsOfExperience} ano{cv.yearsOfExperience !== 1 ? 's' : ''} de experiência
                                                    </span>
                                                )}
                                                {analysisResults[cv.id] && (
                                                    <span style={styles.analyzedTag}>
                                                        <FileCheck size={12} /> Auditado por IA
                                                    </span>
                                                )}
                                                {isSaved(cv.id) && (
                                                    <span style={styles.offlineSavedTag}>
                                                        <HardDrive size={11} /> Offline Pronto
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div style={styles.actionsContainer}>
                                            {/* Botão Salvar para Leitura Offline (IndexedDB via Service Worker) */}
                                            <button
                                                type="button"
                                                onClick={async () => {
                                                    const res = await toggleSaveCV(cv, analysisResults[cv.id]);
                                                    setToastMessage(res.saved 
                                                        ? `Currículo "${cv.name}" salvo no IndexedDB para leitura offline!` 
                                                        : `Currículo "${cv.name}" removido do modo offline.`
                                                    );
                                                }}
                                                style={{
                                                    ...styles.offlineToggleBtn,
                                                    backgroundColor: isSaved(cv.id) ? 'rgba(16, 185, 129, 0.12)' : colors.background,
                                                    borderColor: isSaved(cv.id) ? '#10b981' : colors.border,
                                                    color: isSaved(cv.id) ? '#10b981' : colors.textSecondary
                                                }}
                                                title={isSaved(cv.id) ? "Disponível offline no IndexedDB (Clique para remover)" : "Salvar este currículo para leitura offline no IndexedDB via Service Worker"}
                                            >
                                                {isSaved(cv.id) ? <CheckCircle2 size={13} color="#10b981" /> : <HardDrive size={13} />}
                                                <span>{isSaved(cv.id) ? 'Salvo Offline' : 'Salvar Offline'}</span>
                                            </button>

                                            {/* Primary Executive PDF Export Button */}
                                            <button
                                                style={styles.exportExecutivePdfBtn}
                                                onClick={() => handleOpenExportPdfModal(cv)}
                                                title="Exportar este currículo em PDF Executivo Profissional (pré-visualizar, personalizar cores e baixar)"
                                            >
                                                <FileDown size={14} />
                                                <span>Exportar PDF Executivo</span>
                                            </button>

                                            {/* Single Download Quick Actions */}
                                            <button
                                                style={styles.singleDownloadBtn}
                                                onClick={() => handleDownloadSingle(cv, 'pdf')}
                                                title="Download direto do PDF Executivo com 1 clique"
                                            >
                                                <Download size={13} /> PDF Direto
                                            </button>
                                            <button
                                                style={styles.singleDownloadBtn}
                                                onClick={() => handleDownloadSingle(cv, 'txt')}
                                                title="Baixar este currículo individualmente em TXT (ATS)"
                                            >
                                                <FileText size={13} /> TXT
                                            </button>

                                            <button 
                                                style={analyzingId === cv.id ? styles.analyzeButtonDisabled : styles.analyzeButton} 
                                                onClick={() => handleAnalyzeCv(cv)} 
                                                disabled={analyzingId === cv.id}
                                                title="Executar auditoria de palavras-chave e aderência ATS"
                                            >
                                                {analyzingId === cv.id ? 'Analisando...' : 'Analisar Novamente'}
                                            </button>

                                            <button 
                                                style={styles.deleteButton}
                                                onClick={() => handleDeleteCv(cv.id)}
                                                title="Excluir currículo"
                                            >
                                                <Trash />
                                            </button>
                                        </div>
                                    </div>

                                    {cv.portfolioLinks && cv.portfolioLinks.length > 0 && (
                                        <div style={styles.portfolioSection}>
                                            <strong style={styles.portfolioHeader}>Portfólio & Links:</strong>
                                            <ul style={styles.portfolioList}>
                                                {cv.portfolioLinks.map((link, index) => (
                                                    <li key={index}>
                                                        <a href={link} target="_blank" rel="noopener noreferrer" style={{color: colors.primary}}>
                                                            {link}
                                                        </a>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Seção de Competências Técnicas e Soft Skills com Tags Interativas */}
                                    <div style={styles.cardSkillsContainer}>
                                        <div style={styles.cardSkillsHeader}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                                <TagIcon size={15} color={colors.primary} />
                                                <strong style={{ fontSize: '13px', color: colors.textPrimary }}>
                                                    Competências & Soft Skills:
                                                </strong>
                                                <span style={styles.cardSkillsBadge}>
                                                    {((cv.technicalSkills?.length || 0) + (cv.softSkills?.length || 0))} tags
                                                </span>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => handleExtractSkillsForSavedCv(cv)}
                                                disabled={extractingCardSkillsId === cv.id}
                                                style={extractingCardSkillsId === cv.id ? styles.cardExtractBtnDisabled : styles.cardExtractBtn}
                                                title="Extrair ou re-analisar competências técnicas e soft skills do texto deste currículo com IA"
                                            >
                                                {extractingCardSkillsId === cv.id ? (
                                                    <>
                                                        <Loader2 size={13} className="animate-spin" />
                                                        <span>Extraindo com IA...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <SparklesIcon size={13} />
                                                        <span>
                                                            {((cv.technicalSkills?.length || 0) + (cv.softSkills?.length || 0)) > 0 
                                                                ? 'Re-extrair Skills (IA)' 
                                                                : 'Extrair Competências (IA)'}
                                                        </span>
                                                    </>
                                                )}
                                            </button>
                                        </div>

                                        {/* Tags Técnicas (Hard Skills) */}
                                        {cv.technicalSkills && cv.technicalSkills.length > 0 && (
                                            <div style={{ marginTop: '8px' }}>
                                                <div style={{ fontSize: '11px', fontWeight: 800, color: '#1d4ed8', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <Cpu size={12} />
                                                    HARD SKILLS ({cv.technicalSkills.length})
                                                </div>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                    {cv.technicalSkills.map((skill, sIdx) => (
                                                        <span key={`card-tech-${sIdx}-${skill}`} style={styles.cardTechTag}>
                                                            <span>{skill}</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveSkillFromSavedCv(cv.id, skill, 'technical')}
                                                                style={styles.cardTagRemoveBtn}
                                                                title={`Remover competência técnica "${skill}"`}
                                                                aria-label={`Remover ${skill}`}
                                                            >
                                                                &times;
                                                            </button>
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Tags Comportamentais (Soft Skills) */}
                                        {cv.softSkills && cv.softSkills.length > 0 && (
                                            <div style={{ marginTop: '8px' }}>
                                                <div style={{ fontSize: '11px', fontWeight: 800, color: '#047857', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <UsersIcon size={12} />
                                                    SOFT SKILLS ({cv.softSkills.length})
                                                </div>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                    {cv.softSkills.map((skill, sIdx) => (
                                                        <span key={`card-soft-${sIdx}-${skill}`} style={styles.cardSoftTag}>
                                                            <span>{skill}</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveSkillFromSavedCv(cv.id, skill, 'soft')}
                                                                style={styles.cardTagRemoveBtn}
                                                                title={`Remover soft skill "${skill}"`}
                                                                aria-label={`Remover ${skill}`}
                                                            >
                                                                &times;
                                                            </button>
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {(!cv.technicalSkills || cv.technicalSkills.length === 0) && (!cv.softSkills || cv.softSkills.length === 0) && (
                                            <p style={{ fontSize: '12px', color: colors.textSecondary, margin: '6px 0 8px 0', fontStyle: 'italic' }}>
                                                Nenhuma competência vinculada ainda. Clique em "Extrair Competências (IA)" acima ou adicione tags interativas abaixo.
                                            </p>
                                        )}

                                        {/* Inline Add Skill Tag Input */}
                                        <div style={styles.cardAddSkillRow}>
                                            <input
                                                type="text"
                                                placeholder="Adicionar competência (ex: Docker, Liderança...)"
                                                value={cardNewSkillText[cv.id] || ''}
                                                onChange={(e) => setCardNewSkillText(prev => ({ ...prev, [cv.id]: e.target.value }))}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        handleAddSkillToSavedCv(cv.id);
                                                    }
                                                }}
                                                style={styles.cardAddSkillInput}
                                            />
                                            <select
                                                value={cardNewSkillType[cv.id] || 'technical'}
                                                onChange={(e) => setCardNewSkillType(prev => ({ ...prev, [cv.id]: e.target.value as 'technical' | 'soft' }))}
                                                style={styles.cardAddSkillSelect}
                                            >
                                                <option value="technical">Hard Skill (Técnica)</option>
                                                <option value="soft">Soft Skill (Comportamental)</option>
                                            </select>
                                            <button
                                                type="button"
                                                onClick={() => handleAddSkillToSavedCv(cv.id)}
                                                disabled={!(cardNewSkillText[cv.id] || '').trim()}
                                                style={!(cardNewSkillText[cv.id] || '').trim() ? styles.cardAddBtnDisabled : styles.cardAddBtn}
                                            >
                                                <PlusIcon size={12} />
                                                <span>Adicionar</span>
                                            </button>
                                        </div>
                                    </div>

                                    {analysisResults[cv.id] && (
                                        <div style={styles.analysisResult}>
                                            <ReactMarkdown
                                                components={{
                                                    h1: ({node, ...props}) => <h3 style={{fontSize: '1.2em', marginTop: '1em', color: colors.primary}} {...props} />,
                                                    h2: ({node, ...props}) => <h4 style={{fontSize: '1.1em', marginTop: '1em', color: colors.textPrimary}} {...props} />,
                                                    strong: ({node, ...props}) => <strong style={{fontWeight: 'bold'}} {...props} />,
                                                    ul: ({node, ...props}) => <ul style={{paddingLeft: '20px', listStyle: 'disc'}} {...props} />,
                                                    li: ({node, ...props}) => <li style={{marginBottom: '0.5em'}} {...props} />,
                                                }}
                                            >
                                                {analysisResults[cv.id]}
                                            </ReactMarkdown>
                                        </div>
                                    )}
                                </motion.li>
                            );
                        })}
                    </ul>
                )}
            </div>

            {/* Modal de Configuração de Backup Automático & Segurança dos Dados */}
            <CVBackupModal
                isOpen={showBackupModal}
                onClose={() => setShowBackupModal(false)}
                cvs={cvs}
                analysisResults={analysisResults}
                onRestore={handleRestoreFromBackup}
                colors={colors}
                onShowToast={(msg) => setToastMessage(msg)}
            />

            {/* Modal de Importação de Perfil do LinkedIn via IA */}
            <LinkedInImportModal
                isOpen={showLinkedInModal}
                onClose={() => setShowLinkedInModal(false)}
                onProfileImported={handleLinkedInProfileImported}
                colors={colors}
            />

            {/* Modal de Exportação e Pré-visualização do Currículo em PDF Executivo Profissional */}
            <CVExportPdfModal
                isOpen={showPdfModal}
                onClose={() => {
                    setShowPdfModal(false);
                    setPdfExportCv(null);
                }}
                cv={pdfExportCv}
                analysis={pdfExportCv ? analysisResults[pdfExportCv.id] : undefined}
                colors={colors}
                onShowToast={(msg) => setToastMessage(msg)}
            />

            {/* Modal de Exportação em Lote de Currículos em Arquivo PDF Único */}
            <CVBatchPdfExportModal
                isOpen={showBatchPdfModal}
                onClose={() => setShowBatchPdfModal(false)}
                cvs={cvs}
                analysisResults={analysisResults}
                initialSelectedIds={selectedCvIds.length > 0 ? selectedCvIds : cvs.map(c => c.id)}
                colors={colors}
                onShowToast={(msg) => setToastMessage(msg)}
            />

            {/* Modal de Exportação em Lote (.ZIP) para Seleção de Múltiplos Perfis de Currículo */}
            <CVBatchZipExportModal
                isOpen={showBatchZipModal}
                onClose={() => setShowBatchZipModal(false)}
                cvs={cvs}
                analysisResults={analysisResults}
                initialSelectedIds={selectedCvIds.length > 0 ? selectedCvIds : cvs.map(c => c.id)}
                colors={colors}
                onShowToast={(msg) => setToastMessage(msg)}
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
    topHeaderBanner: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '20px',
    },
    header: { 
        color: colors.textPrimary, 
        fontSize: '24px', 
        fontWeight: '800', 
        letterSpacing: '-0.02em', 
        margin: '0 0 6px 0' 
    },
    headerDescription: {
        color: colors.textSecondary,
        fontSize: '14px',
        margin: 0,
        maxWidth: '750px',
        lineHeight: 1.5,
    },
    headerQuickStats: {
        display: 'flex',
        gap: '12px',
    },
    headerRightActions: {
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        flexWrap: 'wrap',
    },
    headerBackupBtn: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '8px 14px',
        borderRadius: '10px',
        backgroundColor: colors.surface,
        border: `1px solid ${colors.border}`,
        cursor: 'pointer',
        boxShadow: colors.shadowSm || '0 1px 4px rgba(0,0,0,0.05)',
        transition: 'all 0.15s ease',
    },
    statBox: {
        backgroundColor: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: '10px',
        padding: '8px 16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minWidth: '70px',
    },
    statNumber: {
        fontSize: '18px',
        fontWeight: '800',
        color: colors.primary,
        lineHeight: 1.2,
    },
    statLabel: {
        fontSize: '11px',
        fontWeight: '600',
        color: colors.textSecondary,
        textTransform: 'uppercase',
    },
    subHeader: { 
        color: colors.textPrimary, 
        fontSize: '19px', 
        fontWeight: '700', 
        borderBottom: `1px solid ${colors.border}`, 
        paddingBottom: '12px', 
        marginBottom: '16px', 
        letterSpacing: '-0.01em' 
    },
    form: { 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '14px', 
        padding: '24px', 
        backgroundColor: colors.surface, 
        borderRadius: '14px', 
        border: `1px solid ${colors.border}`, 
        boxShadow: colors.shadow || '0 4px 20px rgba(0,0,0,0.06)' 
    },
    formHeaderRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        borderBottom: `1px solid ${colors.border}`,
        paddingBottom: '12px',
        marginBottom: '4px',
    },
    linkedInImportBtn: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 16px',
        borderRadius: '10px',
        backgroundColor: '#0a66c2',
        color: '#ffffff',
        border: 'none',
        fontSize: '13px',
        fontWeight: 700,
        cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(10, 102, 194, 0.3)',
        transition: 'all 0.15s ease',
    },
    linkedInBadgeIcon: {
        backgroundColor: '#ffffff',
        color: '#0a66c2',
        borderRadius: '3px',
        fontWeight: 900,
        fontSize: '12px',
        width: '18px',
        height: '18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        lineHeight: 1,
    },
    uploadOptionsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '14px',
        marginBottom: '4px',
    },
    uploadBoxFlex: {
        border: `2px dashed ${colors.primary}`,
        borderRadius: '12px',
        padding: '18px',
        textAlign: 'center',
        cursor: 'pointer',
        backgroundColor: colors.primaryLight || colors.background,
        transition: 'all 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '80px',
    },
    linkedInCardActionBtn: {
        border: '1px solid rgba(10, 102, 194, 0.35)',
        borderRadius: '12px',
        padding: '16px 18px',
        backgroundColor: 'rgba(10, 102, 194, 0.05)',
        cursor: 'pointer',
        transition: 'all 0.18s ease',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        textAlign: 'left',
        minHeight: '80px',
    },
    linkedInCircleLogo: {
        width: '38px',
        height: '38px',
        borderRadius: '8px',
        backgroundColor: '#0a66c2',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 900,
        fontSize: '18px',
        flexShrink: 0,
        boxShadow: '0 2px 8px rgba(10, 102, 194, 0.25)',
    },
    aiTagSmall: {
        fontSize: '10px',
        fontWeight: 800,
        backgroundColor: '#0a66c2',
        color: '#ffffff',
        padding: '1px 6px',
        borderRadius: '4px',
        textTransform: 'uppercase',
    },
    uploadBox: {
        border: `2px dashed ${colors.primary}`,
        borderRadius: '12px',
        padding: '22px',
        textAlign: 'center',
        cursor: 'pointer',
        backgroundColor: colors.primaryLight || colors.background,
        marginBottom: '4px',
        transition: 'all 0.2s ease',
    },
    uploadLabel: {
        color: colors.primary,
        fontWeight: 600,
        fontSize: '14px',
    },
    fileInput: {
        display: 'none',
    },
    input: { 
        padding: '12px 14px', 
        fontSize: '14px', 
        borderRadius: '8px', 
        border: `1px solid ${colors.border}`, 
        backgroundColor: colors.inputBg, 
        color: colors.inputText, 
        outline: 'none' 
    },
    textarea: { 
        padding: '14px', 
        fontSize: '14px', 
        borderRadius: '8px', 
        border: `1px solid ${colors.border}`, 
        backgroundColor: colors.inputBg, 
        color: colors.inputText, 
        minHeight: '180px', 
        lineHeight: 1.6, 
        outline: 'none',
        fontFamily: 'inherit'
    },
    button: { 
        padding: '12px 24px', 
        fontSize: '14px', 
        fontWeight: 700, 
        color: colors.textOnPrimary, 
        backgroundColor: colors.primary, 
        border: 'none', 
        borderRadius: '8px', 
        cursor: 'pointer', 
        boxShadow: '0 2px 8px rgba(136, 19, 55, 0.25)', 
        transition: 'opacity 0.2s' 
    },
    buttonDisabled: {
        padding: '12px 24px',
        fontSize: '14px',
        fontWeight: 600,
        color: colors.buttonDisabledText,
        backgroundColor: colors.buttonDisabledBg,
        border: 'none',
        borderRadius: '8px',
        cursor: 'not-allowed',
    },
    secondaryButton: { 
        padding: '9px 14px', 
        fontSize: '13px', 
        fontWeight: 600, 
        color: colors.textPrimary, 
        backgroundColor: colors.background, 
        border: `1px solid ${colors.border}`, 
        borderRadius: '8px', 
        cursor: 'pointer', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '6px' 
    },
    successButton: { 
        padding: '9px 14px', 
        fontSize: '13px', 
        fontWeight: 600, 
        color: colors.textOnPrimary, 
        backgroundColor: colors.success, 
        border: `1px solid ${colors.success}`, 
        borderRadius: '8px', 
        cursor: 'pointer', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '6px' 
    },
    listContainer: { marginTop: '36px' },
    listSectionHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '16px',
        borderBottom: `1px solid ${colors.border}`,
        paddingBottom: '16px',
        marginBottom: '20px',
    },
    listTitle: {
        color: colors.textPrimary,
        fontSize: '20px',
        fontWeight: '800',
        margin: '0 0 6px 0',
        letterSpacing: '-0.01em',
    },
    listSubtitle: {
        color: colors.textSecondary,
        fontSize: '13px',
        margin: 0,
        maxWidth: '650px',
        lineHeight: 1.4,
    },
    batchToolbar: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        flexWrap: 'wrap',
    },
    linkedInToolbarBtn: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '9px 14px',
        fontSize: '13px',
        fontWeight: 700,
        color: '#0a66c2',
        backgroundColor: 'rgba(10, 102, 194, 0.08)',
        border: '1px solid rgba(10, 102, 194, 0.25)',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
    },
    backupToolbarBtn: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '9px 14px',
        fontSize: '13px',
        fontWeight: 600,
        color: colors.textPrimary,
        backgroundColor: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
    },
    quickBackupBtn: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '9px 14px',
        fontSize: '13px',
        fontWeight: 600,
        color: colors.primary,
        backgroundColor: colors.primaryLight || 'rgba(136, 19, 55, 0.08)',
        border: `1px solid ${colors.primary}`,
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
    },
    quickBackupBtnDisabled: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '9px 14px',
        fontSize: '13px',
        fontWeight: 600,
        color: colors.buttonDisabledText,
        backgroundColor: colors.buttonDisabledBg,
        border: `1px solid ${colors.border}`,
        borderRadius: '8px',
        cursor: 'not-allowed',
        opacity: 0.6,
    },
    offlineToolbarBtn: {
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
    offlineToggleBtn: {
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '7px 11px',
        fontSize: '12px',
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
        padding: '3px 8px',
        borderRadius: '6px',
        fontSize: '11px',
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        whiteSpace: 'nowrap',
    },
    selectAllBtn: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '9px 14px',
        fontSize: '13px',
        fontWeight: 600,
        color: colors.textPrimary,
        backgroundColor: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
    },
    exportBatchPdfBtn: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '9px 18px',
        fontSize: '13px',
        fontWeight: 700,
        color: '#ffffff',
        background: 'linear-gradient(135deg, #881337 0%, #be123c 100%)',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        boxShadow: '0 2px 10px rgba(136, 19, 55, 0.35)',
        transition: 'all 0.18s ease',
    },
    exportBatchPdfBtnDisabled: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '9px 18px',
        fontSize: '13px',
        fontWeight: 600,
        color: colors.buttonDisabledText,
        backgroundColor: colors.buttonDisabledBg,
        border: `1px solid ${colors.border}`,
        borderRadius: '8px',
        cursor: 'not-allowed',
        opacity: 0.6,
    },
    exportBatchPdfBtnInline: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '7px 14px',
        fontSize: '12px',
        fontWeight: 700,
        color: '#ffffff',
        background: 'linear-gradient(135deg, #881337 0%, #be123c 100%)',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(136, 19, 55, 0.25)',
    },
    quickDownloadBatchPdfBtnInline: {
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        padding: '7px 13px',
        fontSize: '12px',
        fontWeight: 700,
        color: colors.primary,
        backgroundColor: colors.surface,
        border: `1.5px solid ${colors.primary}`,
        borderRadius: '6px',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
    },
    exportZipBtn: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '9px 18px',
        fontSize: '13px',
        fontWeight: 700,
        color: colors.textOnPrimary,
        backgroundColor: colors.primary,
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        boxShadow: '0 2px 10px rgba(136, 19, 55, 0.35)',
        transition: 'all 0.18s ease',
    },
    exportZipBtnDisabled: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '9px 18px',
        fontSize: '13px',
        fontWeight: 600,
        color: colors.buttonDisabledText,
        backgroundColor: colors.buttonDisabledBg,
        border: `1px solid ${colors.border}`,
        borderRadius: '8px',
        cursor: 'not-allowed',
        opacity: 0.6,
    },
    exportZipBtnInline: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '7px 14px',
        fontSize: '12px',
        fontWeight: 700,
        color: colors.textOnPrimary,
        backgroundColor: colors.primary,
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
    },
    quickDownloadZipBtnInline: {
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        padding: '7px 12px',
        fontSize: '12px',
        fontWeight: 600,
        color: colors.textPrimary,
        backgroundColor: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: '6px',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
    },
    exportPdfBtnInline: {
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        padding: '7px 13px',
        fontSize: '12px',
        fontWeight: 700,
        color: colors.primary,
        backgroundColor: colors.surface,
        border: `1.5px solid ${colors.primary}`,
        borderRadius: '6px',
        cursor: 'pointer',
        boxShadow: colors.shadowSm || '0 1px 3px rgba(0,0,0,0.05)',
        transition: 'all 0.15s ease',
    },
    selectionBar: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        padding: '10px 16px',
        backgroundColor: colors.primaryLight || 'rgba(136, 19, 55, 0.08)',
        border: `1px solid ${colors.primary}`,
        borderRadius: '10px',
        marginBottom: '20px',
    },
    selectionBarLeft: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        flexWrap: 'wrap',
    },
    selectionBadge: {
        backgroundColor: colors.surface,
        border: `1px solid ${colors.borderFocus || '#881337'}`,
        color: colors.textPrimary,
        padding: '3px 10px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: 700,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    },
    actionBtnCountBadge: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: '20px',
        height: '20px',
        padding: '0 6px',
        borderRadius: '10px',
        backgroundColor: '#ffffff',
        color: colors.primary || '#881337',
        fontSize: '11px',
        fontWeight: 800,
        boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
        marginLeft: '6px'
    },
    selectionCounterPill: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: '22px',
        height: '22px',
        padding: '0 6px',
        borderRadius: '11px',
        backgroundColor: colors.primary || '#881337',
        color: '#ffffff',
        fontSize: '11.5px',
        fontWeight: 800,
        marginRight: '6px',
        boxShadow: '0 2px 6px rgba(136, 19, 55, 0.35)'
    },
    actionBarSelectionIndicator: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 12px',
        backgroundColor: colors.primaryLight || 'rgba(136, 19, 55, 0.08)',
        border: `1.5px solid ${colors.primary}`,
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: 700,
        color: colors.primary,
        boxShadow: '0 2px 8px rgba(136, 19, 55, 0.15)',
    },
    actionBarCountPill: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: '20px',
        height: '20px',
        padding: '0 6px',
        borderRadius: '10px',
        backgroundColor: colors.primary,
        color: '#ffffff',
        fontSize: '11px',
        fontWeight: 800,
        boxShadow: '0 2px 5px rgba(136, 19, 55, 0.3)',
    },
    actionBarCountText: {
        fontSize: '12px',
        fontWeight: 700,
        color: colors.primary,
        whiteSpace: 'nowrap',
    },
    selectionBarText: {
        fontSize: '13px',
        color: colors.textPrimary,
        fontWeight: 500,
    },
    selectionBarRight: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
    },
    clearSelectionBtn: {
        background: 'transparent',
        border: `1px solid ${colors.border}`,
        color: colors.textSecondary,
        padding: '6px 12px',
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: 600,
        cursor: 'pointer',
    },
    searchListFilterRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginBottom: '16px',
    },
    searchListFilterInput: {
        flex: 1,
        padding: '10px 14px',
        borderRadius: '8px',
        border: `1px solid ${colors.border}`,
        backgroundColor: colors.surface,
        color: colors.textPrimary,
        fontSize: '13px',
        outline: 'none',
        boxShadow: colors.shadowSm || '0 1px 3px rgba(0,0,0,0.03)',
    },
    clearSearchBtn: {
        padding: '9px 14px',
        borderRadius: '8px',
        border: `1px solid ${colors.border}`,
        backgroundColor: 'transparent',
        color: colors.textSecondary,
        fontSize: '12px',
        fontWeight: 600,
        cursor: 'pointer',
    },
    emptyState: {
        textAlign: 'center',
        padding: '50px 20px',
        backgroundColor: colors.surface,
        borderRadius: '14px',
        border: `1px dashed ${colors.border}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadSampleBtn: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 18px',
        fontSize: '13px',
        fontWeight: 700,
        color: colors.textOnPrimary,
        backgroundColor: colors.primary,
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(136, 19, 55, 0.3)',
    },
    emptyStateBackupBtn: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 18px',
        fontSize: '13px',
        fontWeight: 600,
        color: colors.textPrimary,
        backgroundColor: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
    },
    list: { listStyle: 'none', padding: 0, margin: 0 },
    listItem: { 
        padding: '18px 20px', 
        borderRadius: '12px', 
        marginBottom: '14px',
        boxShadow: colors.shadowSm || '0 2px 8px rgba(0,0,0,0.04)',
        transition: 'all 0.18s ease',
    },
    listItemHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
    },
    listItemInfoGroup: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        flex: '1 1 auto',
        minWidth: 0,
    },
    checkboxBtn: {
        background: 'none',
        border: 'none',
        padding: '2px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: colors.primary,
        flexShrink: 0,
    },
    cvName: {
        fontWeight: '700',
        color: colors.textPrimary,
        fontSize: '1.05em',
        letterSpacing: '-0.01em',
        wordBreak: 'break-word',
        overflowWrap: 'break-word',
    },
    experienceTag: {
        backgroundColor: colors.primaryLight || colors.primary,
        color: colors.primary,
        border: `1px solid ${colors.border}`,
        padding: '3px 8px',
        borderRadius: '6px',
        fontSize: '11px',
        fontWeight: '700',
        whiteSpace: 'nowrap',
    },
    analyzedTag: {
        backgroundColor: colors.surface,
        color: colors.success || '#10b981',
        border: `1px solid ${colors.success || '#10b981'}`,
        padding: '3px 8px',
        borderRadius: '6px',
        fontSize: '11px',
        fontWeight: '700',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        whiteSpace: 'nowrap',
    },
    actionsContainer: {
        display: 'flex',
        gap: '6px',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    exportExecutivePdfBtn: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '7px 13px',
        fontSize: '12px',
        fontWeight: 700,
        color: colors.textOnPrimary,
        backgroundColor: colors.primary,
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        boxShadow: '0 2px 6px rgba(136, 19, 55, 0.25)',
        transition: 'all 0.15s ease',
    },
    singleDownloadBtn: {
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '7px 11px',
        fontSize: '12px',
        fontWeight: 600,
        color: colors.textPrimary,
        backgroundColor: colors.background,
        border: `1px solid ${colors.border}`,
        borderRadius: '6px',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
    },
    analyzeButton: {
        padding: '7px 12px',
        fontSize: '12px',
        fontWeight: 600,
        color: colors.textOnPrimary,
        backgroundColor: colors.success || '#059669',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
        flexShrink: 0,
    },
    analyzeButtonDisabled: {
        padding: '7px 12px',
        fontSize: '12px',
        fontWeight: 600,
        color: colors.buttonDisabledText,
        backgroundColor: colors.buttonDisabledBg,
        border: 'none',
        borderRadius: '6px',
        cursor: 'not-allowed',
        flexShrink: 0,
    },
    deleteButton: {
        padding: '7px 8px',
        backgroundColor: colors.notification,
        color: colors.textOnPrimary,
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        lineHeight: 0,
    },
    analysisResult: {
        marginTop: '14px',
        padding: '12px 14px',
        backgroundColor: colors.background,
        borderRadius: '8px',
        border: `1px solid ${colors.border}`,
        lineHeight: 1.6,
        color: colors.textPrimary,
        fontSize: '13px',
    },
    portfolioSection: {
        marginTop: '12px',
        paddingTop: '12px',
        borderTop: `1px solid ${colors.border}`,
    },
    portfolioHeader: {
        color: colors.textPrimary,
        fontSize: '13px',
        marginBottom: '4px',
        display: 'block',
    },
    portfolioList: {
        listStyle: 'none',
        padding: 0,
        margin: '4px 0 0 0',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        fontSize: '13px',
    },
    cardSkillsContainer: {
        marginTop: '12px',
        padding: '12px',
        backgroundColor: colors.background || '#f8fafc',
        borderRadius: '10px',
        border: `1px solid ${colors.border}`,
    },
    cardSkillsHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '8px',
    },
    cardSkillsBadge: {
        fontSize: '11px',
        fontWeight: 700,
        padding: '2px 7px',
        borderRadius: '10px',
        backgroundColor: `${colors.primary}18`,
        color: colors.primary,
    },
    cardExtractBtn: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 10px',
        fontSize: '11px',
        fontWeight: 700,
        color: '#ffffff',
        backgroundColor: colors.primary,
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
        transition: 'all 0.15s ease',
    },
    cardExtractBtnDisabled: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 10px',
        fontSize: '11px',
        fontWeight: 700,
        color: '#ffffff',
        backgroundColor: `${colors.primary}80`,
        border: 'none',
        borderRadius: '6px',
        cursor: 'not-allowed',
    },
    cardTechTag: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '3px 8px',
        backgroundColor: '#eff6ff',
        color: '#1e40af',
        border: '1px solid #bfdbfe',
        borderRadius: '6px',
        fontSize: '11px',
        fontWeight: 600,
    },
    cardSoftTag: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '3px 8px',
        backgroundColor: '#ecfdf5',
        color: '#065f46',
        border: '1px solid #a7f3d0',
        borderRadius: '6px',
        fontSize: '11px',
        fontWeight: 600,
    },
    cardTagRemoveBtn: {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color: 'inherit',
        opacity: 0.7,
        fontSize: '13px',
        lineHeight: 1,
        padding: '0 2px',
        marginLeft: '2px',
    },
    cardAddSkillRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        marginTop: '10px',
        paddingTop: '8px',
        borderTop: `1px dashed ${colors.border}`,
        flexWrap: 'wrap',
    },
    cardAddSkillInput: {
        flex: '1 1 200px',
        padding: '6px 10px',
        fontSize: '12px',
        borderRadius: '6px',
        border: `1px solid ${colors.border}`,
        backgroundColor: colors.surface,
        color: colors.textPrimary,
        outline: 'none',
    },
    cardAddSkillSelect: {
        padding: '6px 8px',
        fontSize: '11px',
        fontWeight: 600,
        borderRadius: '6px',
        border: `1px solid ${colors.border}`,
        backgroundColor: colors.surface,
        color: colors.textPrimary,
        outline: 'none',
        cursor: 'pointer',
    },
    cardAddBtn: {
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '6px 10px',
        fontSize: '11px',
        fontWeight: 700,
        color: '#ffffff',
        backgroundColor: colors.primary,
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
    },
    cardAddBtnDisabled: {
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '6px 10px',
        fontSize: '11px',
        fontWeight: 700,
        color: '#94a3b8',
        backgroundColor: '#e2e8f0',
        border: 'none',
        borderRadius: '6px',
        cursor: 'not-allowed',
        whiteSpace: 'nowrap',
    },
    // Modal Styles
    modalBackdrop: {
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
        backgroundColor: 'rgba(0,0,0,0.65)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000,
        padding: '20px'
    },
    modalContent: {
        backgroundColor: colors.background, padding: '25px', borderRadius: '12px', width: '90%', maxWidth: '800px',
        maxHeight: '90vh', overflowY: 'auto', border: `1px solid ${colors.border}`, position: 'relative'
    },
    modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
    closeButton: { background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: colors.textSecondary },
    modalDescription: { color: colors.textSecondary, marginBottom: '20px', fontSize: '14px', lineHeight: 1.5 },
    layoutGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 240px), 1fr))', gap: '16px' },
    layoutCard: {
        backgroundColor: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '10px', padding: '15px',
        display: 'flex', flexDirection: 'column', gap: '10px'
    },
    previewBox: {
        backgroundColor: colors.background, padding: '10px', borderRadius: '6px', border: `1px solid ${colors.border}`,
        height: '100px', overflow: 'hidden', opacity: 0.8
    },
    resultContainer: { display: 'flex', flexDirection: 'column', gap: '15px' },
    resultHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' },
    previewContent: {
        maxHeight: '300px', overflowY: 'auto', padding: '20px', backgroundColor: colors.surface,
        border: `1px solid ${colors.border}`, borderRadius: '6px', fontSize: '13px', color: colors.textPrimary
    },
    resultActions: { display: 'flex', gap: '10px', justifyContent: 'flex-end' },
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

export default CVManager;
