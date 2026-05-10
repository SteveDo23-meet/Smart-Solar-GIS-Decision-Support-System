import { motion } from 'framer-motion';
import { Banknote, Gauge, Leaf, MapPin, Zap } from 'lucide-react';
import { useAnalysisContext } from '../../app/providers/AnalysisProvider';
import { formatCurrency, formatEnergy, formatNumber } from '../../utils/formatters';
import { Badge } from '../ui/Badge';
import { GlassCard } from '../ui/GlassCard';

export const StatsCards: React.FC = () => {
  const { filteredAnalysis: analysis, solarTimeline } = useAnalysisContext();
  const originalEnergy = analysis?.rankedLocations.reduce((sum, location) => sum + location.annualEnergyKwh, 0) ?? 0;
  const originalAverageScore = analysis?.rankedLocations.length
    ? Math.round(analysis.rankedLocations.reduce((sum, location) => sum + location.score, 0) / analysis.rankedLocations.length)
    : 0;
  const timelineEnabled = solarTimeline.isTimelineEnabled;
  const cards = [
    {
      icon: Zap,
      label: 'Yearly Output',
      value: analysis ? `${formatEnergy(analysis.estimatedAnnualEnergyKwh)}/yr` : '0 MWh/yr',
      subValue: timelineEnabled && analysis ? `Original ${formatEnergy(originalEnergy)}/yr` : undefined,
      color: '#22d3ee',
    },
    {
      icon: MapPin,
      label: 'Suitable Areas',
      value: analysis?.potentialLocations.toString() ?? '0',
      color: '#bef264',
    },
    {
      icon: Gauge,
      label: 'Average Solar Score',
      value: `${analysis?.averageScore ?? 0}%`,
      subValue: timelineEnabled && analysis ? `Original ${originalAverageScore}%` : undefined,
      color: '#facc15',
    },
    {
      icon: Banknote,
      label: 'Annual Savings',
      value: analysis ? formatCurrency(analysis.estimatedAnnualSavingsUsd) : '$0',
      color: '#38bdf8',
    },
    {
      icon: Leaf,
      label: 'CO2 Reduction',
      value: analysis ? `${formatNumber(analysis.estimatedCo2ReductionKgPerYear / 1000, 1)} t/yr` : '0 t/yr',
      color: '#34d399',
    },
  ];

  return (
    <div className="overflow-x-hidden">
      {timelineEnabled && (
        <div className="mb-2">
          <Badge variant="warning" size="sm">Timeline adjusted</Badge>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 overflow-x-hidden">
      {cards.map((card, index) => {
        const Icon = card.icon;

        return (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04, duration: 0.25 }}
          >
            <GlassCard className="h-full min-w-0 !p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{card.label}</p>
                  <p className="mt-2 break-words text-lg font-bold leading-tight text-white">{card.value}</p>
                  {card.subValue && <p className="mt-1 break-words text-[11px] text-slate-500">{card.subValue}</p>}
                </div>
                <div
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border"
                  style={{ borderColor: `${card.color}66`, backgroundColor: `${card.color}14` }}
                >
                  <Icon className="h-5 w-5" style={{ color: card.color }} />
                </div>
              </div>
            </GlassCard>
          </motion.div>
        );
      })}
      </div>
    </div>
  );
};
