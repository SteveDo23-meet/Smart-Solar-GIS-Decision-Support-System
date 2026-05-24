import React from 'react';
import { RotateCcw, Settings2, SlidersHorizontal } from 'lucide-react';
import { useAnalysisContext } from '../../app/providers/AnalysisProvider';
import type { ScoringConfig } from '../../config/scoringConfig';
import type { PoiType } from '../../data/mockPois';
import { POI_TYPE_LABELS } from '../../data/mockPois';
import { GlassCard } from '../ui/GlassCard';

type FeatureWeightKey =
  | 'solarExposure'
  | 'weatherConditions'
  | 'surfaceType'
  | 'baseSolarScore'
  | 'shadingPenalty'
  | 'mediumRiskPenalty'
  | 'highRiskPenalty';

type DecisionThresholdKey =
  | 'recommendedMinScore'
  | 'conditionalMinScore'
  | 'excellentMinScore'
  | 'highMinScore'
  | 'mediumMinScore'
  | 'highRiskMinScore'
  | 'mediumRiskMinScore';

type AreaThresholdKey = 'minimumMeaningfulArea' | 'openSpaceMinimumArea' | 'roadMinimumArea';
type ShadingThresholdKey = 'mediumShading' | 'highShading' | 'rejectionShading' | 'parkTreeConflict';

const surfaceOptions = Object.entries(POI_TYPE_LABELS) as Array<[PoiType, string]>;

interface RangeControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (value: number) => void;
}

const RangeControl: React.FC<RangeControlProps> = ({ label, value, min, max, step, unit = '', onChange }) => {
  const displayValue = Number.isInteger(step) ? value : Number(value.toFixed(2));

  return (
    <label className="block min-w-0">
      <div className="mb-1 flex items-center justify-between gap-2 text-[11px] text-slate-400">
        <span className="truncate">{label}</span>
        <span className="shrink-0 font-semibold text-slate-100">
          {displayValue}
          {unit}
        </span>
      </div>
      <div className="grid grid-cols-[1fr_4.5rem] items-center gap-2">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="h-2 min-w-0 accent-cyan-300"
        />
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={displayValue}
          onChange={(event) => onChange(Number(event.target.value))}
          className="h-8 w-full rounded-md border border-white/10 bg-slate-950/70 px-2 text-right text-xs text-slate-100 outline-none focus:border-cyan-300/60"
        />
      </div>
    </label>
  );
};

export const ScoringSettings: React.FC = () => {
  const { scoringConfig, setScoringConfig, resetScoringConfig } = useAnalysisContext();
  const [selectedSurface, setSelectedSurface] = React.useState<PoiType>('parking');
  const selectedRiskWeight = scoringConfig.riskSurfaceWeights[selectedSurface] ?? scoringConfig.riskSurfaceWeights.default;

  const updateFeatureWeight = (key: FeatureWeightKey, value: number) => {
    setScoringConfig((current) => ({
      ...current,
      featureWeights: {
        ...current.featureWeights,
        [key]: value,
      },
    }));
  };

  const updateDecisionThreshold = (key: DecisionThresholdKey, value: number) => {
    setScoringConfig((current) => ({
      ...current,
      decisionThresholds: {
        ...current.decisionThresholds,
        [key]: value,
      },
    }));
  };

  const updateAreaThreshold = (key: AreaThresholdKey, value: number) => {
    setScoringConfig((current) => ({
      ...current,
      areaThresholds: {
        ...current.areaThresholds,
        [key]: value,
      },
    }));
  };

  const updateShadingThreshold = (key: ShadingThresholdKey, value: number) => {
    setScoringConfig((current) => ({
      ...current,
      shadingThresholds: {
        ...current.shadingThresholds,
        [key]: value,
      },
    }));
  };

  const updateSurfaceWeight = (value: number) => {
    setScoringConfig((current) => ({
      ...current,
      surfaceTypeWeights: {
        ...current.surfaceTypeWeights,
        [selectedSurface]: value,
      },
    }));
  };

  const updateRiskSurfaceWeight = (value: number) => {
    setScoringConfig((current) => ({
      ...current,
      riskSurfaceWeights: {
        ...current.riskSurfaceWeights,
        [selectedSurface]: value,
      } as ScoringConfig['riskSurfaceWeights'],
    }));
  };

  const updateDefaultRiskWeight = (value: number) => {
    setScoringConfig((current) => ({
      ...current,
      riskSurfaceWeights: {
        ...current.riskSurfaceWeights,
        default: value,
      },
    }));
  };

  return (
    <GlassCard className="overflow-x-hidden !p-4">
      <div className="mb-3 flex min-w-0 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Settings2 className="h-4 w-4 shrink-0 text-cyan-300" />
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.18em] text-cyan-200">Scoring Model</p>
            <p className="truncate text-xs text-slate-500">Weighted decision parameters</p>
          </div>
        </div>
        <button
          type="button"
          onClick={resetScoringConfig}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-white/10 bg-white/[0.04] text-slate-300 hover:border-cyan-300/40 hover:text-cyan-100"
          aria-label="Reset scoring configuration"
          title="Reset scoring configuration"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="space-y-4">
        <section className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
            <SlidersHorizontal className="h-3.5 w-3.5 text-lime-200" />
            Criteria weights
          </div>
          <RangeControl label="Solar exposure" value={scoringConfig.featureWeights.solarExposure} min={0} max={0.5} step={0.01} onChange={(value) => updateFeatureWeight('solarExposure', value)} />
          <RangeControl label="Weather conditions" value={scoringConfig.featureWeights.weatherConditions} min={0} max={0.35} step={0.01} onChange={(value) => updateFeatureWeight('weatherConditions', value)} />
          <RangeControl label="Surface quality" value={scoringConfig.featureWeights.surfaceType} min={0} max={0.35} step={0.01} onChange={(value) => updateFeatureWeight('surfaceType', value)} />
          <RangeControl label="Base solar score" value={scoringConfig.featureWeights.baseSolarScore} min={0} max={0.5} step={0.01} onChange={(value) => updateFeatureWeight('baseSolarScore', value)} />
          <RangeControl label="Shading penalty" value={scoringConfig.featureWeights.shadingPenalty} min={0} max={0.8} step={0.01} onChange={(value) => updateFeatureWeight('shadingPenalty', value)} />
        </section>

        <section className="space-y-2 border-t border-white/10 pt-3">
          <p className="text-xs font-semibold text-slate-200">Surface preference</p>
          <select
            value={selectedSurface}
            onChange={(event) => setSelectedSurface(event.target.value as PoiType)}
            className="h-9 w-full min-w-0 rounded-md border border-white/10 bg-slate-950/70 px-2 text-xs text-slate-100 outline-none focus:border-cyan-300/60"
          >
            {surfaceOptions.map(([type, label]) => (
              <option key={type} value={type}>
                {label}
              </option>
            ))}
          </select>
          <RangeControl label="Preference score" value={scoringConfig.surfaceTypeWeights[selectedSurface]} min={-20} max={20} step={1} onChange={updateSurfaceWeight} />
          <RangeControl label="Surface risk weight" value={selectedRiskWeight} min={0} max={30} step={1} onChange={updateRiskSurfaceWeight} />
          <RangeControl label="Default risk weight" value={scoringConfig.riskSurfaceWeights.default} min={0} max={20} step={1} onChange={updateDefaultRiskWeight} />
        </section>

        <section className="space-y-2 border-t border-white/10 pt-3">
          <p className="text-xs font-semibold text-slate-200">Decision thresholds</p>
          <RangeControl label="Recommended min" value={scoringConfig.decisionThresholds.recommendedMinScore} min={40} max={95} step={1} unit="%" onChange={(value) => updateDecisionThreshold('recommendedMinScore', value)} />
          <RangeControl label="Conditional min" value={scoringConfig.decisionThresholds.conditionalMinScore} min={20} max={80} step={1} unit="%" onChange={(value) => updateDecisionThreshold('conditionalMinScore', value)} />
          <RangeControl label="High risk min" value={scoringConfig.decisionThresholds.highRiskMinScore} min={10} max={60} step={1} onChange={(value) => updateDecisionThreshold('highRiskMinScore', value)} />
        </section>

        <section className="space-y-2 border-t border-white/10 pt-3">
          <p className="text-xs font-semibold text-slate-200">Rejection thresholds</p>
          <RangeControl label="Rejection shading" value={scoringConfig.shadingThresholds.rejectionShading} min={5} max={60} step={1} unit="%" onChange={(value) => updateShadingThreshold('rejectionShading', value)} />
          <RangeControl label="Park tree conflict" value={scoringConfig.shadingThresholds.parkTreeConflict} min={5} max={50} step={1} unit="%" onChange={(value) => updateShadingThreshold('parkTreeConflict', value)} />
          <RangeControl label="Minimum area" value={scoringConfig.areaThresholds.minimumMeaningfulArea} min={100} max={5000} step={50} unit=" m2" onChange={(value) => updateAreaThreshold('minimumMeaningfulArea', value)} />
          <RangeControl label="Road minimum area" value={scoringConfig.areaThresholds.roadMinimumArea} min={500} max={8000} step={100} unit=" m2" onChange={(value) => updateAreaThreshold('roadMinimumArea', value)} />
        </section>
      </div>
    </GlassCard>
  );
};
