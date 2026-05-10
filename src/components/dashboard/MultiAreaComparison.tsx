import { Award, Layers3, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAnalysisContext } from '../../app/providers/AnalysisProvider';
import { useMapContext } from '../../app/providers/MapProvider';
import { getMostEfficientArea, summarizeAreaEfficiency } from '../../services/multiPolygonAnalysis.service';
import { formatArea, formatCurrency, formatEnergy, formatNumber } from '../../utils/formatters';
import { Badge } from '../ui/Badge';
import { GlassCard } from '../ui/GlassCard';

const efficiencyVariant = (label: string) => {
  if (label === 'Most Efficient') return 'success';
  if (label === 'High Efficiency') return 'secondary';
  if (label === 'Moderate Efficiency') return 'warning';
  return 'danger';
};

export const MultiAreaComparison: React.FC = () => {
  const { filteredAnalysis } = useAnalysisContext();
  const { planningAreas, removePlanningArea } = useMapContext();
  const summaries = summarizeAreaEfficiency(filteredAnalysis, planningAreas);
  const bestArea = getMostEfficientArea(summaries);

  if (planningAreas.length === 0) return null;

  return (
    <GlassCard className="overflow-x-hidden !p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-lime-200">
            <Layers3 className="h-4 w-4" />
            Area Comparison
          </p>
          <h2 className="mt-1 break-words text-lg font-semibold text-white">
            {bestArea ? `${bestArea.areaLabel} is most efficient` : `${planningAreas.length} selected areas`}
          </h2>
        </div>
        {bestArea && (
          <Badge variant="success" size="sm" className="shrink-0">
            <Award className="mr-1 inline h-3 w-3" />
            Best
          </Badge>
        )}
      </div>

      {summaries.length === 0 ? (
        <div className="space-y-2">
          <p className="text-xs leading-5 text-slate-500">Draw multiple polygons, then click Analyze Areas to compare them.</p>
          {planningAreas.map((area) => (
            <div key={area.id} className="flex items-center justify-between gap-2 rounded-md border border-white/10 bg-white/[0.035] px-3 py-2">
              <span className="min-w-0 truncate text-xs font-semibold text-slate-200">{area.label}</span>
              <button
                type="button"
                onClick={() => removePlanningArea(area.id)}
                className="grid h-7 w-7 shrink-0 place-items-center rounded-md border border-white/10 bg-white/[0.04] text-slate-300"
                title={`Remove ${area.label}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {summaries.map((summary, index) => (
            <motion.div
              key={summary.areaId}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className={`rounded-lg border p-3 ${
                summary.efficiencyLabel === 'Most Efficient'
                  ? 'border-lime-300/35 bg-lime-300/[0.06]'
                  : 'border-white/10 bg-white/[0.035]'
              }`}
            >
              <div className="mb-2 flex min-w-0 items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white">{summary.areaLabel}</p>
                  <p className="mt-1 text-xs text-slate-500">{formatArea(summary.polygonAreaM2)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Badge variant={efficiencyVariant(summary.efficiencyLabel)} size="sm">
                    {summary.efficiencyLabel}
                  </Badge>
                  {!filteredAnalysis && (
                    <button
                      type="button"
                      onClick={() => removePlanningArea(summary.areaId)}
                      className="grid h-7 w-7 place-items-center rounded-md border border-white/10 bg-white/[0.04] text-slate-300"
                      title={`Remove ${summary.areaLabel}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
                <span>
                  Output <strong className="text-cyan-100">{formatEnergy(summary.totalAnnualEnergyKwh)}</strong>
                </span>
                <span>
                  Density <strong className="text-lime-100">{formatNumber(summary.annualEnergyPerM2, 1)} kWh/m2</strong>
                </span>
                <span>
                  AI Avg <strong className="text-white">{summary.averageAiSuitabilityScore}</strong>
                </span>
                <span>
                  Recommended <strong className="text-white">{summary.recommendedCount}/{summary.candidateCount}</strong>
                </span>
                <span>
                  Savings <strong className="text-cyan-100">{formatCurrency(summary.totalAnnualSavingsUsd)}</strong>
                </span>
                <span>
                  Payback <strong className="text-white">{summary.averagePaybackYears || 0} yr</strong>
                </span>
              </div>
              <p className="mt-2 break-words text-xs text-slate-500">Best candidate: {summary.bestCandidateName}</p>
            </motion.div>
          ))}
        </div>
      )}
    </GlassCard>
  );
};
