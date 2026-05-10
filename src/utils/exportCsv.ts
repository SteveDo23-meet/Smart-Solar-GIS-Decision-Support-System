import type { AnalyzedPOI } from '../services/solarAnalysis.service';
import type { SolarTimelineState } from '../types/solarTimeline';

const escapeCsvValue = (value: string | number | undefined) => {
  const text = String(value ?? '');
  if (!/[",\n]/.test(text)) return text;
  return `"${text.replace(/"/g, '""')}"`;
};

export const exportCandidatesToCsv = (
  locations: AnalyzedPOI[],
  timelineState?: SolarTimelineState,
  filename = 'solar-suitability-report.csv'
) => {
  const columns: Array<[string, (location: AnalyzedPOI) => string | number | undefined]> = [
    ['rank', (location) => location.rank],
    ['name', (location) => location.name],
    ['type', (location) => location.type],
    ['decisionStatus', (location) => location.decisionStatus],
    ['aiSuitabilityScore', (location) => location.aiSuitabilityScore],
    ['aiConfidence', (location) => location.aiConfidence],
    ['riskLevel', (location) => location.riskLevel],
    ['annualEnergyKwh', (location) => location.annualEnergyKwh],
    ['estimatedSystemCapacityKwp', (location) => location.estimatedSystemCapacityKwp],
    ['estimatedPanelCount', (location) => location.estimatedPanelCount],
    ['estimatedInstallationCostUsd', (location) => location.estimatedInstallationCostUsd],
    ['estimatedAnnualSavingsUsd', (location) => location.estimatedAnnualSavingsUsd],
    ['estimatedPaybackYears', (location) => location.estimatedPaybackYears],
    ['estimatedCo2ReductionKgPerYear', (location) => location.estimatedCo2ReductionKgPerYear],
    ['dataSource', (location) => location.solarEngineResult.source],
    ['recommendedAction', (location) => location.recommendedAction],
    ['rejectionReason', (location) => location.rejectionReason],
    ['timeAdjustedSolarScore', (location) => location.timeAdjustedSolarScore],
    ['timeAdjustedAnnualEnergyKwh', (location) => location.timeAdjustedAnnualEnergyKwh],
    ['timeAdjustedAiSuitabilityScore', (location) => location.timeAdjustedAiSuitabilityScore],
    ['timeAdjustedShadingRisk', (location) => location.timeAdjustedShadingRisk],
    ['solarTimeHour', (location) => location.solarTimeHour ?? timelineState?.solarTimeHour],
    ['solarSeason', (location) => location.solarSeason ?? timelineState?.solarSeason],
  ];

  const header = columns.map(([column]) => column).join(',');
  const rows = locations.map((location) =>
    columns.map(([, getValue]) => escapeCsvValue(getValue(location))).join(',')
  );
  const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};
