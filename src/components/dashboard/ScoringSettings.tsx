import React from 'react';
import { RotateCcw, Settings2, SlidersHorizontal } from 'lucide-react';
import { useAnalysisContext } from '../../app/providers/AnalysisProvider';
import { getScoringCalibrationNote } from '../../config/scoringConfig';
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
  | 'conditionalMaxScore'
  | 'excellentMinScore'
  | 'highMinScore'
  | 'mediumMinScore'
  | 'highRiskMinScore'
  | 'mediumRiskMinScore';

type AreaThresholdKey =
  | 'minimumMeaningfulArea'
  | 'limitedSurfaceArea'
  | 'openSpaceMinimumArea'
  | 'confidenceAreaBonus'
  | 'roadMinimumArea'
  | 'largeUsableSurface'
  | 'smallAreaRisk';
type ShadingThresholdKey =
  | 'lowShading'
  | 'mediumShading'
  | 'elevatedShading'
  | 'highShading'
  | 'rejectionShading'
  | 'parkTreeConflict';
type RiskFactorWeightKey = 'mediumShading' | 'highShading' | 'smallArea';
type RoiThresholdKey = 'strongAnnualOutputKwh' | 'referenceAnnualOutputKwh';

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
  const calibrationPeople = scoringConfig.calibrationMetadata.intendedCalibrationBy.join(', ');

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

  const updateRiskFactorWeight = (key: RiskFactorWeightKey, value: number) => {
    setScoringConfig((current) => ({
      ...current,
      riskFactorWeights: {
        ...current.riskFactorWeights,
        [key]: value,
      },
    }));
  };

  const updateRoiThreshold = (key: RoiThresholdKey, value: number) => {
    setScoringConfig((current) => ({
      ...current,
      roiThresholds: {
        ...current.roiThresholds,
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
            <p className="truncate text-xs text-slate-500">{scoringConfig.calibrationMetadata.calibrationStatus}</p>
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

      <div className="mb-4 rounded-md border border-cyan-300/15 bg-cyan-300/[0.045] p-3">
        <p className="text-xs font-semibold text-cyan-100">{scoringConfig.calibrationMetadata.modelType}</p>
        <p className="mt-1 break-words text-[11px] leading-snug text-slate-400">{getScoringCalibrationNote()}</p>
        <p className="mt-2 break-words text-[11px] leading-snug text-slate-500">Calibration by: {calibrationPeople}</p>
      </div>

      <div className="space-y-4">
        <section className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
            <SlidersHorizontal className="h-3.5 w-3.5 text-lime-200" />
            Default criteria weights
          </div>
          <RangeControl label="Solar exposure" value={scoringConfig.featureWeights.solarExposure} min={0} max={0.5} step={0.01} onChange={(value) => updateFeatureWeight('solarExposure', value)} />
          <RangeControl label="Weather conditions" value={scoringConfig.featureWeights.weatherConditions} min={0} max={0.35} step={0.01} onChange={(value) => updateFeatureWeight('weatherConditions', value)} />
          <RangeControl label="Surface quality" value={scoringConfig.featureWeights.surfaceType} min={0} max={0.35} step={0.01} onChange={(value) => updateFeatureWeight('surfaceType', value)} />
          <RangeControl label="Base solar score" value={scoringConfig.featureWeights.baseSolarScore} min={0} max={0.5} step={0.01} onChange={(value) => updateFeatureWeight('baseSolarScore', value)} />
          <RangeControl label="Shading penalty" value={scoringConfig.featureWeights.shadingPenalty} min={0} max={0.8} step={0.01} onChange={(value) => updateFeatureWeight('shadingPenalty', value)} />
          <RangeControl label="Medium risk penalty" value={scoringConfig.featureWeights.mediumRiskPenalty} min={0} max={15} step={1} onChange={(value) => updateFeatureWeight('mediumRiskPenalty', value)} />
          <RangeControl label="High risk penalty" value={scoringConfig.featureWeights.highRiskPenalty} min={0} max={25} step={1} onChange={(value) => updateFeatureWeight('highRiskPenalty', value)} />
        </section>

        <section className="space-y-2 border-t border-white/10 pt-3">
          <p className="text-xs font-semibold text-slate-200">Default surface preference</p>
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
          <p className="text-xs font-semibold text-slate-200">Default decision thresholds</p>
          <RangeControl label="Recommended min" value={scoringConfig.decisionThresholds.recommendedMinScore} min={40} max={95} step={1} unit="%" onChange={(value) => updateDecisionThreshold('recommendedMinScore', value)} />
          <RangeControl label="Conditional min" value={scoringConfig.decisionThresholds.conditionalMinScore} min={20} max={80} step={1} unit="%" onChange={(value) => updateDecisionThreshold('conditionalMinScore', value)} />
          <RangeControl label="Conditional max" value={scoringConfig.decisionThresholds.conditionalMaxScore} min={40} max={95} step={1} unit="%" onChange={(value) => updateDecisionThreshold('conditionalMaxScore', value)} />
          <RangeControl label="Excellent label min" value={scoringConfig.decisionThresholds.excellentMinScore} min={60} max={100} step={1} unit="%" onChange={(value) => updateDecisionThreshold('excellentMinScore', value)} />
          <RangeControl label="High label min" value={scoringConfig.decisionThresholds.highMinScore} min={40} max={95} step={1} unit="%" onChange={(value) => updateDecisionThreshold('highMinScore', value)} />
          <RangeControl label="Medium label min" value={scoringConfig.decisionThresholds.mediumMinScore} min={20} max={80} step={1} unit="%" onChange={(value) => updateDecisionThreshold('mediumMinScore', value)} />
          <RangeControl label="Medium risk min" value={scoringConfig.decisionThresholds.mediumRiskMinScore} min={5} max={40} step={1} onChange={(value) => updateDecisionThreshold('mediumRiskMinScore', value)} />
          <RangeControl label="High risk min" value={scoringConfig.decisionThresholds.highRiskMinScore} min={10} max={60} step={1} onChange={(value) => updateDecisionThreshold('highRiskMinScore', value)} />
        </section>

        <section className="space-y-2 border-t border-white/10 pt-3">
          <p className="text-xs font-semibold text-slate-200">Default shading thresholds</p>
          <RangeControl label="Low shading" value={scoringConfig.shadingThresholds.lowShading} min={0} max={30} step={1} unit="%" onChange={(value) => updateShadingThreshold('lowShading', value)} />
          <RangeControl label="Medium shading" value={scoringConfig.shadingThresholds.mediumShading} min={5} max={50} step={1} unit="%" onChange={(value) => updateShadingThreshold('mediumShading', value)} />
          <RangeControl label="Elevated shading" value={scoringConfig.shadingThresholds.elevatedShading} min={5} max={60} step={1} unit="%" onChange={(value) => updateShadingThreshold('elevatedShading', value)} />
          <RangeControl label="High shading" value={scoringConfig.shadingThresholds.highShading} min={10} max={70} step={1} unit="%" onChange={(value) => updateShadingThreshold('highShading', value)} />
          <RangeControl label="Rejection shading" value={scoringConfig.shadingThresholds.rejectionShading} min={5} max={60} step={1} unit="%" onChange={(value) => updateShadingThreshold('rejectionShading', value)} />
          <RangeControl label="Park tree conflict" value={scoringConfig.shadingThresholds.parkTreeConflict} min={5} max={50} step={1} unit="%" onChange={(value) => updateShadingThreshold('parkTreeConflict', value)} />
        </section>

        <section className="space-y-2 border-t border-white/10 pt-3">
          <p className="text-xs font-semibold text-slate-200">Default area thresholds</p>
          <RangeControl label="Minimum area" value={scoringConfig.areaThresholds.minimumMeaningfulArea} min={100} max={5000} step={50} unit=" m2" onChange={(value) => updateAreaThreshold('minimumMeaningfulArea', value)} />
          <RangeControl label="Limited surface area" value={scoringConfig.areaThresholds.limitedSurfaceArea} min={100} max={6000} step={50} unit=" m2" onChange={(value) => updateAreaThreshold('limitedSurfaceArea', value)} />
          <RangeControl label="Open space minimum" value={scoringConfig.areaThresholds.openSpaceMinimumArea} min={100} max={8000} step={100} unit=" m2" onChange={(value) => updateAreaThreshold('openSpaceMinimumArea', value)} />
          <RangeControl label="Confidence area bonus" value={scoringConfig.areaThresholds.confidenceAreaBonus} min={500} max={10000} step={100} unit=" m2" onChange={(value) => updateAreaThreshold('confidenceAreaBonus', value)} />
          <RangeControl label="Road minimum area" value={scoringConfig.areaThresholds.roadMinimumArea} min={500} max={8000} step={100} unit=" m2" onChange={(value) => updateAreaThreshold('roadMinimumArea', value)} />
          <RangeControl label="Large usable surface" value={scoringConfig.areaThresholds.largeUsableSurface} min={1000} max={30000} step={500} unit=" m2" onChange={(value) => updateAreaThreshold('largeUsableSurface', value)} />
          <RangeControl label="Small area risk" value={scoringConfig.areaThresholds.smallAreaRisk} min={100} max={5000} step={50} unit=" m2" onChange={(value) => updateAreaThreshold('smallAreaRisk', value)} />
        </section>

        <section className="space-y-2 border-t border-white/10 pt-3">
          <p className="text-xs font-semibold text-slate-200">Default risk contributions</p>
          <RangeControl label="Medium shading risk" value={scoringConfig.riskFactorWeights.mediumShading} min={0} max={25} step={1} onChange={(value) => updateRiskFactorWeight('mediumShading', value)} />
          <RangeControl label="High shading risk" value={scoringConfig.riskFactorWeights.highShading} min={0} max={40} step={1} onChange={(value) => updateRiskFactorWeight('highShading', value)} />
          <RangeControl label="Small area risk" value={scoringConfig.riskFactorWeights.smallArea} min={0} max={30} step={1} onChange={(value) => updateRiskFactorWeight('smallArea', value)} />
        </section>

        <section className="space-y-2 border-t border-white/10 pt-3">
          <p className="text-xs font-semibold text-slate-200">Default ROI/output thresholds</p>
          <RangeControl label="Strong annual output" value={scoringConfig.roiThresholds.strongAnnualOutputKwh} min={50000} max={2000000} step={50000} unit=" kWh" onChange={(value) => updateRoiThreshold('strongAnnualOutputKwh', value)} />
          <RangeControl label="Reference annual output" value={scoringConfig.roiThresholds.referenceAnnualOutputKwh} min={100000} max={3000000} step={50000} unit=" kWh" onChange={(value) => updateRoiThreshold('referenceAnnualOutputKwh', value)} />
        </section>
      </div>
    </GlassCard>
  );
};
