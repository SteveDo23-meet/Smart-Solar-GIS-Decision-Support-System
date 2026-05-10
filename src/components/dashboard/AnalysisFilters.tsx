import { Filter, X } from 'lucide-react';
import { DEFAULT_ANALYSIS_FILTERS, useAnalysisContext } from '../../app/providers/AnalysisProvider';
import type {
  DataSourceFilter,
  DecisionFilter,
  RiskFilter,
  SurfaceFilter,
} from '../../app/providers/AnalysisProvider';
import { GlassCard } from '../ui/GlassCard';

const decisionOptions: Array<{ value: DecisionFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'Recommended', label: 'Recommended' },
  { value: 'Conditional', label: 'Conditional' },
  { value: 'Not Recommended', label: 'Not Recommended' },
];

const surfaceOptions: Array<{ value: SurfaceFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'parking', label: 'Parking' },
  { value: 'bus_station', label: 'Bus Station' },
  { value: 'building', label: 'Public Building' },
  { value: 'open_space', label: 'Open Space' },
  { value: 'park', label: 'Park' },
  { value: 'road_transport', label: 'Road / Transport' },
  { value: 'paved_area', label: 'Paved Area' },
];

const dataSourceOptions: Array<{ value: DataSourceFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'google_solar', label: 'Google Solar API' },
  { value: 'ai_gis_estimation', label: 'AI GIS Estimate' },
];

const riskOptions: Array<{ value: RiskFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'Low', label: 'Low' },
  { value: 'Medium', label: 'Medium' },
  { value: 'High', label: 'High' },
];

const selectClass =
  'h-9 w-full min-w-0 rounded-md border border-white/10 bg-slate-950/70 px-2 text-xs text-slate-100 outline-none focus:border-cyan-300/60';

export const AnalysisFilters: React.FC = () => {
  const { filters, updateFilter, clearFilters, filteredAnalysis } = useAnalysisContext();
  const hasActiveFilters = JSON.stringify(filters) !== JSON.stringify(DEFAULT_ANALYSIS_FILTERS);

  return (
    <GlassCard className="overflow-x-hidden !p-4">
      <div className="mb-3 flex min-w-0 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Filter className="h-4 w-4 shrink-0 text-cyan-300" />
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.18em] text-cyan-200">Filters</p>
            <p className="truncate text-xs text-slate-500">{filteredAnalysis?.potentialLocations ?? 0} visible candidates</p>
          </div>
        </div>
        <button
          type="button"
          onClick={clearFilters}
          disabled={!hasActiveFilters}
          className="flex h-8 shrink-0 items-center gap-1 rounded-md border border-white/10 bg-white/[0.04] px-2 text-xs text-slate-300 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <X className="h-3.5 w-3.5" />
          Clear
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label className="min-w-0 text-[11px] text-slate-500">
          Decision
          <select
            className={`${selectClass} mt-1`}
            value={filters.decisionStatus}
            onChange={(event) => updateFilter('decisionStatus', event.target.value as DecisionFilter)}
          >
            {decisionOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="min-w-0 text-[11px] text-slate-500">
          Surface
          <select
            className={`${selectClass} mt-1`}
            value={filters.surfaceType}
            onChange={(event) => updateFilter('surfaceType', event.target.value as SurfaceFilter)}
          >
            {surfaceOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="min-w-0 text-[11px] text-slate-500">
          Data Source
          <select
            className={`${selectClass} mt-1`}
            value={filters.dataSource}
            onChange={(event) => updateFilter('dataSource', event.target.value as DataSourceFilter)}
          >
            {dataSourceOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="min-w-0 text-[11px] text-slate-500">
          Risk
          <select
            className={`${selectClass} mt-1`}
            value={filters.riskLevel}
            onChange={(event) => updateFilter('riskLevel', event.target.value as RiskFilter)}
          >
            {riskOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </GlassCard>
  );
};
