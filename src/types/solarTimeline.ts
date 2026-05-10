export type SolarSeason = 'winter' | 'spring' | 'summer' | 'autumn';

export interface SolarTimelineState {
  solarTimeHour: number;
  solarSeason: SolarSeason;
  isTimelineEnabled: boolean;
}

export type TimelineImpactLabel = 'Low Exposure' | 'Moderate Exposure' | 'Peak Exposure';

export interface TimeAdjustedFields {
  timeAdjustedSolarScore?: number;
  timeAdjustedAnnualEnergyKwh?: number;
  timeAdjustedAiSuitabilityScore?: number;
  timeAdjustedShadingRisk?: number;
  timelineImpactLabel?: TimelineImpactLabel;
  timelineNotes?: string[];
  solarTimeHour?: number;
  solarSeason?: SolarSeason;
}
