import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useAnalysisContext } from '../../app/providers/AnalysisProvider';
import { generateEnergyForecast } from '../../services/solarAnalysis.service';
import { Badge } from '../ui/Badge';
import { GlassCard } from '../ui/GlassCard';

interface EnergyChartProps {
  chartType?: 'area' | 'bar';
}

export const EnergyChart: React.FC<EnergyChartProps> = ({ chartType = 'area' }) => {
  const { filteredAnalysis: analysis, solarTimeline } = useAnalysisContext();
  const base = Math.max(850, Math.round((analysis?.estimatedAnnualEnergyKwh ?? 1_200_000) / 365));
  const data = generateEnergyForecast(base);

  return (
    <GlassCard className="!p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-amber-200">Forecast</p>
          <h2 className="text-lg font-semibold text-white">7-Day Energy Output</h2>
        </div>
        {solarTimeline.isTimelineEnabled && <Badge variant="warning" size="sm">Timeline adjusted</Badge>}
      </div>

      <div className="h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'area' ? (
            <AreaChart data={data}>
              <defs>
                <linearGradient id="predictedEnergy" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#334155" strokeDasharray="3 3" opacity={0.35} />
              <XAxis dataKey="day" stroke="#94a3b8" tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} width={44} />
              <Tooltip
                contentStyle={{
                  background: 'rgba(2, 6, 23, 0.92)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 8,
                  color: '#e2e8f0',
                }}
              />
              <Area
                type="monotone"
                dataKey="predicted"
                stroke="#22d3ee"
                strokeWidth={2}
                fill="url(#predictedEnergy)"
                name="Predicted kWh"
              />
              <Area type="monotone" dataKey="optimal" stroke="#bef264" strokeWidth={2} fill="transparent" name="Optimal kWh" />
            </AreaChart>
          ) : (
            <BarChart data={data}>
              <CartesianGrid stroke="#334155" strokeDasharray="3 3" opacity={0.35} />
              <XAxis dataKey="day" stroke="#94a3b8" tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} width={44} />
              <Tooltip
                contentStyle={{
                  background: 'rgba(2, 6, 23, 0.92)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 8,
                  color: '#e2e8f0',
                }}
              />
              <Bar dataKey="predicted" fill="#22d3ee" radius={[6, 6, 0, 0]} name="Predicted kWh" />
              <Bar dataKey="optimal" fill="#bef264" radius={[6, 6, 0, 0]} name="Optimal kWh" />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
};
