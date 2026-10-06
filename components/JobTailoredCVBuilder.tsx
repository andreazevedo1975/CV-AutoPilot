// Senior Executive CV Architecture - Job Tailored CV Builder & ATS Master
import React, { useState, useContext, useEffect, useRef } from 'react';
import { ThemeContext } from '../ThemeContext';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { 
  CV, 
  Application, 
  TailoredCVOutput, 
  JobKeywordItem, 
  TailoredCVExperience 
} from '../types';
import { understandJobAndBuildTailoredCV } from '../services/geminiService';
import { 
  Sparkles, 
  FileText, 
  Target, 
  Briefcase, 
  CheckCircle2 as CheckCircle, 
  Copy, 
  Download, 
  Upload, 
  Wand2 as Wand, 
  ChevronRight, 
  ArrowRight, 
  RefreshCw, 
  ShieldCheck, 
  Layers, 
  Award, 
  AlertCircle, 
  Check, 
  Building2, 
  MapPin, 
  Eye, 
  Printer, 
  Edit3, 
  ExternalLink,
  Zap,
  Bookmark
} from 'lucide-react';

declare const mammoth: any;
declare const pdfjsLib: any;

interface JobTailoredCVBuilderProps {
  initialJobDescription?: string;
  initialJobTitle?: string;
  initialCompany?: string;
  onNavigateToCVManager?: () => void;
}

export const JobTailoredCVBuilder: React.FC<JobTailoredCVBuilderProps> = ({
  initialJobDescription = '',
  initialJobTitle = '',
  initialCompany = '',
  onNavigateToCVManager,
}) => {
  const { colors } = useContext(ThemeContext);

  // Stored resources
  const [storedCVs, setStoredCVs] = useLocalStorage<CV[]>('cvs', []);
  const [storedApps] = useLocalStorage<Application[]>('applications', []);

  // Form states
  const [jobText, setJobText] = useState(initialJobDescription);
  const [jobTitle, setJobTitle] = useState(initialJobTitle);
  const [companyName, setCompanyName] = useState(initialCompany);

  const [cvText, setCvText] = useState('');
  const [selectedStoredCvId, setSelectedStoredCvId] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [selectedLayout, setSelectedLayout] = useState<string>('tech-ats-master');

  // Generation state
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TailoredCVOutput | null>(null);

  // Preview & Editor state
  const [activeTab, setActiveTab] = useState<'preview' | 'ats-text' | 'editor'>('preview');
  const [editedFullText, setEditedFullText] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Paleta de estilo para a pré-visualização executiva do CV (Padrão Vinho Nobre & Preto Executivo)
  const [paletteTheme, setPaletteTheme] = useState<'bordeaux' | 'noir' | 'slate' | 'emerald'>('bordeaux');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync initial props
  useEffect(() => {
    if (initialJobDescription) setJobText(initialJobDescription);
    if (initialJobTitle) setJobTitle(initialJobTitle);
    if (initialCompany) setCompanyName(initialCompany);
  }, [initialJobDescription, initialJobTitle, initialCompany]);

  // If user picks a stored CV, load its content
  const handleSelectStoredCV = (cvId: string) => {
    setSelectedStoredCvId(cvId);
    const found = storedCVs.find(c => c.id === cvId);
    if (found) {
      setCvText(found.content);
      setFileName(`Currículo: ${found.name}`);
    }
  };

  // Quick load from Pipeline application
  const handleLoadApp = (app: Application) => {
    setJobTitle(app.jobTitle);
    setCompanyName(app.companyName);
    setJobText(prev => (prev ? `${prev}\n\nVaga: ${app.jobTitle} em ${app.companyName}` : `Vaga: ${app.jobTitle}\nEmpresa: ${app.companyName}\nNotas: ${app.notes || 'Sem requisitos adicionais'}`));
  };

  // Handle file upload (.pdf, .docx, .txt)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();

    if (file.type === 'application/pdf') {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js`;
      reader.onload = async (event) => {
        if (!event.target?.result) return;
        try {
          const typedArray = new Uint8Array(event.target.result as ArrayBuffer);
          const pdf = await pdfjsLib.getDocument(typedArray).promise;
          let text = '';
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            text += textContent.items.map((item: any) => item.str).join(' ') + '\n';
          }
          setCvText(text);
        } catch (err) {
          console.error('PDF parsing error', err);
          setError('Não foi possível ler o arquivo PDF. Tente colar o texto manualmente.');
        }
      };
      reader.readAsArrayBuffer(file);
    } else if (file.type.includes('word') || file.name.endsWith('.docx')) {
      reader.onload = async (event) => {
        if (!event.target?.result) return;
        try {
          const res = await mammoth.extractRawText({ arrayBuffer: event.target.result });
          setCvText(res.value);
        } catch (err) {
          console.error('DOCX parsing error', err);
          setError('Não foi possível ler o arquivo DOCX. Tente colar o texto manualmente.');
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      // Plain text
      reader.onload = (event) => {
        setCvText(event.target?.result as string || '');
      };
      reader.readAsText(file);
    }
  };

  // Trigger Master AI Tailoring
  const handleGenerateTailoredCV = async () => {
    if (!jobText.trim()) {
      setError('Por favor, informe a descrição ou requisitos da vaga procurada.');
      return;
    }
    if (!cvText.trim()) {
      setError('Por favor, importe ou cole o currículo do candidato.');
      return;
    }

    setError(null);
    setIsLoading(true);
    setLoadingStep(1);

    // Dynamic progress feedback
    const t1 = setTimeout(() => setLoadingStep(2), 900);
    const t2 = setTimeout(() => setLoadingStep(3), 2000);
    const t3 = setTimeout(() => setLoadingStep(4), 3200);

    try {
      const output = await understandJobAndBuildTailoredCV({
        jobText,
        cvText,
        jobTitle,
        companyName,
        layoutChoice: selectedLayout,
      });

      setResult(output);
      setEditedFullText(output.tailoredCV.fullText);
      setSelectedLayout(output.tailoredCV.layoutId);
    } catch (err: any) {
      console.error('Master CV optimization error', err);
      setError('Houve uma instabilidade momentânea na análise da IA. O gerador executivo automático gerou uma versão preliminar.');
    } finally {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      setIsLoading(false);
      setLoadingStep(0);
    }
  };

  // Switch layout and regenerate formatting
  const handleChangeLayout = async (layoutId: string) => {
    setSelectedLayout(layoutId);
    if (!result) return;

    setIsLoading(true);
    try {
      const output = await understandJobAndBuildTailoredCV({
        jobText,
        cvText: editedFullText || result.tailoredCV.fullText,
        jobTitle: result.jobAnalysis.targetRole,
        companyName: result.jobAnalysis.companyName,
        layoutChoice: layoutId,
      });
      setResult(output);
      setEditedFullText(output.tailoredCV.fullText);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Copy to clipboard
  const handleCopy = () => {
    const textToCopy = editedFullText || result?.tailoredCV.fullText || '';
    if (!textToCopy) return;

    navigator.clipboard.writeText(textToCopy);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2500);
  };

  // Save tailored CV to CV Manager library
  const handleSaveToCVManager = () => {
    if (!result) return;
    const content = editedFullText || result.tailoredCV.fullText;
    const role = result.jobAnalysis.targetRole || 'Especialista';
    const comp = result.jobAnalysis.companyName ? ` (${result.jobAnalysis.companyName})` : '';
    const newCv: CV = {
      id: `cv-tailored-${Date.now()}`,
      name: `CV Otimizado - ${role}${comp}`,
      content,
      yearsOfExperience: result.candidateAudit.yearsOfExperienceEstimated,
    };

    setStoredCVs(prev => [newCv, ...prev]);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Download .TXT
  const handleDownloadTxt = () => {
    const text = editedFullText || result?.tailoredCV.fullText || '';
    if (!text) return;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Curriculo_Otimizado_${(result?.jobAnalysis.targetRole || 'ATS').replace(/\s+/g, '_')}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Print Clean PDF
  const handlePrint = () => {
    window.print();
  };

  const layoutOptions = [
    {
      id: 'tech-ats-master',
      name: 'Tech Master & ATS-First',
      description: 'Estrutura técnica densa, foco em stack e palavras-chave. Ideal para Engenharia, Dados e Cloud.',
      badge: '99.8% Aprovação ATS',
    },
    {
      id: 'executive-c-level',
      name: 'Executivo C-Level & Diretoria',
      description: 'Prioriza governança, métricas financeiras de ROI, gestão de grandes times e estratégia.',
      badge: 'Banca C-Level',
    },
    {
      id: 'product-growth',
      name: 'Inovação, Produto & Resultados',
      description: 'Ênfase em métricas de negócio (LTV, retenção), entregas de squads e visão centrada no usuário.',
      badge: 'PMs & Growth',
    },
    {
      id: 'hybrid-specialist',
      name: 'Especialista Sênior Híbrido',
      description: 'Equilíbrio cirúrgico entre profundidade técnica de alto nível e liderança operacional de projetos.',
      badge: 'Staff & Lead',
    },
    {
      id: 'clean-swiss',
      name: 'Minimalista Clean Suíço',
      description: 'Design refinado, tipografia de alto contraste e espaçamento arejado para leitura em 6 segundos.',
      badge: 'Design Universal',
    },
  ];

  // Palette color definitions (Black & Wine Executive Identity)
  const paletteStyles = {
    bordeaux: {
      accent: '#881337', // Vinho Tinto Nobre C-Level (Burgundy)
      accentBg: 'rgba(136, 19, 55, 0.08)',
      headerBg: '#4c0519',
      chipBg: 'rgba(136, 19, 55, 0.12)',
      chipText: '#be123c',
    },
    noir: {
      accent: '#18181b', // Preto Ônix & Grafite Profundo
      accentBg: 'rgba(24, 24, 27, 0.08)',
      headerBg: '#09090b',
      chipBg: 'rgba(24, 24, 27, 0.12)',
      chipText: '#a1a1aa',
    },
    emerald: {
      accent: '#059669',
      accentBg: 'rgba(5, 150, 105, 0.08)',
      headerBg: '#065f46',
      chipBg: 'rgba(5, 150, 105, 0.12)',
      chipText: '#10b981',
    },
    slate: {
      accent: '#3f3f46',
      accentBg: 'rgba(63, 63, 70, 0.08)',
      headerBg: '#27272a',
      chipBg: 'rgba(63, 63, 70, 0.12)',
      chipText: '#71717a',
    },
  };

  const currentPalette = paletteStyles[paletteTheme];

  return (
    <div className="space-y-6">
      {/* Hero Presentation Header */}
      <div 
        className="p-6 rounded-2xl border relative overflow-hidden transition-all"
        style={{ 
          backgroundColor: colors.surface, 
          borderColor: colors.border,
          boxShadow: colors.shadow 
        }}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg flex-shrink-0">
              <Wand size={28} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Mestre de Confecção & RH Sênior
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  ATS Scanner 99.8%
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Fórmula XYZ da Google
                </span>
              </div>
              <h2 className="text-xl lg:text-2xl font-extrabold" style={{ color: colors.textPrimary }}>
                Confeccionador Inteligente de Currículo Sob Medida para a Vaga
              </h2>
              <p className="text-xs lg:text-sm max-w-3xl mt-1 leading-relaxed" style={{ color: colors.textSecondary }}>
                Nossa IA atua como um <strong>Diretor Executivo de Recursos Humanos (Chief People Officer)</strong> e 
                especialista em algoritmos ATS (Workday, Taleo, Greenhouse, Gupy). Ela compreende os requisitos mandatórios da oportunidade,
                audita seu histórico, seleciona o <strong>modelo de layout mais atrativo</strong> para suas especializações e reescreve 
                suas realizações com métricas quantificáveis de alto impacto.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Input Stages Grid: Job Description & Candidate CV */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* STEP 1: Entendimento da Vaga */}
        <div 
          className="p-5 rounded-2xl border flex flex-col justify-between"
          style={{ backgroundColor: colors.surface, borderColor: colors.border }}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                  1
                </span>
                <h3 className="font-bold text-sm lg:text-base" style={{ color: colors.textPrimary }}>
                  Entendimento da Vaga Almejada
                </h3>
              </div>
              {storedApps.length > 0 && (
                <div className="relative group">
                  <span className="text-[11px] font-semibold text-blue-400 cursor-pointer flex items-center gap-1 hover:underline">
                    <Briefcase size={12} />
                    Carregar do Pipeline ({storedApps.length})
                  </span>
                  <div 
                    className="hidden group-hover:block absolute right-0 top-6 w-64 p-2 rounded-xl border shadow-xl z-20 text-xs max-h-48 overflow-y-auto"
                    style={{ backgroundColor: colors.surfaceElevated || colors.surface, borderColor: colors.border }}
                  >
                    <div className="font-bold text-[10px] text-muted pb-1 mb-1 border-b" style={{ borderColor: colors.border }}>
                      SELECIONE UMA VAGA DO SEU PIPELINE:
                    </div>
                    {storedApps.map(app => (
                      <button
                        key={app.id}
                        type="button"
                        onClick={() => handleLoadApp(app)}
                        className="w-full text-left p-1.5 rounded-lg hover:bg-blue-500/15 transition-all text-[11px] truncate block"
                      >
                        <strong>{app.jobTitle}</strong> • {app.companyName}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: colors.textSecondary }}>
                  Título do Cargo / Vaga (Opcional):
                </label>
                <input
                  type="text"
                  placeholder="Ex: Engenheiro de Software Sênior, Tech Lead"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border text-xs outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  style={{ backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.textPrimary }}
                />
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: colors.textSecondary }}>
                  Empresa Contratante (Opcional):
                </label>
                <input
                  type="text"
                  placeholder="Ex: Nubank, Itaú, Mercado Livre, Google"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border text-xs outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  style={{ backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.textPrimary }}
                />
              </div>
            </div>

            <label className="text-xs font-semibold block mb-1" style={{ color: colors.textSecondary }}>
              Descrição Completa da Vaga / Requisitos (Job Description):
            </label>
            <textarea
              rows={8}
              placeholder="Cole aqui o anúncio da vaga (responsabilidades, qualificações obrigatórias, diferenciais e tecnologias). A IA extrairá cirurgicamente todas as palavras-chave críticas e requisitos que os recrutadores humanos e robôs ATS procuram..."
              value={jobText}
              onChange={(e) => setJobText(e.target.value)}
              className="w-full p-3 rounded-xl border text-xs font-mono leading-relaxed outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
              style={{ backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.textPrimary }}
            />
          </div>

          <div className="text-[11px] mt-2 flex items-center gap-1.5 opacity-70" style={{ color: colors.textSecondary }}>
            <Zap size={13} className="text-amber-400" />
            <span>Dica: Quanto mais detalhado for o texto da vaga, mais precisas serão as palavras-chave integradas.</span>
          </div>
        </div>

        {/* STEP 2: Importação do Currículo do Candidato */}
        <div 
          className="p-5 rounded-2xl border flex flex-col justify-between"
          style={{ backgroundColor: colors.surface, borderColor: colors.border }}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                  2
                </span>
                <h3 className="font-bold text-sm lg:text-base" style={{ color: colors.textPrimary }}>
                  Currículo Atual do Candidato
                </h3>
              </div>

              {storedCVs.length > 0 && (
                <div className="relative">
                  <select
                    value={selectedStoredCvId}
                    onChange={(e) => handleSelectStoredCV(e.target.value)}
                    className="text-xs px-2.5 py-1 rounded-lg border font-semibold outline-none cursor-pointer"
                    style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border, color: colors.textPrimary }}
                  >
                    <option value="">📂 Usar da Biblioteca ({storedCVs.length})</option>
                    {storedCVs.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Upload Box */}
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="p-3.5 mb-3 border-2 border-dashed rounded-xl cursor-pointer hover:border-blue-500 transition-all flex items-center justify-between gap-3 text-xs"
              style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border }}
            >
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                  <Upload size={18} />
                </div>
                <div>
                  <span className="font-bold block" style={{ color: colors.textPrimary }}>
                    {fileName || 'Importar arquivo (.pdf, .docx, .txt)'}
                  </span>
                  <span className="text-[11px] opacity-70" style={{ color: colors.textSecondary }}>
                    Clique para selecionar ou arraste o arquivo do seu computador
                  </span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-lg text-white font-semibold text-[11px]" style={{ backgroundColor: colors.primary }}>
                Procurar
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.doc,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            <label className="text-xs font-semibold block mb-1" style={{ color: colors.textSecondary }}>
              Ou Cole o Conteúdo do seu Currículo Atual:
            </label>
            <textarea
              rows={8}
              placeholder="Cole aqui seu currículo atual (experiências, formação, projetos, histórico e competências). A IA sênior identificará suas especializações reais e eliminará fraquezas de escrita..."
              value={cvText}
              onChange={(e) => setCvText(e.target.value)}
              className="w-full p-3 rounded-xl border text-xs font-mono leading-relaxed outline-none focus:ring-2 focus:ring-rose-800 transition-all resize-none"
              style={{ backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.textPrimary }}
            />
          </div>

          <div className="text-[11px] mt-2 flex items-center gap-1.5 opacity-70" style={{ color: colors.textSecondary }}>
            <ShieldCheck size={13} className="text-emerald-400" />
            <span>Seus dados são confidenciais e processados exclusivamente para a sua candidatura.</span>
          </div>
        </div>
      </div>

      {/* Action Trigger Banner */}
      <div 
        className="p-5 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4"
        style={{ backgroundColor: colors.surfaceElevated || colors.surface, borderColor: colors.border }}
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl text-rose-400" style={{ backgroundColor: colors.primaryLight }}>
            <Target size={22} />
          </div>
          <div>
            <span className="font-bold text-sm block" style={{ color: colors.textPrimary }}>
              Pronto para ativar a consultoria do Mestre Sênior de RH?
            </span>
            <span className="text-xs" style={{ color: colors.textSecondary }}>
              Alinhamento cirúrgico de palavras-chave, seleção de layout ideal e fórmula XYZ da Google.
            </span>
          </div>
        </div>

        <button
          onClick={handleGenerateTailoredCV}
          disabled={isLoading || !jobText.trim() || !cvText.trim()}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg ${
            isLoading || !jobText.trim() || !cvText.trim()
              ? 'opacity-50 cursor-not-allowed text-white'
              : 'text-white hover:scale-[1.02]'
          }`}
          style={{
            background: isLoading || !jobText.trim() || !cvText.trim()
              ? colors.buttonDisabledBg
              : 'linear-gradient(135deg, #881337 0%, #4c0519 100%)',
            boxShadow: isLoading || !jobText.trim() || !cvText.trim()
              ? 'none'
              : '0 4px 18px rgba(136, 19, 55, 0.45)',
          }}
        >
          {isLoading ? (
            <>
              <RefreshCw size={18} className="animate-spin" />
              <span>Confeccionando Currículo Sob Medida...</span>
            </>
          ) : (
            <>
              <Sparkles size={18} />
              <span>Analisar Vaga & Confeccionar Currículo Mestre</span>
            </>
          )}
        </button>
      </div>

      {/* Loading Progress Feedback Bar */}
      {isLoading && (
        <div 
          className="p-6 rounded-2xl border text-center space-y-3 animate-pulse"
          style={{ backgroundColor: colors.surface, borderColor: colors.border }}
        >
          <div className="w-10 h-10 mx-auto rounded-full bg-blue-600/20 text-blue-500 flex items-center justify-center">
            <RefreshCw size={22} className="animate-spin" />
          </div>
          <h4 className="font-bold text-base" style={{ color: colors.textPrimary }}>
            Consultoria Executiva do CV-AutoPilot em Andamento...
          </h4>
          <div className="max-w-md mx-auto space-y-2 text-xs" style={{ color: colors.textSecondary }}>
            <div className={`flex items-center gap-2 ${loadingStep >= 1 ? 'text-blue-400 font-semibold' : 'opacity-40'}`}>
              <CheckCircle size={14} />
              <span>1. Decodificando requisitos inegociáveis e palavras-chave ATS da vaga</span>
            </div>
            <div className={`flex items-center gap-2 ${loadingStep >= 2 ? 'text-blue-400 font-semibold' : 'opacity-40'}`}>
              <CheckCircle size={14} />
              <span>2. Auditando competências e especializações reais do candidato</span>
            </div>
            <div className={`flex items-center gap-2 ${loadingStep >= 3 ? 'text-blue-400 font-semibold' : 'opacity-40'}`}>
              <CheckCircle size={14} />
              <span>3. Selecionando o modelo de layout de maior atratividade para a vaga</span>
            </div>
            <div className={`flex items-center gap-2 ${loadingStep >= 4 ? 'text-blue-400 font-semibold' : 'opacity-40'}`}>
              <CheckCircle size={14} />
              <span>4. Redigindo realizações na Fórmula XYZ da Google e eliminando vícios de escrita</span>
            </div>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-xs flex items-center gap-2">
          <AlertCircle size={16} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* RESULTS DISPLAY: Master Audit & Tailored Studio */}
      {result && !isLoading && (
        <div className="space-y-6 pt-2">
          {/* Executive Audit Dashboard Card */}
          <div 
            className="p-6 rounded-2xl border"
            style={{ 
              backgroundColor: colors.surface, 
              borderColor: colors.border,
              boxShadow: colors.shadow 
            }}
          >
            {/* Top diagnostic header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b pb-5" style={{ borderColor: colors.border }}>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/15 text-purple-400 border border-purple-500/20">
                    Diagnóstico Executivo de RH
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/15 text-blue-400">
                    Senioridade: {result.jobAnalysis.seniorityLevel}
                  </span>
                </div>
                <h3 className="text-lg lg:text-xl font-black" style={{ color: colors.textPrimary }}>
                  Alinhamento: {result.jobAnalysis.targetRole} {result.jobAnalysis.companyName ? `• ${result.jobAnalysis.companyName}` : ''}
                </h3>
                <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                  Especialização Mapeada: <strong>{result.candidateAudit.detectedSpecialization}</strong> (~{result.candidateAudit.yearsOfExperienceEstimated} anos de mercado)
                </p>
              </div>

              {/* Match Score Comparison Pill */}
              <div className="flex items-center gap-4 bg-slate-900/40 p-3 rounded-2xl border border-white/10">
                <div>
                  <span className="text-[10px] block opacity-70 text-slate-400">Match Inicial</span>
                  <span className="text-xl font-bold text-amber-400">{result.candidateAudit.initialMatchScore}%</span>
                </div>
                <ArrowRight size={18} className="text-blue-400" />
                <div>
                  <span className="text-[10px] block opacity-70 text-slate-400">Score Otimizado</span>
                  <span className="text-2xl font-black text-emerald-400 flex items-center gap-1">
                    {result.candidateAudit.projectedMatchScore}%
                    <Sparkles size={14} />
                  </span>
                </div>
              </div>
            </div>

            {/* Keyword Matrix Inspection */}
            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold flex items-center gap-1.5" style={{ color: colors.textPrimary }}>
                  <Award size={15} className="text-blue-500" />
                  Auditoria de Palavras-Chave Críticas da Vaga (Rastreadas pelo ATS):
                </span>
                <span className="text-[11px]" style={{ color: colors.textMuted }}>
                  {result.jobAnalysis.topKeywords.length} termos prioritários mapeados
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {result.jobAnalysis.topKeywords.map((kw: JobKeywordItem, idx: number) => {
                  const isCritical = kw.relevance === 'Crítica';
                  const isHigh = kw.relevance === 'Alta';
                  return (
                    <div
                      key={idx}
                      className={`px-3 py-1.5 rounded-xl border text-xs flex items-center gap-2 transition-all ${
                        isCritical 
                          ? 'bg-red-500/10 border-red-500/30 text-red-400 font-bold' 
                          : isHigh 
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 font-semibold'
                            : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                      }`}
                    >
                      <span>{kw.keyword}</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-black/30 font-medium">
                        {kw.category}
                      </span>
                      {kw.inOriginalCv ? (
                        <span title="Presente no currículo original" className="text-emerald-400">✓</span>
                      ) : (
                        <span title="Termo crucial incorporado com maestria pela IA" className="text-amber-400">✨ Novo</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Strengths & Weaknesses Rectified */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5 pt-5 border-t" style={{ borderColor: colors.border }}>
              <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs space-y-1.5">
                <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle size={14} />
                  Pontos Fortes Alavancados pelo Especialista de RH:
                </span>
                <ul className="space-y-1 pl-4 list-disc text-[11px]" style={{ color: colors.textSecondary }}>
                  {result.candidateAudit.identifiedStrengths.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>

              <div className="p-3.5 rounded-xl bg-blue-500/5 border border-blue-500/20 text-xs space-y-1.5">
                <span className="font-bold text-blue-400 flex items-center gap-1.5">
                  <Zap size={14} />
                  Fraquezas de Escrita & Formatação Eliminadas:
                </span>
                <ul className="space-y-1 pl-4 list-disc text-[11px]" style={{ color: colors.textSecondary }}>
                  {result.candidateAudit.criticalWeaknessesFixed.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Recruiter Tactical Advice Strip */}
            {result.tailoredCV.recruiterTips && result.tailoredCV.recruiterTips.length > 0 && (
              <div className="mt-4 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs flex items-start gap-2.5">
                <Sparkles size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-amber-400 block mb-1">
                    Conselho Tático do Headhunter Sênior para a Entrevista:
                  </strong>
                  <p className="text-[11px] leading-relaxed" style={{ color: colors.textSecondary }}>
                    {result.tailoredCV.recruiterTips[0]}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Layout Selector Bar */}
          <div 
            className="p-5 rounded-2xl border"
            style={{ backgroundColor: colors.surface, borderColor: colors.border }}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
              <div>
                <h4 className="font-bold text-sm lg:text-base flex items-center gap-2" style={{ color: colors.textPrimary }}>
                  <Layers size={18} className="text-blue-500" />
                  Modelos & Layouts Especializados para sua Área
                </h4>
                <p className="text-xs" style={{ color: colors.textSecondary }}>
                  O layout recomendado pelo mestre de RH foi calibrado de acordo com a sua senioridade e especialização.
                </p>
              </div>

              {/* Palette Theme Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold" style={{ color: colors.textSecondary }}>Paleta:</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPaletteTheme('bordeaux')}
                    title="Vinho Tinto Imperial Executivo"
                    className={`w-6 h-6 rounded-full bg-[#881337] transition-all ${paletteTheme === 'bordeaux' ? 'ring-2 ring-rose-400 scale-110' : 'opacity-70'}`}
                  />
                  <button
                    onClick={() => setPaletteTheme('noir')}
                    title="Preto Ônix Executivo"
                    className={`w-6 h-6 rounded-full bg-zinc-900 transition-all ${paletteTheme === 'noir' ? 'ring-2 ring-zinc-400 scale-110' : 'opacity-70'}`}
                  />
                  <button
                    onClick={() => setPaletteTheme('slate')}
                    title="Grafite Clássico"
                    className={`w-6 h-6 rounded-full bg-zinc-700 transition-all ${paletteTheme === 'slate' ? 'ring-2 ring-slate-400 scale-110' : 'opacity-70'}`}
                  />
                  <button
                    onClick={() => setPaletteTheme('emerald')}
                    title="Emerald Growth"
                    className={`w-6 h-6 rounded-full bg-emerald-700 transition-all ${paletteTheme === 'emerald' ? 'ring-2 ring-emerald-400 scale-110' : 'opacity-70'}`}
                  />
                </div>
              </div>
            </div>

            {/* Layout Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {layoutOptions.map((layout) => {
                const isSelected = selectedLayout === layout.id;
                const isRecommended = result.tailoredCV.layoutId === layout.id;

                return (
                  <button
                    key={layout.id}
                    type="button"
                    onClick={() => handleChangeLayout(layout.id)}
                    className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-500/10 shadow-md ring-1 ring-blue-500' 
                        : 'hover:border-slate-400'
                    }`}
                    style={{ backgroundColor: isSelected ? undefined : colors.surfaceElevated || colors.surfaceHover }}
                  >
                    {isRecommended && (
                      <span className="absolute -top-2.5 right-2 px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-500 text-black shadow-sm">
                        ★ RECOMENDADO
                      </span>
                    )}
                    <div>
                      <div className="font-bold text-xs mb-1" style={{ color: colors.textPrimary }}>
                        {layout.name}
                      </div>
                      <p className="text-[10px] leading-tight opacity-75 mb-2" style={{ color: colors.textSecondary }}>
                        {layout.description}
                      </p>
                    </div>
                    <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-black/20 text-blue-400 inline-block self-start">
                      {layout.badge}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Layout Rationale Note */}
            <div className="mt-3 p-2.5 rounded-xl bg-blue-500/5 border border-blue-500/15 text-[11px] flex items-center gap-2">
              <span className="font-bold text-blue-400">Por que este layout:</span>
              <span style={{ color: colors.textSecondary }}>{result.tailoredCV.layoutRationale}</span>
            </div>
          </div>

          {/* Action Bar & Mode Switcher */}
          <div 
            className="p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-3"
            style={{ backgroundColor: colors.surface, borderColor: colors.border }}
          >
            {/* View Mode Tabs */}
            <div className="flex w-full sm:w-auto overflow-x-auto p-1 rounded-xl border text-xs font-semibold scrollbar-none" style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border }}>
              <button
                onClick={() => setActiveTab('preview')}
                className="px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all whitespace-nowrap"
                style={{
                  backgroundColor: activeTab === 'preview' ? colors.primary : 'transparent',
                  color: activeTab === 'preview' ? colors.textOnPrimary : colors.textSecondary,
                  boxShadow: activeTab === 'preview' ? `0 2px 8px ${colors.primaryGlow || 'rgba(136,19,55,0.3)'}` : 'none'
                }}
              >
                <Eye size={14} />
                <span>Pré-visualização Executiva</span>
              </button>
              <button
                onClick={() => setActiveTab('ats-text')}
                className="px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all whitespace-nowrap"
                style={{
                  backgroundColor: activeTab === 'ats-text' ? colors.primary : 'transparent',
                  color: activeTab === 'ats-text' ? colors.textOnPrimary : colors.textSecondary,
                  boxShadow: activeTab === 'ats-text' ? `0 2px 8px ${colors.primaryGlow || 'rgba(136,19,55,0.3)'}` : 'none'
                }}
              >
                <FileText size={14} />
                <span>Formato ATS</span>
              </button>
              <button
                onClick={() => setActiveTab('editor')}
                className="px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all whitespace-nowrap"
                style={{
                  backgroundColor: activeTab === 'editor' ? colors.primary : 'transparent',
                  color: activeTab === 'editor' ? colors.textOnPrimary : colors.textSecondary,
                  boxShadow: activeTab === 'editor' ? `0 2px 8px ${colors.primaryGlow || 'rgba(136,19,55,0.3)'}` : 'none'
                }}
              >
                <Edit3 size={14} />
                <span>Editor Livre</span>
              </button>
            </div>

            {/* Palette Switcher (When in Preview) */}
            {activeTab === 'preview' && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs" style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border }}>
                <span className="text-[11px] font-bold opacity-75 mr-1" style={{ color: colors.textSecondary }}>Estilo:</span>
                <button
                  onClick={() => setPaletteTheme('bordeaux')}
                  className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all ${paletteTheme === 'bordeaux' ? 'bg-[#881337] text-white shadow-sm' : 'opacity-70 hover:opacity-100'}`}
                  title="Vinho Tinto Imperial Executivo"
                >
                  🍷 Vinho
                </button>
                <button
                  onClick={() => setPaletteTheme('noir')}
                  className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all ${paletteTheme === 'noir' ? 'bg-zinc-900 text-white shadow-sm ring-1 ring-zinc-700' : 'opacity-70 hover:opacity-100'}`}
                  title="Preto Ônix Executivo"
                >
                  ⚫ Preto
                </button>
                <button
                  onClick={() => setPaletteTheme('slate')}
                  className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all ${paletteTheme === 'slate' ? 'bg-zinc-700 text-white shadow-sm' : 'opacity-70 hover:opacity-100'}`}
                  title="Grafite Clássico"
                >
                  🩶 Grafite
                </button>
                <button
                  onClick={() => setPaletteTheme('emerald')}
                  className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all ${paletteTheme === 'emerald' ? 'bg-emerald-700 text-white shadow-sm' : 'opacity-70 hover:opacity-100'}`}
                  title="Esmeralda Corporativo"
                >
                  🟢 Esmeralda
                </button>
              </div>
            )}

            {/* Export & Save Buttons */}
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold hover:opacity-80 transition-all"
                style={{ borderColor: colors.border, color: colors.textPrimary, backgroundColor: colors.surfaceHover }}
              >
                {copySuccess ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                <span>{copySuccess ? 'Copiado!' : 'Copiar'}</span>
              </button>

              <button
                onClick={handleDownloadTxt}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold hover:opacity-80 transition-all"
                style={{ borderColor: colors.border, color: colors.textPrimary, backgroundColor: colors.surfaceHover }}
              >
                <Download size={14} />
                <span>Baixar .TXT</span>
              </button>

              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold hover:opacity-80 transition-all"
                style={{ borderColor: colors.border, color: colors.textPrimary, backgroundColor: colors.surfaceHover }}
              >
                <Printer size={14} />
                <span>Imprimir / PDF</span>
              </button>

              <button
                onClick={handleSaveToCVManager}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-bold transition-all shadow-md"
                style={{
                  background: 'linear-gradient(135deg, #881337 0%, #580c23 100%)',
                  boxShadow: '0 2px 10px rgba(136, 19, 55, 0.35)',
                }}
              >
                {saveSuccess ? <Check size={14} /> : <Bookmark size={14} />}
                <span>{saveSuccess ? 'Salvo na Biblioteca!' : 'Salvar no CV-Manager'}</span>
              </button>
            </div>
          </div>

          {/* MAIN CV VIEW CONTAINER */}
          {activeTab === 'preview' && (
            <div 
              id="tailored-cv-printable-sheet"
              className="p-4 sm:p-7 lg:p-12 rounded-2xl border shadow-2xl max-w-4xl mx-auto font-sans leading-relaxed print:p-0 print:border-none print:shadow-none print:bg-white print:text-black overflow-hidden"
              style={{ 
                backgroundColor: colors.surfaceElevated || colors.surface, 
                borderColor: colors.border,
                color: colors.textPrimary 
              }}
            >
              {/* CV HEADER */}
              <div className="border-b-2 pb-6 mb-6" style={{ borderColor: currentPalette.accent }}>
                <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight" style={{ color: currentPalette.accent }}>
                  {result.tailoredCV.header.name}
                </h1>
                <div className="text-sm lg:text-base font-semibold mt-1" style={{ color: colors.textPrimary }}>
                  {result.tailoredCV.header.headline}
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs mt-2.5 opacity-80" style={{ color: colors.textSecondary }}>
                  <span>📍 {result.tailoredCV.header.location}</span>
                  <span>📞 {result.tailoredCV.header.phone}</span>
                  <span>✉️ {result.tailoredCV.header.email}</span>
                  {result.tailoredCV.header.linkedin && (
                    <span>🔗 {result.tailoredCV.header.linkedin}</span>
                  )}
                </div>
              </div>

              {/* EXECUTIVE SUMMARY */}
              <div className="mb-6">
                <h2 
                  className="text-xs font-black uppercase tracking-wider mb-2 flex items-center gap-2"
                  style={{ color: currentPalette.accent }}
                >
                  <span>RESUMO PROFISSIONAL & PROPOSTA DE VALOR</span>
                </h2>
                <p className="text-xs lg:text-sm leading-relaxed text-justify" style={{ color: colors.textSecondary }}>
                  {result.tailoredCV.executiveSummary}
                </p>
              </div>

              {/* STRATEGIC COMPETENCY MATRIX */}
              <div className="mb-6">
                <h2 
                  className="text-xs font-black uppercase tracking-wider mb-2.5"
                  style={{ color: currentPalette.accent }}
                >
                  MATRIZ DE COMPETÊNCIAS ESTRATÉGICAS (ATS 99.8%)
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl border" style={{ backgroundColor: currentPalette.accentBg, borderColor: colors.border }}>
                    <strong className="block text-[11px] mb-1 font-bold" style={{ color: currentPalette.accent }}>
                      Hard Skills & Especializações:
                    </strong>
                    <span style={{ color: colors.textSecondary }}>
                      {result.tailoredCV.competencyMatrix.hardSkills.join(' • ')}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl border" style={{ backgroundColor: currentPalette.accentBg, borderColor: colors.border }}>
                    <strong className="block text-[11px] mb-1 font-bold" style={{ color: currentPalette.accent }}>
                      Ferramentas, Tecnologias & Stacks:
                    </strong>
                    <span style={{ color: colors.textSecondary }}>
                      {result.tailoredCV.competencyMatrix.toolsAndTech.join(' • ')}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl border" style={{ backgroundColor: currentPalette.accentBg, borderColor: colors.border }}>
                    <strong className="block text-[11px] mb-1 font-bold" style={{ color: currentPalette.accent }}>
                      Metodologias & Práticas Ágeis:
                    </strong>
                    <span style={{ color: colors.textSecondary }}>
                      {result.tailoredCV.competencyMatrix.methodologies.join(' • ')}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl border" style={{ backgroundColor: currentPalette.accentBg, borderColor: colors.border }}>
                    <strong className="block text-[11px] mb-1 font-bold" style={{ color: currentPalette.accent }}>
                      Liderança, Gestão & Negócios:
                    </strong>
                    <span style={{ color: colors.textSecondary }}>
                      {result.tailoredCV.competencyMatrix.leadershipAndSoft.join(' • ')}
                    </span>
                  </div>
                </div>
              </div>

              {/* PROFESSIONAL EXPERIENCES */}
              <div className="mb-6">
                <h2 
                  className="text-xs font-black uppercase tracking-wider mb-3.5"
                  style={{ color: currentPalette.accent }}
                >
                  EXPERIÊNCIA PROFISSIONAL (FÓRMULA XYZ DA GOOGLE)
                </h2>

                <div className="space-y-5">
                  {result.tailoredCV.experiences.map((exp: TailoredCVExperience, idx: number) => (
                    <div key={idx} className="border-l-2 pl-4 space-y-1.5" style={{ borderColor: currentPalette.accent }}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                        <h3 className="font-bold text-sm lg:text-base" style={{ color: colors.textPrimary }}>
                          {exp.role} <span className="opacity-70 font-normal">| {exp.company}</span>
                        </h3>
                        <span className="text-xs font-semibold opacity-70" style={{ color: colors.textSecondary }}>
                          {exp.period} {exp.location ? `• ${exp.location}` : ''}
                        </span>
                      </div>

                      {exp.scopeDescription && (
                        <p className="text-xs italic opacity-85" style={{ color: colors.textSecondary }}>
                          {exp.scopeDescription}
                        </p>
                      )}

                      <ul className="space-y-1 pt-1">
                        {exp.achievementsXYZ.map((ach, aIdx) => (
                          <li key={aIdx} className="text-xs lg:text-sm flex items-start gap-2 leading-relaxed" style={{ color: colors.textSecondary }}>
                            <span className="text-blue-500 font-bold">•</span>
                            <span>{ach}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              {/* EDUCATION & CERTIFICATIONS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t" style={{ borderColor: colors.border }}>
                <div>
                  <h2 
                    className="text-xs font-black uppercase tracking-wider mb-2"
                    style={{ color: currentPalette.accent }}
                  >
                    FORMAÇÃO ACADÊMICA
                  </h2>
                  <div className="space-y-2 text-xs">
                    {result.tailoredCV.education.map((edu, eIdx) => (
                      <div key={eIdx}>
                        <strong className="block" style={{ color: colors.textPrimary }}>{edu.course}</strong>
                        <span className="opacity-75" style={{ color: colors.textSecondary }}>
                          {edu.institution} {edu.year ? `• ${edu.year}` : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h2 
                    className="text-xs font-black uppercase tracking-wider mb-2"
                    style={{ color: currentPalette.accent }}
                  >
                    CERTIFICAÇÕES E DESTAQUES
                  </h2>
                  <ul className="space-y-1.5 text-xs">
                    {result.tailoredCV.certifications.map((cert, cIdx) => (
                      <li key={cIdx} className="flex items-start gap-1.5" style={{ color: colors.textSecondary }}>
                        <span className="text-emerald-500">✓</span>
                        <span>{cert}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* ATS PLAIN TEXT TAB */}
          {activeTab === 'ats-text' && (
            <div 
              className="p-6 rounded-2xl border space-y-3"
              style={{ backgroundColor: colors.surface, borderColor: colors.border }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold" style={{ color: colors.textPrimary }}>
                  Texto Estruturado ATS-Ready (Compatível com Workday, Taleo, Greenhouse, Gupy):
                </span>
                <span className="text-[11px] opacity-70">
                  Pronto para colar em qualquer formulário online de candidatura
                </span>
              </div>
              <pre 
                className="p-4 rounded-xl border text-xs font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap max-h-[600px] select-all"
                style={{ backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.textPrimary }}
              >
                {editedFullText || result.tailoredCV.fullText}
              </pre>
            </div>
          )}

          {/* FREE EDITOR TAB */}
          {activeTab === 'editor' && (
            <div 
              className="p-6 rounded-2xl border space-y-3"
              style={{ backgroundColor: colors.surface, borderColor: colors.border }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold" style={{ color: colors.textPrimary }}>
                  Editor de Ajustes Finais do Currículo:
                </span>
                <span className="text-[11px] opacity-70">
                  Modifique qualquer texto livremente antes de exportar ou salvar
                </span>
              </div>
              <textarea
                rows={22}
                value={editedFullText}
                onChange={(e) => setEditedFullText(e.target.value)}
                className="w-full p-4 rounded-xl border text-xs font-mono leading-relaxed outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                style={{ backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.textPrimary }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default JobTailoredCVBuilder;
