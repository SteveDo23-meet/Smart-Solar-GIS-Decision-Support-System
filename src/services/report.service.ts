import type { AnalysisResult, AnalyzedPOI } from './solarAnalysis.service';
import { getRoiPlanningNote } from './roiEstimation.service';
import type { Polygon } from '../utils/geo';
import type { SolarTimelineState } from '../types/solarTimeline';

export interface SolarSuitabilityReport {
  generatedAt: Date;
  polygonSummary: string;
  totalAnalyzedLocations: number;
  recommendedCount: number;
  conditionalCount: number;
  notRecommendedCount: number;
  totalEstimatedAnnualEnergyKwh: number;
  totalEstimatedAnnualSavingsUsd: number;
  totalCo2ReductionKgPerYear: number;
  bestRecommendedLocation: AnalyzedPOI | null;
  topRecommendedLocations: AnalyzedPOI[];
  rejectedLocations: AnalyzedPOI[];
  aiRecommendationSummary: string;
  roiSummary: string;
  googleSolarApiCount: number;
  aiGisEstimateCount: number;
  timelineEnabled: boolean;
  solarTimeHour: number;
  solarSeason: string;
  resultsMode: string;
  adjustedTotalEnergyKwh?: number;
  disclaimer: string;
  roiNote: string;
  timelineDisclaimer: string;
}

const getDecisionCount = (locations: AnalyzedPOI[], decisionStatus: AnalyzedPOI['decisionStatus']) =>
  locations.filter((location) => location.decisionStatus === decisionStatus).length;

const getPolygonSummary = (polygon: Polygon | null) => {
  if (!polygon) return 'No active polygon selected.';
  const vertices = polygon.coordinates[0]?.length ?? 0;
  return `${Math.max(0, vertices - 1)} vertices selected for GIS analysis.`;
};

export const createSolarSuitabilityReport = (
  analysis: AnalysisResult,
  polygon: Polygon | null,
  timelineState: SolarTimelineState
): SolarSuitabilityReport => {
  const rankedLocations = analysis.rankedLocations;
  const recommendedLocations = rankedLocations.filter((location) => location.decisionStatus === 'Recommended');
  const rejectedLocations = rankedLocations.filter((location) => location.decisionStatus === 'Not Recommended');
  const googleSolarApiCount = rankedLocations.filter(
    (location) => location.solarEngineResult.source === 'google_solar'
  ).length;
  const aiGisEstimateCount = rankedLocations.length - googleSolarApiCount;
  const bestRecommendedLocation = recommendedLocations[0] ?? rankedLocations[0] ?? null;
  const averagePayback =
    rankedLocations.length > 0
      ? rankedLocations.reduce((sum, location) => sum + location.estimatedPaybackYears, 0) / rankedLocations.length
      : 0;

  return {
    generatedAt: new Date(),
    polygonSummary: getPolygonSummary(polygon),
    totalAnalyzedLocations: rankedLocations.length,
    recommendedCount: getDecisionCount(rankedLocations, 'Recommended'),
    conditionalCount: getDecisionCount(rankedLocations, 'Conditional'),
    notRecommendedCount: getDecisionCount(rankedLocations, 'Not Recommended'),
    totalEstimatedAnnualEnergyKwh: analysis.estimatedAnnualEnergyKwh,
    totalEstimatedAnnualSavingsUsd: analysis.estimatedAnnualSavingsUsd,
    totalCo2ReductionKgPerYear: analysis.estimatedCo2ReductionKgPerYear,
    bestRecommendedLocation,
    topRecommendedLocations: recommendedLocations.slice(0, 5),
    rejectedLocations,
    aiRecommendationSummary: `${recommendedLocations.length} locations are recommended, ${rejectedLocations.length} locations are rejected, and ${getDecisionCount(
      rankedLocations,
      'Conditional'
    )} require conditional review.`,
    roiSummary: `Portfolio payback averages ${averagePayback.toFixed(1)} years across the filtered candidate set.`,
    googleSolarApiCount,
    aiGisEstimateCount,
    timelineEnabled: timelineState.isTimelineEnabled,
    solarTimeHour: timelineState.solarTimeHour,
    solarSeason: timelineState.solarSeason,
    resultsMode: timelineState.isTimelineEnabled ? 'Timeline-adjusted simulation' : 'Original analysis values',
    adjustedTotalEnergyKwh: timelineState.isTimelineEnabled ? analysis.estimatedAnnualEnergyKwh : undefined,
    disclaimer:
      'This report is a planning-support estimate and does not replace detailed engineering, structural, legal, or electrical design review.',
    roiNote: getRoiPlanningNote(),
    timelineDisclaimer:
      'Dynamic Solar Timeline is a simulation layer and should be validated using detailed solar engineering tools.',
  };
};
