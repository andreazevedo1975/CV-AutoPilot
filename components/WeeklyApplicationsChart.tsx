// components/WeeklyApplicationsChart.tsx - Gráfico comparativo semanal de Candidaturas vs Entrevistas
import React, { useState, useMemo, useContext } from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid, 
  ReferenceLine
} from 'recharts';
import { Application, ApplicationStatus } from '../types';
import { ThemeContext } from '../App';
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  CheckCircle2, 
  Send, 
  Award, 
  Sparkles, 
  Info, 
  ArrowUpRight,
  Filter
} from 'lucide-react';

interface WeeklyApplicationsChartProps {
  applications: Application[];
  onAddSampleData?: () => void;
}

export interface WeekMetric {
  weekKey: string;
  weekLabel: string;
  weekRange: string;
  startDate: Date;
  endDate: Date;
  applicationsCount: number;
  interviewsCount: number;
  conversionRate: number; // percentage (0 - 100)
  companiesApplied: string[];
  companiesInterviewing: string[];
  isCurrentWeek: boolean;
}

// Sample realistic benchmark history if user doesn't have enough recorded data
const DEMO_WEEKLY_DATA: WeekMetric[] = [
  {
    weekKey: 'W-7',
    weekLabel: 'Semana 1',
    weekRange: '04/Ago - 10/Ago',
    startDate: new Date('2026-08-04'),
    endDate: new Date('2026-08-10'),
    applicationsCount: 8,
    interviewsCount: 1,
    conversionRate: 12.5,
    companiesApplied: ['Nubank', 'Itaú Unibanco', 'Ambev', 'Mercado Livre', 'Stone', 'TOTVS', 'Loggi', 'QuintoAndar'],
    companiesInterviewing: ['Stone'],
    isCurrentWeek: false
  },
  {
    weekKey: 'W-6',
    weekLabel: 'Semana 2',
    weekRange: '11/Ago - 17/Ago',
    startDate: new Date('2026-08-11'),
    endDate: new Date('2026-08-17'),
    applicationsCount: 14,
    interviewsCount: 3,
    conversionRate: 21.4,
    companiesApplied: ['PicPay', 'BTG Pactual', 'Localiza', 'C&A', 'XP Inc', 'Raízen', 'Embraer', 'B3', 'Votorantim', 'Magazine Luiza'],
    companiesInterviewing: ['PicPay', 'XP Inc', 'BTG Pactual'],
    isCurrentWeek: false
  },
  {
    weekKey: 'W-5',
    weekLabel: 'Semana 3',
    weekRange: '18/Ago - 24/Ago',
    startDate: new Date('2026-08-18'),
    endDate: new Date('2026-08-24'),
    applicationsCount: 12,
    interviewsCount: 2,
    conversionRate: 16.7,
    companiesApplied: ['Gerdau', 'Suzano', 'Klabin', 'Natura &Co', 'Rede D\'Or', 'SulAmérica', 'Porto Seguro', 'Carrefour'],
    companiesInterviewing: ['Natura &Co', 'SulAmérica'],
    isCurrentWeek: false
  },
  {
    weekKey: 'W-4',
    weekLabel: 'Semana 4',
    weekRange: '25/Ago - 31/Ago',
    startDate: new Date('2026-08-25'),
    endDate: new Date('2026-08-31'),
    applicationsCount: 19,
    interviewsCount: 5,
    conversionRate: 26.3,
    companiesApplied: ['Amazon Brasil', 'Google SP', 'Microsoft', 'Oracle', 'SAP', 'Cisco', 'Dell', 'IBM Brasil', 'Accenture'],
    companiesInterviewing: ['Amazon Brasil', 'Microsoft', 'Accenture', 'Google SP', 'Oracle'],
    isCurrentWeek: false
  },
  {
    weekKey: 'W-3',
    weekLabel: 'Semana 5',
    weekRange: '01/Set - 07/Set',
    startDate: new Date('2026-09-01'),
    endDate: new Date('2026-09-07'),
    applicationsCount: 15,
    interviewsCount: 4,
    conversionRate: 26.7,
    companiesApplied: ['Banco Inter', 'C6 Bank', 'Neon', 'Creditas', 'PagBank', 'Ebanx', 'Wildlife Studios'],
    companiesInterviewing: ['Banco Inter', 'Creditas', 'C6 Bank', 'Ebanx'],
    isCurrentWeek: false
  },
  {
    weekKey: 'W-2',
    weekLabel: 'Semana 6',
    weekRange: '08/Set - 14/Set',
    startDate: new Date('2026-09-08'),
    endDate: new Date('2026-09-14'),
    applicationsCount: 22,
    interviewsCount: 6,
    conversionRate: 27.3,
    companiesApplied: ['Bradesco', 'Santander', 'Claro', 'Vivo', 'TIM', 'Oi Fibra', 'Algar Telecom', 'Globo', 'SBT'],
    companiesInterviewing: ['Bradesco', 'Santander', 'Vivo', 'Globo', 'Claro', 'TIM'],
    isCurrentWeek: false
  },
  {
    weekKey: 'W-1',
    weekLabel: 'Semana 7',
    weekRange: '15/Set - 21/Set',
    startDate: new Date('2026-09-15'),
    endDate: new Date('2026-09-21'),
    applicationsCount: 18,
    interviewsCount: 5,
    conversionRate: 27.8,
    companiesApplied: ['Cosan', 'Ultrapar', 'Rumo', 'CCR', 'Ecorodovias', 'Santos Brasil', 'JBS', 'BRF', 'Marfrig'],
    companiesInterviewing: ['Cosan', 'Rumo', 'CCR', 'JBS', 'Ultrapar'],
    isCurrentWeek: false
  },
  {
    weekKey: 'W-0',
    weekLabel: 'Semana Atual',
    weekRange: '22/Set - 28/Set',
    startDate: new Date('2026-09-22'),
    endDate: new Date('2026-09-28'),
    applicationsCount: 11,
    interviewsCount: 3,
    conversionRate: 27.3,
    companiesApplied: ['Shopee', 'Shein', 'Mercado Livre', 'Magalu', 'B2W Digital', 'Enjoei'],
    companiesInterviewing: ['Shopee', 'Mercado Livre', 'Magalu'],
    isCurrentWeek: true
  }
];

// Helper to get start of week (Monday)
function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDateShort(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const month = monthNames[date.getMonth()];
  return `${day}/${month}`;
}

export const WeeklyApplicationsChart: React.FC<WeeklyApplicationsChartProps> = ({
  applications,
  onAddSampleData
}) => {
  const { colors, theme } = useContext(ThemeContext);
  const isDark = theme === 'dark';

  const [timeRangeWeeks, setTimeRangeWeeks] = useState<number>(8); // 4, 8, or 12 weeks
  const [useDemoMode, setUseDemoMode] = useState<boolean>(false);

  // Group user applications by week
  const computedUserWeeklyData = useMemo<WeekMetric[]>(() => {
    if (!applications || applications.length === 0) return [];

    const now = new Date();
    const currentMonday = getMonday(now);

    // Build week slots from oldest needed up to current Monday
    const slots: WeekMetric[] = [];
    for (let i = timeRangeWeeks - 1; i >= 0; i--) {
      const weekStart = new Date(currentMonday);
      weekStart.setDate(weekStart.getDate() - i * 7);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      const isCurrent = i === 0;
      const weekLabel = isCurrent 
        ? 'Semana Atual' 
        : `Semana -${i}`;
      
      const weekRange = `${formatDateShort(weekStart)} - ${formatDateShort(weekEnd)}`;

      slots.push({
        weekKey: `W-${i}`,
        weekLabel,
        weekRange,
        startDate: weekStart,
        endDate: weekEnd,
        applicationsCount: 0,
        interviewsCount: 0,
        conversionRate: 0,
        companiesApplied: [],
        companiesInterviewing: [],
        isCurrentWeek: isCurrent
      });
    }

    // Populate counts
    applications.forEach(app => {
      const appDate = app.dateApplied ? new Date(app.dateApplied) : null;
      if (!appDate || isNaN(appDate.getTime())) return;

      // Find matching slot for application submission
      const appSlot = slots.find(slot => appDate >= slot.startDate && appDate <= slot.endDate);
      if (appSlot) {
        appSlot.applicationsCount++;
        if (app.companyName && !appSlot.companiesApplied.includes(app.companyName)) {
          appSlot.companiesApplied.push(app.companyName);
        }
      }

      // Check if interview scheduled
      const isInterview = 
        app.status === ApplicationStatus.Entrevistando || 
        app.status === ApplicationStatus.Oferta || 
        !!app.reminderDate;

      if (isInterview) {
        // If there's an explicit reminder/interview date, slot it there, otherwise use application week
        const interviewDate = app.reminderDate ? new Date(app.reminderDate) : appDate;
        const interviewSlot = slots.find(slot => interviewDate >= slot.startDate && interviewDate <= slot.endDate);
        if (interviewSlot) {
          interviewSlot.interviewsCount++;
          if (app.companyName && !interviewSlot.companiesInterviewing.includes(app.companyName)) {
            interviewSlot.companiesInterviewing.push(app.companyName);
          }
        } else if (appSlot) {
          appSlot.interviewsCount++;
          if (app.companyName && !appSlot.companiesInterviewing.includes(app.companyName)) {
            appSlot.companiesInterviewing.push(app.companyName);
          }
        }
      }
    });

    // Compute conversion rates
    slots.forEach(slot => {
      slot.conversionRate = slot.applicationsCount > 0 
        ? Math.round((slot.interviewsCount / slot.applicationsCount) * 1000) / 10 
        : 0;
    });

    return slots;
  }, [applications, timeRangeWeeks]);

  // Determine if we should show demo benchmark data or user data
  const hasRealData = applications && applications.length > 0;
  const isShowingDemo = useDemoMode || !hasRealData;

  const activeChartData = useMemo(() => {
    if (isShowingDemo) {
      return DEMO_WEEKLY_DATA.slice(-timeRangeWeeks);
    }
    return computedUserWeeklyData;
  }, [isShowingDemo, timeRangeWeeks, computedUserWeeklyData]);

  // Aggregate Metrics
  const totalApplications = activeChartData.reduce((acc, curr) => acc + curr.applicationsCount, 0);
  const totalInterviews = activeChartData.reduce((acc, curr) => acc + curr.interviewsCount, 0);
  const overallConversion = totalApplications > 0 
    ? ((totalInterviews / totalApplications) * 100).toFixed(1) 
    : '0';

  const bestWeek = [...activeChartData].sort((a, b) => b.conversionRate - a.conversionRate)[0];
  const weeklyAverageApplied = activeChartData.length > 0 
    ? (totalApplications / activeChartData.length).toFixed(1) 
    : '0';

  // Palette styling conforming to app design
  const applicationsColor = isDark ? '#be123c' : '#881337'; // Burgundy / Vinho Nobre
  const interviewsColor = isDark ? '#10b981' : '#059669';   // Esmeralda Corporativo

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as WeekMetric;
      return (
        <div 
          className="p-4 rounded-xl shadow-2xl border text-xs space-y-2 min-w-[240px] backdrop-blur-md"
          style={{ 
            backgroundColor: isDark ? 'rgba(18, 15, 20, 0.95)' : 'rgba(255, 255, 255, 0.98)',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.12)',
            color: colors.textPrimary 
          }}
        >
          <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: colors.border }}>
            <span className="font-bold text-sm flex items-center gap-1.5">
              <Calendar size={14} className="text-rose-500" />
              {data.weekLabel}
            </span>
            <span className="text-[11px] font-mono opacity-80" style={{ color: colors.textSecondary }}>
              {data.weekRange}
            </span>
          </div>

          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-medium" style={{ color: applicationsColor }}>
                <Send size={12} />
                Candidaturas Enviadas:
              </span>
              <span className="font-mono font-bold text-sm">{data.applicationsCount}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-medium" style={{ color: interviewsColor }}>
                <CheckCircle2 size={12} />
                Entrevistas Agendadas:
              </span>
              <span className="font-mono font-bold text-sm text-emerald-500">{data.interviewsCount}</span>
            </div>

            <div className="flex items-center justify-between pt-1 border-t" style={{ borderColor: colors.border }}>
              <span className="text-neutral-500 font-medium flex items-center gap-1">
                <TrendingUp size={12} />
                Taxa de Conversão:
              </span>
              <span className={`font-mono font-black ${data.conversionRate >= 20 ? 'text-emerald-500' : 'text-amber-500'}`}>
                {data.conversionRate}%
              </span>
            </div>
          </div>

          {data.companiesInterviewing && data.companiesInterviewing.length > 0 && (
            <div className="pt-2 border-t text-[11px]" style={{ borderColor: colors.border }}>
              <span className="font-bold block opacity-75 mb-1" style={{ color: colors.textSecondary }}>
                Empresas com Entrevista:
              </span>
              <div className="flex flex-wrap gap-1">
                {data.companiesInterviewing.map((comp, idx) => (
                  <span 
                    key={idx} 
                    className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-medium"
                  >
                    {comp}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div 
      className="p-5 md:p-6 rounded-2xl border transition-all shadow-sm my-6"
      style={{ 
        backgroundColor: colors.surface, 
        borderColor: colors.border 
      }}
    >
      {/* Header with Title & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b" style={{ borderColor: colors.border }}>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
              <BarChart3 size={20} />
            </div>
            <h3 className="text-lg md:text-xl font-black tracking-tight" style={{ color: colors.textPrimary }}>
              Candidaturas Enviadas vs. Entrevistas Agendadas
            </h3>
            {isShowingDemo && (
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1">
                <Sparkles size={11} /> Benchmark / Demonstração
              </span>
            )}
            {!isShowingDemo && (
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 size={11} /> Dados Reais do Seu Painel
              </span>
            )}
          </div>
          <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>
            Acompanhe o funil de conversão semanal e o impacto de cada currículo customizado nas suas convocações de RH.
          </p>
        </div>

        {/* View Options */}
        <div className="flex items-center gap-2 flex-wrap">
          {hasRealData && (
            <button
              onClick={() => setUseDemoMode(!useDemoMode)}
              className="text-xs px-3 py-1.5 rounded-xl border font-semibold transition-all hover:opacity-90"
              style={{ 
                backgroundColor: useDemoMode ? colors.primary : colors.surfaceHover || colors.background,
                borderColor: colors.border,
                color: useDemoMode ? '#ffffff' : colors.textPrimary
              }}
              title="Alternar entre seus dados reais e o histórico benchmark"
            >
              {useDemoMode ? 'Ver Meus Dados Reais' : 'Ver Benchmark de Exemplo'}
            </button>
          )}

          {/* Timeframe Filter Selector */}
          <div className="flex items-center rounded-xl p-1 border" style={{ backgroundColor: colors.background, borderColor: colors.border }}>
            {[
              { label: '4 Sem', value: 4 },
              { label: '8 Sem', value: 8 },
              { label: '12 Sem', value: 12 }
            ].map(tf => (
              <button
                key={tf.value}
                onClick={() => setTimeRangeWeeks(tf.value)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  timeRangeWeeks === tf.value 
                    ? 'shadow-xs text-white' 
                    : 'opacity-70 hover:opacity-100'
                }`}
                style={{
                  backgroundColor: timeRangeWeeks === tf.value ? (colors.primary || '#881337') : 'transparent',
                  color: timeRangeWeeks === tf.value ? '#ffffff' : colors.textSecondary
                }}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5">
        {/* KPI 1: Candidaturas */}
        <div 
          className="p-3.5 rounded-xl border relative overflow-hidden"
          style={{ backgroundColor: colors.surfaceHover || colors.background, borderColor: colors.border }}
        >
          <div className="flex items-center justify-between text-xs font-semibold mb-1" style={{ color: colors.textSecondary }}>
            <span>Total Candidaturas</span>
            <Send size={13} style={{ color: applicationsColor }} />
          </div>
          <div className="text-2xl font-black font-mono" style={{ color: colors.textPrimary }}>
            {totalApplications}
          </div>
          <div className="text-[10px] mt-1 opacity-75" style={{ color: colors.textSecondary }}>
            Média: ~{weeklyAverageApplied} / semana
          </div>
          <div 
            className="absolute bottom-0 left-0 right-0 h-1" 
            style={{ backgroundColor: applicationsColor }}
          />
        </div>

        {/* KPI 2: Entrevistas */}
        <div 
          className="p-3.5 rounded-xl border relative overflow-hidden"
          style={{ backgroundColor: colors.surfaceHover || colors.background, borderColor: colors.border }}
        >
          <div className="flex items-center justify-between text-xs font-semibold mb-1" style={{ color: colors.textSecondary }}>
            <span>Entrevistas Agendadas</span>
            <CheckCircle2 size={13} style={{ color: interviewsColor }} />
          </div>
          <div className="text-2xl font-black font-mono text-emerald-500">
            {totalInterviews}
          </div>
          <div className="text-[10px] mt-1 opacity-75" style={{ color: colors.textSecondary }}>
            Convocações confirmadas
          </div>
          <div 
            className="absolute bottom-0 left-0 right-0 h-1" 
            style={{ backgroundColor: interviewsColor }}
          />
        </div>

        {/* KPI 3: Taxa de Conversão Geral */}
        <div 
          className="p-3.5 rounded-xl border relative overflow-hidden"
          style={{ backgroundColor: colors.surfaceHover || colors.background, borderColor: colors.border }}
        >
          <div className="flex items-center justify-between text-xs font-semibold mb-1" style={{ color: colors.textSecondary }}>
            <span>Taxa de Conversão</span>
            <TrendingUp size={13} className="text-rose-500" />
          </div>
          <div className="text-2xl font-black font-mono" style={{ color: colors.primary }}>
            {overallConversion}%
          </div>
          <div className="text-[10px] mt-1 opacity-75" style={{ color: colors.textSecondary }}>
            Média de mercado: ~15% - 20%
          </div>
          <div 
            className="absolute bottom-0 left-0 right-0 h-1 bg-rose-500"
          />
        </div>

        {/* KPI 4: Melhor Semana */}
        <div 
          className="p-3.5 rounded-xl border relative overflow-hidden"
          style={{ backgroundColor: colors.surfaceHover || colors.background, borderColor: colors.border }}
        >
          <div className="flex items-center justify-between text-xs font-semibold mb-1" style={{ color: colors.textSecondary }}>
            <span>Melhor Desempenho</span>
            <Award size={13} className="text-amber-500" />
          </div>
          <div className="text-lg font-black truncate" style={{ color: colors.textPrimary }}>
            {bestWeek ? `${bestWeek.conversionRate}%` : '0%'}
          </div>
          <div className="text-[10px] mt-1 opacity-75 truncate" style={{ color: colors.textSecondary }}>
            {bestWeek ? `${bestWeek.weekLabel} (${bestWeek.interviewsCount} convocações)` : 'Sem dados'}
          </div>
          <div 
            className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500"
          />
        </div>
      </div>

      {/* Main Bar Chart */}
      <div className="w-full h-[320px] md:h-[360px] pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={activeChartData}
            margin={{ top: 20, right: 15, left: -10, bottom: 25 }}
            barGap={6}
            barCategoryGap="25%"
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              vertical={false} 
              stroke={isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'} 
            />
            <XAxis 
              dataKey="weekLabel" 
              tickLine={false} 
              axisLine={{ stroke: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)' }}
              tick={{ 
                fill: isDark ? '#a89ea4' : '#6b7280', 
                fontSize: 11, 
                fontWeight: 600 
              }}
              dy={10}
            />
            <YAxis 
              tickLine={false} 
              axisLine={false}
              tick={{ 
                fill: isDark ? '#a89ea4' : '#6b7280', 
                fontSize: 11,
                fontFamily: 'monospace'
              }}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="top" 
              align="right"
              wrapperStyle={{ paddingBottom: '16px', fontSize: '12px', fontWeight: 600 }}
              formatter={(value) => {
                if (value === 'applicationsCount') return 'Candidaturas Enviadas';
                if (value === 'interviewsCount') return 'Entrevistas Agendadas';
                return value;
              }}
            />
            
            {/* Bars */}
            <Bar 
              dataKey="applicationsCount" 
              name="applicationsCount"
              fill={applicationsColor} 
              radius={[6, 6, 0, 0]}
              maxBarSize={38}
            />
            <Bar 
              dataKey="interviewsCount" 
              name="interviewsCount"
              fill={interviewsColor} 
              radius={[6, 6, 0, 0]}
              maxBarSize={38}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Footer Info & Insights */}
      <div 
        className="mt-4 pt-3 border-t flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
        style={{ borderColor: colors.border, color: colors.textSecondary }}
      >
        <div className="flex items-center gap-2">
          <Info size={14} className="text-emerald-500 shrink-0" />
          <span>
            <strong>Dica de Carreira:</strong> Candidaturas alinhadas com as palavras-chave do <em>Analista de Vagas</em> elevam a taxa de agendamento de entrevistas em até <strong>3.2x</strong>.
          </span>
        </div>

        {isShowingDemo && !hasRealData && onAddSampleData && (
          <button
            onClick={onAddSampleData}
            className="text-xs px-3 py-1.5 rounded-xl font-bold text-white bg-rose-700 hover:bg-rose-600 transition-all flex items-center gap-1.5 shrink-0 shadow-xs"
          >
            <Sparkles size={12} />
            <span>Preencher Candidaturas de Teste</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default WeeklyApplicationsChart;
