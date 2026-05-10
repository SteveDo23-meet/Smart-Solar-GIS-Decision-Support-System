import { motion } from 'framer-motion';
import { BrainCircuit, MapPin, Zap } from 'lucide-react';
import { useAnalysisContext } from '../../app/providers/AnalysisProvider';
import { POI_TYPE_LABELS } from '../../data/mockPois';
import { formatCurrency, formatEnergy, formatNumber, formatPower } from '../../utils/formatters';
import { Badge } from '../ui/Badge';
import { GlassCard } from '../ui/GlassCard';
import { ProgressBar } from '../ui/ProgressBar';

interface TopLocationsProps {
  limit?: number;
}

const sourceLabel = (source: string) => (source === 'google_solar' ? 'Google Solar API' : 'AI GIS Estimate');

export const TopLocations: React.FC<TopLocationsProps> = ({ limit = 4 }) => {
  const { filteredAnalysis: analysis, selectedLocation, setSelectedLocation, solarTimeline } = useAnalysisContext();
  const topLocations = analysis?.topLocations.slice(0, limit) ?? [];
  const timelineEnabled = solarTimeline.isTimelineEnabled;

  return (
    <GlassCard className="overflow-x-hidden !p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-cyan-200">Recommended</p>
          <h2 className="text-lg font-semibold text-white">Top Locations</h2>
        </div>
        <MapPin className="h-5 w-5 text-cyan-300" />
      </div>

      <div className="space-y-3">
        {topLocations.map((poi, index) => (
          <motion.button
            key={poi.id}
            type="button"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.04 }}
            onClick={() => setSelectedLocation(poi)}
            className={`w-full min-w-0 rounded-lg border p-3 text-left transition ${
              selectedLocation?.id === poi.id
                ? 'border-cyan-300/60 bg-cyan-300/10'
                : 'border-white/10 bg-white/[0.035] hover:border-white/20 hover:bg-white/[0.06]'
            }`}
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="break-words text-sm font-semibold leading-snug text-white">{poi.name}</p>
                <p className="mt-1 break-words text-xs text-slate-400">{poi.surfaceLabel ?? POI_TYPE_LABELS[poi.type]}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <Badge variant={(poi.timeAdjustedSolarScore ?? poi.score) >= 85 ? 'success' : 'secondary'} size="sm">
                  {poi.timeAdjustedSolarScore ?? poi.score}%
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
            <ProgressBar
              value={poi.timeAdjustedSolarScore ?? poi.score}
              color={(poi.timeAdjustedSolarScore ?? poi.score) >= 85 ? '#bef264' : '#22d3ee'}
              height="sm"
            />
            <div className="mt-3 rounded-md border border-cyan-300/15 bg-cyan-300/[0.045] p-2">
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="flex min-w-0 items-center gap-1.5 text-xs font-semibold text-cyan-100">
                  <BrainCircuit className="h-3.5 w-3.5 shrink-0" />
                  AI Decision: {poi.decisionStatus}
                </span>
                <span className="shrink-0 text-xs text-slate-400">
                  AI {poi.timeAdjustedAiSuitabilityScore ?? poi.aiSuitabilityScore}
                </span>
              </div>
              <p className={`break-words text-xs leading-snug ${poi.decisionStatus === 'Not Recommended' ? 'text-red-100' : 'text-slate-400'}`}>
                {poi.decisionStatus === 'Not Recommended' && poi.rejectionReason
                  ? `Reason: ${poi.rejectionReason}`
                  : poi.recommendedAction}
              </p>
            </div>
            <div className="mt-3 rounded-md border border-lime-300/15 bg-lime-300/[0.045] p-2">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-lime-100">{poi.roiLabel}</span>
                <span className="text-slate-300">{poi.estimatedPaybackYears} yr payback</span>
              </div>
              <p className="mt-1 text-xs text-slate-400">{formatCurrency(poi.estimatedAnnualSavingsUsd)}/yr estimated savings</p>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-cyan-300" />
                {formatPower(poi.estimatedCapacityKw)}
              </span>
              <span>
                {formatEnergy(poi.timeAdjustedAnnualEnergyKwh ?? poi.annualEnergyKwh)}/yr
                {timelineEnabled && <span className="block text-[11px] text-slate-500">Orig. {formatEnergy(poi.annualEnergyKwh)}</span>}
              </span>
              <span>{formatNumber(poi.recommendedPanelCount)} panels</span>
              <span>{poi.solarEfficiencyPercent}% efficiency</span>
            </div>
            {timelineEnabled && poi.timelineNotes && poi.timelineNotes.length > 0 && (
              <p className="mt-2 break-words text-xs leading-snug text-amber-100/80">{poi.timelineNotes[0]}</p>
            )}
          </motion.button>
        ))}
      </div>
    </GlassCard>
  );
};
