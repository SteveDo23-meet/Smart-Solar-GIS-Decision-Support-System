import type { AnalyzedPOI } from './solarAnalysis.service';
import type { SolarSeason, SolarTimelineState, TimeAdjustedFields, TimelineImpactLabel } from '../types/solarTimeline';

type TimelineCandidate = AnalyzedPOI;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const treeSensitiveTypes = new Set(['park', 'open_space']);
const transportTypes = new Set(['road', 'highway', 'road_shoulder', 'transport_corridor']);

export const getSeasonFactor = (season: SolarSeason) => {
  const factors: Record<SolarSeason, number> = {
    summer: 1,
    spring: 0.88,
    autumn: 0.82,
    winter: 0.65,
  };

  return factors[season];
};

export const getTimeOfDayFactor = (hour: number) => {
  const normalizedHour = clamp(hour, 6, 18);
  const curve = Math.sin(((normalizedHour - 6) / 12) * Math.PI);
  return clamp(curve, 0.25, 1);
};

export const getShadingFactorByTime = (hour: number, baseShading: number) => {
  const edgeOfDayFactor = Math.abs(hour - 12) / 6;
  const additionalShade = edgeOfDayFactor * 18;
  const noonRelief = hour >= 11 && hour <= 14 ? 6 : 0;

  return clamp(baseShading + additionalShade - noonRelief, 0, 100);
};

const getImpactLabel = (combinedFactor: number): TimelineImpactLabel => {
  if (combinedFactor >= 0.78) return 'Peak Exposure';
  if (combinedFactor >= 0.46) return 'Moderate Exposure';
  return 'Low Exposure';
};

const getTimelineNotes = (
  candidate: TimelineCandidate,
  state: SolarTimelineState,
  combinedFactor: number,
  adjustedShading: number
) => {
  const notes: string[] = [];

  if (state.solarTimeHour >= 11 && state.solarTimeHour <= 14 && combinedFactor >= 0.78) {
    notes.push('Peak noon exposure improves expected output.');
  }
  if (state.solarSeason === 'winter') notes.push('Winter season reduces estimated yield.');
  if (state.solarSeason === 'spring') notes.push('Spring season keeps strong yield with mild seasonal reduction.');
  if (state.solarSeason === 'autumn') notes.push('Autumn season reduces late-day production.');
  if ((state.solarTimeHour <= 8 || state.solarTimeHour >= 17) && adjustedShading > candidate.shading + 8) {
    notes.push('Morning or evening shading increases risk for this site.');
  }
  if (treeSensitiveTypes.has(candidate.type) && adjustedShading >= 28) {
    notes.push('Tree-sensitive surface shows stronger timeline shading impact.');
  }
  if (transportTypes.has(candidate.type)) {
    notes.push('Transport corridor output remains constrained by safety and right-of-way limits.');
  }

  return notes.slice(0, 4);
};

export const applySolarTimelineToCandidate = <TCandidate extends TimelineCandidate>(
  candidate: TCandidate,
  timelineState: SolarTimelineState
): TCandidate & Required<Pick<TimeAdjustedFields, 'timelineImpactLabel' | 'timelineNotes' | 'solarTimeHour' | 'solarSeason'>> &
  TimeAdjustedFields => {
  if (!timelineState.isTimelineEnabled) {
    return {
      ...candidate,
      solarTimeHour: timelineState.solarTimeHour,
      solarSeason: timelineState.solarSeason,
      timelineImpactLabel: 'Peak Exposure',
      timelineNotes: [],
    };
  }

  const timeFactor = getTimeOfDayFactor(timelineState.solarTimeHour);
  const seasonFactor = getSeasonFactor(timelineState.solarSeason);
  const winterShadePenalty = timelineState.solarSeason === 'winter' ? 8 : timelineState.solarSeason === 'autumn' ? 3 : 0;
  const typeShadeSensitivity = treeSensitiveTypes.has(candidate.type) ? 1.28 : transportTypes.has(candidate.type) ? 1.12 : 1;
  const adjustedShading = clamp(
    getShadingFactorByTime(timelineState.solarTimeHour, candidate.shading) * typeShadeSensitivity + winterShadePenalty,
    0,
    100
  );
  const combinedFactor = clamp(timeFactor * seasonFactor, 0.12, 1);
  const shadingDelta = Math.max(0, adjustedShading - candidate.shading);
  const timeAdjustedSolarScore = Math.round(
    clamp(candidate.score * (0.62 + combinedFactor * 0.42) - shadingDelta * 0.25, 0, 100)
  );
  const timeAdjustedAnnualEnergyKwh = Math.round(candidate.annualEnergyKwh * combinedFactor * (1 - shadingDelta / 250));
  const timeAdjustedAiSuitabilityScore = Math.round(
    clamp(candidate.aiSuitabilityScore * (0.72 + combinedFactor * 0.28) - shadingDelta * 0.18, 0, 100)
  );

  return {
    ...candidate,
    timeAdjustedSolarScore,
    timeAdjustedAnnualEnergyKwh,
    timeAdjustedAiSuitabilityScore,
    timeAdjustedShadingRisk: Math.round(adjustedShading),
    timelineImpactLabel: getImpactLabel(combinedFactor),
    timelineNotes: getTimelineNotes(candidate, timelineState, combinedFactor, adjustedShading),
    solarTimeHour: timelineState.solarTimeHour,
    solarSeason: timelineState.solarSeason,
  };
};

export const applySolarTimelineToCandidates = <TCandidate extends TimelineCandidate>(
  candidates: TCandidate[],
  timelineState: SolarTimelineState
) => candidates.map((candidate) => applySolarTimelineToCandidate(candidate, timelineState));

export const DEFAULT_SOLAR_TIMELINE_STATE: SolarTimelineState = {
  solarTimeHour: 12,
  solarSeason: 'summer',
  isTimelineEnabled: true,
};
