import { motion } from 'framer-motion';
import { useAnalysisContext } from '../../app/providers/AnalysisProvider';
import { POI_TYPE_LABELS } from '../../data/mockPois';
import { formatCurrency, formatEnergy, formatNumber } from '../../utils/formatters';
import { Badge } from '../ui/Badge';
import { GlassCard } from '../ui/GlassCard';

const riskVariant = (riskLevel: string) => {
  if (riskLevel === 'Low') return 'success';
  if (riskLevel === 'Medium') return 'warning';
  return 'danger';
};

const decisionVariant = (decisionStatus: string) => {
  if (decisionStatus === 'Recommended') return 'success';
  if (decisionStatus === 'Conditional') return 'warning';
  return 'danger';
};

const sourceLabel = (source: string) => (source === 'google_solar' ? 'Google Solar API' : 'AI GIS Estimate');

export const RankingTable: React.FC = () => {
  const { filteredAnalysis: analysis, setSelectedLocation, solarTimeline } = useAnalysisContext();
  const data = analysis?.rankedLocations ?? [];
  const timelineEnabled = solarTimeline.isTimelineEnabled;

  return (
    <GlassCard className="overflow-x-hidden !p-4">
      <div className="mb-4 flex min-w-0 items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.18em] text-lime-200">Ranking</p>
          <h2 className="truncate text-lg font-semibold text-white">Solar Candidate Priority</h2>
        </div>
        <p className="shrink-0 text-xs text-slate-500">{data.length} records</p>
      </div>

      <div className="space-y-2 overflow-x-hidden">
        {data.slice(0, 8).map((poi, index) => (
          <motion.button
            key={poi.id}
            type="button"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.025 }}
            onClick={() => setSelectedLocation(poi)}
            className="w-full min-w-0 rounded-lg border border-white/[0.08] bg-white/[0.035] p-3 text-left text-slate-200 transition hover:bg-white/[0.06]"
          >
            <div className="mb-2 flex min-w-0 items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="break-words text-sm font-semibold leading-snug text-white">{poi.name}</p>
                <p className="mt-1 break-words text-xs text-slate-400">
                  {poi.surfaceLabel ?? POI_TYPE_LABELS[poi.type]}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <Badge variant={decisionVariant(poi.decisionStatus)} size="sm">
                  {poi.decisionStatus}
                </Badge>
                {timelineEnabled && <Badge variant="warning" size="sm">Timeline adjusted</Badge>}
                <Badge
                  variant={poi.solarEngineResult.source === 'google_solar' ? 'success' : 'secondary'}
                  size="sm"
                  className="whitespace-nowrap"
                >
                  {sourceLabel(poi.solarEngineResult.source)}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <span className="min-w-0 text-slate-400">
                AI <strong className="text-lime-200">{poi.aiSuitabilityLabel}</strong>
              </span>
              <span className="min-w-0 text-slate-400">
                Confidence <strong className="text-white">{Math.round(poi.aiConfidence * 100)}%</strong>
              </span>
              <span className="min-w-0 text-slate-400">
                Risk{' '}
                <Badge variant={riskVariant(poi.riskLevel)} size="sm" className="align-middle">
                  {poi.riskLevel}
                </Badge>
              </span>
              <span className="min-w-0 text-slate-400">
                Score <strong className="text-white">{poi.timeAdjustedAiSuitabilityScore ?? poi.aiSuitabilityScore}</strong>
                {timelineEnabled && <span className="block text-[11px] text-slate-500">Orig. {poi.aiSuitabilityScore}</span>}
              </span>
              <span className="min-w-0 text-slate-400">
                Output <strong className="text-cyan-200">{formatEnergy(poi.timeAdjustedAnnualEnergyKwh ?? poi.annualEnergyKwh)}</strong>
                {timelineEnabled && <span className="block text-[11px] text-slate-500">Orig. {formatEnergy(poi.annualEnergyKwh)}</span>}
              </span>
              <span className="min-w-0 text-slate-400">
                Panels <strong className="text-white">{formatNumber(poi.recommendedPanelCount)}</strong>
              </span>
              <span className="min-w-0 text-slate-400">
                ROI <strong className="text-lime-200">{poi.roiLabel}</strong>
              </span>
              <span className="min-w-0 text-slate-400">
                Payback <strong className="text-white">{poi.estimatedPaybackYears} yr</strong>
              </span>
              <span className="min-w-0 text-slate-400">
                Savings <strong className="text-cyan-200">{formatCurrency(poi.estimatedAnnualSavingsUsd)}/yr</strong>
              </span>
            </div>
            {poi.decisionStatus === 'Not Recommended' && poi.rejectionReason && (
              <p className="mt-2 break-words rounded-md border border-red-400/20 bg-red-400/10 p-2 text-xs leading-snug text-red-100">
                {poi.rejectionReason}
              </p>
            )}
          </motion.button>
        ))}
      </div>
    </GlassCard>
  );
};
