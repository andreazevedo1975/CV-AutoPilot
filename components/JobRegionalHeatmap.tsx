// Senior Data Visualization - Regional Job Heatmap with Recharts
import React, { useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell, 
  CartesianGrid 
} from 'recharts';
import { RegionHeatPoint } from '../types';
import { 
  Flame, 
  TrendingUp, 
  MapPin, 
  DollarSign, 
  Laptop, 
  Building2, 
  Info, 
  Compass,
  ArrowUpRight
} from 'lucide-react';

interface JobRegionalHeatmapProps {
  keyword: string;
  data: RegionHeatPoint[];
  colors: any;
  onSelectRegion?: (state: string, regionName: string) => void;
}

export const JobRegionalHeatmap: React.FC<JobRegionalHeatmapProps> = ({
  keyword,
  data,
  colors,
  onSelectRegion
}) => {
  const [activeRegion, setActiveRegion] = useState<RegionHeatPoint | null>(data[0] || null);
  const [metricMode, setMetricMode] = useState<'volume' | 'intensity'>('volume');

  const totalJobs = data.reduce((acc, curr) => acc + curr.jobVolume, 0);
  const topRegion = [...data].sort((a, b) => b.jobVolume - a.jobVolume)[0];
  const remoteShare = data.find(d => d.state === 'Remoto')?.jobVolume || 0;
  const remotePercent = totalJobs > 0 ? Math.round((remoteShare / totalJobs) * 100) : 0;

  // Compute color based on heat intensity (0 to 100) with Wine & Black Executive Palette
  const getBarColor = (intensity: number, isSelected: boolean) => {
    if (isSelected) return colors.primary || '#881337'; // Focus highlight
    if (intensity >= 80) return '#881337'; // Vinho Imperial Intenso
    if (intensity >= 65) return '#be123c'; // Vinho Médio
    if (intensity >= 45) return '#b45309'; // Âmbar Nobre
    if (intensity >= 30) return '#059669'; // Esmeralda Executivo
    return '#52525b'; // Grafite Ônix Base
  };

  const chartData = data.map(item => ({
    ...item,
    chartValue: metricMode === 'volume' ? item.jobVolume : item.heatIntensity,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const p: RegionHeatPoint = payload[0].payload;
      return (
        <div 
          style={{ 
            backgroundColor: colors.surfaceElevated || colors.surface, 
            borderColor: colors.border,
            color: colors.textPrimary 
          }}
          className="p-3.5 rounded-xl border shadow-xl max-w-xs text-xs space-y-2 backdrop-blur-md"
        >
          <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: colors.border }}>
            <div className="font-bold text-sm flex items-center gap-1.5">
              <MapPin size={14} className="text-blue-500" />
              <span>{p.state} - {p.regionName}</span>
            </div>
            <span className="px-2 py-0.5 rounded-full font-semibold text-[10px] bg-red-500/15 text-red-400">
              {p.demandStatus}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-left pt-1">
            <div>
              <span className="text-[10px] block opacity-70">Oferta Estimada</span>
              <span className="font-bold text-sm text-blue-400">~{p.jobVolume} vagas</span>
            </div>
            <div>
              <span className="text-[10px] block opacity-70">Índice de Calor</span>
              <span className="font-bold text-sm text-amber-400">{p.heatIntensity}/100</span>
            </div>
            <div className="col-span-2">
              <span className="text-[10px] block opacity-70">Média Salarial Típica</span>
              <span className="font-semibold text-emerald-400">{p.averageSalary}</span>
            </div>
          </div>

          <div className="pt-1.5 border-t" style={{ borderColor: colors.border }}>
            <span className="text-[10px] block opacity-70 mb-1">Distribuição de Modalidade:</span>
            <div className="flex items-center gap-1 text-[10px] font-medium">
              <span className="text-blue-400">Remoto: {p.workModelDistribution.remote}%</span>
              <span>•</span>
              <span className="text-purple-400">Híbrido: {p.workModelDistribution.hybrid}%</span>
              <span>•</span>
              <span className="text-slate-400">Presencial: {p.workModelDistribution.onsite}%</span>
            </div>
          </div>

          <div className="text-[10px] opacity-60 italic pt-1">
            Pólos: {p.topHiringHubs.slice(0, 2).join(', ')}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div 
      id="regional-job-heatmap-card"
      className="p-5 rounded-2xl border transition-all"
      style={{ 
        backgroundColor: colors.surface, 
        borderColor: colors.border,
        boxShadow: colors.shadow 
      }}
    >
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5 border-b pb-4" style={{ borderColor: colors.border }}>
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
              <Flame size={20} />
            </div>
            <div>
              <h3 className="font-bold text-base md:text-lg flex items-center gap-2" style={{ color: colors.textPrimary }}>
                Mapa de Calor Regional de Contratações
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold border" style={{ backgroundColor: colors.primaryLight, color: colors.primary, borderColor: colors.border }}>
                  Recharts Analytics
                </span>
              </h3>
              <p className="text-xs" style={{ color: colors.textSecondary }}>
                Densidade geográfica de vagas e demanda em tempo real para: <strong className="text-rose-400">"{keyword}"</strong>
              </p>
            </div>
          </div>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <div className="inline-flex p-1 rounded-xl border text-xs font-semibold" style={{ backgroundColor: colors.surfaceHover, borderColor: colors.border }}>
            <button
              onClick={() => setMetricMode('volume')}
              className="px-3 py-1 rounded-lg transition-all"
              style={{
                backgroundColor: metricMode === 'volume' ? colors.primary : 'transparent',
                color: metricMode === 'volume' ? colors.textOnPrimary : colors.textSecondary,
                boxShadow: metricMode === 'volume' ? `0 2px 8px ${colors.primaryGlow || 'rgba(136,19,55,0.3)'}` : 'none'
              }}
            >
              Volume de Vagas
            </button>
            <button
              onClick={() => setMetricMode('intensity')}
              className="px-3 py-1 rounded-lg transition-all"
              style={{
                backgroundColor: metricMode === 'intensity' ? colors.primary : 'transparent',
                color: metricMode === 'intensity' ? colors.textOnPrimary : colors.textSecondary,
                boxShadow: metricMode === 'intensity' ? `0 2px 8px ${colors.primaryGlow || 'rgba(136,19,55,0.3)'}` : 'none'
              }}
            >
              Índice de Calor (0-100)
            </button>
          </div>
        </div>
      </div>

      {/* Highlights Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div className="p-3 rounded-xl border" style={{ backgroundColor: colors.surfaceElevated || colors.surfaceHover, borderColor: colors.border }}>
          <span className="text-[11px] font-medium block" style={{ color: colors.textMuted }}>Total Mapeado</span>
          <span className="text-lg font-extrabold text-rose-500">~{totalJobs} Vagas</span>
          <span className="text-[10px] block opacity-70">Amostragem nacional</span>
        </div>

        <div className="p-3 rounded-xl border" style={{ backgroundColor: colors.surfaceElevated || colors.surfaceHover, borderColor: colors.border }}>
          <span className="text-[11px] font-medium block" style={{ color: colors.textMuted }}>Pólo Líder em Vagas</span>
          <span className="text-lg font-extrabold text-amber-500">{topRegion?.state} ({topRegion?.jobVolume})</span>
          <span className="text-[10px] block opacity-70 truncate">{topRegion?.regionName}</span>
        </div>

        <div className="p-3 rounded-xl border" style={{ backgroundColor: colors.surfaceElevated || colors.surfaceHover, borderColor: colors.border }}>
          <span className="text-[11px] font-medium block" style={{ color: colors.textMuted }}>Vagas 100% Remotas</span>
          <span className="text-lg font-extrabold text-emerald-500">{remotePercent}% do Total</span>
          <span className="text-[10px] block opacity-70">Sem restrição física</span>
        </div>

        <div className="p-3 rounded-xl border" style={{ backgroundColor: colors.surfaceElevated || colors.surfaceHover, borderColor: colors.border }}>
          <span className="text-[11px] font-medium block" style={{ color: colors.textMuted }}>Maior Faixa Salarial</span>
          <span className="text-lg font-extrabold text-purple-400">SP & Brasília</span>
          <span className="text-[10px] block opacity-70">Até R$ 18.000+</span>
        </div>
      </div>

      {/* Main Recharts BarChart Heatmap */}
      <div className="w-full h-72 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
            onClick={(e: any) => {
              if (e && e.activePayload && e.activePayload.length) {
                const item: RegionHeatPoint = e.activePayload[0].payload;
                setActiveRegion(item);
                if (onSelectRegion) onSelectRegion(item.state, item.regionName);
              }
            }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} stroke={colors.textMuted} />
            <XAxis 
              dataKey="state" 
              tick={{ fill: colors.textSecondary, fontSize: 11, fontWeight: 600 }}
              axisLine={{ stroke: colors.border }}
              tickLine={false}
              interval={0}
            />
            <YAxis 
              tick={{ fill: colors.textSecondary, fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: colors.surfaceHover, opacity: 0.5 }} />
            <Bar 
              dataKey="chartValue" 
              radius={[6, 6, 0, 0]}
              animationDuration={800}
            >
              {chartData.map((entry) => (
                <Cell 
                  key={`cell-${entry.state}`}
                  fill={getBarColor(entry.heatIntensity, activeRegion?.state === entry.state)}
                  cursor="pointer"
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend & Interactive Region Inspector */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 pt-3 border-t text-xs" style={{ borderColor: colors.border }}>
        {/* Color Legend */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-semibold text-[11px]" style={{ color: colors.textSecondary }}>Grau de Aquecimento:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500"></span>
            <span style={{ color: colors.textSecondary }}>🔥 Extrema Demanda (80+)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-orange-500"></span>
            <span style={{ color: colors.textSecondary }}>⚡ Alta (65-79)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
            <span style={{ color: colors.textSecondary }}>📍 Moderada (45-64)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
            <span style={{ color: colors.textSecondary }}>🌱 Emergente</span>
          </div>
        </div>

        {/* Action Button for currently active region */}
        {activeRegion && onSelectRegion && (
          <button
            onClick={() => onSelectRegion(activeRegion.state, activeRegion.regionName)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-sm"
          >
            <span>Filtrar Vagas em <strong>{activeRegion.state}</strong></span>
            <ArrowUpRight size={13} />
          </button>
        )}
      </div>

      {/* Selected Region Details Pill Strip */}
      {activeRegion && (
        <div 
          className="mt-4 p-3.5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
          style={{ backgroundColor: colors.surfaceElevated || colors.surfaceHover, borderColor: colors.border }}
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-500/15 text-blue-500 font-bold">
              {activeRegion.state}
            </div>
            <div>
              <div className="font-bold text-sm" style={{ color: colors.textPrimary }}>
                {activeRegion.regionName}
              </div>
              <div className="text-[11px] opacity-75">
                Salário médio: <strong className="text-emerald-400">{activeRegion.averageSalary}</strong> • Status: <strong className="text-amber-400">{activeRegion.demandStatus}</strong>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {activeRegion.topHiringHubs.map((hub, idx) => (
              <span 
                key={idx}
                className="px-2 py-0.5 rounded-md border text-[10px] font-medium"
                style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.textSecondary }}
              >
                📍 {hub}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default JobRegionalHeatmap;
