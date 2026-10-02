import React, { useState, useContext, useMemo } from 'react';
import { 
  Zap, 
  Copy, 
  Check, 
  Sparkles, 
  Briefcase, 
  Building2, 
  FileText, 
  Globe, 
  ExternalLink, 
  Plus, 
  Trash2, 
  RefreshCw, 
  Code, 
  HelpCircle, 
  CheckCircle2, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp, 
  Sliders, 
  Send,
  Layers,
  ArrowRight,
  BookmarkPlus,
  Share2
} from 'lucide-react';
import { ThemeContext } from '../App';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { 
  CV, 
  Application, 
  ApplicationStatus, 
  JobFormAutofillPortal, 
  JobFormField, 
  JobFormAutofillResult 
} from '../types';
import { 
  generateJobFormAutofill, 
  answerCustomScreeningQuestion, 
  generateBrowserAutofillScript 
} from '../services/geminiService';

interface JobFormAutofillProps {
  onNavigateToApplications?: () => void;
}

export const JobFormAutofill: React.FC<JobFormAutofillProps> = ({ onNavigateToApplications }) => {
  const { colors, theme } = useContext(ThemeContext);

  // Storage
  const [savedCvs] = useLocalStorage<CV[]>('cvs', []);
  const [applications, setApplications] = useLocalStorage<Application[]>('applications', []);

  // Form State
  const [selectedCvId, setSelectedCvId] = useState<string>(() => savedCvs[0]?.id || '');
  const [customCvText, setCustomCvText] = useState<string>('');
  const [isUsingCustomCv, setIsUsingCustomCv] = useState<boolean>(false);
  const [jobTitle, setJobTitle] = useState<string>('Tech Lead Full Stack & Cloud');
  const [companyName, setCompanyName] = useState<string>('Fintech Inovadora');
  const [jobUrl, setJobUrl] = useState<string>('');
  const [jobDescription, setJobDescription] = useState<string>(
    `Buscamos Tech Lead Full Stack com forte experiência em React, TypeScript, Node.js e arquitetura em nuvem (AWS).
Responsabilidades:
- Liderar tecnicamente um time multidisciplinar de alta performance.
- Desenhar arquiteturas escaláveis, resilientes e orientadas a microsserviços.
- Garantir padrões de qualidade de código, testes automatizados e esteiras de CI/CD.
- Comunicar decisões arquiteturais com clareza para stakeholders de negócio e produto.

Requisitos:
- Sólida experiência em desenvolvimento web moderno (React, Node.js, TypeScript).
- Vivência prática com bancos de dados relacionais e não-relacionais (PostgreSQL, Redis, MongoDB).
- Práticas de DevOps e Cloud (Docker, Kubernetes, AWS).
- Habilidade comprovada em liderança técnica, mentoria e resolução de problemas complexos.
- Inglês avançado para interlocução diária.`
  );
  const [portal, setPortal] = useState<JobFormAutofillPortal>('universal');

  // Custom Screening Questions
  const [customQuestions, setCustomQuestions] = useState<string[]>([
    'Qual seu nível de experiência com microsserviços e mensageria distribuída?',
    'Como você avalia a maturidade técnica do seu time em code reviews e testes?'
  ]);
  const [newQuestionText, setNewQuestionText] = useState<string>('');

  // Generation & Results
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [autofillResult, setAutofillResult] = useState<JobFormAutofillResult | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [copiedFieldId, setCopiedFieldId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState<boolean>(false);
  const [copiedScript, setCopiedScript] = useState<boolean>(false);
  const [showScriptModal, setShowScriptModal] = useState<boolean>(false);
  const [savedToPipeline, setSavedToPipeline] = useState<boolean>(false);
  const [regeneratingFieldId, setRegeneratingFieldId] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Active CV text resolution
  const activeCvContent = useMemo(() => {
    if (isUsingCustomCv) return customCvText;
    const found = savedCvs.find(c => c.id === selectedCvId);
    return found ? found.content : customCvText || (savedCvs[0]?.content || '');
  }, [isUsingCustomCv, customCvText, savedCvs, selectedCvId]);

  // Portals configuration
  const portalsList: { id: JobFormAutofillPortal; name: string; tag: string; icon: string }[] = [
    { id: 'universal', name: 'Padrão Global', tag: 'Qualquer Site', icon: '🌐' },
    { id: 'gupy', name: 'Gupy', tag: 'ATS Brasil #1', icon: '🚀' },
    { id: 'linkedin', name: 'LinkedIn Easy Apply', tag: 'Candidatura Simplificada', icon: '💼' },
    { id: 'workday', name: 'Workday / Taleo', tag: 'Multinacionais', icon: '🏢' },
    { id: 'greenhouse', name: 'Greenhouse', tag: 'Tech & Startups', icon: '🌿' },
    { id: 'lever', name: 'Lever', tag: 'Escala Global', icon: '⚡' },
    { id: 'vagas_catho', name: 'Vagas.com / Catho', tag: 'Portais Nacionais', icon: '📑' },
    { id: 'infojobs', name: 'InfoJobs', tag: 'Vagas Brasil', icon: '🔍' },
  ];

  // Load sample vacancy
  const handleLoadSampleJob = () => {
    setJobTitle('Engenheiro de Software Sênior / Tech Lead');
    setCompanyName('Nubank / Neobank');
    setJobDescription(
      `Oportunidade para atuar no desenvolvimento de sistemas financeiros escaláveis e de alta disponibilidade.
Missão:
- Projetar e construir microsserviços de baixa latência em nuvem.
- Garantir segurança, conformidade e integridade transacional.
- Colaborar com Product Managers e Designers para entregar valor ágil.

Requisitos Indispensáveis:
- Proficiência em TypeScript, React, Node.js ou Go/Java.
- Experiência prática com bancos de dados relacionais e mensageria (Kafka/RabbitMQ).
- Boas práticas: Clean Architecture, TDD, CI/CD, Observabilidade.
- Inglês avançado para documentação e colaboração global.`
    );
  };

  // Add custom question
  const handleAddQuestion = () => {
    if (!newQuestionText.trim()) return;
    setCustomQuestions(prev => [...prev, newQuestionText.trim()]);
    setNewQuestionText('');
  };

  // Remove custom question
  const handleRemoveQuestion = (idx: number) => {
    setCustomQuestions(prev => prev.filter((_, i) => i !== idx));
  };

  // Generate Autofill
  const handleGenerateAutofill = async () => {
    setErrorMessage(null);
    if (!activeCvContent.trim()) {
      setErrorMessage('Selecione ou insira o texto de um currículo antes de gerar o auto-preenchimento.');
      return;
    }

    setIsGenerating(true);
    setSavedToPipeline(false);

    try {
      const result = await generateJobFormAutofill(
        activeCvContent,
        jobTitle,
        companyName,
        jobDescription,
        portal,
        customQuestions
      );
      setAutofillResult(result);
    } catch (err) {
      console.error('Erro ao gerar preenchimento automático:', err);
      setErrorMessage('Houve uma falha temporária na geração com IA. Verifique sua conexão e tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Regenerate individual custom question answer
  const handleRegenerateQuestionAnswer = async (field: JobFormField) => {
    if (!autofillResult) return;
    setRegeneratingFieldId(field.id);

    try {
      const newAnswer = await answerCustomScreeningQuestion(
        activeCvContent,
        jobDescription,
        field.label
      );

      const updatedFields = autofillResult.fields.map(f => {
        if (f.id === field.id) {
          return { ...f, value: newAnswer };
        }
        return f;
      });

      const updatedScript = generateBrowserAutofillScript(updatedFields, autofillResult.companyName);
      setAutofillResult({
        ...autofillResult,
        fields: updatedFields,
        browserFillScript: updatedScript
      });
    } catch (err) {
      console.error('Erro ao regenerar resposta:', err);
    } finally {
      setRegeneratingFieldId(null);
    }
  };

  // Update field value manually
  const handleFieldChange = (fieldId: string, newValue: string) => {
    if (!autofillResult) return;
    const updated = autofillResult.fields.map(f => {
      if (f.id === fieldId) {
        return { ...f, value: newValue };
      }
      return f;
    });

    const updatedScript = generateBrowserAutofillScript(updated, autofillResult.companyName);
    setAutofillResult({
      ...autofillResult,
      fields: updated,
      browserFillScript: updatedScript
    });
  };

  // Copy single field
  const handleCopyField = (fieldId: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedFieldId(fieldId);
    setTimeout(() => setCopiedFieldId(null), 2000);
  };

  // Copy all fields
  const handleCopyAll = () => {
    if (!autofillResult) return;
    const allText = autofillResult.fields
      .map(f => `=== ${f.label.toUpperCase()} ===\n${f.value}\n`)
      .join('\n');
    navigator.clipboard.writeText(allText);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2500);
  };

  // Copy browser script
  const handleCopyScript = () => {
    if (!autofillResult?.browserFillScript) return;
    navigator.clipboard.writeText(autofillResult.browserFillScript);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  // Save to application pipeline
  const handleSaveToPipeline = () => {
    if (!autofillResult) return;

    const newApp: Application = {
      id: new Date().toISOString(),
      jobTitle: autofillResult.jobTitle,
      companyName: autofillResult.companyName,
      dateApplied: new Date().toISOString().split('T')[0],
      jobUrl: jobUrl || undefined,
      status: ApplicationStatus.Aplicou,
      notes: `Inscrição preenchida automaticamente via IA para o portal ${autofillResult.targetPortal}. Score ATS: ${autofillResult.atsCompatibilityScore}%. Palavras-chave: ${autofillResult.matchedKeywords.slice(0, 5).join(', ')}.`,
      reminderDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 5 dias
    };

    setApplications(prev => [newApp, ...prev]);
    setSavedToPipeline(true);
  };

  // Filter fields by category and search
  const filteredFields = useMemo(() => {
    if (!autofillResult) return [];
    return autofillResult.fields.filter(f => {
      const matchCat = activeCategory === 'all' || f.category === activeCategory;
      const matchSearch = !searchFilter || 
        f.label.toLowerCase().includes(searchFilter.toLowerCase()) || 
        f.value.toLowerCase().includes(searchFilter.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [autofillResult, activeCategory, searchFilter]);

  const categories = [
    { id: 'all', label: 'Todos os Campos', count: autofillResult?.fields.length || 0 },
    { id: 'personal', label: '👤 Pessoais & Contatos', count: autofillResult?.fields.filter(f => f.category === 'personal').length || 0 },
    { id: 'summary', label: '🎯 Resumo & Pitch', count: autofillResult?.fields.filter(f => f.category === 'summary').length || 0 },
    { id: 'screening', label: '💬 Perguntas da Vaga', count: autofillResult?.fields.filter(f => f.category === 'screening').length || 0 },
    { id: 'experience', label: '💼 Experiência & Cargo', count: autofillResult?.fields.filter(f => f.category === 'experience').length || 0 },
    { id: 'education', label: '🎓 Formação', count: autofillResult?.fields.filter(f => f.category === 'education').length || 0 },
    { id: 'skills', label: '🛠️ Competências ATS', count: autofillResult?.fields.filter(f => f.category === 'skills').length || 0 },
    { id: 'custom', label: '❓ Perguntas Extras', count: autofillResult?.fields.filter(f => f.category === 'custom').length || 0 },
  ];

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '10px 0 40px 0' }}>
      {/* Header Banner */}
      <div style={{
        background: `linear-gradient(135deg, ${colors.surface} 0%, ${colors.surfaceElevated || colors.surface} 100%)`,
        border: `1px solid ${colors.border}`,
        borderRadius: '16px',
        padding: '24px 28px',
        marginBottom: '24px',
        boxShadow: colors.shadow || '0 4px 20px rgba(0,0,0,0.06)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: '-40px',
          right: '-40px',
          width: '180px',
          height: '180px',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${colors.primary}15 0%, transparent 70%)`,
          pointerEvents: 'none'
        }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', marginBottom: '8px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            backgroundColor: `${colors.primary}18`,
            color: colors.primary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 2px 8px ${colors.primary}25`
          }}>
            <Zap size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: colors.textPrimary, letterSpacing: '-0.02em' }}>
                Auto-Preenchimento Inteligente de Inscrições
              </h1>
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '3px 9px',
                borderRadius: '12px',
                backgroundColor: `${colors.primary}20`,
                color: colors.primary,
                border: `1px solid ${colors.primary}40`
              }}>
                Gemini 3.8 Flash • ATS Autofill
              </span>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: colors.textSecondary, lineHeight: 1.5 }}>
              Gere respostas personalizadas de alta pontuação para formulários de emprego (Gupy, LinkedIn Easy Apply, Workday, Greenhouse e Lever) cruzando seu currículo com as exigências da vaga.
            </p>
          </div>
        </div>

        {/* Portal Badges Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginTop: '16px',
          paddingTop: '16px',
          borderTop: `1px solid ${colors.border}`,
          overflowX: 'auto',
          paddingBottom: '4px'
        }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: colors.textSecondary, whiteSpace: 'nowrap', marginRight: '4px' }}>
            Selecione a Plataforma Alvo:
          </span>
          {portalsList.map(p => {
            const isSelected = portal === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setPortal(p.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: isSelected ? 700 : 500,
                  cursor: 'pointer',
                  border: isSelected ? `1.5px solid ${colors.primary}` : `1px solid ${colors.border}`,
                  backgroundColor: isSelected ? `${colors.primary}18` : colors.surface,
                  color: isSelected ? colors.primary : colors.textSecondary,
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                  boxShadow: isSelected ? `0 2px 6px ${colors.primary}20` : 'none'
                }}
              >
                <span>{p.icon}</span>
                <span>{p.name}</span>
                <span style={{
                  fontSize: '10px',
                  opacity: 0.8,
                  padding: '1px 5px',
                  borderRadius: '8px',
                  backgroundColor: isSelected ? `${colors.primary}25` : `${colors.border}80`
                }}>
                  {p.tag}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Error Notification Banner */}
      {errorMessage && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          padding: '12px 18px',
          borderRadius: '12px',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#991b1b',
          fontSize: '13px',
          fontWeight: 600,
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={18} color="#dc2626" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#991b1b',
              fontSize: '16px',
              padding: '0 4px',
              lineHeight: 1
            }}
          >
            &times;
          </button>
        </div>
      )}

      {/* Main Grid: Inputs vs Results */}
      <div style={{ display: 'grid', gridTemplateColumns: autofillResult ? '1fr 1.6fr' : '1fr', gap: '20px' }}>
        {/* Left Column: Form Configuration */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Section 1: CV Selection */}
          <div style={{
            backgroundColor: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: '14px',
            padding: '18px',
            boxShadow: colors.shadowSm || '0 1px 3px rgba(0,0,0,0.04)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={17} color={colors.primary} />
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: colors.textPrimary }}>
                  1. Currículo de Referência
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsUsingCustomCv(!isUsingCustomCv)}
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: colors.primary,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                {isUsingCustomCv ? 'Selecionar dos meus CVs' : 'Colar texto avulso'}
              </button>
            </div>

            {!isUsingCustomCv ? (
              <div>
                {savedCvs.length > 0 ? (
                  <select
                    value={selectedCvId}
                    onChange={(e) => setSelectedCvId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      fontSize: '13px',
                      borderRadius: '8px',
                      border: `1px solid ${colors.border}`,
                      backgroundColor: colors.inputBg || colors.surface,
                      color: colors.inputText || colors.textPrimary,
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    {savedCvs.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.yearsOfExperience ? `(${c.yearsOfExperience} anos exp)` : ''}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div style={{
                    padding: '12px',
                    borderRadius: '8px',
                    backgroundColor: `${colors.primary}10`,
                    border: `1px dashed ${colors.primary}40`,
                    fontSize: '12px',
                    color: colors.textSecondary
                  }}>
                    Nenhum currículo cadastrado no CV Manager ainda. Use o campo abaixo para colar o texto do seu currículo.
                  </div>
                )}
              </div>
            ) : (
              <div>
                <textarea
                  placeholder="Cole aqui o texto completo do seu currículo..."
                  value={customCvText}
                  onChange={(e) => setCustomCvText(e.target.value)}
                  rows={5}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    fontSize: '12px',
                    borderRadius: '8px',
                    border: `1px solid ${colors.border}`,
                    backgroundColor: colors.inputBg || colors.surface,
                    color: colors.inputText || colors.textPrimary,
                    outline: 'none',
                    boxSizing: 'border-box',
                    fontFamily: 'monospace'
                  }}
                />
              </div>
            )}
          </div>

          {/* Section 2: Job Information */}
          <div style={{
            backgroundColor: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: '14px',
            padding: '18px',
            boxShadow: colors.shadowSm || '0 1px 3px rgba(0,0,0,0.04)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Briefcase size={17} color={colors.primary} />
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: colors.textPrimary }}>
                  2. Dados da Vaga de Emprego
                </h3>
              </div>
              <button
                type="button"
                onClick={handleLoadSampleJob}
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: colors.primary,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Sparkles size={11} />
                Carregar Exemplo
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: colors.textSecondary, marginBottom: '4px' }}>
                    Título do Cargo:
                  </label>
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="Ex: Tech Lead Full Stack"
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      fontSize: '12px',
                      borderRadius: '6px',
                      border: `1px solid ${colors.border}`,
                      backgroundColor: colors.inputBg || colors.surface,
                      color: colors.inputText || colors.textPrimary,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: colors.textSecondary, marginBottom: '4px' }}>
                    Empresa Contratante:
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Ex: Nubank, Itaú, Remota"
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      fontSize: '12px',
                      borderRadius: '6px',
                      border: `1px solid ${colors.border}`,
                      backgroundColor: colors.inputBg || colors.surface,
                      color: colors.inputText || colors.textPrimary,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: colors.textSecondary, marginBottom: '4px' }}>
                  Link da Vaga (Opcional):
                </label>
                <input
                  type="text"
                  value={jobUrl}
                  onChange={(e) => setJobUrl(e.target.value)}
                  placeholder="https://gupy.io/... ou https://linkedin.com/jobs/..."
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    fontSize: '12px',
                    borderRadius: '6px',
                    border: `1px solid ${colors.border}`,
                    backgroundColor: colors.inputBg || colors.surface,
                    color: colors.inputText || colors.textPrimary,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: colors.textSecondary, marginBottom: '4px' }}>
                  Descrição Completa da Vaga (Job Description):
                </label>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  rows={6}
                  placeholder="Cole aqui os requisitos, responsabilidades e qualificações da vaga..."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    fontSize: '12px',
                    borderRadius: '8px',
                    border: `1px solid ${colors.border}`,
                    backgroundColor: colors.inputBg || colors.surface,
                    color: colors.inputText || colors.textPrimary,
                    outline: 'none',
                    boxSizing: 'border-box',
                    lineHeight: 1.45
                  }}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Custom Screening Questions */}
          <div style={{
            backgroundColor: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: '14px',
            padding: '18px',
            boxShadow: colors.shadowSm || '0 1px 3px rgba(0,0,0,0.04)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <HelpCircle size={17} color={colors.primary} />
              <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: colors.textPrimary }}>
                3. Perguntas Específicas do Formulário
              </h3>
            </div>
            <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: colors.textSecondary }}>
              Cole perguntas discursivas solicitadas pelo formulário (ex: "Descreva uma situação...", "Por que você quer trabalhar aqui?") para a IA redigir respostas sob medida.
            </p>

            {/* List of custom questions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
              {customQuestions.map((q, idx) => (
                <div
                  key={`question-${idx}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: colors.background,
                    border: `1px solid ${colors.border}`,
                    fontSize: '12px',
                    color: colors.textPrimary
                  }}
                >
                  <span style={{ fontWeight: 600, flex: 1 }}>{q}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveQuestion(idx)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: colors.danger || '#dc2626',
                      padding: '2px',
                      display: 'flex'
                    }}
                    title="Remover pergunta"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>

            {/* Add new question row */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={newQuestionText}
                onChange={(e) => setNewQuestionText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddQuestion();
                  }
                }}
                placeholder="Ex: Como você lida com prazos apertados?"
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  fontSize: '12px',
                  borderRadius: '6px',
                  border: `1px solid ${colors.border}`,
                  backgroundColor: colors.inputBg || colors.surface,
                  color: colors.inputText || colors.textPrimary,
                  outline: 'none'
                }}
              />
              <button
                type="button"
                onClick={handleAddQuestion}
                disabled={!newQuestionText.trim()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '8px 12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  borderRadius: '6px',
                  backgroundColor: newQuestionText.trim() ? colors.primary : colors.buttonDisabledBg,
                  color: newQuestionText.trim() ? colors.textOnPrimary : colors.buttonDisabledText,
                  border: 'none',
                  cursor: newQuestionText.trim() ? 'pointer' : 'not-allowed'
                }}
              >
                <Plus size={14} />
                <span>Adicionar</span>
              </button>
            </div>
          </div>

          {/* Action Button: Generate */}
          <button
            type="button"
            onClick={handleGenerateAutofill}
            disabled={isGenerating || !activeCvContent.trim()}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              padding: '14px 24px',
              borderRadius: '12px',
              backgroundColor: colors.primary,
              color: colors.textOnPrimary,
              fontSize: '14px',
              fontWeight: 800,
              border: 'none',
              cursor: isGenerating ? 'not-allowed' : 'pointer',
              boxShadow: `0 4px 14px ${colors.primary}40`,
              transition: 'all 0.2s ease',
              opacity: isGenerating ? 0.7 : 1
            }}
          >
            {isGenerating ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                <span>Analisando CV e Gerando Respostas com IA...</span>
              </>
            ) : (
              <>
                <Sparkles size={18} />
                <span>Gerar Preenchimento Automático com IA</span>
              </>
            )}
          </button>
        </div>

        {/* Right Column: Generated Autofill Results */}
        <div>
          {autofillResult ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* ATS Compatibility & Summary Banner */}
              <div style={{
                backgroundColor: colors.surface,
                border: `1px solid ${colors.border}`,
                borderRadius: '14px',
                padding: '20px',
                boxShadow: colors.shadowSm || '0 2px 8px rgba(0,0,0,0.05)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: colors.primary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      AUDITORIA ATS & COMPATIBILIDADE
                    </span>
                    <h2 style={{ margin: '2px 0 0 0', fontSize: '18px', fontWeight: 800, color: colors.textPrimary }}>
                      {autofillResult.jobTitle} • {autofillResult.companyName}
                    </h2>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 16px',
                    borderRadius: '10px',
                    backgroundColor: autofillResult.atsCompatibilityScore >= 90 ? '#ecfdf5' : '#eff6ff',
                    border: `1.5px solid ${autofillResult.atsCompatibilityScore >= 90 ? '#059669' : '#2563eb'}`
                  }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '10px', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                        Match ATS
                      </div>
                      <div style={{ fontSize: '20px', fontWeight: 900, color: autofillResult.atsCompatibilityScore >= 90 ? '#059669' : '#2563eb', lineHeight: 1 }}>
                        {autofillResult.atsCompatibilityScore}%
                      </div>
                    </div>
                    <CheckCircle2 size={24} color={autofillResult.atsCompatibilityScore >= 90 ? '#059669' : '#2563eb'} />
                  </div>
                </div>

                {/* Keywords Tags */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
                  {autofillResult.matchedKeywords.map((kw, i) => (
                    <span
                      key={`kw-${i}`}
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: '6px',
                        backgroundColor: `${colors.success || '#059669'}15`,
                        color: colors.success || '#059669',
                        border: `1px solid ${colors.success || '#059669'}30`
                      }}
                    >
                      ✓ {kw}
                    </span>
                  ))}
                  {autofillResult.missingKeywords.map((mkw, i) => (
                    <span
                      key={`mkw-${i}`}
                      style={{
                        fontSize: '11px',
                        fontWeight: 500,
                        padding: '2px 8px',
                        borderRadius: '6px',
                        backgroundColor: '#f1f5f9',
                        color: '#64748b',
                        border: '1px solid #cbd5e1'
                      }}
                      title="Palavra-chave recomendada para o formulário"
                    >
                      + {mkw}
                    </span>
                  ))}
                </div>

                {/* Global Action Toolbar */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  flexWrap: 'wrap',
                  paddingTop: '14px',
                  borderTop: `1px solid ${colors.border}`
                }}>
                  <button
                    type="button"
                    onClick={handleCopyAll}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 14px',
                      fontSize: '12px',
                      fontWeight: 700,
                      borderRadius: '8px',
                      backgroundColor: copiedAll ? '#059669' : colors.primary,
                      color: '#ffffff',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {copiedAll ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedAll ? 'Todos Copiados!' : 'Copiar Todos os Campos'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowScriptModal(true)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 14px',
                      fontSize: '12px',
                      fontWeight: 700,
                      borderRadius: '8px',
                      backgroundColor: colors.surface,
                      color: colors.primary,
                      border: `1.5px solid ${colors.primary}`,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Code size={14} />
                    <span>Script de Injeção no Navegador (F12)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveToPipeline}
                    disabled={savedToPipeline}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 14px',
                      fontSize: '12px',
                      fontWeight: 700,
                      borderRadius: '8px',
                      backgroundColor: savedToPipeline ? '#059669' : colors.surface,
                      color: savedToPipeline ? '#ffffff' : colors.textPrimary,
                      border: `1px solid ${colors.border}`,
                      cursor: savedToPipeline ? 'default' : 'pointer'
                    }}
                  >
                    {savedToPipeline ? <Check size={14} /> : <BookmarkPlus size={14} />}
                    <span>{savedToPipeline ? 'Salvo no Pipeline!' : 'Salvar no Pipeline'}</span>
                  </button>
                </div>
              </div>

              {/* Category Filter Tabs & Search */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                backgroundColor: colors.surface,
                border: `1px solid ${colors.border}`,
                borderRadius: '12px',
                padding: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="Filtrar por nome de campo ou valor..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '6px 10px',
                      fontSize: '12px',
                      borderRadius: '6px',
                      border: `1px solid ${colors.border}`,
                      backgroundColor: colors.inputBg || colors.surface,
                      color: colors.inputText || colors.textPrimary,
                      outline: 'none'
                    }}
                  />
                  {searchFilter && (
                    <button
                      type="button"
                      onClick={() => setSearchFilter('')}
                      style={{
                        padding: '6px 10px',
                        fontSize: '11px',
                        fontWeight: 600,
                        borderRadius: '6px',
                        border: `1px solid ${colors.border}`,
                        backgroundColor: 'transparent',
                        color: colors.textSecondary,
                        cursor: 'pointer'
                      }}
                    >
                      Limpar
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
                  {categories.map(cat => {
                    const isSelected = activeCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setActiveCategory(cat.id)}
                        style={{
                          padding: '5px 10px',
                          borderRadius: '8px',
                          fontSize: '11px',
                          fontWeight: isSelected ? 700 : 500,
                          backgroundColor: isSelected ? colors.primary : 'transparent',
                          color: isSelected ? colors.textOnPrimary : colors.textSecondary,
                          border: isSelected ? 'none' : `1px solid ${colors.border}`,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {cat.label} ({cat.count})
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Fields List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {filteredFields.map(field => {
                  const isCopied = copiedFieldId === field.id;
                  const isRegenerating = regeneratingFieldId === field.id;

                  return (
                    <div
                      key={field.id}
                      style={{
                        backgroundColor: colors.surface,
                        border: `1px solid ${colors.border}`,
                        borderRadius: '12px',
                        padding: '16px',
                        boxShadow: colors.shadowSm || '0 1px 3px rgba(0,0,0,0.03)',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {/* Field Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '8px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <strong style={{ fontSize: '13px', color: colors.textPrimary }}>
                              {field.label}
                            </strong>
                            {field.confidenceScore && (
                              <span style={{
                                fontSize: '10px',
                                fontWeight: 700,
                                padding: '1px 6px',
                                borderRadius: '10px',
                                backgroundColor: `${colors.primary}12`,
                                color: colors.primary
                              }}>
                                {field.confidenceScore}% Confiabilidade
                              </span>
                            )}
                          </div>
                          {field.tips && (
                            <span style={{ fontSize: '11px', color: colors.textSecondary, display: 'block', marginTop: '2px' }}>
                              💡 {field.tips}
                            </span>
                          )}
                        </div>

                        {/* Action buttons per field */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {field.isCustom && (
                            <button
                              type="button"
                              onClick={() => handleRegenerateQuestionAnswer(field)}
                              disabled={isRegenerating}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '5px 9px',
                                fontSize: '11px',
                                fontWeight: 600,
                                borderRadius: '6px',
                                border: `1px solid ${colors.border}`,
                                backgroundColor: colors.background,
                                color: colors.textPrimary,
                                cursor: isRegenerating ? 'not-allowed' : 'pointer'
                              }}
                              title="Re-gerar resposta com inteligência artificial"
                            >
                              <RefreshCw size={11} className={isRegenerating ? 'animate-spin' : ''} />
                              <span>{isRegenerating ? 'Gerando...' : 'Re-gerar (IA)'}</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleCopyField(field.id, field.value)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '5px 11px',
                              fontSize: '11px',
                              fontWeight: 700,
                              borderRadius: '6px',
                              backgroundColor: isCopied ? '#059669' : colors.primary,
                              color: '#ffffff',
                              border: 'none',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            {isCopied ? <Check size={12} /> : <Copy size={12} />}
                            <span>{isCopied ? 'Copiado!' : 'Copiar'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Field Input / Textarea */}
                      {field.fieldType === 'textarea' ? (
                        <textarea
                          rows={field.value.length > 250 ? 5 : 3}
                          value={field.value}
                          onChange={(e) => handleFieldChange(field.id, e.target.value)}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            fontSize: '13px',
                            borderRadius: '8px',
                            border: `1px solid ${colors.border}`,
                            backgroundColor: colors.inputBg || colors.surface,
                            color: colors.inputText || colors.textPrimary,
                            outline: 'none',
                            boxSizing: 'border-box',
                            lineHeight: 1.5,
                            resize: 'vertical'
                          }}
                        />
                      ) : (
                        <input
                          type="text"
                          value={field.value}
                          onChange={(e) => handleFieldChange(field.id, e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            fontSize: '13px',
                            borderRadius: '8px',
                            border: `1px solid ${colors.border}`,
                            backgroundColor: colors.inputBg || colors.surface,
                            color: colors.inputText || colors.textPrimary,
                            outline: 'none',
                            boxSizing: 'border-box'
                          }}
                        />
                      )}

                      {/* Suggested Alternatives if any */}
                      {field.suggestedAlternatives && field.suggestedAlternatives.length > 0 && (
                        <div style={{ marginTop: '8px' }}>
                          <span style={{ fontSize: '10px', fontWeight: 700, color: colors.textSecondary, textTransform: 'uppercase' }}>
                            Alternativas Rápidas:
                          </span>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                            {field.suggestedAlternatives.map((alt, altIdx) => (
                              <button
                                key={`alt-${altIdx}`}
                                type="button"
                                onClick={() => handleFieldChange(field.id, alt)}
                                style={{
                                  fontSize: '11px',
                                  padding: '3px 8px',
                                  borderRadius: '6px',
                                  backgroundColor: colors.background,
                                  color: colors.textSecondary,
                                  border: `1px solid ${colors.border}`,
                                  cursor: 'pointer',
                                  transition: 'all 0.1s ease'
                                }}
                              >
                                {alt}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Empty State before generation */
            <div style={{
              backgroundColor: colors.surface,
              border: `2px dashed ${colors.border}`,
              borderRadius: '16px',
              padding: '60px 30px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '14px'
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: `${colors.primary}12`,
                color: colors.primary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Zap size={32} />
              </div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: colors.textPrimary }}>
                Nenhum formulário gerado ainda
              </h3>
              <p style={{ margin: 0, fontSize: '13px', color: colors.textSecondary, maxWidth: '420px', lineHeight: 1.5 }}>
                Selecione seu currículo e a vaga desejada à esquerda, depois clique em <strong>"Gerar Preenchimento Automático com IA"</strong> para obter instantaneamente todos os dados, resumos, redações e respostas de triagem prontos para aplicar.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Script Modal */}
      {showScriptModal && autofillResult && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: '16px',
            maxWidth: '750px',
            width: '100%',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '18px 24px',
              borderBottom: `1px solid ${colors.border}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Code size={20} color={colors.primary} />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: colors.textPrimary }}>
                  Script de Auto-Preenchimento no Navegador (Console F12)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowScriptModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '20px',
                  color: colors.textSecondary
                }}
              >
                &times;
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                padding: '14px',
                borderRadius: '10px',
                backgroundColor: `${colors.primary}12`,
                border: `1px solid ${colors.primary}30`,
                fontSize: '12px',
                color: colors.textPrimary,
                lineHeight: 1.6
              }}>
                <strong>Como usar em 3 passos simples:</strong>
                <ol style={{ margin: '6px 0 0 0', paddingLeft: '20px' }}>
                  <li>Abra a página do formulário da vaga (Gupy, LinkedIn, Workday, etc.).</li>
                  <li>Pressione <code>F12</code> no teclado (ou clique com botão direito &gt; <em>Inspecionar</em>) e vá para a aba <strong>Console</strong>.</li>
                  <li>Cole o código abaixo e pressione <code>Enter</code>. Os campos com seletores compatíveis serão preenchidos automaticamente!</li>
                </ol>
              </div>

              <div style={{ position: 'relative' }}>
                <pre style={{
                  backgroundColor: '#0f172a',
                  color: '#f8fafc',
                  padding: '16px',
                  borderRadius: '10px',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  overflowX: 'auto',
                  maxHeight: '300px',
                  margin: 0,
                  lineHeight: 1.5
                }}>
                  {autofillResult.browserFillScript}
                </pre>

                <button
                  type="button"
                  onClick={handleCopyScript}
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '6px 12px',
                    fontSize: '11px',
                    fontWeight: 700,
                    borderRadius: '6px',
                    backgroundColor: copiedScript ? '#059669' : colors.primary,
                    color: '#ffffff',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {copiedScript ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copiedScript ? 'Copiado!' : 'Copiar Código'}</span>
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '14px 24px',
              borderTop: `1px solid ${colors.border}`,
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px'
            }}>
              <button
                type="button"
                onClick={() => setShowScriptModal(false)}
                style={{
                  padding: '8px 16px',
                  fontSize: '12px',
                  fontWeight: 600,
                  borderRadius: '8px',
                  border: `1px solid ${colors.border}`,
                  backgroundColor: 'transparent',
                  color: colors.textPrimary,
                  cursor: 'pointer'
                }}
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={handleCopyScript}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  fontSize: '12px',
                  fontWeight: 700,
                  borderRadius: '8px',
                  backgroundColor: colors.primary,
                  color: '#ffffff',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <Copy size={14} />
                <span>Copiar Script</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobFormAutofill;
