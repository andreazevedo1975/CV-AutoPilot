// components/CareerInsights.tsx - Visualização de Insights de Carreira com Recharts
// Evolução de candidaturas: Entrevistas agendadas por mês versus negativas recebidas
import React, { useState, useMemo, useContext } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Area,
  AreaChart,
  ReferenceLine
} from 'recharts';
import { Application, ApplicationStatus, CareerStrategyAnalysisResult, CV } from '../types';
import { ThemeContext } from '../ThemeContext';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { analyzeRejectionPatternsAndStrategy } from '../services/geminiService';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  CheckCircle2,
  XCircle,
  Award,
  Sparkles,
  Info,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Layers,
  Target,
  Compass,
  Briefcase,
  HelpCircle,
  Activity,
  Flame,
  Zap,
  FileDown,
  Printer
} from 'lucide-react';
import MonthlyPerformancePdfModal from './MonthlyPerformancePdfModal';
import CareerStrategyAnalysisModal from './CareerStrategyAnalysisModal';

export interface CareerInsightsProps {
  applications: Application[];
  onAddSampleData?: () => void;
}

export interface MonthlyCareerMetric {
  monthKey: string;           // YYYY-MM
  monthLabel: string;         // Jan/26, Fev/26, etc.
  fullMonthName: string;      // Janeiro 2026
  interviewsCount: number;    // Entrevistas agendadas no mês
  negativesCount: number;     // Negativas/Rejeições recebidas no mês
  totalApplications: number;  // Total de aplicações feitas no mês
  netTraction: number;        // interviewsCount - negativesCount
  interviewRatio: number;     // % de entrevistas sobre (entrevistas + negativas)
  interviewCompanies: string[]; // Empresas com entrevista no mês
  negativeCompanies: string[];  // Empresas com negativa no mês
  isSimulated?: boolean;
}

// 10-Month realistic Career Progression Benchmark Data
// Reflects a real executive candidate who optimizes their resume and strategy over time
const BENCHMARK_CAREER_DATA: MonthlyCareerMetric[] = [
  {
    monthKey: '2025-12',
    monthLabel: 'Dez/25',
    fullMonthName: 'Dezembro 2025',
    interviewsCount: 2,
    negativesCount: 7,
    totalApplications: 14,
    netTraction: -5,
    interviewRatio: 22.2,
    interviewCompanies: ['Stone', 'Loggi'],
    negativeCompanies: ['TOTVS', 'Ambev', 'Itaú', 'Localiza', 'C&A', 'B3', 'Raízen'],
    isSimulated: true
  },
  {
    monthKey: '2026-01',
    monthLabel: 'Jan/26',
    fullMonthName: 'Janeiro 2026',
    interviewsCount: 3,
    negativesCount: 8,
    totalApplications: 18,
    netTraction: -5,
    interviewRatio: 27.3,
    interviewCompanies: ['QuintoAndar', 'PicPay', 'BTG Pactual'],
    negativeCompanies: ['Nubank', 'Google SP', 'Amazon', 'Votorantim', 'Magazine Luiza', 'Embraer', 'Klabin', 'Suzano'],
    isSimulated: true
  },
  {
    monthKey: '2026-02',
    monthLabel: 'Fev/26',
    fullMonthName: 'Fevereiro 2026',
    interviewsCount: 5,
    negativesCount: 6,
    totalApplications: 19,
    netTraction: -1,
    interviewRatio: 45.5,
    interviewCompanies: ['Mercado Livre', 'Nubank', 'XP Inc', 'Gerdau', 'Natura &Co'],
    negativeCompanies: ['Dell', 'SAP', 'Cisco', 'Accenture', 'Carrefour', 'Rede D\'Or'],
    isSimulated: true
  },
  {
    monthKey: '2026-03',
    monthLabel: 'Mar/26',
    fullMonthName: 'Março 2026',
    interviewsCount: 6,
    negativesCount: 5,
    totalApplications: 22,
    netTraction: 1,
    interviewRatio: 54.5,
    interviewCompanies: ['Itaú Unibanco', 'TOTVS', 'B3', 'SulAmérica', 'Porto Seguro', 'Oracle'],
    negativeCompanies: ['Microsoft', 'IBM Brasil', 'Uber Tech', 'Spotify', 'Meta'],
    isSimulated: true
  },
  {
    monthKey: '2026-04',
    monthLabel: 'Abr/26',
    fullMonthName: 'Abril 2026',
    interviewsCount: 7,
    negativesCount: 4,
    totalApplications: 20,
    netTraction: 3,
    interviewRatio: 63.6,
    interviewCompanies: ['Stone Co.', 'PicPay', 'Ambev Tech', 'Localiza', 'C&A Modas', 'Embraer', 'Accenture'],
    negativeCompanies: ['Amazon AWS', 'Apple BR', 'Stripe', 'Netflix'],
    isSimulated: true
  },
  {
    monthKey: '2026-05',
    monthLabel: 'Mai/26',
    fullMonthName: 'Maio 2026',
    interviewsCount: 8,
    negativesCount: 4,
    totalApplications: 24,
    netTraction: 4,
    interviewRatio: 66.7,
    interviewCompanies: ['Amazon Web Services', 'BTG Pactual', 'XP Investimentos', 'QuintoAndar', 'Loggi', 'Dasa', 'Votorantim', 'Suzano'],
    negativeCompanies: ['Google', 'Cloudflare', 'Datadog', 'Snowflake'],
    isSimulated: true
  },
  {
    monthKey: '2026-06',
    monthLabel: 'Jun/26',
    fullMonthName: 'Junho 2026',
    interviewsCount: 9,
    negativesCount: 3,
    totalApplications: 25,
    netTraction: 6,
    interviewRatio: 75.0,
    interviewCompanies: ['Nubank', 'Mercado Livre', 'Google Brasil', 'Oracle Cloud', 'SAP Labs', 'Dell Technologies', 'IBM Research', 'B3', 'Klabin'],
    negativeCompanies: ['Palantir', 'OpenAI', 'Figma'],
    isSimulated: true
  },
  {
    monthKey: '2026-07',
    monthLabel: 'Jul/26',
    fullMonthName: 'Julho 2026',
    interviewsCount: 11,
    negativesCount: 3,
    totalApplications: 28,
    netTraction: 8,
    interviewRatio: 78.6,
    interviewCompanies: ['Microsoft Americas', 'Amazon AWS', 'Nubank Tech', 'Itaú BBA', 'BTG Alpha', 'Stone Tech', 'PicPay Bank', 'TOTVS Cloud', 'XP Private', 'Ambev Global', 'Rede D\'Or'],
    negativeCompanies: ['Revolut', 'Coinbase', 'Canva'],
    isSimulated: true
  },
  {
    monthKey: '2026-08',
    monthLabel: 'Ago/26',
    fullMonthName: 'Agosto 2026',
    interviewsCount: 10,
    negativesCount: 2,
    totalApplications: 23,
    netTraction: 8,
    interviewRatio: 83.3,
    interviewCompanies: ['Google SP', 'Mercado Livre', 'Nubank', 'Stone Co.', 'Itaú Unibanco', 'Embraer Defesa', 'Natura &Co', 'Porto Seguro', 'SulAmérica', 'B3'],
    negativeCompanies: ['DoorDash', 'Airbnb'],
    isSimulated: true
  },
  {
    monthKey: '2026-09',
    monthLabel: 'Set/26',
    fullMonthName: 'Setembro 2026',
    interviewsCount: 12,
    negativesCount: 2,
    totalApplications: 26,
    netTraction: 10,
    interviewRatio: 85.7,
    interviewCompanies: ['Amazon Web Services', 'Nubank', 'Mercado Livre', 'Stone Co.', 'PicPay', 'Itaú Unibanco', 'XP Inc.', 'TOTVS', 'B3', 'BTG Pactual', 'QuintoAndar', 'Loggi'],
    negativeCompanies: ['Twilio', 'Hubspot'],
    isSimulated: true
  }
];

export const CareerInsights: React.FC<CareerInsightsProps> = ({
  applications,
  onAddSampleData
}) => {
  const { colors } = useContext(ThemeContext);

  // States
  const [chartMode, setChartMode] = useState<'grouped-bars' | 'area-trend' | 'net-traction'>('grouped-bars');
  const [timeframe, setTimeframe] = useState<number>(6); // 3, 6, 10 (all)
  const [forceBenchmark, setForceBenchmark] = useState<boolean>(false);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [showPdfModal, setShowPdfModal] = useState<boolean>(false);
  const [cvs] = useLocalStorage<CV[]>('cvs', []);
  const [showStrategyModal, setShowStrategyModal] = useState<boolean>(false);
  const [strategyAnalysis, setStrategyAnalysis] = useState<CareerStrategyAnalysisResult | null>(null);
  const [isAnalyzingStrategy, setIsAnalyzingStrategy] = useState<boolean>(false);

  const handleOpenStrategyAnalysis = async (forceRefresh = false) => {
    setShowStrategyModal(true);
    if (!strategyAnalysis || forceRefresh) {
      setIsAnalyzingStrategy(true);
      try {
        const result = await analyzeRejectionPatternsAndStrategy({
          monthlyData: displayData,
          applications,
          cvs,
          isBenchmark: isUsingBenchmark
        });
        setStrategyAnalysis(result);
      } catch (err) {
        console.error("Erro ao gerar análise de estratégia:", err);
      } finally {
        setIsAnalyzingStrategy(false);
      }
    }
  };

  // Check if user has sufficient data with interviews and/or negatives
  const hasUserActivity = useMemo(() => {
    if (applications.length < 2) return false;
    const hasInterviewsOrNegatives = applications.some(
      app => app.status === ApplicationStatus.Entrevistando || 
             app.status === ApplicationStatus.Oferta || 
             app.status === ApplicationStatus.Rejeitado ||
             Boolean(app.reminderDate)
    );
    return hasInterviewsOrNegatives;
  }, [applications]);

  // Aggregate user applications by month
  const realMonthlyMetrics = useMemo(() => {
    if (applications.length === 0) return [];

    const monthMap = new Map<string, {
      interviews: number;
      negatives: number;
      total: number;
      interviewCompanies: string[];
      negativeCompanies: string[];
      dateObj: Date;
    }>();

    const monthNamesPt = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const fullMonthNamesPt = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    applications.forEach(app => {
      let d: Date;
      try {
        d = new Date(app.dateApplied);
        if (isNaN(d.getTime())) d = new Date();
      } catch {
        d = new Date();
      }

      const year = d.getFullYear();
      const month = d.getMonth();
      const key = `${year}-${String(month + 1).padStart(2, '0')}`;

      if (!monthMap.has(key)) {
        monthMap.set(key, {
          interviews: 0,
          negatives: 0,
          total: 0,
          interviewCompanies: [],
          negativeCompanies: [],
          dateObj: new Date(year, month, 1)
        });
      }

      const entry = monthMap.get(key)!;
      entry.total++;

      // Scheduled interview counts: either status is Entrevistando, Oferta, or has reminderDate
      const isInterview = 
        app.status === ApplicationStatus.Entrevistando || 
        app.status === ApplicationStatus.Oferta ||
        (Boolean(app.reminderDate) && app.status !== ApplicationStatus.Rejeitado);

      const isNegative = app.status === ApplicationStatus.Rejeitado;

      if (isInterview) {
        entry.interviews++;
        if (app.companyName && !entry.interviewCompanies.includes(app.companyName)) {
          entry.interviewCompanies.push(app.companyName);
        }
      }

      if (isNegative) {
        entry.negatives++;
        if (app.companyName && !entry.negativeCompanies.includes(app.companyName)) {
          entry.negativeCompanies.push(app.companyName);
        }
      }
    });

    const sortedKeys = Array.from(monthMap.keys()).sort();

    return sortedKeys.map(key => {
      const item = monthMap.get(key)!;
      const mIdx = item.dateObj.getMonth();
      const yearShort = String(item.dateObj.getFullYear()).slice(2);
      const fullYear = item.dateObj.getFullYear();
      const monthLabel = `${monthNamesPt[mIdx]}/${yearShort}`;
      const fullMonthName = `${fullMonthNamesPt[mIdx]} ${fullYear}`;

      const totalResponses = item.interviews + item.negatives;
      const interviewRatio = totalResponses > 0
        ? Math.round((item.interviews / totalResponses) * 1000) / 10
        : 0;

      return {
        monthKey: key,
        monthLabel,
        fullMonthName,
        interviewsCount: item.interviews,
        negativesCount: item.negatives,
        totalApplications: item.total,
        netTraction: item.interviews - item.negatives,
        interviewRatio,
        interviewCompanies: item.interviewCompanies,
        negativeCompanies: item.negativeCompanies,
        isSimulated: false
      };
    });
  }, [applications]);

  // Determine whether to use real user data or benchmark data
  const isUsingBenchmark = forceBenchmark || !hasUserActivity || realMonthlyMetrics.length < 2;

  // Active dataset filtered by timeframe
  const displayData = useMemo(() => {
    const rawData = isUsingBenchmark ? BENCHMARK_CAREER_DATA : realMonthlyMetrics;
    if (timeframe >= rawData.length) return rawData;
    return rawData.slice(-timeframe);
  }, [isUsingBenchmark, realMonthlyMetrics, timeframe]);

  // Key KPI calculations across current dataset
  const kpiMetrics = useMemo(() => {
    const totalInterviews = displayData.reduce((acc, curr) => acc + curr.interviewsCount, 0);
    const totalNegatives = displayData.reduce((acc, curr) => acc + curr.negativesCount, 0);
    const totalResponses = totalInterviews + totalNegatives;
    
    // Overall success ratio
    const overallRatio = totalResponses > 0
      ? Math.round((totalInterviews / totalResponses) * 1000) / 10
      : 0;

    // Net traction
    const totalNetTraction = totalInterviews - totalNegatives;

    // Month-over-month evolution for interviews
    let momInterviewsChange = 0;
    if (displayData.length >= 2) {
      const current = displayData[displayData.length - 1].interviewsCount;
      const previous = displayData[displayData.length - 2].interviewsCount;
      momInterviewsChange = current - previous;
    }

    // Month-over-month evolution for negatives
    let momNegativesChange = 0;
    if (displayData.length >= 2) {
      const current = displayData[displayData.length - 1].negativesCount;
      const previous = displayData[displayData.length - 2].negativesCount;
      momNegativesChange = current - previous;
    }

    // Best month by interviews
    let bestMonth = displayData[0] || null;
    displayData.forEach(m => {
      if (m.interviewsCount > (bestMonth?.interviewsCount || 0)) {
        bestMonth = m;
      }
    });

    // Ratio text representation (e.g., 1 entrevista para cada X negativas)
    const ratioText = totalNegatives > 0 && totalInterviews > 0
      ? `1 : ${(totalNegatives / totalInterviews).toFixed(1)}`
      : totalInterviews > 0 ? '100% favorável' : 'Aguardando';

    return {
      totalInterviews,
      totalNegatives,
      totalResponses,
      overallRatio,
      totalNetTraction,
      momInterviewsChange,
      momNegativesChange,
      bestMonth,
      ratioText
    };
  }, [displayData]);

  // Selected month detail record
  const activeDetailRecord = useMemo(() => {
    if (!selectedMonth) return displayData[displayData.length - 1] || null;
    return displayData.find(d => d.monthKey === selectedMonth) || displayData[displayData.length - 1] || null;
  }, [selectedMonth, displayData]);

  // Strategic AI Diagnosis based on trends
  const diagnosis = useMemo(() => {
    const { totalInterviews, totalNegatives, overallRatio, momInterviewsChange, totalNetTraction } = kpiMetrics;

    if (totalInterviews === 0 && totalNegatives === 0) {
      return {
        headline: 'Início de Prospecção Ativa',
        badge: 'Fase de Entrada',
        tone: 'neutral',
        analysis: 'Seu funil ainda está sendo populado. Envie candidaturas personalizadas com o Gerador de Currículos Executivos e agende retornos para mensurar os primeiros índices de resposta.',
        recommendation: 'Cadastre suas primeiras candidaturas ou use os dados de benchmark para projetar sua meta mensal de 6 a 10 entrevistas.'
      };
    }

    if (overallRatio >= 60 || totalNetTraction > 0) {
      return {
        headline: 'Forte Tração de Mercado (Alta Conversão)',
        badge: 'Momento de Alta',
        tone: 'positive',
        analysis: `Excelente evolução! O volume de entrevistas agendadas (${totalInterviews}) supera com folga as negativas (${totalNegatives}), resultando em uma taxa positiva de ${overallRatio}%. Seu posicionamento e histórico profissional estão alinhados às exigências dos recrutadores.`,
        recommendation: 'Aproveite o momento positivo para negociar simultaneamente pacotes de remuneração e praticar no Simulador de Entrevistas com a Dra. Valéria para converter convocações em ofertas finais.'
      };
    }

    if (overallRatio >= 35) {
      return {
        headline: 'Ritmo Saudável com Espaço para Refinamento',
        badge: 'Equilíbrio Competitivo',
        tone: 'balanced',
        analysis: `Equilíbrio sustentável no funil: ${totalInterviews} entrevistas agendadas contra ${totalNegatives} negativas (${overallRatio}% de retorno positivo). Negativas nesta proporção são perfeitamente naturais em processos seletivos concorridos de média e alta senioridade.`,
        recommendation: 'Foque em tailoring cirúrgico no CV para cada vaga e amplie o networking direto no LinkedIn com decisores (Tech Leads e Headhunters).'
      };
    }

    return {
      headline: 'Ajuste Estratégico de Posicionamento Recomendado',
      badge: 'Otimização Necessária',
      tone: 'caution',
      analysis: `O volume de negativas (${totalNegatives}) está superando as entrevistas agendadas (${totalInterviews}). Isso costuma indicar desalinhamento de palavras-chave ATS, senioridade descasada da remuneração ou ausência de métricas quantitativas nas realizações do CV.`,
      recommendation: 'Utilize a ferramenta de Análise de Compatibilidade de Vagas para auditar a pontuação ATS antes de enviar novas candidaturas.'
    };
  }, [kpiMetrics]);

  // Colors for visualization
  const interviewColor = '#10b981'; // Emerald 500
  const negativeColor = '#ef4444';  // Red 500
  const netPositiveColor = '#059669'; // Emerald 600
  const netNegativeColor = '#f43f5e'; // Rose 500
  const ratioColor = '#881337';     // Executive Burgundy brand

  return (
    <div
      style={{
        backgroundColor: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: '14px',
        padding: '24px',
        marginBottom: '28px',
        boxShadow: colors.shadow || '0 4px 20px rgba(0, 0, 0, 0.05)',
        transition: 'all 0.2s ease',
      }}
    >
      {/* Header with Title and Global Actions */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '16px',
          paddingBottom: '20px',
          borderBottom: `1px solid ${colors.border}`,
          marginBottom: '22px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: colors.primaryLight || 'rgba(136, 19, 55, 0.08)',
                color: colors.primary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: `1px solid ${colors.border}`
              }}
            >
              <Compass style={{ width: '20px', height: '20px' }} />
            </div>
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: '20px',
                  fontWeight: 700,
                  color: colors.textPrimary,
                  letterSpacing: '-0.02em',
                }}
              >
                Insights de Carreira
              </h2>
            </div>
          </div>
          <p
            style={{
              margin: '2px 0 0 0',
              fontSize: '13.5px',
              color: colors.textSecondary,
              lineHeight: 1.4,
            }}
          >
            Evolução temporal das candidaturas: <strong>Entrevistas agendadas</strong> por mês versus <strong>negativas recebidas</strong>.
          </p>
        </div>

        {/* Action Controls: Chart Mode, Period, Benchmark Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          {/* Timeframe selector */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: colors.surfaceHover || '#f8fafc',
              border: `1px solid ${colors.border}`,
              borderRadius: '8px',
              padding: '2px',
            }}
          >
            {[
              { val: 3, label: '3M' },
              { val: 6, label: '6M' },
              { val: 12, label: '12M' }
            ].map(t => (
              <button
                key={t.val}
                type="button"
                onClick={() => setTimeframe(t.val)}
                style={{
                  padding: '5px 10px',
                  fontSize: '12px',
                  fontWeight: timeframe === t.val ? 600 : 500,
                  color: timeframe === t.val ? colors.textOnPrimary || '#ffffff' : colors.textSecondary,
                  backgroundColor: timeframe === t.val ? colors.primary : 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* View mode toggle */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: colors.surfaceHover || '#f8fafc',
              border: `1px solid ${colors.border}`,
              borderRadius: '8px',
              padding: '2px',
            }}
          >
            <button
              type="button"
              onClick={() => setChartMode('grouped-bars')}
              title="Comparativo em Barras Agrupadas"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 10px',
                fontSize: '12px',
                fontWeight: chartMode === 'grouped-bars' ? 600 : 500,
                color: chartMode === 'grouped-bars' ? colors.textOnPrimary || '#ffffff' : colors.textSecondary,
                backgroundColor: chartMode === 'grouped-bars' ? colors.primary : 'transparent',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <BarChart3 style={{ width: '13px', height: '13px' }} />
              <span>Barras</span>
            </button>
            <button
              type="button"
              onClick={() => setChartMode('area-trend')}
              title="Evolução Temporal em Linhas e Área"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 10px',
                fontSize: '12px',
                fontWeight: chartMode === 'area-trend' ? 600 : 500,
                color: chartMode === 'area-trend' ? colors.textOnPrimary || '#ffffff' : colors.textSecondary,
                backgroundColor: chartMode === 'area-trend' ? colors.primary : 'transparent',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <TrendingUp style={{ width: '13px', height: '13px' }} />
              <span>Tendência</span>
            </button>
            <button
              type="button"
              onClick={() => setChartMode('net-traction')}
              title="Saldo Líquido de Tração (Entrevistas - Negativas)"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 10px',
                fontSize: '12px',
                fontWeight: chartMode === 'net-traction' ? 600 : 500,
                color: chartMode === 'net-traction' ? colors.textOnPrimary || '#ffffff' : colors.textSecondary,
                backgroundColor: chartMode === 'net-traction' ? colors.primary : 'transparent',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <Activity style={{ width: '13px', height: '13px' }} />
              <span>Saldo Líquido</span>
            </button>
          </div>

          {/* Toggle Real vs Benchmark Data */}
          <button
            type="button"
            onClick={() => setForceBenchmark(!forceBenchmark)}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: isUsingBenchmark ? 'rgba(136, 19, 55, 0.08)' : colors.surfaceHover || '#f1f5f9',
              color: isUsingBenchmark ? colors.primary : colors.textSecondary,
              border: `1px solid ${isUsingBenchmark ? colors.primary : colors.border}`,
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Sparkles style={{ width: '13px', height: '13px' }} />
            <span>{isUsingBenchmark ? 'Benchmark Executivo Ativo' : 'Seus Dados Reais'}</span>
          </button>

          {/* Botão de Análise de Estratégia (IA) */}
          <button
            type="button"
            onClick={() => handleOpenStrategyAnalysis(false)}
            style={{
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#0284c7',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(2, 132, 199, 0.25)',
              transition: 'all 0.15s ease'
            }}
            title="Examinar com IA o padrão mensal de negativas e sugerir ajustes táticos no currículo ou foco das candidaturas"
          >
            <Sparkles style={{ width: '14px', height: '14px' }} />
            <span>Análise de Estratégia</span>
          </button>

          {/* Botão de Geração do PDF Resumo Mensal */}
          <button
            type="button"
            onClick={() => setShowPdfModal(true)}
            style={{
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: colors.primary,
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(136, 19, 55, 0.25)',
              transition: 'all 0.15s ease'
            }}
            title="Gerar PDF resumo mensal do desempenho de candidaturas (entrevistas vs negativas) para imprimir ou salvar"
          >
            <FileDown style={{ width: '14px', height: '14px' }} />
            <span>Gerar PDF Resumo Mensal</span>
          </button>
        </div>
      </div>

      {/* Info banner if benchmark is shown due to low real data */}
      {isUsingBenchmark && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
            padding: '10px 14px',
            backgroundColor: 'rgba(136, 19, 55, 0.04)',
            border: `1px solid ${colors.border}`,
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '13px',
            color: colors.textSecondary,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Info style={{ width: '15px', height: '15px', color: colors.primary, flexShrink: 0 }} />
            <span>
              {hasUserActivity
                ? 'Exibindo projeção comparativa de benchmark com histórico multi-mês. Clique em "Seus Dados Reais" para alternar.'
                : 'Você ainda possui poucas candidaturas com status de entrevista ou negativa. Exibindo benchmark analítico de referência.'}
            </span>
          </div>
          {onAddSampleData && (
            <button
              type="button"
              onClick={onAddSampleData}
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: colors.primary,
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Carregar dados de exemplo no painel
            </button>
          )}
        </div>
      )}

      {/* Executive KPI Metric Cards (Zero-Pill Discipline) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '14px',
          marginBottom: '24px'
        }}
      >
        {/* Card 1: Entrevistas Agendadas */}
        <div
          style={{
            padding: '16px 18px',
            backgroundColor: colors.surfaceHover || '#fafafa',
            border: `1px solid ${colors.border}`,
            borderRadius: '10px',
            position: 'relative'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Entrevistas Agendadas
            </span>
            <CheckCircle2 style={{ width: '16px', height: '16px', color: interviewColor }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '6px' }}>
            <span style={{ fontSize: '26px', fontWeight: 800, color: colors.textPrimary, letterSpacing: '-0.03em' }}>
              {kpiMetrics.totalInterviews}
            </span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: interviewColor, display: 'flex', alignItems: 'center' }}>
              {kpiMetrics.momInterviewsChange >= 0 ? (
                <>
                  <ArrowUpRight style={{ width: '14px', height: '14px' }} />
                  +{kpiMetrics.momInterviewsChange} MoM
                </>
              ) : (
                <>
                  <ArrowDownRight style={{ width: '14px', height: '14px' }} />
                  {kpiMetrics.momInterviewsChange} MoM
                </>
              )}
            </span>
          </div>
          <div style={{ fontSize: '12px', color: colors.textSecondary }}>
            Convocações registradas no período selecionado
          </div>
        </div>

        {/* Card 2: Negativas Recebidas */}
        <div
          style={{
            padding: '16px 18px',
            backgroundColor: colors.surfaceHover || '#fafafa',
            border: `1px solid ${colors.border}`,
            borderRadius: '10px',
            position: 'relative'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Negativas Recebidas
            </span>
            <XCircle style={{ width: '16px', height: '16px', color: negativeColor }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '6px' }}>
            <span style={{ fontSize: '26px', fontWeight: 800, color: colors.textPrimary, letterSpacing: '-0.03em' }}>
              {kpiMetrics.totalNegatives}
            </span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: colors.textSecondary, display: 'flex', alignItems: 'center' }}>
              {kpiMetrics.momNegativesChange <= 0 ? (
                <span style={{ color: interviewColor, display: 'flex', alignItems: 'center' }}>
                  <ArrowDownRight style={{ width: '14px', height: '14px' }} />
                  {kpiMetrics.momNegativesChange} MoM
                </span>
              ) : (
                <span style={{ color: negativeColor, display: 'flex', alignItems: 'center' }}>
                  <ArrowUpRight style={{ width: '14px', height: '14px' }} />
                  +{kpiMetrics.momNegativesChange} MoM
                </span>
              )}
            </span>
          </div>
          <div style={{ fontSize: '12px', color: colors.textSecondary }}>
            Retornos com descontinuidade ou encerramento
          </div>
        </div>

        {/* Card 3: Proporção Entrevistas / Negativas */}
        <div
          style={{
            padding: '16px 18px',
            backgroundColor: colors.surfaceHover || '#fafafa',
            border: `1px solid ${colors.border}`,
            borderRadius: '10px',
            position: 'relative'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Taxa de Resposta Favorável
            </span>
            <Award style={{ width: '16px', height: '16px', color: colors.primary }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '6px' }}>
            <span style={{ fontSize: '26px', fontWeight: 800, color: colors.primary, letterSpacing: '-0.03em' }}>
              {kpiMetrics.overallRatio}%
            </span>
            <span style={{ fontSize: '12px', color: colors.textSecondary }}>
              ({kpiMetrics.ratioText})
            </span>
          </div>
          <div style={{ fontSize: '12px', color: colors.textSecondary }}>
            Proporção de convocações sobre o total de respostas
          </div>
        </div>

        {/* Card 4: Tração Líquida */}
        <div
          style={{
            padding: '16px 18px',
            backgroundColor: colors.surfaceHover || '#fafafa',
            border: `1px solid ${colors.border}`,
            borderRadius: '10px',
            position: 'relative'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Saldo de Tração
            </span>
            <Flame style={{ width: '16px', height: '16px', color: kpiMetrics.totalNetTraction >= 0 ? netPositiveColor : netNegativeColor }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '6px' }}>
            <span
              style={{
                fontSize: '26px',
                fontWeight: 800,
                color: kpiMetrics.totalNetTraction >= 0 ? netPositiveColor : netNegativeColor,
                letterSpacing: '-0.03em'
              }}
            >
              {kpiMetrics.totalNetTraction > 0 ? `+${kpiMetrics.totalNetTraction}` : kpiMetrics.totalNetTraction}
            </span>
            <span style={{ fontSize: '12px', color: colors.textSecondary }}>
              {kpiMetrics.totalNetTraction >= 0 ? 'Diferencial Positivo' : 'Em Recuperação'}
            </span>
          </div>
          <div style={{ fontSize: '12px', color: colors.textSecondary }}>
            Diferença: Entrevistas agendadas menos negativas
          </div>
        </div>
      </div>

      {/* Main Recharts Chart Area */}
      <div
        style={{
          border: `1px solid ${colors.border}`,
          borderRadius: '12px',
          padding: '20px 16px 16px 16px',
          backgroundColor: colors.background || '#ffffff',
          marginBottom: '22px'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '16px',
            paddingBottom: '12px',
            borderBottom: `1px solid ${colors.border}`
          }}
        >
          <div>
            <span style={{ fontSize: '14px', fontWeight: 700, color: colors.textPrimary }}>
              {chartMode === 'grouped-bars' && 'Comparativo Mensal: Entrevistas Agendadas vs. Negativas'}
              {chartMode === 'area-trend' && 'Evolução Temporal e Trajetória de Tração'}
              {chartMode === 'net-traction' && 'Saldo Líquido de Tração Mensal (Entrevistas - Negativas)'}
            </span>
            <div style={{ fontSize: '12px', color: colors.textSecondary, marginTop: '2px' }}>
              Passe o mouse ou toque nos pontos para ver detalhes por mês e empresas
            </div>
          </div>

          {/* Legend indicators */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '12px', color: colors.textSecondary }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: interviewColor }}></span>
              <strong style={{ color: colors.textPrimary }}>Entrevistas Agendadas</strong>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: negativeColor }}></span>
              <strong style={{ color: colors.textPrimary }}>Negativas Recebidas</strong>
            </div>
            {chartMode === 'area-trend' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '14px', height: '2px', backgroundColor: ratioColor }}></span>
                <span>Taxa Favorável (%)</span>
              </div>
            )}
          </div>
        </div>

        {/* Chart Render */}
        <div style={{ width: '100%', height: '340px' }}>
          <ResponsiveContainer width="100%" height="100%">
            {chartMode === 'grouped-bars' ? (
              <BarChart
                data={displayData}
                margin={{ top: 15, right: 15, left: -15, bottom: 0 }}
                barGap={6}
                onClick={(e: any) => {
                  if (e && e.activePayload && e.activePayload.length > 0) {
                    const record = e.activePayload[0].payload as MonthlyCareerMetric;
                    setSelectedMonth(record.monthKey);
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={colors.border} opacity={0.6} />
                <XAxis
                  dataKey="monthLabel"
                  stroke={colors.textSecondary}
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: colors.border }}
                />
                <YAxis
                  stroke={colors.textSecondary}
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: colors.border }}
                  allowDecimals={false}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const data = payload[0].payload as MonthlyCareerMetric;
                    return (
                      <div
                        style={{
                          backgroundColor: colors.surface,
                          border: `1px solid ${colors.border}`,
                          borderRadius: '8px',
                          padding: '12px 14px',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                          fontSize: '12.5px',
                          minWidth: '220px'
                        }}
                      >
                        <div style={{ fontWeight: 700, color: colors.textPrimary, marginBottom: '8px', borderBottom: `1px solid ${colors.border}`, paddingBottom: '4px' }}>
                          {data.fullMonthName}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ color: interviewColor, fontWeight: 600 }}>Entrevistas Agendadas:</span>
                          <strong style={{ color: colors.textPrimary }}>{data.interviewsCount}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ color: negativeColor, fontWeight: 600 }}>Negativas Recebidas:</span>
                          <strong style={{ color: colors.textPrimary }}>{data.negativesCount}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span style={{ color: colors.textSecondary }}>Saldo Líquido:</span>
                          <strong style={{ color: data.netTraction >= 0 ? netPositiveColor : netNegativeColor }}>
                            {data.netTraction > 0 ? `+${data.netTraction}` : data.netTraction}
                          </strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: `1px dashed ${colors.border}`, paddingTop: '4px' }}>
                          <span style={{ color: colors.textSecondary }}>Taxa Favorável:</span>
                          <strong style={{ color: colors.primary }}>{data.interviewRatio}%</strong>
                        </div>
                        {data.interviewCompanies.length > 0 && (
                          <div style={{ marginTop: '8px', fontSize: '11px', color: colors.textSecondary, borderTop: `1px solid ${colors.border}`, paddingTop: '6px' }}>
                            <strong style={{ color: colors.textPrimary }}>Empresas com entrevista:</strong> {data.interviewCompanies.slice(0, 3).join(', ')}{data.interviewCompanies.length > 3 ? '...' : ''}
                          </div>
                        )}
                      </div>
                    );
                  }}
                />
                <Bar
                  dataKey="interviewsCount"
                  name="Entrevistas Agendadas"
                  fill={interviewColor}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={38}
                />
                <Bar
                  dataKey="negativesCount"
                  name="Negativas Recebidas"
                  fill={negativeColor}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={38}
                />
              </BarChart>
            ) : chartMode === 'area-trend' ? (
              <ComposedChart
                data={displayData}
                margin={{ top: 15, right: 15, left: -15, bottom: 0 }}
                onClick={(e: any) => {
                  if (e && e.activePayload && e.activePayload.length > 0) {
                    const record = e.activePayload[0].payload as MonthlyCareerMetric;
                    setSelectedMonth(record.monthKey);
                  }
                }}
              >
                <defs>
                  <linearGradient id="interviewGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={interviewColor} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={interviewColor} stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="negativeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={negativeColor} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={negativeColor} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={colors.border} opacity={0.6} />
                <XAxis
                  dataKey="monthLabel"
                  stroke={colors.textSecondary}
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: colors.border }}
                />
                <YAxis
                  yAxisId="left"
                  stroke={colors.textSecondary}
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: colors.border }}
                  allowDecimals={false}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[0, 100]}
                  stroke={ratioColor}
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: colors.border }}
                  unit="%"
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const data = payload[0].payload as MonthlyCareerMetric;
                    return (
                      <div
                        style={{
                          backgroundColor: colors.surface,
                          border: `1px solid ${colors.border}`,
                          borderRadius: '8px',
                          padding: '12px 14px',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                          fontSize: '12.5px',
                          minWidth: '220px'
                        }}
                      >
                        <div style={{ fontWeight: 700, color: colors.textPrimary, marginBottom: '8px', borderBottom: `1px solid ${colors.border}`, paddingBottom: '4px' }}>
                          {data.fullMonthName}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ color: interviewColor, fontWeight: 600 }}>Entrevistas:</span>
                          <strong style={{ color: colors.textPrimary }}>{data.interviewsCount}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ color: negativeColor, fontWeight: 600 }}>Negativas:</span>
                          <strong style={{ color: colors.textPrimary }}>{data.negativesCount}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: `1px dashed ${colors.border}`, paddingTop: '4px' }}>
                          <span style={{ color: ratioColor, fontWeight: 600 }}>Taxa Favorável:</span>
                          <strong style={{ color: ratioColor }}>{data.interviewRatio}%</strong>
                        </div>
                      </div>
                    );
                  }}
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="interviewsCount"
                  name="Entrevistas Agendadas"
                  stroke={interviewColor}
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#interviewGrad)"
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="negativesCount"
                  name="Negativas Recebidas"
                  stroke={negativeColor}
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  fillOpacity={1}
                  fill="url(#negativeGrad)"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="interviewRatio"
                  name="Taxa de Resposta Favorável (%)"
                  stroke={ratioColor}
                  strokeWidth={2}
                  dot={{ r: 3, fill: ratioColor }}
                />
              </ComposedChart>
            ) : (
              <BarChart
                data={displayData}
                margin={{ top: 15, right: 15, left: -15, bottom: 0 }}
                onClick={(e: any) => {
                  if (e && e.activePayload && e.activePayload.length > 0) {
                    const record = e.activePayload[0].payload as MonthlyCareerMetric;
                    setSelectedMonth(record.monthKey);
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={colors.border} opacity={0.6} />
                <XAxis
                  dataKey="monthLabel"
                  stroke={colors.textSecondary}
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: colors.border }}
                />
                <YAxis
                  stroke={colors.textSecondary}
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: colors.border }}
                  allowDecimals={false}
                />
                <ReferenceLine y={0} stroke={colors.border} strokeWidth={1.5} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const data = payload[0].payload as MonthlyCareerMetric;
                    return (
                      <div
                        style={{
                          backgroundColor: colors.surface,
                          border: `1px solid ${colors.border}`,
                          borderRadius: '8px',
                          padding: '12px 14px',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                          fontSize: '12.5px',
                          minWidth: '220px'
                        }}
                      >
                        <div style={{ fontWeight: 700, color: colors.textPrimary, marginBottom: '8px', borderBottom: `1px solid ${colors.border}`, paddingBottom: '4px' }}>
                          {data.fullMonthName}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ color: data.netTraction >= 0 ? netPositiveColor : netNegativeColor, fontWeight: 700 }}>
                            Saldo de Tração:
                          </span>
                          <strong style={{ color: data.netTraction >= 0 ? netPositiveColor : netNegativeColor }}>
                            {data.netTraction > 0 ? `+${data.netTraction}` : data.netTraction}
                          </strong>
                        </div>
                        <div style={{ fontSize: '11px', color: colors.textSecondary, marginTop: '4px' }}>
                          {data.interviewsCount} entrevistas vs {data.negativesCount} negativas
                        </div>
                      </div>
                    );
                  }}
                />
                <Bar
                  dataKey="netTraction"
                  name="Saldo de Tração"
                  fill={netPositiveColor}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={44}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Strategic Career Diagnostic Panel (Zero-Pill Discipline) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px',
          marginBottom: '20px'
        }}
      >
        {/* Box 1: Diagnóstico e Análise de Tendência */}
        <div
          style={{
            padding: '18px 20px',
            backgroundColor: colors.surfaceHover || '#f8fafc',
            border: `1px solid ${colors.border}`,
            borderRadius: '10px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Target style={{ width: '16px', height: '16px', color: colors.primary }} />
                <span style={{ fontSize: '14px', fontWeight: 700, color: colors.textPrimary }}>
                  Diagnóstico de Tração
                </span>
              </div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: diagnosis.tone === 'positive' ? netPositiveColor : diagnosis.tone === 'caution' ? negativeColor : colors.primary,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}
              >
                {diagnosis.badge}
              </span>
            </div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: colors.textPrimary, marginBottom: '6px' }}>
              {diagnosis.headline}
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: colors.textSecondary, lineHeight: 1.5 }}>
              {diagnosis.analysis}
            </p>
          </div>
        </div>

        {/* Box 2: Recomendação Tática Acionável */}
        <div
          style={{
            padding: '18px 20px',
            backgroundColor: colors.surfaceHover || '#f8fafc',
            border: `1px solid ${colors.border}`,
            borderRadius: '10px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Zap style={{ width: '16px', height: '16px', color: colors.primary }} />
              <span style={{ fontSize: '14px', fontWeight: 700, color: colors.textPrimary }}>
                Recomendação Executiva
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: colors.textSecondary, lineHeight: 1.5 }}>
              {diagnosis.recommendation}
            </p>
            <div style={{ marginTop: '10px' }}>
              <button
                type="button"
                onClick={() => handleOpenStrategyAnalysis(false)}
                style={{
                  padding: '6px 12px',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  color: colors.primary,
                  backgroundColor: 'rgba(136, 19, 55, 0.08)',
                  border: `1px solid ${colors.primary}`,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
              >
                <Sparkles style={{ width: '13px', height: '13px' }} />
                <span>Auditar Padrão de Negativas & Ajustes Táticos (IA)</span>
              </button>
            </div>
          </div>
          <div
            style={{
              marginTop: '12px',
              paddingTop: '10px',
              borderTop: `1px solid ${colors.border}`,
              fontSize: '11.5px',
              color: colors.textMuted || colors.textSecondary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <span>Mês de Maior Volume: <strong>{kpiMetrics.bestMonth?.fullMonthName || '-'}</strong> ({kpiMetrics.bestMonth?.interviewsCount || 0} entrevistas)</span>
          </div>
        </div>
      </div>

      {/* Month-by-Month Detailed Evolution Table / Selected Month Insight */}
      <div
        style={{
          border: `1px solid ${colors.border}`,
          borderRadius: '10px',
          overflow: 'hidden',
          backgroundColor: colors.surface
        }}
      >
        <div
          style={{
            padding: '12px 18px',
            backgroundColor: colors.surfaceHover || '#f8fafc',
            borderBottom: `1px solid ${colors.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar style={{ width: '15px', height: '15px', color: colors.primary }} />
            <span style={{ fontSize: '13px', fontWeight: 700, color: colors.textPrimary }}>
              Detalhamento Mês a Mês ({displayData.length} meses analisados)
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {activeDetailRecord && (
              <span style={{ fontSize: '12px', color: colors.textSecondary }}>
                Mês em foco: <strong style={{ color: colors.textPrimary }}>{activeDetailRecord.fullMonthName}</strong>
              </span>
            )}
            <button
              type="button"
              onClick={() => setShowPdfModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 10px',
                fontSize: '11.5px',
                fontWeight: 600,
                borderRadius: '6px',
                border: `1px solid ${colors.border}`,
                backgroundColor: colors.surface,
                color: colors.primary,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title="Gerar PDF resumo mensal do desempenho para imprimir ou salvar"
            >
              <FileDown style={{ width: '13px', height: '13px' }} />
              <span>Imprimir / Salvar PDF</span>
            </button>
          </div>
        </div>

        {/* Responsive Table of Months */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${colors.border}`, color: colors.textSecondary, fontSize: '12px' }}>
                <th style={{ padding: '10px 16px', fontWeight: 600 }}>Mês</th>
                <th style={{ padding: '10px 16px', fontWeight: 600 }}>Entrevistas</th>
                <th style={{ padding: '10px 16px', fontWeight: 600 }}>Negativas</th>
                <th style={{ padding: '10px 16px', fontWeight: 600 }}>Saldo Líquido</th>
                <th style={{ padding: '10px 16px', fontWeight: 600 }}>Taxa Favorável</th>
                <th style={{ padding: '10px 16px', fontWeight: 600 }}>Destaques / Empresas</th>
              </tr>
            </thead>
            <tbody>
              {displayData.map((m) => {
                const isSelected = selectedMonth === m.monthKey;
                return (
                  <tr
                    key={m.monthKey}
                    onClick={() => setSelectedMonth(m.monthKey)}
                    style={{
                      borderBottom: `1px solid ${colors.borderSubtle || colors.border}`,
                      backgroundColor: isSelected ? 'rgba(136, 19, 55, 0.05)' : 'transparent',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s'
                    }}
                  >
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: colors.textPrimary }}>
                      {m.monthLabel}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ color: interviewColor, fontWeight: 700 }}>
                        {m.interviewsCount}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ color: negativeColor, fontWeight: 600 }}>
                        {m.negativesCount}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          fontWeight: 700,
                          color: m.netTraction >= 0 ? netPositiveColor : netNegativeColor
                        }}
                      >
                        {m.netTraction > 0 ? `+${m.netTraction}` : m.netTraction}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontWeight: 600, color: colors.textPrimary }}>
                        {m.interviewRatio}%
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: colors.textSecondary, fontSize: '12px', maxWidth: '280px' }}>
                      {m.interviewCompanies && m.interviewCompanies.length > 0 ? (
                        <span>{m.interviewCompanies.slice(0, 3).join(', ')}{m.interviewCompanies.length > 3 ? ` (+${m.interviewCompanies.length - 3})` : ''}</span>
                      ) : (
                        <span style={{ color: colors.textMuted || '#94a3b8' }}>-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de PDF Resumo Mensal de Desempenho (Entrevistas vs Negativas) */}
      <MonthlyPerformancePdfModal
        isOpen={showPdfModal}
        onClose={() => setShowPdfModal(false)}
        colors={colors}
        monthlyData={displayData}
        kpiMetrics={kpiMetrics}
        diagnosis={diagnosis}
        timeframeMonths={timeframe}
        isBenchmarkData={isUsingBenchmark}
        applications={applications}
      />

      {/* Modal de Análise de Estratégia & Diagnóstico de Negativas (IA) */}
      <CareerStrategyAnalysisModal
        isOpen={showStrategyModal}
        onClose={() => setShowStrategyModal(false)}
        colors={colors}
        analysis={strategyAnalysis}
        isLoading={isAnalyzingStrategy}
        onRefresh={() => handleOpenStrategyAnalysis(true)}
      />
    </div>
  );
};

export default CareerInsights;
