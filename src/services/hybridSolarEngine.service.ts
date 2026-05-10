import type { POI } from '../data/mockPois';
import { calculateSolarScore } from '../utils/scoring';
import { fetchGoogleSolarBuildingInsights } from './googleSolar.service';

export interface HybridSolarResult {
  source: 'google_solar' | 'ai_gis_estimation';
  annualEnergyKwh: number;
  solarPotentialScore: number;
  sunshineHours?: number;
  roofAreaMeters2?: number;
  maxArrayPanelsCount?: number;
  carbonOffsetKgPerYear?: number;
  confidence: number;
  notes: string[];
}

export type CandidateWithHybridSolar = POI & {
  solarEngineResult: HybridSolarResult;
};

const buildingTypes = new Set(['building', 'public_building']);

const capacityFactorForScore = (score: number) => 0.16 + (score / 100) * 0.08;

const getPanelCount = (candidate: POI) => {
  const usableRatio = candidate.type === 'park' ? 0.18 : candidate.type.includes('road') ? 0.24 : 0.52;
  return Math.max(4, Math.round((candidate.area * usableRatio) / 2.1));
};

export const estimateWithAIGis = (candidate: POI, notes: string[] = []): HybridSolarResult => {
  const solarPotentialScore = calculateSolarScore(candidate);
  const annualEnergyKwh = Math.round(
    candidate.estimatedCapacityKw * 8760 * capacityFactorForScore(solarPotentialScore) * (candidate.weatherConditions / 100)
  );
  const maxArrayPanelsCount = getPanelCount(candidate);

  return {
    source: 'ai_gis_estimation',
    annualEnergyKwh,
    solarPotentialScore,
    maxArrayPanelsCount,
    carbonOffsetKgPerYear: Math.round(annualEnergyKwh * 0.38),
    confidence: buildingTypes.has(candidate.type) ? 0.58 : 0.64,
    notes: notes.length
      ? notes
      : ['AI GIS estimate based on detected surface type, area, weather factor, exposure, and shading.'],
  };
};

const getGoogleSolarResult = async (candidate: POI, signal?: AbortSignal): Promise<HybridSolarResult | null> => {
  const insights = await fetchGoogleSolarBuildingInsights(candidate.lat, candidate.lng, signal);
  if (!insights?.annualEnergyKwh && !insights?.maxArrayPanelsCount) return null;

  const fallback = estimateWithAIGis(candidate);
  const annualEnergyKwh = Math.round(insights.annualEnergyKwh ?? fallback.annualEnergyKwh);
  const maxArrayPanelsCount = insights.maxArrayPanelsCount ?? fallback.maxArrayPanelsCount;

  return {
    source: 'google_solar',
    annualEnergyKwh,
    solarPotentialScore: insights.solarPotentialScore ?? fallback.solarPotentialScore,
    sunshineHours: insights.sunshineHours,
    roofAreaMeters2: insights.roofAreaMeters2,
    maxArrayPanelsCount,
    carbonOffsetKgPerYear: Math.round(insights.carbonOffsetKgPerYear ?? annualEnergyKwh * 0.38),
    confidence: 0.88,
    notes: insights.notes,
  };
};

export const applyHybridSolarEngine = async (
  candidate: POI,
  signal?: AbortSignal
): Promise<CandidateWithHybridSolar> => {
  if (buildingTypes.has(candidate.type)) {
    try {
      const googleSolarResult = await getGoogleSolarResult(candidate, signal);
      if (googleSolarResult) {
        return {
          ...candidate,
          solarEngineResult: googleSolarResult,
        };
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') throw error;
    }

    return {
      ...candidate,
      solarEngineResult: estimateWithAIGis(candidate, ['Google Solar data unavailable; AI GIS estimate used.']),
    };
  }

  return {
    ...candidate,
    solarEngineResult: estimateWithAIGis(candidate),
  };
};

export const applyHybridSolarEngineToCandidates = async (
  candidates: POI[],
  signal?: AbortSignal
): Promise<CandidateWithHybridSolar[]> => {
  const enrichedCandidates = await Promise.all(
    candidates.map((candidate) => applyHybridSolarEngine(candidate, signal))
  );

  return enrichedCandidates;
};
