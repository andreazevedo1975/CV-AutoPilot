import React, { useState, useContext, useMemo } from 'react';
import { 
  TrendingUp, 
  Search, 
  DollarSign, 
  Building2, 
  MapPin, 
  Briefcase, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Copy, 
  Check, 
  BookmarkCheck, 
  Globe, 
  Award, 
  BarChart3, 
  ShieldCheck, 
  HelpCircle,
  RefreshCw,
  Sliders,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  FileSpreadsheet
} from 'lucide-react';
import { ThemeContext } from '../App';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Application, SalaryBenchmarkResult, SenioritySalaryTier } from '../types';
import { analyzeSalaryBenchmark } from '../services/geminiService';

interface SalaryBenchmarkingProps {
  onNavigateToApplications?: () => void;
}

export const SalaryBenchmarking: React.FC<SalaryBenchmarkingProps> = ({ onNavigateToApplications }) => {
  const { colors, theme } = useContext(ThemeContext);

  // Storage
  const [applications, setApplications] = useLocalStorage<Application[]>('applications', []);

  // Mode Selection
  const [activeTab, setActiveTab] = useState<'pipeline' | 'custom'>('pipeline');

  // Selected Application for analysis
  const [selectedAppId, setSelectedAppId] = useState<string>(() => applications[0]?.id || '');

  // Custom Simulator Form
  const [customJobTitle, setCustomJobTitle] = useState<string>('Tech Lead Full Stack & Cloud');
  const [customLocation, setCustomLocation] = useState<string>('São Paulo, SP / Remoto Brasil');
  const [customSeniority, setCustomSeniority] = useState<string>('Sênior');
  const [customCompanyName, setCustomCompanyName] = useState<string>('');
  const [customExpectedSalary, setCustomExpectedSalary] = useState<number | ''>(15000);

  // Loading & Results
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [benchmarkResult, setBenchmarkResult] = useState<SalaryBenchmarkResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedReport, setCopiedReport] = useState<boolean>(false);
  const [savedToAppSuccess, setSavedToAppSuccess] = useState<boolean>(false);

  // Quick suggestions for one-click testing
  const quickJobSuggestions = [
    { title: 'Tech Lead Full Stack', loc: 'São Paulo, SP / Remoto', sen: 'Especialista / Lead', sal: 19000 },
    { title: 'Engenheiro de Software Sênior', loc: 'São Paulo, SP', sen: 'Sênior', sal: 15000 },
    { title: 'Product Manager (GPM)', loc: 'Remoto Brasil', sen: 'Sênior', sal: 16500 },
    { title: 'Arquiteto de Soluções Cloud (AWS)', loc: 'São Paulo, SP', sen: 'Especialista / Lead', sal: 22000 },
    { title: 'Cientista de Dados / IA', loc: 'Remoto Brasil', sen: 'Sênior', sal: 15500 },
    { title: 'DevOps / SRE Sênior', loc: 'Curitiba, PR / Remoto', sen: 'Sênior', sal: 14500 }
  ];

  // Active Application resolved
  const activeSelectedApp = useMemo(() => {
    return applications.find(a => a.id === selectedAppId) || applications[0] || null;
  }, [applications, selectedAppId]);

  // Run Benchmark for Registered Application
  const handleAnalyzeApplication = async (appToAnalyze?: Application) => {
    const target = appToAnalyze || activeSelectedApp;
    if (!target) {
      setErrorMessage('Nenhuma vaga selecionada no pipeline. Cadastre uma candidatura ou use o simulador livre.');
      return;
    }

    setErrorMessage(null);
    setIsAnalyzing(true);
    setSavedToAppSuccess(false);

    // Parse potential expected salary from notes or salaryExpectation
    let expSalary: number | undefined;
    if (target.salaryExpectation) {
      const parsedNum = parseFloat(target.salaryExpectation.replace(/[^0-9]/g, ''));
      if (!isNaN(parsedNum) && parsedNum > 1000) expSalary = parsedNum;
    } else if (target.notes) {
      const match = target.notes.match(/(?:R\$|sal[aá]rio|pretens[ãa]o)[:\s]*(\d+[\d.,]*)/i);
      if (match) {
        const num = parseFloat(match[1].replace(/\./g, '').replace(',', '.'));
        if (!isNaN(num) && num > 1000) expSalary = num;
      }
    }

    const loc = target.location || 'São Paulo, SP / Remoto Brasil';

    try {
      const result = await analyzeSalaryBenchmark(
        target.jobTitle,
        loc,
        'Sênior',
        expSalary,
        target.companyName
      );
      setBenchmarkResult(result);
    } catch (err) {
      console.error('Erro na análise de benchmarking salarial:', err);
      setErrorMessage('Houve uma falha na pesquisa de mercado em tempo real. Tente novamente.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Run Benchmark for Custom Form
  const handleAnalyzeCustom = async () => {
    if (!customJobTitle.trim()) {
      setErrorMessage('Informe o título do cargo para consultar o benchmarking.');
      return;
    }

    setErrorMessage(null);
    setIsAnalyzing(true);
    setSavedToAppSuccess(false);

    try {
      const expSal = typeof customExpectedSalary === 'number' && customExpectedSalary > 0 
        ? customExpectedSalary 
        : undefined;

      const result = await analyzeSalaryBenchmark(
        customJobTitle,
        customLocation,
        customSeniority,
        expSal,
        customCompanyName
      );
      setBenchmarkResult(result);
    } catch (err) {
      console.error('Erro na análise de benchmarking salarial:', err);
      setErrorMessage('Houve uma falha na pesquisa de mercado em tempo real. Tente novamente.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Save recommended salary back into Application notes
  const handleSaveToApplication = () => {
    if (!benchmarkResult || !activeSelectedApp) return;

    const formattedClt = `R$ ${benchmarkResult.marketAverageClt.toLocaleString('pt-BR')} (CLT Médio)`;
    const formattedPj = benchmarkResult.marketAveragePj ? ` / R$ ${benchmarkResult.marketAveragePj.toLocaleString('pt-BR')} (PJ)` : '';
    const updatedNotes = `${activeSelectedApp.notes ? activeSelectedApp.notes + '\n\n' : ''}[Benchmarking Salarial IA 2026]: Média de Mercado: ${formattedClt}${formattedPj}. Faixa P25-P90: R$ ${benchmarkResult.percentiles.p25.toLocaleString('pt-BR')} a R$ ${benchmarkResult.percentiles.p90.toLocaleString('pt-BR')}.`;

    const updatedApps = applications.map(app => {
      if (app.id === activeSelectedApp.id) {
        return {
          ...app,
          salaryExpectation: `${benchmarkResult.marketAverageClt}`,
          notes: updatedNotes
        };
      }
      return app;
    });

    setApplications(updatedApps);
    setSavedToAppSuccess(true);
    setTimeout(() => setSavedToAppSuccess(false), 3000);
  };

  // Copy structured report to clipboard
  const handleCopyReport = () => {
    if (!benchmarkResult) return;

    const reportText = `=====================================================
CV-AutoPilot Enterprise • Relatório de Benchmarking Salarial (IA)
Cargo: ${benchmarkResult.jobTitle}
Localidade: ${benchmarkResult.location}
Senioridade Analisada: ${benchmarkResult.targetSeniority}
Data da Auditoria: ${new Date(benchmarkResult.analyzedAt).toLocaleDateString('pt-BR')}
=====================================================

MÉTRICAS PRINCIPAIS DE REMUNERAÇÃO:
- Média de Mercado CLT: R$ ${benchmarkResult.marketAverageClt.toLocaleString('pt-BR')} / mês
- Média Estimada PJ: ${benchmarkResult.marketAveragePj ? `R$ ${benchmarkResult.marketAveragePj.toLocaleString('pt-BR')} / mês` : 'N/A'}
- Percentil 25 (Piso Inicial): R$ ${benchmarkResult.percentiles.p25.toLocaleString('pt-BR')}
- Percentil 50 (Mediana): R$ ${benchmarkResult.percentiles.median.toLocaleString('pt-BR')}
- Percentil 75 (Consolidado): R$ ${benchmarkResult.percentiles.p75.toLocaleString('pt-BR')}
- Percentil 90 (Top Tier / Multinacionais): R$ ${benchmarkResult.percentiles.p90.toLocaleString('pt-BR')}

${benchmarkResult.marketComparison ? `AUDITORIA DA SUA PRETENSÃO:
- Pretensão Informada: R$ ${benchmarkResult.candidateExpectedSalary?.toLocaleString('pt-BR')} / mês
- Veredito: ${benchmarkResult.marketComparison.verdict}\n` : ''}
FAIXAS SALARIAIS POR SENIORIDADE:
${benchmarkResult.seniorityTiers.map(t => `- ${t.seniority}: CLT R$ ${t.cltMin.toLocaleString('pt-BR')} a R$ ${t.cltMax.toLocaleString('pt-BR')} (Média R$ ${t.cltAvg.toLocaleString('pt-BR')})${t.pjAvg ? ` | PJ Média: R$ ${t.pjAvg.toLocaleString('pt-BR')}` : ''}`).join('\n')}

PACOTE DE BENEFÍCIOS TÍPICOS:
${benchmarkResult.commonBenefits.map(b => `- ${b}`).join('\n')}

ESTRATÉGIAS DE NEGOCIAÇÃO RECOMENDADAS:
${benchmarkResult.negotiationTips.map(tip => `- ${tip}`).join('\n')}

FONTES CONSULTADAS VIA SEARCH GROUNDING:
${benchmarkResult.sources.map(s => `- ${s.title}: ${s.uri}`).join('\n')}
`;

    navigator.clipboard.writeText(reportText);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2500);
  };

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
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            backgroundColor: `${colors.primary}18`,
            color: colors.primary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 2px 8px ${colors.primary}25`
          }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: colors.textPrimary, letterSpacing: '-0.02em' }}>
                Benchmarking Salarial & Inteligência de Remuneração
              </h1>
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '3px 9px',
                borderRadius: '12px',
                backgroundColor: '#ecfdf5',
                color: '#059669',
                border: '1px solid #a7f3d0',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <Globe size={11} />
                Google Search Grounding • 2026 Live
              </span>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: colors.textSecondary, lineHeight: 1.5 }}>
              Audite remunerações de mercado em tempo real para as vagas cadastradas no seu pipeline ou simule cargos e cidades brasileiras, com base no Guia Salarial Robert Half, Glassdoor e Catho.
            </p>
          </div>
        </div>

        {/* Mode Switch Tabs */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginTop: '16px',
          paddingTop: '16px',
          borderTop: `1px solid ${colors.border}`,
          flexWrap: 'wrap'
        }}>
          <button
            type="button"
            onClick={() => setActiveTab('pipeline')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: activeTab === 'pipeline' ? 700 : 500,
              backgroundColor: activeTab === 'pipeline' ? colors.primary : colors.surface,
              color: activeTab === 'pipeline' ? colors.textOnPrimary : colors.textSecondary,
              border: activeTab === 'pipeline' ? 'none' : `1px solid ${colors.border}`,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Briefcase size={14} />
            <span>Vagas Cadastradas no Pipeline ({applications.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('custom')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: activeTab === 'custom' ? 700 : 500,
              backgroundColor: activeTab === 'custom' ? colors.primary : colors.surface,
              color: activeTab === 'custom' ? colors.textOnPrimary : colors.textSecondary,
              border: activeTab === 'custom' ? 'none' : `1px solid ${colors.border}`,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Sliders size={14} />
            <span>Simulador Livre de Mercado & Localidades</span>
          </button>
        </div>
      </div>

      {/* Error Message Banner */}
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

      {/* Main Grid: Controls & Results */}
      <div style={{ display: 'grid', gridTemplateColumns: benchmarkResult ? '1fr 1.6fr' : '1fr', gap: '22px' }}>
        {/* Left Column: Form / Selection */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {activeTab === 'pipeline' ? (
            /* Pipeline Selection Mode */
            <div style={{
              backgroundColor: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: '14px',
              padding: '20px',
              boxShadow: colors.shadowSm || '0 1px 3px rgba(0,0,0,0.04)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <Briefcase size={17} color={colors.primary} />
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: colors.textPrimary }}>
                  Selecione uma Vaga do seu Pipeline
                </h3>
              </div>

              {applications.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: colors.textSecondary }}>
                    A IA analisará a localidade, o cargo e o histórico da oportunidade para pesquisar benchmarks em tempo real.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '380px', overflowY: 'auto' }}>
                    {applications.map(app => {
                      const isSelected = selectedAppId === app.id;
                      return (
                        <div
                          key={app.id}
                          onClick={() => setSelectedAppId(app.id)}
                          style={{
                            padding: '12px 14px',
                            borderRadius: '10px',
                            border: isSelected ? `2px solid ${colors.primary}` : `1px solid ${colors.border}`,
                            backgroundColor: isSelected ? `${colors.primary}10` : colors.background,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: '10px'
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '13px', color: colors.textPrimary }}>
                              {app.jobTitle}
                            </div>
                            <div style={{ fontSize: '12px', color: colors.textSecondary, display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                              <span>🏢 {app.companyName}</span>
                              {app.location && <span>📍 {app.location}</span>}
                              {app.salaryExpectation && <span>💰 R$ {app.salaryExpectation}</span>}
                            </div>
                          </div>

                          <div style={{ textAlign: 'right' }}>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 600,
                              padding: '2px 8px',
                              borderRadius: '6px',
                              backgroundColor: `${colors.primary}15`,
                              color: colors.primary
                            }}>
                              {app.status}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {activeSelectedApp && (
                    <div style={{
                      marginTop: '12px',
                      padding: '12px',
                      borderRadius: '8px',
                      backgroundColor: colors.background,
                      border: `1px solid ${colors.border}`,
                      fontSize: '12px'
                    }}>
                      <div style={{ fontWeight: 700, color: colors.textPrimary, marginBottom: '4px' }}>
                        Parâmetros da Consulta:
                      </div>
                      <div style={{ color: colors.textSecondary }}>
                        Cargo: <strong>{activeSelectedApp.jobTitle}</strong> • Empresa: <strong>{activeSelectedApp.companyName}</strong>
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => handleAnalyzeApplication()}
                    disabled={isAnalyzing}
                    style={{
                      marginTop: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '12px 20px',
                      borderRadius: '10px',
                      backgroundColor: colors.primary,
                      color: colors.textOnPrimary,
                      fontSize: '13px',
                      fontWeight: 700,
                      border: 'none',
                      cursor: isAnalyzing ? 'not-allowed' : 'pointer',
                      boxShadow: `0 2px 10px ${colors.primary}35`,
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {isAnalyzing ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        <span>Pesquisando Remunerações em Tempo Real...</span>
                      </>
                    ) : (
                      <>
                        <Search size={16} />
                        <span>Pesquisar Benchmarks desta Vaga (IA)</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div style={{
                  textAlign: 'center',
                  padding: '30px 10px',
                  color: colors.textSecondary,
                  fontSize: '13px'
                }}>
                  <p style={{ margin: '0 0 10px 0' }}>
                    Nenhuma candidatura cadastrada ainda no seu painel.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('custom')}
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: colors.primary,
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      textDecoration: 'underline'
                    }}
                  >
                    Usar o Simulador Livre de Mercado
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Custom Simulator Mode */
            <div style={{
              backgroundColor: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: '14px',
              padding: '20px',
              boxShadow: colors.shadowSm || '0 1px 3px rgba(0,0,0,0.04)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <Sliders size={17} color={colors.primary} />
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: colors.textPrimary }}>
                  Simulador de Mercado Customizado
                </h3>
              </div>

              {/* Quick suggestions pills */}
              <div style={{ marginBottom: '14px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: colors.textSecondary, textTransform: 'uppercase' }}>
                  Sugestões Rápidas:
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                  {quickJobSuggestions.map((sug, sIdx) => (
                    <button
                      key={`sug-${sIdx}`}
                      type="button"
                      onClick={() => {
                        setCustomJobTitle(sug.title);
                        setCustomLocation(sug.loc);
                        setCustomSeniority(sug.sen);
                        setCustomExpectedSalary(sug.sal);
                      }}
                      style={{
                        fontSize: '11px',
                        padding: '4px 9px',
                        borderRadius: '6px',
                        backgroundColor: colors.background,
                        border: `1px solid ${colors.border}`,
                        color: colors.textSecondary,
                        cursor: 'pointer',
                        transition: 'all 0.1s ease'
                      }}
                    >
                      {sug.title}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: colors.textSecondary, marginBottom: '4px' }}>
                    Título do Cargo:
                  </label>
                  <input
                    type="text"
                    value={customJobTitle}
                    onChange={(e) => setCustomJobTitle(e.target.value)}
                    placeholder="Ex: Tech Lead Full Stack, Product Manager..."
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
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: colors.textSecondary, marginBottom: '4px' }}>
                      Localidade / Polo:
                    </label>
                    <input
                      type="text"
                      value={customLocation}
                      onChange={(e) => setCustomLocation(e.target.value)}
                      placeholder="Ex: São Paulo, SP ou Remoto"
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
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: colors.textSecondary, marginBottom: '4px' }}>
                      Senioridade:
                    </label>
                    <select
                      value={customSeniority}
                      onChange={(e) => setCustomSeniority(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        fontSize: '13px',
                        borderRadius: '8px',
                        border: `1px solid ${colors.border}`,
                        backgroundColor: colors.inputBg || colors.surface,
                        color: colors.inputText || colors.textPrimary,
                        outline: 'none',
                        cursor: 'pointer',
                        boxSizing: 'border-box'
                      }}
                    >
                      <option value="Júnior">Júnior (0-2 anos)</option>
                      <option value="Pleno">Pleno (2-5 anos)</option>
                      <option value="Sênior">Sênior (5-8 anos)</option>
                      <option value="Especialista / Lead">Especialista / Tech Lead (8+ anos)</option>
                      <option value="Diretoria / C-Level">Diretoria / Head / C-Level</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: colors.textSecondary, marginBottom: '4px' }}>
                      Empresa (Opcional):
                    </label>
                    <input
                      type="text"
                      value={customCompanyName}
                      onChange={(e) => setCustomCompanyName(e.target.value)}
                      placeholder="Ex: Nubank, Mercado Livre..."
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
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: colors.textSecondary, marginBottom: '4px' }}>
                      Pretensão Salarial R$ (Opcional):
                    </label>
                    <input
                      type="number"
                      value={customExpectedSalary}
                      onChange={(e) => setCustomExpectedSalary(e.target.value ? Number(e.target.value) : '')}
                      placeholder="Ex: 16000"
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
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAnalyzeCustom}
                  disabled={isAnalyzing}
                  style={{
                    marginTop: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '12px 20px',
                    borderRadius: '10px',
                    backgroundColor: colors.primary,
                    color: colors.textOnPrimary,
                    fontSize: '13px',
                    fontWeight: 700,
                    border: 'none',
                    cursor: isAnalyzing ? 'not-allowed' : 'pointer',
                    boxShadow: `0 2px 10px ${colors.primary}35`,
                    transition: 'all 0.15s ease'
                  }}
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      <span>Consultando Search Grounding 2026...</span>
                    </>
                  ) : (
                    <>
                      <Search size={16} />
                      <span>Analisar Benchmarking Salarial (IA)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Benchmarking Results */}
        <div>
          {benchmarkResult ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Executive Summary Card */}
              <div style={{
                backgroundColor: colors.surface,
                border: `1px solid ${colors.border}`,
                borderRadius: '16px',
                padding: '24px',
                boxShadow: colors.shadowSm || '0 2px 8px rgba(0,0,0,0.05)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                  <div>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: colors.primary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      AUDITORIA SALARIAL DE MERCADO
                    </span>
                    <h2 style={{ margin: '2px 0 0 0', fontSize: '20px', fontWeight: 800, color: colors.textPrimary }}>
                      {benchmarkResult.jobTitle}
                    </h2>
                    <div style={{ fontSize: '12px', color: colors.textSecondary, marginTop: '4px' }}>
                      📍 {benchmarkResult.location} • Nível: <strong>{benchmarkResult.targetSeniority}</strong>
                    </div>
                  </div>

                  {/* Actions Header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {activeTab === 'pipeline' && activeSelectedApp && (
                      <button
                        type="button"
                        onClick={handleSaveToApplication}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '7px 12px',
                          borderRadius: '8px',
                          fontSize: '11px',
                          fontWeight: 700,
                          backgroundColor: savedToAppSuccess ? '#059669' : colors.surface,
                          color: savedToAppSuccess ? '#ffffff' : colors.primary,
                          border: `1px solid ${savedToAppSuccess ? '#059669' : colors.primary}`,
                          cursor: 'pointer'
                        }}
                      >
                        {savedToAppSuccess ? <Check size={13} /> : <BookmarkCheck size={13} />}
                        <span>{savedToAppSuccess ? 'Salvo na Vaga!' : 'Salvar na Vaga'}</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleCopyReport}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '7px 12px',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontWeight: 700,
                        backgroundColor: copiedReport ? '#059669' : colors.primary,
                        color: '#ffffff',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      {copiedReport ? <Check size={13} /> : <Copy size={13} />}
                      <span>{copiedReport ? 'Copiado!' : 'Copiar Relatório'}</span>
                    </button>
                  </div>
                </div>

                {/* Primary Metric Highlights: CLT vs PJ */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '20px' }}>
                  {/* CLT Card */}
                  <div style={{
                    padding: '16px',
                    borderRadius: '12px',
                    backgroundColor: colors.background,
                    border: `1px solid ${colors.border}`
                  }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: colors.textSecondary, textTransform: 'uppercase' }}>
                      Média CLT de Mercado
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 900, color: colors.primary, margin: '6px 0 2px 0' }}>
                      R$ {benchmarkResult.marketAverageClt.toLocaleString('pt-BR')}
                      <span style={{ fontSize: '13px', fontWeight: 500, color: colors.textSecondary }}> / mês</span>
                    </div>
                    <div style={{ fontSize: '11px', color: colors.textSecondary }}>
                      Piso P25: R$ {benchmarkResult.percentiles.p25.toLocaleString('pt-BR')} • Teto P90: R$ {benchmarkResult.percentiles.p90.toLocaleString('pt-BR')}
                    </div>
                  </div>

                  {/* PJ Card */}
                  <div style={{
                    padding: '16px',
                    borderRadius: '12px',
                    backgroundColor: colors.background,
                    border: `1px solid ${colors.border}`
                  }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: colors.textSecondary, textTransform: 'uppercase' }}>
                      Estimativa Contratação PJ
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 900, color: '#059669', margin: '6px 0 2px 0' }}>
                      {benchmarkResult.marketAveragePj ? `R$ ${benchmarkResult.marketAveragePj.toLocaleString('pt-BR')}` : 'Sob Consulta'}
                      <span style={{ fontSize: '13px', fontWeight: 500, color: colors.textSecondary }}> / mês</span>
                    </div>
                    <div style={{ fontSize: '11px', color: colors.textSecondary }}>
                      Base compensatória (+45% a 60% vs CLT para encargos)
                    </div>
                  </div>
                </div>

                {/* Candidate Comparison Verdict if expected salary given */}
                {benchmarkResult.marketComparison && (
                  <div style={{
                    padding: '14px 18px',
                    borderRadius: '12px',
                    backgroundColor: benchmarkResult.marketComparison.status === 'above' 
                      ? '#eff6ff' 
                      : benchmarkResult.marketComparison.status === 'below' 
                      ? '#fefce8' 
                      : '#ecfdf5',
                    border: `1.5px solid ${
                      benchmarkResult.marketComparison.status === 'above' 
                        ? '#3b82f6' 
                        : benchmarkResult.marketComparison.status === 'below' 
                        ? '#eab308' 
                        : '#059669'
                    }`,
                    marginBottom: '20px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      {benchmarkResult.marketComparison.status === 'above' ? (
                        <ArrowUpRight size={18} color="#2563eb" />
                      ) : benchmarkResult.marketComparison.status === 'below' ? (
                        <ArrowDownRight size={18} color="#ca8a04" />
                      ) : (
                        <CheckCircle2 size={18} color="#059669" />
                      )}
                      <strong style={{ fontSize: '13px', color: colors.textPrimary }}>
                        Auditoria de Competitividade: {benchmarkResult.marketComparison.percentageDiff >= 0 ? '+' : ''}{benchmarkResult.marketComparison.percentageDiff}% em relação à média
                      </strong>
                    </div>
                    <p style={{ margin: 0, fontSize: '12.5px', color: colors.textPrimary, lineHeight: 1.5 }}>
                      {benchmarkResult.marketComparison.verdict}
                    </p>
                  </div>
                )}

                {/* Visual Percentile Salary Range Bar */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: colors.textPrimary }}>
                      Régua de Percentis Salariais CLT (P25 - P90)
                    </span>
                    <span style={{ fontSize: '11px', color: colors.textSecondary }}>
                      Mercado Brasil 2026
                    </span>
                  </div>

                  <div style={{ position: 'relative', margin: '20px 0 10px 0' }}>
                    <div style={{
                      height: '14px',
                      borderRadius: '7px',
                      background: `linear-gradient(to right, #93c5fd, ${colors.primary}, #059669)`,
                      position: 'relative'
                    }} />

                    {/* Percentile Markers */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '11px', color: colors.textSecondary }}>
                      <div>
                        <strong>P25 (Piso)</strong><br />
                        R$ {benchmarkResult.percentiles.p25.toLocaleString('pt-BR')}
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <strong style={{ color: colors.primary }}>P50 (Mediana)</strong><br />
                        R$ {benchmarkResult.percentiles.median.toLocaleString('pt-BR')}
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <strong>P75</strong><br />
                        R$ {benchmarkResult.percentiles.p75.toLocaleString('pt-BR')}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <strong style={{ color: '#059669' }}>P90 (Top Tier)</strong><br />
                        R$ {benchmarkResult.percentiles.p90.toLocaleString('pt-BR')}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Seniority Tiers Breakdown Table */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: colors.textPrimary, marginBottom: '10px' }}>
                    📊 Tabela Salarial por Nível de Experiência
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                      <thead>
                        <tr style={{ borderBottom: `1px solid ${colors.border}`, color: colors.textSecondary }}>
                          <th style={{ textAlign: 'left', padding: '8px 10px' }}>Senioridade</th>
                          <th style={{ textAlign: 'right', padding: '8px 10px' }}>Faixa CLT (Mín - Máx)</th>
                          <th style={{ textAlign: 'right', padding: '8px 10px' }}>Média CLT</th>
                          <th style={{ textAlign: 'right', padding: '8px 10px' }}>Média PJ Estimada</th>
                        </tr>
                      </thead>
                      <tbody>
                        {benchmarkResult.seniorityTiers.map((tier, tIdx) => {
                          const isTarget = tier.seniority.toLowerCase().includes(benchmarkResult.targetSeniority.toLowerCase());
                          return (
                            <tr
                              key={`tier-${tIdx}`}
                              style={{
                                borderBottom: `1px solid ${colors.border}`,
                                backgroundColor: isTarget ? `${colors.primary}12` : 'transparent',
                                fontWeight: isTarget ? 700 : 500
                              }}
                            >
                              <td style={{ padding: '9px 10px', color: isTarget ? colors.primary : colors.textPrimary }}>
                                {tier.seniority} {isTarget ? '⭐' : ''}
                              </td>
                              <td style={{ textAlign: 'right', padding: '9px 10px', color: colors.textSecondary }}>
                                R$ {tier.cltMin.toLocaleString('pt-BR')} - R$ {tier.cltMax.toLocaleString('pt-BR')}
                              </td>
                              <td style={{ textAlign: 'right', padding: '9px 10px', color: colors.textPrimary }}>
                                R$ {tier.cltAvg.toLocaleString('pt-BR')}
                              </td>
                              <td style={{ textAlign: 'right', padding: '9px 10px', color: '#059669' }}>
                                {tier.pjAvg ? `R$ ${tier.pjAvg.toLocaleString('pt-BR')}` : '-'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Common Benefits Package */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: colors.textPrimary, marginBottom: '8px' }}>
                    🎁 Pacote de Benefícios & Bônus Praticados pelo Mercado
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px' }}>
                    {benchmarkResult.commonBenefits.map((ben, bIdx) => (
                      <div
                        key={`ben-${bIdx}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          backgroundColor: colors.background,
                          border: `1px solid ${colors.border}`,
                          fontSize: '12px',
                          color: colors.textPrimary
                        }}
                      >
                        <CheckCircle2 size={14} color="#059669" />
                        <span>{ben}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Strategic Negotiation Tips */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: colors.textPrimary, marginBottom: '8px' }}>
                    💡 Estratégias de Negociação Salarial Recomendadas pela IA
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {benchmarkResult.negotiationTips.map((tip, tipIdx) => (
                      <div
                        key={`tip-${tipIdx}`}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '8px',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          backgroundColor: `${colors.primary}08`,
                          border: `1px solid ${colors.primary}20`,
                          fontSize: '12.5px',
                          color: colors.textPrimary,
                          lineHeight: 1.45
                        }}
                      >
                        <Award size={16} color={colors.primary} style={{ marginTop: '2px', flexShrink: 0 }} />
                        <span>{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Market Trends Summary */}
                <div style={{
                  padding: '14px',
                  borderRadius: '10px',
                  backgroundColor: colors.background,
                  border: `1px solid ${colors.border}`,
                  fontSize: '12.5px',
                  color: colors.textPrimary,
                  lineHeight: 1.55,
                  marginBottom: '18px'
                }}>
                  <strong style={{ display: 'block', marginBottom: '4px', color: colors.primary }}>
                    📈 Panorama de Tendências de Mercado & Localidade:
                  </strong>
                  {benchmarkResult.marketTrendsSummary}
                </div>

                {/* Search Grounding Live Citations */}
                <div style={{
                  paddingTop: '14px',
                  borderTop: `1px solid ${colors.border}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: colors.textSecondary, textTransform: 'uppercase' }}>
                    🔗 Fontes Grounded Consultadas em Tempo Real:
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {benchmarkResult.sources.map((src, sIdx) => (
                      <a
                        key={`src-${sIdx}`}
                        href={src.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          backgroundColor: colors.background,
                          border: `1px solid ${colors.border}`,
                          fontSize: '11px',
                          color: colors.primary,
                          textDecoration: 'none'
                        }}
                      >
                        <ExternalLink size={11} />
                        <span>{src.title}</span>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Empty State */
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
                <DollarSign size={32} />
              </div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: colors.textPrimary }}>
                Nenhum benchmarking consultado ainda
              </h3>
              <p style={{ margin: 0, fontSize: '13px', color: colors.textSecondary, maxWidth: '420px', lineHeight: 1.5 }}>
                Selecione uma vaga cadastrada à esquerda ou utilize o simulador livre para obter em tempo real as médias salariais (CLT/PJ), percentis de mercado, pacote de benefícios e táticas de negociação salarial fundamentadas no <strong>Google Search Grounding</strong>.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalaryBenchmarking;
