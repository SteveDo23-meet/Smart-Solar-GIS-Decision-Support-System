import { X } from 'lucide-react';
import { useAnalysisContext } from '../../app/providers/AnalysisProvider';
import { POI_TYPE_LABELS } from '../../data/mockPois';
import type { POI } from '../../data/mockPois';
import type { AnalyzedPOI } from '../../services/solarAnalysis.service';
import { formatArea, formatCurrency, formatEnergy, formatNumber, formatPower } from '../../utils/formatters';
import { Badge } from '../ui/Badge';

const isAnalyzedPoi = (poi: unknown): poi is AnalyzedPOI => {
  return Boolean(poi && typeof poi === 'object' && 'aiSuitabilityScore' in poi && 'decisionStatus' in poi);
};

const decisionVariant = (decisionStatus: AnalyzedPOI['decisionStatus']) => {
  if (decisionStatus === 'Recommended') return 'success';
  if (decisionStatus === 'Conditional') return 'warning';
  return 'danger';
};

const riskVariant = (riskLevel: AnalyzedPOI['riskLevel']) => {
  if (riskLevel === 'Low') return 'success';
  if (riskLevel === 'Medium') return 'warning';
  return 'danger';
};

interface InfoTileProps {
  label: string;
  value: string | number;
  valueClassName?: string;
}

const InfoTile: React.FC<InfoTileProps> = ({ label, value, valueClassName = 'text-white' }) => (
  <span className="rounded-md border border-white/10 bg-white/[0.035] p-2">
    {label} <strong className={`block text-sm ${valueClassName}`}>{value}</strong>
  </span>
);

const SmallMetric: React.FC<InfoTileProps> = ({ label, value, valueClassName = 'text-white' }) => (
  <span>
    {label} <strong className={valueClassName}>{value}</strong>
  </span>
);

const getSelectedLocation = (selectedLocation: POI | null, rankedLocations: AnalyzedPOI[] = []) => {
  if (!selectedLocation) return null;
  return rankedLocations.find((location) => location.id === selectedLocation.id) ?? selectedLocation;
};

export const SelectedLocationPanel: React.FC = () => {
  const { filteredAnalysis, selectedLocation, setSelectedLocation, solarTimeline } = useAnalysisContext();
  const active = getSelectedLocation(selectedLocation, filteredAnalysis?.rankedLocations);

  if (!active) return null;

  const analyzed = isAnalyzedPoi(active) ? active : null;
  const aiScore = analyzed?.timeAdjustedAiSuitabilityScore ?? analyzed?.aiSuitabilityScore ?? 'Pending';
  const annualEnergy = analyzed?.timeAdjustedAnnualEnergyKwh ?? analyzed?.annualEnergyKwh;
  const solarScore = analyzed?.timeAdjustedSolarScore ?? analyzed?.score ?? active.solarExposure;
  const shading = analyzed?.timeAdjustedShadingRisk ?? active.shading;
  const output = annualEnergy ? `${formatEnergy(annualEnergy)}/yr` : 'Pending';
  const timelineEnabled = solarTimeline.isTimelineEnabled && Boolean(analyzed?.timeAdjustedAiSuitabilityScore);
  const actionText =
    analyzed?.decisionStatus === 'Not Recommended' && analyzed.rejectionReason
      ? `Reason: ${analyzed.rejectionReason}`
      : analyzed?.recommendedAction;

  return (
    <aside className="absolute left-3 top-24 z-40 max-h-[calc(100vh-15rem)] w-[min(360px,calc(100vw-1.5rem))] overflow-y-auto rounded-lg border border-white/10 bg-slate-950/82 p-4 shadow-2xl backdrop-blur-xl lg:left-4">
      <div className="mb-3 flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.18em] text-cyan-200">Selected Area</p>
          <h2 className="mt-1 break-words text-base font-semibold leading-snug text-white">{active.name}</h2>
          <p className="mt-1 break-words text-xs leading-snug text-slate-400">{active.address}</p>
        </div>
        <button
          type="button"
          onClick={() => setSelectedLocation(null)}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-white/10 bg-white/[0.04] text-slate-300 hover:border-cyan-300/40 hover:text-cyan-100"
          aria-label="Close selected area details"
          title="Close selected area details"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        <Badge variant="secondary" size="sm">{active.surfaceLabel ?? POI_TYPE_LABELS[active.type]}</Badge>
        {analyzed && <Badge variant={decisionVariant(analyzed.decisionStatus)} size="sm">{analyzed.decisionStatus}</Badge>}
        {analyzed && <Badge variant={riskVariant(analyzed.riskLevel)} size="sm">{analyzed.riskLevel} Risk</Badge>}
        {timelineEnabled && <Badge variant="warning" size="sm">Timeline adjusted</Badge>}
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
        <InfoTile label="Area" value={formatArea(active.area)} />
        <InfoTile label="AI Score" value={aiScore} valueClassName="text-cyan-100" />
        <InfoTile label="Solar" value={`${solarScore}%`} valueClassName="text-lime-100" />
        <InfoTile label="Shading" value={`${shading}%`} valueClassName="text-rose-100" />
        <InfoTile label="Capacity" value={formatPower(active.estimatedCapacityKw)} />
        <InfoTile label="Output" value={output} valueClassName="text-cyan-100" />
      </div>

      {analyzed && (
        <div className="mt-3 border-t border-white/10 pt-3">
          <div className="mb-2 grid grid-cols-2 gap-2 text-xs text-slate-400">
            <SmallMetric label="Panels" value={formatNumber(analyzed.recommendedPanelCount)} />
            <SmallMetric label="ROI" value={analyzed.roiLabel} valueClassName="text-lime-100" />
            <SmallMetric label="Payback" value={`${analyzed.estimatedPaybackYears} yr`} />
            <SmallMetric label="Savings" value={`${formatCurrency(analyzed.estimatedAnnualSavingsUsd)}/yr`} valueClassName="text-cyan-100" />
          </div>
          <p className={`break-words text-xs leading-snug ${analyzed.decisionStatus === 'Not Recommended' ? 'text-red-100' : 'text-slate-300'}`}>
            {actionText}
          </p>
        </div>
      )}
    </aside>
  );
};
