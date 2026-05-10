import type { POI, PoiType } from '../data/mockPois';
import { MOCK_POIS, POI_TYPE_LABELS } from '../data/mockPois';
import type { HybridSolarResult } from './hybridSolarEngine.service';
import type { AIRecommendation } from './mlRecommendation.service';
import { applyMLRecommendations } from './mlRecommendation.service';
import type { RoiEstimate } from './roiEstimation.service';
import { applyRoiEstimates } from './roiEstimation.service';
import type { TimeAdjustedFields } from '../types/solarTimeline';
import { calculateSolarScore, getScoreBreakdown, getScoreLabel } from '../utils/scoring';

export interface AnalyzedPOI extends POI, AIRecommendation, RoiEstimate, TimeAdjustedFields {
  rank: number;
  score: number;
  scoreLabel: ReturnType<typeof getScoreLabel>;
  solarEfficiencyPercent: number;
  recommendedPanelCount: number;
  weatherFactor: number;
  annualEnergyKwh: number;
  co2OffsetTons: number;
  recommendation: string;
  solarEngineResult: HybridSolarResult;
}

export interface WeatherSnapshot {
  condition: string;
  temperatureC: number;
  cloudCover: number;
  irradianceWm2: number;
  windKph: number;
}

export interface AnalysisResult {
  totalArea: number;
  potentialLocations: number;
  rankedLocations: AnalyzedPOI[];
  topLocations: AnalyzedPOI[];
  averageScore: number;
  totalCapacityKw: number;
  estimatedAnnualEnergyKwh: number;
  estimatedPanelCount: number;
  averageSolarEfficiency: number;
  co2OffsetTons: number;
  estimatedAnnualSavingsUsd: number;
  estimatedCo2ReductionKgPerYear: number;
  weather: WeatherSnapshot;
  scoreAverages: {
    solarExposure: number;
    surfaceType: number;
    weatherConditions: number;
    shading: number;
  };
  typeSummary: Array<{
    type: PoiType;
    label: string;
    count: number;
    capacityKw: number;
    averageScore: number;
  }>;
}

const capacityFactorForScore = (score: number) => 0.16 + (score / 100) * 0.08;

const getPanelCount = (poi: POI) => {
  const surfaceRatio = Math.max(0.14, Math.min(0.72, poi.estimatedCapacityKw / Math.max(1, poi.area) / 0.2));
  return Math.max(4, Math.round((poi.area * surfaceRatio) / 2.1));
};

const getSolarEfficiency = (score: number, weatherFactor: number) => {
  return Math.round(Math.max(12, Math.min(24, 13 + score * 0.08 + weatherFactor * 0.035)));
};

const getRecommendation = (poi: POI, score: number) => {
  if (score >= 85 && poi.type === 'parking') return 'Prioritize canopy feasibility study';
  if (score >= 84 && ['highway', 'road_shoulder', 'transport_corridor'].includes(poi.type)) {
    return 'Evaluate right-of-way ownership and safety setbacks';
  }
  if (score >= 85) return 'Advance to structural and interconnection review';
  if (score >= 75) return 'Model shade and utility access constraints';
  return 'Keep in reserve pending field validation';
};

const average = (values: number[]) => {
  if (!values.length) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
};

type SolarAnalysisInput = POI & {
  solarEngineResult?: HybridSolarResult;
};

export const analyzeSolarPotential = (pois: SolarAnalysisInput[]): AnalysisResult => {
  const enrichedLocations = pois.map((poi) => {
      const fallbackScore = calculateSolarScore(poi);
      const solarEngineResult = poi.solarEngineResult ?? {
        source: 'ai_gis_estimation' as const,
        annualEnergyKwh: Math.round(
          poi.estimatedCapacityKw * 8760 * capacityFactorForScore(fallbackScore) * (poi.weatherConditions / 100)
        ),
        solarPotentialScore: fallbackScore,
        maxArrayPanelsCount: getPanelCount(poi),
        carbonOffsetKgPerYear: Math.round(
          poi.estimatedCapacityKw * 8760 * capacityFactorForScore(fallbackScore) * (poi.weatherConditions / 100) * 0.38
        ),
        confidence: 0.58,
        notes: ['AI GIS estimate used by local analysis engine.'],
      };
      const score = solarEngineResult.solarPotentialScore;
      const weatherFactor = poi.weatherConditions;
      const solarEfficiencyPercent = getSolarEfficiency(score, weatherFactor);
      const recommendedPanelCount = solarEngineResult.maxArrayPanelsCount ?? getPanelCount(poi);
      const annualEnergyKwh = Math.round(solarEngineResult.annualEnergyKwh);

      return {
        ...poi,
        solarEngineResult,
        rank: 0,
        score,
        scoreLabel: getScoreLabel(score),
        solarEfficiencyPercent,
        recommendedPanelCount,
        weatherFactor,
        annualEnergyKwh,
        co2OffsetTons: Math.round((solarEngineResult.carbonOffsetKgPerYear ?? annualEnergyKwh * 0.38) / 1000),
        recommendation: getRecommendation(poi, score),
      };
    });

  const rankedLocations = applyRoiEstimates(applyMLRecommendations(enrichedLocations))
    .sort((a, b) => b.aiSuitabilityScore - a.aiSuitabilityScore || b.score - a.score || b.estimatedCapacityKw - a.estimatedCapacityKw)
    .map((poi, index) => ({ ...poi, rank: index + 1 }));

  const totalArea = rankedLocations.reduce((sum, poi) => sum + poi.area, 0);
  const totalCapacityKw = rankedLocations.reduce((sum, poi) => sum + poi.estimatedCapacityKw, 0);
  const estimatedAnnualEnergyKwh = rankedLocations.reduce((sum, poi) => sum + poi.annualEnergyKwh, 0);
  const estimatedPanelCount = rankedLocations.reduce((sum, poi) => sum + poi.recommendedPanelCount, 0);
  const estimatedAnnualSavingsUsd = rankedLocations.reduce((sum, poi) => sum + poi.estimatedAnnualSavingsUsd, 0);
  const estimatedCo2ReductionKgPerYear = rankedLocations.reduce((sum, poi) => sum + poi.estimatedCo2ReductionKgPerYear, 0);
  const scoreAverages = {
    solarExposure: average(rankedLocations.map((poi) => poi.solarExposure)),
    surfaceType: average(rankedLocations.map((poi) => poi.surfaceType)),
    weatherConditions: average(rankedLocations.map((poi) => poi.weatherConditions)),
    shading: average(rankedLocations.map((poi) => poi.shading)),
  };

  const typeSummary = (Object.keys(POI_TYPE_LABELS) as PoiType[]).map((type) => {
    const group = rankedLocations.filter((poi) => poi.type === type);

    return {
      type,
      label: POI_TYPE_LABELS[type],
      count: group.length,
      capacityKw: group.reduce((sum, poi) => sum + poi.estimatedCapacityKw, 0),
      averageScore: average(group.map((poi) => poi.score)),
    };
  });

  return {
    totalArea,
    potentialLocations: rankedLocations.length,
    rankedLocations,
    topLocations: rankedLocations.slice(0, 5),
    averageScore: average(rankedLocations.map((poi) => poi.score)),
    totalCapacityKw,
    estimatedAnnualEnergyKwh,
    estimatedPanelCount,
    averageSolarEfficiency: average(rankedLocations.map((poi) => poi.solarEfficiencyPercent)),
    co2OffsetTons: Math.round(estimatedCo2ReductionKgPerYear / 1000),
    estimatedAnnualSavingsUsd,
    estimatedCo2ReductionKgPerYear,
    weather: generateMockWeatherData(),
    scoreAverages,
    typeSummary,
  };
};

export const analyzeMockArea = (): AnalysisResult => analyzeSolarPotential(MOCK_POIS);

export const generateMockWeatherData = (): WeatherSnapshot => ({
  condition: 'Clear coastal sun',
  temperatureC: 27,
  cloudCover: 9,
  irradianceWm2: 948,
  windKph: 14,
});

export const getWeightedScoreBreakdown = (poi: POI) => getScoreBreakdown(poi);

export const generateEnergyForecast = (baseKwh = 3200) => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return days.map((day, index) => {
    const solarCurve = 0.88 + Math.sin(index / 2.4) * 0.08;
    const predicted = Math.round(baseKwh * solarCurve);
    const optimal = Math.round(baseKwh * 1.08);

    return {
      day,
      predicted,
      optimal,
      efficiency: Math.round((predicted / optimal) * 100),
    };
  });
};
