import type { POI, PoiType } from '../data/mockPois';

export type AISuitabilityLabel = 'Low' | 'Medium' | 'High' | 'Excellent';
export type RiskLevel = 'Low' | 'Medium' | 'High';
export type DecisionStatus = 'Recommended' | 'Conditional' | 'Not Recommended';

export interface AIRecommendation {
  aiSuitabilityScore: number;
  aiConfidence: number;
  aiSuitabilityLabel: AISuitabilityLabel;
  riskLevel: RiskLevel;
  recommendedAction: string;
  aiExplanation: string[];
  positiveFactors: string[];
  negativeFactors: string[];
  isRecommended: boolean;
  rejectionReason?: string;
  decisionStatus: DecisionStatus;
}

export type SolarCandidateWithAI<TCandidate extends POI = POI> = TCandidate & AIRecommendation;

type MLInputCandidate = POI & {
  score?: number;
  annualEnergyKwh?: number;
  recommendedPanelCount?: number;
  solarEfficiencyPercent?: number;
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const preferredSurfaceBonus: Partial<Record<PoiType, number>> = {
  parking: 12,
  building: 10,
  public_building: 10,
  paved_area: 8,
  open_space: 4,
  bus_station: 3,
  transport_corridor: 0,
  road_shoulder: -2,
  highway: -3,
  road: -5,
  park: -10,
};

const riskSurfacePenalty: Partial<Record<PoiType, number>> = {
  park: 24,
  road: 18,
  highway: 22,
  road_shoulder: 20,
  transport_corridor: 18,
  bus_station: 8,
};

export const getAISuitabilityLabel = (score: number): AISuitabilityLabel => {
  if (score >= 86) return 'Excellent';
  if (score >= 72) return 'High';
  if (score >= 52) return 'Medium';
  return 'Low';
};

export const getRiskLevel = (candidate: MLInputCandidate): RiskLevel => {
  const surfaceRisk = riskSurfacePenalty[candidate.type] ?? 6;
  const shadingRisk = candidate.shading > 28 ? 18 : candidate.shading > 16 ? 9 : 0;
  const areaRisk = candidate.area < 850 ? 10 : 0;
  const riskScore = surfaceRisk + shadingRisk + areaRisk;

  if (riskScore >= 32) return 'High';
  if (riskScore >= 16) return 'Medium';
  return 'Low';
};

const getDecisionStatus = (score: number, riskLevel: RiskLevel): DecisionStatus => {
  if (score >= 75 && riskLevel !== 'High') return 'Recommended';
  if (score >= 50 && score <= 74 && riskLevel !== 'High') return 'Conditional';
  return 'Not Recommended';
};

const getRejectionReason = (candidate: MLInputCandidate): string => {
  if (candidate.type === 'park' && candidate.shading >= 22) {
    return 'High tree shading and public-use conflict reduce installation feasibility.';
  }

  if (['road_shoulder', 'road', 'highway', 'transport_corridor'].includes(candidate.type) && candidate.area < 3_000) {
    return 'Limited usable surface and high infrastructure risk.';
  }

  if (candidate.type === 'open_space' && candidate.area < 1_500) {
    return 'Insufficient area for meaningful solar output.';
  }

  if (candidate.shading >= 30) {
    return 'Shading risk is too high for efficient solar production.';
  }

  if (candidate.area < 900) {
    return 'Insufficient usable area for a meaningful solar installation.';
  }

  return 'Combined suitability score and implementation risk do not support recommendation.';
};

export const getRecommendedAction = (
  candidate: MLInputCandidate,
  score: number,
  riskLevel: RiskLevel
): string => {
  if (score >= 86 && riskLevel === 'Low') return 'Advance to feasibility and interconnection review';
  if (score < 50 || riskLevel === 'High') return 'Do not prioritize; document rejection rationale';
  if (candidate.type === 'parking' && score >= 74) return 'Prioritize canopy layout and ownership validation';
  if (['building', 'public_building'].includes(candidate.type) && score >= 70) {
    return 'Request roof survey and structural load check';
  }
  if (['road', 'highway', 'road_shoulder', 'transport_corridor'].includes(candidate.type)) {
    return 'Validate right-of-way, setbacks, and safety constraints';
  }
  if (candidate.type === 'park') return 'Review public-use conflict and tree preservation constraints';
  if (score >= 62) return 'Keep in shortlist pending field validation';
  return 'Deprioritize until constraints improve';
};

const getPositiveFactors = (candidate: MLInputCandidate): string[] => {
  const factors: string[] = [];

  if (candidate.solarExposure >= 88) factors.push('Strong solar exposure');
  if (candidate.area >= 8_000) factors.push('Large usable surface');
  if (candidate.weatherConditions >= 88) factors.push('Favorable weather factor');
  if ((candidate.annualEnergyKwh ?? 0) >= 500_000) factors.push('High annual output potential');
  if (['parking', 'building', 'public_building', 'paved_area'].includes(candidate.type)) {
    factors.push('Practical installation surface');
  }
  if (candidate.shading <= 10) factors.push('Low shading risk');

  return factors.slice(0, 4);
};

const getNegativeFactors = (candidate: MLInputCandidate): string[] => {
  const factors: string[] = [];

  if (candidate.shading >= 22) factors.push('Elevated shading risk');
  if (candidate.area < 1_200) factors.push('Limited surface area');
  if (candidate.weatherConditions < 82) factors.push('Lower weather reliability');
  if (candidate.type === 'park') factors.push('Public-use and tree conflict');
  if (['road', 'highway', 'road_shoulder', 'transport_corridor'].includes(candidate.type)) {
    factors.push('Transport safety and access constraints');
  }
  if (candidate.surfaceType < 70) factors.push('Surface suitability requires review');

  return factors.slice(0, 4);
};

export const getAIExplanation = (
  candidate: MLInputCandidate,
  score: number,
  riskLevel: RiskLevel
): string[] => {
  const explanation = [
    `Suitability model ranks this candidate as ${getAISuitabilityLabel(score).toLowerCase()} based on surface, output, and risk signals.`,
    `Risk is ${riskLevel.toLowerCase()} due to shading, surface class, and implementation constraints.`,
  ];

  if (candidate.type === 'parking') explanation.push('Parking areas are favored for solar canopies and predictable ownership review.');
  if (['building', 'public_building'].includes(candidate.type)) {
    explanation.push('Public roofs are favored when structural review is feasible.');
  }
  if (['road', 'highway', 'road_shoulder', 'transport_corridor'].includes(candidate.type)) {
    explanation.push('Transport corridors retain energy potential but require safety and right-of-way validation.');
  }
  if (candidate.type === 'park') explanation.push('Park candidates are penalized for tree cover and public-space conflicts.');

  return explanation.slice(0, 4);
};

export const applyMLRecommendation = <TCandidate extends MLInputCandidate>(
  candidate: TCandidate
): SolarCandidateWithAI<TCandidate> => {
  const normalizedOutput = clamp(((candidate.annualEnergyKwh ?? 0) / 1_000_000) * 14, 0, 14);
  const areaSignal = clamp(Math.log10(Math.max(candidate.area, 100)) * 8 - 16, 0, 18);
  const scoreSignal = (candidate.score ?? 0) * 0.22;
  const exposureSignal = candidate.solarExposure * 0.24;
  const weatherSignal = candidate.weatherConditions * 0.12;
  const surfaceSignal = candidate.surfaceType * 0.12;
  const shadingPenalty = candidate.shading * 0.34;
  const typeSignal = preferredSurfaceBonus[candidate.type] ?? 0;
  const riskLevel = getRiskLevel(candidate);
  const riskPenalty = riskLevel === 'High' ? 10 : riskLevel === 'Medium' ? 4 : 0;
  const aiSuitabilityScore = Math.round(
    clamp(
      exposureSignal + weatherSignal + surfaceSignal + scoreSignal + areaSignal + normalizedOutput + typeSignal - shadingPenalty - riskPenalty,
      0,
      100
    )
  );
  const decisionStatus = getDecisionStatus(aiSuitabilityScore, riskLevel);
  const rejectionReason = decisionStatus === 'Not Recommended' ? getRejectionReason(candidate) : undefined;
  const positiveFactors = getPositiveFactors(candidate);
  const negativeFactors = rejectionReason ? [rejectionReason, ...getNegativeFactors(candidate)].slice(0, 4) : getNegativeFactors(candidate);
  const confidenceBase = 0.58 + positiveFactors.length * 0.055 - negativeFactors.length * 0.025;
  const aiConfidence = Number(clamp(confidenceBase + (candidate.area > 2_500 ? 0.06 : 0), 0.42, 0.94).toFixed(2));

  return {
    ...candidate,
    aiSuitabilityScore,
    aiConfidence,
    aiSuitabilityLabel: getAISuitabilityLabel(aiSuitabilityScore),
    riskLevel,
    recommendedAction: getRecommendedAction(candidate, aiSuitabilityScore, riskLevel),
    aiExplanation: getAIExplanation(candidate, aiSuitabilityScore, riskLevel),
    positiveFactors,
    negativeFactors,
    isRecommended: decisionStatus !== 'Not Recommended',
    rejectionReason,
    decisionStatus,
  };
};

export const applyMLRecommendations = <TCandidate extends MLInputCandidate>(
  candidates: TCandidate[]
): Array<SolarCandidateWithAI<TCandidate>> => {
  return candidates.map((candidate) => applyMLRecommendation(candidate));
};
