import type { PlanningArea } from '../hooks/usePolygon';
import type { AnalyzedPOI, AnalysisResult } from './solarAnalysis.service';
import { calculatePolygonArea } from '../utils/geo';

export interface AreaEfficiencySummary {
  areaId: string;
  areaLabel: string;
  polygonAreaM2: number;
  candidateCount: number;
  recommendedCount: number;
  totalAnnualEnergyKwh: number;
  annualEnergyPerM2: number;
  averageSolarScore: number;
  averageAiSuitabilityScore: number;
  averagePaybackYears: number;
  totalAnnualSavingsUsd: number;
  bestCandidateName: string;
  efficiencyLabel: 'Low Efficiency' | 'Moderate Efficiency' | 'High Efficiency' | 'Most Efficient';
}

const average = (values: number[]) => {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

const getDisplayEnergy = (candidate: AnalyzedPOI) => candidate.timeAdjustedAnnualEnergyKwh ?? candidate.annualEnergyKwh;
const getDisplayScore = (candidate: AnalyzedPOI) => candidate.timeAdjustedSolarScore ?? candidate.score;
const getDisplayAiScore = (candidate: AnalyzedPOI) =>
  candidate.timeAdjustedAiSuitabilityScore ?? candidate.aiSuitabilityScore;

const getAreaEfficiencyLabel = (
  summary: Omit<AreaEfficiencySummary, 'efficiencyLabel'>,
  bestAreaId: string
): AreaEfficiencySummary['efficiencyLabel'] => {
  if (summary.areaId === bestAreaId) return 'Most Efficient';
  if (summary.annualEnergyPerM2 >= 18 && summary.averageAiSuitabilityScore >= 72) return 'High Efficiency';
  if (summary.annualEnergyPerM2 >= 9 && summary.averageAiSuitabilityScore >= 52) return 'Moderate Efficiency';
  return 'Low Efficiency';
};

export const summarizeAreaEfficiency = (
  analysis: AnalysisResult | null,
  planningAreas: PlanningArea[]
): AreaEfficiencySummary[] => {
  if (!analysis || planningAreas.length === 0) return [];

  const rawSummaries = planningAreas.map((area) => {
    const candidates = analysis.rankedLocations.filter((candidate) => candidate.planningAreaId === area.id);
    const polygonAreaM2 = Math.max(1, calculatePolygonArea(area.polygon));
    const totalAnnualEnergyKwh = candidates.reduce((sum, candidate) => sum + getDisplayEnergy(candidate), 0);
    const recommendedCandidates = candidates.filter((candidate) => candidate.decisionStatus === 'Recommended');
    const sortedCandidates = [...candidates].sort(
      (a, b) => getDisplayAiScore(b) - getDisplayAiScore(a) || getDisplayEnergy(b) - getDisplayEnergy(a)
    );

    return {
      areaId: area.id,
      areaLabel: area.label,
      polygonAreaM2,
      candidateCount: candidates.length,
      recommendedCount: recommendedCandidates.length,
      totalAnnualEnergyKwh,
      annualEnergyPerM2: totalAnnualEnergyKwh / polygonAreaM2,
      averageSolarScore: Math.round(average(candidates.map(getDisplayScore))),
      averageAiSuitabilityScore: Math.round(average(candidates.map(getDisplayAiScore))),
      averagePaybackYears: Number(average(candidates.map((candidate) => candidate.estimatedPaybackYears)).toFixed(1)),
      totalAnnualSavingsUsd: candidates.reduce((sum, candidate) => sum + candidate.estimatedAnnualSavingsUsd, 0),
      bestCandidateName: sortedCandidates[0]?.name ?? 'No candidates detected',
    };
  });

  const bestSummary = [...rawSummaries]
    .filter((summary) => summary.candidateCount > 0)
    .sort(
      (a, b) =>
        b.annualEnergyPerM2 - a.annualEnergyPerM2 ||
        b.averageAiSuitabilityScore - a.averageAiSuitabilityScore ||
        b.totalAnnualEnergyKwh - a.totalAnnualEnergyKwh
    )[0];
  const bestAreaId = bestSummary?.areaId ?? rawSummaries[0]?.areaId ?? '';

  return rawSummaries.map((summary) => ({
    ...summary,
    efficiencyLabel: getAreaEfficiencyLabel(summary, bestAreaId),
  }));
};

export const getMostEfficientArea = (summaries: AreaEfficiencySummary[]) =>
  summaries.find((summary) => summary.efficiencyLabel === 'Most Efficient') ?? null;
