// components/DashboardComparativeCharts.tsx - Gráficos comparativos com Recharts
import React, { useState, useMemo, useContext } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Bar,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Area,
  AreaChart,
} from 'recharts';
import { Application, ApplicationStatus } from '../types';
import { ThemeContext } from '../ThemeContext';
import {
  TrendingUp,
  PieChart as PieChartIcon,
  BarChart3,
  Award,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowUpRight,
  Filter,
  Sparkles,
  Info,
} from 'lucide-react';

interface DashboardComparativeChartsProps {
  applications: Application[];
  onAddSampleData?: () => void;
}

interface MonthlyMetric {
  monthKey: string;     // YYYY-MM
  monthLabel: string;   // Jan/26, Fev/26, etc.
  totalApplications: number;
  viewedCount: number;
  interviewsCount: number;
  offersCount: number;
  rejectedCount: number;
  ghostingCount: number;
  successRate: number;      // (interviews + offers) / total * 100
  offerSuccessRate: number; // offers / total * 100
}

// 12 Months benchmark sample data for comparison when user data is empty or starting out
const SAMPLE_MONTHLY_DATA: MonthlyMetric[] = [
  { monthKey: '2025-10', monthLabel: 'Out/25', totalApplications: 12, viewedCount: 4, interviewsCount: 2, offersCount: 0, rejectedCount: 5, ghostingCount: 1, successRate: 16.7, offerSuccessRate: 0 },
  { monthKey: '2025-11', monthLabel: 'Nov/25', totalApplications: 18, viewedCount: 7, interviewsCount: 3, offersCount: 0, rejectedCount: 6, ghostingCount: 2, successRate: 16.7, offerSuccessRate: 0 },
  { monthKey: '2025-12', monthLabel: 'Dez/25', totalApplications: 14, viewedCount: 5, interviewsCount: 2, offersCount: 1, rejectedCount: 4, ghostingCount: 2, successRate: 21.4, offerSuccessRate: 7.1 },
  { monthKey: '2026-01', monthLabel: 'Jan/26', totalApplications: 24, viewedCount: 10, interviewsCount: 5, offersCount: 1, rejectedCount: 6, ghostingCount: 2, successRate: 25.0, offerSuccessRate: 4.2 },
  { monthKey: '2026-02', monthLabel: 'Fev/26', totalApplications: 20, viewedCount: 8, interviewsCount: 4, offersCount: 1, rejectedCount: 5, ghostingCount: 2, successRate: 25.0, offerSuccessRate: 5.0 },
  { monthKey: '2026-03', monthLabel: 'Mar/26', totalApplications: 28, viewedCount: 12, interviewsCount: 7, offersCount: 2, rejectedCount: 5, ghostingCount: 2, successRate: 32.1, offerSuccessRate: 7.1 },
  { monthKey: '2026-04', monthLabel: 'Abr/26', totalApplications: 22, viewedCount: 9, interviewsCount: 6, offersCount: 1, rejectedCount: 4, ghostingCount: 2, successRate: 31.8, offerSuccessRate: 4.5 },
  { monthKey: '2026-05', monthLabel: 'Mai/26', totalApplications: 30, viewedCount: 14, interviewsCount: 9, offersCount: 3, rejectedCount: 3, ghostingCount: 1, successRate: 40.0, offerSuccessRate: 10.0 },
  { monthKey: '2026-06', monthLabel: 'Jun/26', totalApplications: 26, viewedCount: 11, interviewsCount: 8, offersCount: 2, rejectedCount: 4, ghostingCount: 1, successRate: 38.5, offerSuccessRate: 7.7 },
  { monthKey: '2026-07', monthLabel: 'Jul/26', totalApplications: 34, viewedCount: 16, interviewsCount: 12, offersCount: 4, rejectedCount: 2, ghostingCount: 0, successRate: 47.1, offerSuccessRate: 11.8 },
  { monthKey: '2026-08', monthLabel: 'Ago/26', totalApplications: 32, viewedCount: 15, interviewsCount: 11, offersCount: 3, rejectedCount: 2, ghostingCount: 1, successRate: 43.8, offerSuccessRate: 9.4 },
  { monthKey: '2026-09', monthLabel: 'Set/26', totalApplications: 25, viewedCount: 11, interviewsCount: 9, offersCount: 3, rejectedCount: 1, ghostingCount: 1, successRate: 48.0, offerSuccessRate: 12.0 },
];

export const DashboardComparativeCharts: React.FC<DashboardComparativeChartsProps> = ({
  applications,
  onAddSampleData,
}) => {
  const { colors } = useContext(ThemeContext);

  // View modes
  const [useBenchmarkComparison, setUseBenchmarkComparison] = useState(applications.length < 3);
  const [successMetricMode, setSuccessMetricMode] = useState<'overall' | 'offers'>('overall');
  const [statusChartType, setStatusChartType] = useState<'donut' | 'bars'>('donut');
  const [timeframeMonths, setTimeframeMonths] = useState<number>(6); // 6 or 12

  // Distinct status palette
  const statusPalette: Record<ApplicationStatus, { color: string; label: string }> = {
    [ApplicationStatus.Aplicou]: { color: '#3b82f6', label: 'Candidatou-se' },
    [ApplicationStatus.Visualizado]: { color: '#8b5cf6', label: 'Visualizado' },
    [ApplicationStatus.Entrevistando]: { color: '#10b981', label: 'Em Entrevista' },
    [ApplicationStatus.Oferta]: { color: '#f59e0b', label: 'Oferta Recebida' },
    [ApplicationStatus.Rejeitado]: { color: '#ef4444', label: 'Rejeitado' },
    [ApplicationStatus.Ignorado]: { color: '#6b7280', label: 'Ignorado (Ghosting)' },
  };

  // Month names in Portuguese
  const monthNamesPt = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  // Process user's actual applications grouped by Month
  const realMonthlyMetrics = useMemo(() => {
    if (applications.length === 0) return [];

    const map = new Map<string, {
      total: number;
      viewed: number;
      interviews: number;
      offers: number;
      rejected: number;
      ghosting: number;
      dateObj: Date;
    }>();

    applications.forEach(app => {
      let date: Date;
      try {
        date = new Date(app.dateApplied);
        if (isNaN(date.getTime())) date = new Date();
      } catch {
        date = new Date();
      }

      const year = date.getFullYear();
      const month = date.getMonth();
      const key = `${year}-${String(month + 1).padStart(2, '0')}`;

      if (!map.has(key)) {
        map.set(key, {
          total: 0,
          viewed: 0,
          interviews: 0,
          offers: 0,
          rejected: 0,
          ghosting: 0,
          dateObj: new Date(year, month, 1),
        });
      }

      const entry = map.get(key)!;
      entry.total++;

      switch (app.status) {
        case ApplicationStatus.Visualizado:
          entry.viewed++;
          break;
        case ApplicationStatus.Entrevistando:
          entry.interviews++;
          break;
        case ApplicationStatus.Oferta:
          entry.offers++;
          break;
        case ApplicationStatus.Rejeitado:
          entry.rejected++;
          break;
        case ApplicationStatus.Ignorado:
          entry.ghosting++;
          break;
        default:
          break;
      }
    });

    // Sort chronologically
    const sortedKeys = Array.from(map.keys()).sort();
    return sortedKeys.map(key => {
      const item = map.get(key)!;
      const monthIdx = item.dateObj.getMonth();
      const yearShort = String(item.dateObj.getFullYear()).slice(2);
      const monthLabel = `${monthNamesPt[monthIdx]}/${yearShort}`;

      const successRate = item.total > 0
        ? Math.round(((item.interviews + item.offers) / item.total) * 1000) / 10
        : 0;

      const offerSuccessRate = item.total > 0
        ? Math.round((item.offers / item.total) * 1000) / 10
        : 0;

      return {
        monthKey: key,
        monthLabel,
        totalApplications: item.total,
        viewedCount: item.viewed,
        interviewsCount: item.interviews,
        offersCount: item.offers,
        rejectedCount: item.rejected,
        ghostingCount: item.ghosting,
        successRate,
        offerSuccessRate,
      };
    });
  }, [applications]);

  // Determine active monthly dataset
  const activeMonthlyData = useMemo(() => {
    const baseData = useBenchmarkComparison || realMonthlyMetrics.length < 2
      ? SAMPLE_MONTHLY_DATA
      : realMonthlyMetrics;

    return baseData.slice(-timeframeMonths);
  }, [useBenchmarkComparison, realMonthlyMetrics, timeframeMonths]);

  // Overall statistics for KPI cards
  const stats = useMemo(() => {
    const data = activeMonthlyData;
    const totalApps = data.reduce((acc, curr) => acc + curr.totalApplications, 0);
    const totalInterviews = data.reduce((acc, curr) => acc + curr.interviewsCount, 0);
    const totalOffers = data.reduce((acc, curr) => acc + curr.offersCount, 0);

    const avgSuccessRate = totalApps > 0
      ? Math.round(((totalInterviews + totalOffers) / totalApps) * 1000) / 10
      : 0;

    const avgOfferRate = totalApps > 0
      ? Math.round((totalOffers / totalApps) * 1000) / 10
      : 0;

    // Best performing month
    let bestMonth = data[0] || null;
    data.forEach(m => {
      if (m.successRate > (bestMonth?.successRate || 0)) {
        bestMonth = m;
      }
    });

    // Month-over-month variation
    const lastMonth = data[data.length - 1];
    const prevMonth = data[data.length - 2];
    const momChange = lastMonth && prevMonth && prevMonth.successRate > 0
      ? Math.round((lastMonth.successRate - prevMonth.successRate) * 10) / 10
      : 0;

    return {
      totalApps,
      totalInterviews,
      totalOffers,
      avgSuccessRate,
      avgOfferRate,
      bestMonth,
      momChange,
    };
  }, [activeMonthlyData]);

  // Distribution of Job Application Statuses
  const statusDistributionData = useMemo(() => {
    // Counts for current applications
    const counts: Record<ApplicationStatus, number> = {
      [ApplicationStatus.Aplicou]: 0,
      [ApplicationStatus.Visualizado]: 0,
      [ApplicationStatus.Entrevistando]: 0,
      [ApplicationStatus.Oferta]: 0,
      [ApplicationStatus.Rejeitado]: 0,
      [ApplicationStatus.Ignorado]: 0,
    };

    if (applications.length > 0) {
      applications.forEach(app => {
        if (counts[app.status] !== undefined) {
          counts[app.status]++;
        }
      });
    } else {
      // Benchmark distribution
      counts[ApplicationStatus.Aplicou] = 12;
      counts[ApplicationStatus.Visualizado] = 6;
      counts[ApplicationStatus.Entrevistando] = 5;
      counts[ApplicationStatus.Oferta] = 3;
      counts[ApplicationStatus.Rejeitado] = 4;
      counts[ApplicationStatus.Ignorado] = 2;
    }

    const total = Object.values(counts).reduce((a, b) => a + b, 0);

    return Object.entries(counts).map(([status, value]) => {
      const typedStatus = status as ApplicationStatus;
      const percent = total > 0 ? Math.round((value / total) * 1000) / 10 : 0;
      return {
        name: typedStatus,
        label: statusPalette[typedStatus].label,
        value,
        percent,
        color: statusPalette[typedStatus].color,
      };
    }).sort((a, b) => b.value - a.value);
  }, [applications]);

  const totalStatusCount = useMemo(() => {
    return statusDistributionData.reduce((acc, curr) => acc + curr.value, 0);
  }, [statusDistributionData]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
      marginBottom: '32px',
    }}>
      {/* Top Header & Comparative Toolbar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '16px',
        padding: '20px 24px',
        borderRadius: '16px',
        backgroundColor: colors.surface,
        border: `1px solid ${colors.border}`,
        boxShadow: colors.shadow || '0 2px 12px rgba(0,0,0,0.04)',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: colors.primaryLight || 'rgba(136, 19, 55, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: colors.primary,
            }}>
              <TrendingUp size={20} />
            </div>
            <h2 style={{
              fontSize: '20px',
              fontWeight: 800,
              color: colors.textPrimary,
              margin: 0,
              letterSpacing: '-0.02em',
            }}>
              Gráficos Comparativos do Dashboard
            </h2>
          </div>
          <p style={{
            margin: 0,
            fontSize: '13px',
            color: colors.textSecondary,
            maxWidth: '650px',
            lineHeight: 1.5,
          }}>
            Análise evolutiva da <strong>taxa de sucesso das candidaturas ao longo dos meses</strong> e da <strong>distribuição de status das vagas</strong> com a biblioteca Recharts.
          </p>
        </div>

        {/* Action Controls & Data Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {applications.length < 3 && (
            <button
              type="button"
              onClick={() => setUseBenchmarkComparison(prev => !prev)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 700,
                backgroundColor: useBenchmarkComparison ? colors.primary : colors.background,
                color: useBenchmarkComparison ? (colors.textOnPrimary || '#ffffff') : colors.textPrimary,
                border: `1px solid ${useBenchmarkComparison ? colors.primary : colors.border}`,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              title="Alternar entre dados demonstrativos de 12 meses e dados reais"
            >
              <Sparkles size={14} />
              <span>{useBenchmarkComparison ? 'Modo Demonstração (Ativo)' : 'Ver Demonstração'}</span>
            </button>
          )}

          {/* Timeframe Selector */}
          <div style={{
            display: 'flex',
            backgroundColor: colors.background,
            borderRadius: '8px',
            border: `1px solid ${colors.border}`,
            padding: '2px',
          }}>
            <button
              type="button"
              onClick={() => setTimeframeMonths(6)}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 700,
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: timeframeMonths === 6 ? colors.primary : 'transparent',
                color: timeframeMonths === 6 ? (colors.textOnPrimary || '#ffffff') : colors.textSecondary,
              }}
            >
              6 Meses
            </button>
            <button
              type="button"
              onClick={() => setTimeframeMonths(12)}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 700,
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: timeframeMonths === 12 ? colors.primary : 'transparent',
                color: timeframeMonths === 12 ? (colors.textOnPrimary || '#ffffff') : colors.textSecondary,
              }}
            >
              12 Meses
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '14px',
      }}>
        {/* Card 1: Taxa de Sucesso Geral */}
        <div style={{
          padding: '16px 20px',
          borderRadius: '14px',
          backgroundColor: colors.surface,
          border: `1px solid ${colors.border}`,
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: colors.textSecondary }}>
              Taxa Média de Sucesso
            </span>
            <div style={{
              padding: '4px 8px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 800,
              backgroundColor: stats.momChange >= 0 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
              color: stats.momChange >= 0 ? '#10b981' : '#ef4444',
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
            }}>
              <ArrowUpRight size={12} />
              <span>{stats.momChange >= 0 ? `+${stats.momChange}%` : `${stats.momChange}%`}</span>
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: colors.primary, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            {stats.avgSuccessRate}%
          </div>
          <span style={{ fontSize: '12px', color: colors.textSecondary, marginTop: '4px', display: 'block' }}>
            {stats.totalInterviews + stats.totalOffers} de {stats.totalApps} geraram entrevistas ou ofertas
          </span>
        </div>

        {/* Card 2: Taxa de Ofertas Finais */}
        <div style={{
          padding: '16px 20px',
          borderRadius: '14px',
          backgroundColor: colors.surface,
          border: `1px solid ${colors.border}`,
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: colors.textSecondary }}>
              Taxa de Ofertas Finais
            </span>
            <Award size={16} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#f59e0b', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            {stats.avgOfferRate}%
          </div>
          <span style={{ fontSize: '12px', color: colors.textSecondary, marginTop: '4px', display: 'block' }}>
            {stats.totalOffers} propostas formais recebidas
          </span>
        </div>

        {/* Card 3: Melhor Mês */}
        <div style={{
          padding: '16px 20px',
          borderRadius: '14px',
          backgroundColor: colors.surface,
          border: `1px solid ${colors.border}`,
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: colors.textSecondary }}>
              Melhor Desempenho
            </span>
            <Calendar size={16} color={colors.primary} />
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: colors.textPrimary, letterSpacing: '-0.01em', lineHeight: 1.2 }}>
            {stats.bestMonth?.monthLabel || 'N/A'}
          </div>
          <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 700, marginTop: '4px', display: 'block' }}>
            ★ {stats.bestMonth?.successRate || 0}% de conversão registrada
          </span>
        </div>

        {/* Card 4: Volume Monitorado */}
        <div style={{
          padding: '16px 20px',
          borderRadius: '14px',
          backgroundColor: colors.surface,
          border: `1px solid ${colors.border}`,
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: colors.textSecondary }}>
              Volume Total Avaliado
            </span>
            <Layers size={16} color={colors.textSecondary} />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: colors.textPrimary, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            {stats.totalApps}
          </div>
          <span style={{ fontSize: '12px', color: colors.textSecondary, marginTop: '4px', display: 'block' }}>
            Candidaturas nos últimos {timeframeMonths} meses
          </span>
        </div>
      </div>

      {/* Grid: 2 Main Comparative Charts side-by-side or stacked on mobile */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 520px), 1fr))',
        gap: '24px',
      }}>
        {/* CHART 1: Taxa de Sucesso ao Longo dos Meses (ComposedChart com Recharts) */}
        <div style={{
          padding: '24px',
          borderRadius: '16px',
          backgroundColor: colors.surface,
          border: `1px solid ${colors.border}`,
          boxShadow: colors.shadow || '0 2px 12px rgba(0,0,0,0.04)',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '430px',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
            flexWrap: 'wrap',
            gap: '10px',
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={18} color={colors.primary} />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: colors.textPrimary }}>
                  Taxa de Sucesso ao Longo dos Meses
                </h3>
              </div>
              <span style={{ fontSize: '12px', color: colors.textSecondary, marginTop: '2px', display: 'block' }}>
                Comparativo mensal de candidaturas, entrevistas e taxa de conversão (%)
              </span>
            </div>

            {/* Toggle Metric Mode */}
            <div style={{
              display: 'flex',
              backgroundColor: colors.background,
              borderRadius: '8px',
              border: `1px solid ${colors.border}`,
              padding: '2px',
            }}>
              <button
                type="button"
                onClick={() => setSuccessMetricMode('overall')}
                style={{
                  padding: '5px 10px',
                  fontSize: '11px',
                  fontWeight: 700,
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: successMetricMode === 'overall' ? colors.primary : 'transparent',
                  color: successMetricMode === 'overall' ? (colors.textOnPrimary || '#ffffff') : colors.textSecondary,
                }}
              >
                Sucesso Geral
              </button>
              <button
                type="button"
                onClick={() => setSuccessMetricMode('offers')}
                style={{
                  padding: '5px 10px',
                  fontSize: '11px',
                  fontWeight: 700,
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: successMetricMode === 'offers' ? colors.primary : 'transparent',
                  color: successMetricMode === 'offers' ? (colors.textOnPrimary || '#ffffff') : colors.textSecondary,
                }}
              >
                Só Ofertas
              </button>
            </div>
          </div>

          {/* Recharts Container for Monthly Evolution */}
          <div style={{ width: '100%', height: '320px', flex: 1 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={activeMonthlyData}
                margin={{ top: 20, right: 20, bottom: 10, left: -10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={colors.border} vertical={false} opacity={0.6} />
                <XAxis
                  dataKey="monthLabel"
                  stroke={colors.textSecondary}
                  fontSize={12}
                  tickLine={false}
                />
                {/* Left Y Axis for Counts */}
                <YAxis
                  yAxisId="left"
                  stroke={colors.textSecondary}
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  label={{ value: 'Qtd Vagas', angle: -90, position: 'insideLeft', fill: colors.textSecondary, fontSize: 10 }}
                />
                {/* Right Y Axis for Success Rate Percentage */}
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke={colors.primary}
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, 100]}
                  unit="%"
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as MonthlyMetric;
                      return (
                        <div style={{
                          backgroundColor: colors.surface,
                          border: `1px solid ${colors.border}`,
                          borderRadius: '10px',
                          padding: '12px 14px',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                          fontSize: '12px',
                          color: colors.textPrimary,
                        }}>
                          <div style={{ fontWeight: 800, fontSize: '13px', marginBottom: '8px', color: colors.primary }}>
                            {label} ({data.monthKey})
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
                              <span style={{ color: colors.textSecondary }}>Candidaturas Totais:</span>
                              <strong>{data.totalApplications}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
                              <span style={{ color: '#10b981' }}>Em Entrevista:</span>
                              <strong>{data.interviewsCount}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
                              <span style={{ color: '#f59e0b' }}>Ofertas Recebidas:</span>
                              <strong>{data.offersCount}</strong>
                            </div>
                            <div style={{
                              marginTop: '6px',
                              paddingTop: '6px',
                              borderTop: `1px solid ${colors.border}`,
                              display: 'flex',
                              justifyContent: 'space-between',
                              gap: '16px',
                            }}>
                              <span style={{ fontWeight: 700, color: colors.primary }}>
                                Taxa de Sucesso {successMetricMode === 'overall' ? 'Geral' : 'de Oferta'}:
                              </span>
                              <strong style={{ color: colors.primary }}>
                                {successMetricMode === 'overall' ? `${data.successRate}%` : `${data.offerSuccessRate}%`}
                              </strong>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  height={36}
                  iconType="circle"
                  wrapperStyle={{ fontSize: '12px', paddingTop: '4px' }}
                />

                {/* Bars for Applications Volume */}
                <Bar
                  yAxisId="left"
                  dataKey="totalApplications"
                  name="Candidaturas Enviadas"
                  fill="#94a3b8"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                  opacity={0.7}
                />
                <Bar
                  yAxisId="left"
                  dataKey="interviewsCount"
                  name="Entrevistas"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                />

                {/* Comparative Line for Success Rate (%) */}
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey={successMetricMode === 'overall' ? 'successRate' : 'offerSuccessRate'}
                  name={successMetricMode === 'overall' ? 'Taxa de Sucesso (%)' : 'Taxa de Ofertas (%)'}
                  stroke={colors.primary}
                  strokeWidth={3}
                  dot={{ r: 5, fill: colors.primary, stroke: colors.surface, strokeWidth: 2 }}
                  activeDot={{ r: 8, fill: colors.primary }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 2: Distribuição de Status das Vagas (Donut / Horizontal Bar com Recharts) */}
        <div style={{
          padding: '24px',
          borderRadius: '16px',
          backgroundColor: colors.surface,
          border: `1px solid ${colors.border}`,
          boxShadow: colors.shadow || '0 2px 12px rgba(0,0,0,0.04)',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '430px',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
            flexWrap: 'wrap',
            gap: '10px',
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PieChartIcon size={18} color={colors.primary} />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: colors.textPrimary }}>
                  Distribuição de Status das Vagas
                </h3>
              </div>
              <span style={{ fontSize: '12px', color: colors.textSecondary, marginTop: '2px', display: 'block' }}>
                Proporção de vagas por etapa no funil de contratação ({totalStatusCount} posições)
              </span>
            </div>

            {/* Alternador de tipo de gráfico: Donut vs Barras */}
            <div style={{
              display: 'flex',
              backgroundColor: colors.background,
              borderRadius: '8px',
              border: `1px solid ${colors.border}`,
              padding: '2px',
            }}>
              <button
                type="button"
                onClick={() => setStatusChartType('donut')}
                style={{
                  padding: '5px 10px',
                  fontSize: '11px',
                  fontWeight: 700,
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: statusChartType === 'donut' ? colors.primary : 'transparent',
                  color: statusChartType === 'donut' ? (colors.textOnPrimary || '#ffffff') : colors.textSecondary,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <PieChartIcon size={13} />
                <span>Rosca</span>
              </button>
              <button
                type="button"
                onClick={() => setStatusChartType('bars')}
                style={{
                  padding: '5px 10px',
                  fontSize: '11px',
                  fontWeight: 700,
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: statusChartType === 'bars' ? colors.primary : 'transparent',
                  color: statusChartType === 'bars' ? (colors.textOnPrimary || '#ffffff') : colors.textSecondary,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <BarChart3 size={13} />
                <span>Barras</span>
              </button>
            </div>
          </div>

          {/* Recharts Container for Status Distribution */}
          <div style={{ width: '100%', height: '320px', flex: 1, position: 'relative' }}>
            {statusChartType === 'donut' ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const item = payload[0].payload;
                        return (
                          <div style={{
                            backgroundColor: colors.surface,
                            border: `1px solid ${colors.border}`,
                            borderRadius: '8px',
                            padding: '10px 12px',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                            fontSize: '12px',
                            color: colors.textPrimary,
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: item.color }} />
                              <strong style={{ color: colors.textPrimary }}>{item.label}</strong>
                            </div>
                            <div style={{ color: colors.textSecondary }}>
                              Total: <strong>{item.value} vaga{item.value !== 1 ? 's' : ''}</strong> ({item.percent}%)
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend
                    layout="horizontal"
                    verticalAlign="bottom"
                    align="center"
                    wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                    formatter={(value) => <span style={{ color: colors.textPrimary, fontWeight: 600 }}>{value}</span>}
                  />
                  <Pie
                    data={statusDistributionData}
                    cx="50%"
                    cy="45%"
                    innerRadius={65}
                    outerRadius={105}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="label"
                  >
                    {statusDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke={colors.surface} strokeWidth={2} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={statusDistributionData}
                  layout="vertical"
                  margin={{ top: 10, right: 30, left: 35, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={colors.border} opacity={0.6} />
                  <XAxis type="number" stroke={colors.textSecondary} fontSize={11} tickLine={false} />
                  <YAxis
                    dataKey="label"
                    type="category"
                    stroke={colors.textSecondary}
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    width={90}
                  />
                  <Tooltip
                    formatter={(val: any, name: any, item: any) => [
                      `${val} vaga(s) (${item.payload.percent}%)`,
                      item.payload.label,
                    ]}
                  />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                    {statusDistributionData.map((entry, index) => (
                      <Cell key={`bar-cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}

            {/* Total Indicator in Donut Center */}
            {statusChartType === 'donut' && (
              <div style={{
                position: 'absolute',
                top: '45%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
                pointerEvents: 'none',
              }}>
                <span style={{ fontSize: '24px', fontWeight: 800, color: colors.textPrimary, display: 'block', lineHeight: 1 }}>
                  {totalStatusCount}
                </span>
                <span style={{ fontSize: '11px', color: colors.textSecondary, textTransform: 'uppercase', fontWeight: 600 }}>
                  Vagas
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardComparativeCharts;
