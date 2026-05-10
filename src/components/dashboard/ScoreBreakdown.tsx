import { useAnalysisContext } from '../../app/providers/AnalysisProvider';
import { getRoiPlanningNote } from '../../services/roiEstimation.service';
import { getWeightedScoreBreakdown } from '../../services/solarAnalysis.service';
import { formatCurrency, formatNumber, formatPower } from '../../utils/formatters';
import { calculateSolarScore } from '../../utils/scoring';
import { Badge } from '../ui/Badge';
import { GlassCard } from '../ui/GlassCard';
import { ProgressBar } from '../ui/ProgressBar';

const sourceLabel = (source: string) => (source === 'google_solar' ? 'Google Solar API' : 'AI GIS Estimate');

export const ScoreBreakdown: React.FC = () => {
  const { filteredAnalysis: analysis, selectedLocation, solarTimeline } = useAnalysisContext();
  const active =
    (selectedLocation ? analysis?.rankedLocations.find((location) => location.id === selectedLocation.id) : null) ??
    analysis?.topLocations[0] ??
    null;
  const breakdown = active ? getWeightedScoreBreakdown(active) : null;
  const activeScore = active ? active.timeAdjustedSolarScore ?? calculateSolarScore(active) : 0;
  const timelineEnabled = solarTimeline.isTimelineEnabled;

  const factors = active && breakdown
    ? [
        {
          label: 'Solar Exposure',
          value: active.solarExposure,
          contribution: breakdown.solarExposure,
          color: '#facc15',
        },
        {
          label: 'Surface Type',
          value: active.surfaceType,
          contribution: breakdown.surfaceType,
          color: '#22d3ee',
        },
        {
          label: 'Weather',
          value: active.weatherConditions,
          contribution: breakdown.weatherConditions,
          color: '#bef264',
        },
        {
          label: 'Shading Penalty',
          value: active.shading,
          contribution: breakdown.shading,
          color: '#fb7185',
        },
      ]
    : [];

  return (
    <GlassCard className="overflow-x-hidden !p-4">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-lime-200">Solar Score Formula</p>
          <h2 className="break-words text-lg font-semibold text-white">{active?.name ?? 'No selected candidate'}</h2>
          {active && (
            <p className="mt-1 break-words text-xs text-slate-500">
              {active.surfaceLabel ?? 'Candidate surface'} / {active.weatherConditions}% weather factor
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500">Solar Score</p>
          <p className="text-3xl font-bold text-lime-200">{active ? `${activeScore}%` : '0%'}</p>
          {timelineEnabled && active && <p className="text-[11px] text-slate-500">Orig. {active.score}%</p>}
        </div>
      </div>

      <div className="space-y-4">
        {factors.map((factor) => (
          <div key={factor.label}>
            <div className="mb-2 flex items-center justify-between gap-3 text-sm">
              <div>
                <p className="font-medium text-slate-100">{factor.label}</p>
                <p className="text-xs text-slate-500">
                  contribution: {factor.contribution > 0 ? '+' : ''}
                  {factor.contribution.toFixed(0)}
                </p>
              </div>
              <p className="font-bold" style={{ color: factor.color }}>
                {factor.value}%
              </p>
            </div>
            <ProgressBar value={factor.value} color={factor.color} height="sm" />
          </div>
        ))}
      </div>

      {active && (
        <div className="mt-5 border-t border-white/10 pt-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-cyan-200">Explain AI Decision</p>
              <p className="text-xs text-slate-500">Smart Solar Suitability Engine</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-cyan-100">{active.timeAdjustedAiSuitabilityScore ?? active.aiSuitabilityScore}</p>
              <p className="text-[11px] text-slate-500">{Math.round(active.aiConfidence * 100)}% confidence</p>
            </div>
          </div>

          <div className="mb-3 flex flex-wrap gap-2">
            {timelineEnabled && <Badge variant="warning" size="sm">Timeline adjusted</Badge>}
            <Badge
              variant={active.solarEngineResult.source === 'google_solar' ? 'success' : 'secondary'}
              size="sm"
            >
              {sourceLabel(active.solarEngineResult.source)}
            </Badge>
            <Badge variant={active.aiSuitabilityLabel === 'Excellent' ? 'success' : active.aiSuitabilityLabel === 'High' ? 'secondary' : 'warning'} size="sm">
              {active.aiSuitabilityLabel}
            </Badge>
            <Badge variant={active.riskLevel === 'Low' ? 'success' : active.riskLevel === 'Medium' ? 'warning' : 'danger'} size="sm">
              {active.riskLevel} Risk
            </Badge>
            <Badge variant={active.decisionStatus === 'Recommended' ? 'success' : active.decisionStatus === 'Conditional' ? 'warning' : 'danger'} size="sm">
              {active.decisionStatus}
            </Badge>
          </div>

          <p className={`mb-3 break-words text-xs leading-snug ${active.decisionStatus === 'Not Recommended' ? 'text-red-100' : 'text-slate-300'}`}>
            {active.decisionStatus === 'Not Recommended' && active.rejectionReason
              ? `Reason: ${active.rejectionReason}`
              : active.recommendedAction}
          </p>

          {timelineEnabled && (
            <div className="mb-4 rounded-md border border-amber-300/15 bg-amber-300/[0.045] p-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-200">Timeline Impact</p>
                <Badge variant="warning" size="sm">{active.timelineImpactLabel ?? 'Moderate Exposure'}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
                <span>
                  Output <strong className="text-amber-100">{formatNumber(active.timeAdjustedAnnualEnergyKwh ?? active.annualEnergyKwh)} kWh</strong>
                </span>
                <span>
                  Shading <strong className="text-rose-100">{active.timeAdjustedShadingRisk ?? active.shading}%</strong>
                </span>
              </div>
              <div className="mt-2 space-y-1">
                {(active.timelineNotes ?? []).slice(0, 3).map((note) => (
                  <p key={note} className="break-words text-xs leading-snug text-amber-100/80">{note}</p>
                ))}
              </div>
            </div>
          )}

          <div className="mb-4 rounded-md border border-lime-300/15 bg-lime-300/[0.045] p-3">
            <div className="mb-2 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-lime-200">ROI Estimate</p>
                <p className="text-xs text-slate-500">{active.roiLabel}</p>
              </div>
              <p className="text-lg font-bold text-lime-100">{active.estimatedPaybackYears} yr</p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
              <span>
                Cost <strong className="text-white">{formatCurrency(active.estimatedInstallationCostUsd)}</strong>
              </span>
              <span>
                Savings <strong className="text-cyan-100">{formatCurrency(active.estimatedAnnualSavingsUsd)}/yr</strong>
              </span>
              <span>
                System <strong className="text-white">{formatPower(active.estimatedSystemCapacityKwp)}</strong>
              </span>
              <span>
                CO2 <strong className="text-lime-100">{formatNumber(active.estimatedCo2ReductionKgPerYear / 1000, 1)} t/yr</strong>
              </span>
            </div>
            <p className="mt-2 break-words text-[11px] leading-snug text-slate-500">{getRoiPlanningNote()}</p>
          </div>

          <div className="space-y-3">
            <div>
              <p className="mb-2 text-xs font-semibold text-lime-200">Positive factors</p>
              <div className="flex flex-wrap gap-1.5">
                {active.positiveFactors.map((factor) => (
                  <span key={factor} className="rounded-md border border-lime-300/20 bg-lime-300/10 px-2 py-1 text-[11px] text-lime-100">
                    {factor}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold text-rose-200">Negative factors</p>
              <div className="flex flex-wrap gap-1.5">
                {active.negativeFactors.map((factor) => (
                  <span key={factor} className="rounded-md border border-rose-300/20 bg-rose-300/10 px-2 py-1 text-[11px] text-rose-100">
                    {factor}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-3 space-y-1">
            {active.solarEngineResult.notes.slice(0, 2).map((line) => (
              <p key={line} className="break-words text-xs leading-snug text-cyan-100/80">
                {line}
              </p>
            ))}
            {active.aiExplanation.slice(0, 2).map((line) => (
              <p key={line} className="break-words text-xs leading-snug text-slate-500">
                {line}
              </p>
            ))}
          </div>
        </div>
      )}
    </GlassCard>
  );
};
