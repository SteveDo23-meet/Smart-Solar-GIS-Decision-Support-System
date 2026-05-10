/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useMockAnalysis } from '../../hooks/useMockAnalysis';
import type { AnalysisResult, AnalyzedPOI } from '../../services/solarAnalysis.service';
import type { POI, PoiType } from '../../data/mockPois';
import { POI_TYPE_LABELS } from '../../data/mockPois';
import { applySolarTimelineToCandidates, DEFAULT_SOLAR_TIMELINE_STATE } from '../../services/solarTimeline.service';
import type { SolarSeason, SolarTimelineState } from '../../types/solarTimeline';

export type DecisionFilter = 'all' | 'Recommended' | 'Conditional' | 'Not Recommended';
export type SurfaceFilter =
  | 'all'
  | 'parking'
  | 'bus_station'
  | 'building'
  | 'open_space'
  | 'park'
  | 'road_transport'
  | 'paved_area';
export type DataSourceFilter = 'all' | 'google_solar' | 'ai_gis_estimation';
export type RiskFilter = 'all' | 'Low' | 'Medium' | 'High';

export interface AnalysisFiltersState {
  decisionStatus: DecisionFilter;
  surfaceType: SurfaceFilter;
  dataSource: DataSourceFilter;
  riskLevel: RiskFilter;
}

export const DEFAULT_ANALYSIS_FILTERS: AnalysisFiltersState = {
  decisionStatus: 'all',
  surfaceType: 'all',
  dataSource: 'all',
  riskLevel: 'all',
};

interface AnalysisContextType {
  analysis: AnalysisResult | null;
  filteredAnalysis: AnalysisResult | null;
  isLoading: boolean;
  isAnalyzed: boolean;
  error: string | null;
  runAnalysis: (pois: POI[]) => void;
  clearAnalysis: () => void;
  candidateLocations: POI[];
  selectedLocation: POI | null;
  setSelectedLocation: (poi: POI | null) => void;
  overlayResetKey: number;
  filters: AnalysisFiltersState;
  setFilters: (filters: AnalysisFiltersState) => void;
  updateFilter: <TKey extends keyof AnalysisFiltersState>(key: TKey, value: AnalysisFiltersState[TKey]) => void;
  clearFilters: () => void;
  isReportOpen: boolean;
  setIsReportOpen: (isOpen: boolean) => void;
  solarTimeline: SolarTimelineState;
  setSolarTimeHour: (hour: number) => void;
  setSolarSeason: (season: SolarSeason) => void;
  setIsTimelineEnabled: (isEnabled: boolean) => void;
  resetSolarTimeline: () => void;
}

const AnalysisContext = createContext<AnalysisContextType | undefined>(undefined);

export const useAnalysisContext = () => {
  const context = useContext(AnalysisContext);
  if (!context) {
    throw new Error('useAnalysisContext must be used within AnalysisProvider');
  }
  return context;
};

interface AnalysisProviderProps {
  children: ReactNode;
}

const average = (values: number[]) => {
  if (!values.length) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
};

const matchesSurfaceFilter = (location: AnalyzedPOI, surfaceType: SurfaceFilter) => {
  if (surfaceType === 'all') return true;
  if (surfaceType === 'building') return ['building', 'public_building'].includes(location.type);
  if (surfaceType === 'road_transport') {
    return ['road', 'highway', 'road_shoulder', 'transport_corridor'].includes(location.type);
  }
  return location.type === surfaceType;
};

const filterLocations = (locations: AnalyzedPOI[], filters: AnalysisFiltersState) =>
  locations.filter((location) => {
    const decisionMatch = filters.decisionStatus === 'all' || location.decisionStatus === filters.decisionStatus;
    const surfaceMatch = matchesSurfaceFilter(location, filters.surfaceType);
    const sourceMatch = filters.dataSource === 'all' || location.solarEngineResult.source === filters.dataSource;
    const riskMatch = filters.riskLevel === 'all' || location.riskLevel === filters.riskLevel;

    return decisionMatch && surfaceMatch && sourceMatch && riskMatch;
  });

const getDisplayEnergy = (poi: AnalyzedPOI) => poi.timeAdjustedAnnualEnergyKwh ?? poi.annualEnergyKwh;
const getDisplayScore = (poi: AnalyzedPOI) => poi.timeAdjustedSolarScore ?? poi.score;
const getDisplaySavings = (poi: AnalyzedPOI) => {
  const savingsPerKwh = poi.annualEnergyKwh > 0 ? poi.estimatedAnnualSavingsUsd / poi.annualEnergyKwh : 0.18;
  return Math.round(getDisplayEnergy(poi) * savingsPerKwh);
};
const getDisplayCo2 = (poi: AnalyzedPOI) => {
  const co2PerKwh = poi.annualEnergyKwh > 0 ? poi.estimatedCo2ReductionKgPerYear / poi.annualEnergyKwh : 0.45;
  return Math.round(getDisplayEnergy(poi) * co2PerKwh);
};

const createFilteredAnalysis = (analysis: AnalysisResult, rankedLocations: AnalyzedPOI[]): AnalysisResult => {
  const estimatedAnnualEnergyKwh = rankedLocations.reduce((sum, poi) => sum + getDisplayEnergy(poi), 0);
  const estimatedPanelCount = rankedLocations.reduce((sum, poi) => sum + poi.recommendedPanelCount, 0);
  const estimatedAnnualSavingsUsd = rankedLocations.reduce((sum, poi) => sum + getDisplaySavings(poi), 0);
  const estimatedCo2ReductionKgPerYear = rankedLocations.reduce((sum, poi) => sum + getDisplayCo2(poi), 0);

  return {
    ...analysis,
    totalArea: rankedLocations.reduce((sum, poi) => sum + poi.area, 0),
    potentialLocations: rankedLocations.length,
    rankedLocations,
    topLocations: rankedLocations.slice(0, 5),
    averageScore: average(rankedLocations.map((poi) => getDisplayScore(poi))),
    totalCapacityKw: rankedLocations.reduce((sum, poi) => sum + poi.estimatedCapacityKw, 0),
    estimatedAnnualEnergyKwh,
    estimatedPanelCount,
    averageSolarEfficiency: average(rankedLocations.map((poi) => poi.solarEfficiencyPercent)),
    co2OffsetTons: Math.round(estimatedCo2ReductionKgPerYear / 1000),
    estimatedAnnualSavingsUsd,
    estimatedCo2ReductionKgPerYear,
    scoreAverages: {
      solarExposure: average(rankedLocations.map((poi) => poi.solarExposure)),
      surfaceType: average(rankedLocations.map((poi) => poi.surfaceType)),
      weatherConditions: average(rankedLocations.map((poi) => poi.weatherConditions)),
      shading: average(rankedLocations.map((poi) => poi.timeAdjustedShadingRisk ?? poi.shading)),
    },
    typeSummary: (Object.keys(POI_TYPE_LABELS) as PoiType[]).map((type) => {
      const group = rankedLocations.filter((poi) => poi.type === type);

      return {
        type,
        label: POI_TYPE_LABELS[type],
        count: group.length,
        capacityKw: group.reduce((sum, poi) => sum + poi.estimatedCapacityKw, 0),
        averageScore: average(group.map((poi) => getDisplayScore(poi))),
      };
    }),
  };
};

export const AnalysisProvider: React.FC<AnalysisProviderProps> = ({ children }) => {
  const analysisLogic = useMockAnalysis();
  const [selectedLocation, setSelectedLocation] = React.useState<POI | null>(null);
  const [filters, setFilters] = React.useState<AnalysisFiltersState>(DEFAULT_ANALYSIS_FILTERS);
  const [isReportOpen, setIsReportOpen] = React.useState(false);
  const [solarTimeline, setSolarTimeline] = React.useState<SolarTimelineState>(DEFAULT_SOLAR_TIMELINE_STATE);

  const filteredAnalysis = React.useMemo(() => {
    if (!analysisLogic.analysis) return null;
    const filteredLocations = filterLocations(analysisLogic.analysis.rankedLocations, filters);
    const timelineLocations = solarTimeline.isTimelineEnabled
      ? applySolarTimelineToCandidates(filteredLocations, solarTimeline)
          .sort(
            (a, b) =>
              (b.timeAdjustedAiSuitabilityScore ?? b.aiSuitabilityScore) -
                (a.timeAdjustedAiSuitabilityScore ?? a.aiSuitabilityScore) ||
              (b.timeAdjustedSolarScore ?? b.score) - (a.timeAdjustedSolarScore ?? a.score)
          )
          .map((location, index) => ({ ...location, rank: index + 1 }))
      : filteredLocations.map((location, index) => ({
          ...location,
          rank: index + 1,
          timeAdjustedSolarScore: undefined,
          timeAdjustedAnnualEnergyKwh: undefined,
          timeAdjustedAiSuitabilityScore: undefined,
          timeAdjustedShadingRisk: undefined,
          timelineImpactLabel: undefined,
          timelineNotes: undefined,
          solarTimeHour: undefined,
          solarSeason: undefined,
        }));

    return createFilteredAnalysis(analysisLogic.analysis, timelineLocations);
  }, [analysisLogic.analysis, filters, solarTimeline]);

  const updateFilter = React.useCallback(
    <TKey extends keyof AnalysisFiltersState>(key: TKey, value: AnalysisFiltersState[TKey]) => {
      setFilters((currentFilters) => ({ ...currentFilters, [key]: value }));
    },
    []
  );

  const clearFilters = React.useCallback(() => {
    setFilters(DEFAULT_ANALYSIS_FILTERS);
  }, []);

  const setSolarTimeHour = React.useCallback((hour: number) => {
    setSolarTimeline((currentTimeline) => ({
      ...currentTimeline,
      solarTimeHour: Math.max(6, Math.min(18, Math.round(hour))),
    }));
  }, []);

  const setSolarSeason = React.useCallback((season: SolarSeason) => {
    setSolarTimeline((currentTimeline) => ({ ...currentTimeline, solarSeason: season }));
  }, []);

  const setIsTimelineEnabled = React.useCallback((isEnabled: boolean) => {
    setSolarTimeline((currentTimeline) => ({ ...currentTimeline, isTimelineEnabled: isEnabled }));
  }, []);

  const resetSolarTimeline = React.useCallback(() => {
    setSolarTimeline(DEFAULT_SOLAR_TIMELINE_STATE);
  }, []);

  const value: AnalysisContextType = {
    analysis: analysisLogic.analysis,
    filteredAnalysis,
    isLoading: analysisLogic.isLoading,
    isAnalyzed: analysisLogic.isAnalyzed,
    error: analysisLogic.error,
    runAnalysis: (pois) => {
      setFilters(DEFAULT_ANALYSIS_FILTERS);
      setSelectedLocation(null);
      setIsReportOpen(false);
      analysisLogic.runAnalysis(pois);
    },
    clearAnalysis: () => {
      analysisLogic.clearAnalysis();
      setSelectedLocation(null);
      setFilters(DEFAULT_ANALYSIS_FILTERS);
      setIsReportOpen(false);
      setSolarTimeline(DEFAULT_SOLAR_TIMELINE_STATE);
    },
    candidateLocations: analysisLogic.candidatePois,
    selectedLocation,
    setSelectedLocation,
    overlayResetKey: analysisLogic.overlayResetKey,
    filters,
    setFilters,
    updateFilter,
    clearFilters,
    isReportOpen,
    setIsReportOpen,
    solarTimeline,
    setSolarTimeHour,
    setSolarSeason,
    setIsTimelineEnabled,
    resetSolarTimeline,
  };

  return (
    <AnalysisContext.Provider value={value}>{children}</AnalysisContext.Provider>
  );
};
