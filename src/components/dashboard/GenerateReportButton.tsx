import { Download, FileText, Printer, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { useAnalysisContext } from '../../app/providers/AnalysisProvider';
import { useMapContext } from '../../app/providers/MapProvider';
import { createSolarSuitabilityReport } from '../../services/report.service';
import { exportCandidatesToCsv } from '../../utils/exportCsv';
import { formatCurrency, formatEnergy, formatNumber } from '../../utils/formatters';
import { Badge } from '../ui/Badge';

const sourceLabel = (source: string) => (source === 'google_solar' ? 'Google Solar API' : 'AI GIS Estimate');

export const GenerateReportButton: React.FC = () => {
  const { filteredAnalysis, isReportOpen, setIsReportOpen, solarTimeline } = useAnalysisContext();
  const { polygon } = useMapContext();
  const report = useMemo(
    () => (filteredAnalysis ? createSolarSuitabilityReport(filteredAnalysis, polygon, solarTimeline) : null),
    [filteredAnalysis, polygon, solarTimeline]
  );

  const exportCsv = () => {
    if (!filteredAnalysis) return;
    exportCandidatesToCsv(filteredAnalysis.rankedLocations, solarTimeline);
  };

  return (
    <>
      <button
        type="button"
        disabled={!filteredAnalysis || filteredAnalysis.rankedLocations.length === 0}
        onClick={() => setIsReportOpen(true)}
        className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-cyan-300/30 bg-cyan-300/12 px-3 text-sm font-semibold text-cyan-100 shadow-[0_0_22px_rgba(34,211,238,0.12)] transition hover:bg-cyan-300/18 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <FileText className="h-4 w-4" />
        Generate Report
      </button>

      {isReportOpen && report && filteredAnalysis && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/72 p-4 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="printable-report max-h-[90vh] w-[min(980px,100%)] overflow-x-hidden overflow-y-auto rounded-lg border border-white/10 bg-slate-950 text-slate-100 shadow-2xl"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-white/10 bg-slate-950/95 p-4 backdrop-blur-xl print:hidden">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.18em] text-cyan-200">Solar Suitability Report</p>
                <h2 className="truncate text-lg font-semibold text-white">Decision Support Summary</h2>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={exportCsv}
                  className="flex h-9 items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-3 text-xs font-semibold text-slate-200"
                >
                  <Download className="h-4 w-4" />
                  CSV
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex h-9 items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-3 text-xs font-semibold text-slate-200"
                >
                  <Printer className="h-4 w-4" />
                  PDF
                </button>
                <button
                  type="button"
                  onClick={() => setIsReportOpen(false)}
                  className="grid h-9 w-9 place-items-center rounded-md border border-white/10 bg-white/[0.04] text-slate-200"
                  title="Close report"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-5 p-5">
              <section>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Generated</p>
                <h1 className="mt-1 text-2xl font-bold text-white">Solar Suitability Report</h1>
                <p className="mt-1 text-sm text-slate-400">{report.generatedAt.toLocaleString()}</p>
                <p className="mt-2 text-sm text-slate-300">{report.polygonSummary}</p>
              </section>

              <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {[
                  ['Analyzed', report.totalAnalyzedLocations],
                  ['Recommended', report.recommendedCount],
                  ['Conditional', report.conditionalCount],
                  ['Rejected', report.notRecommendedCount],
                  ['Annual Energy', `${formatEnergy(report.totalEstimatedAnnualEnergyKwh)}/yr`],
                  ['Annual Savings', `${formatCurrency(report.totalEstimatedAnnualSavingsUsd)}/yr`],
                  ['CO2 Reduction', `${formatNumber(report.totalCo2ReductionKgPerYear / 1000, 1)} t/yr`],
                  ['Google Solar', report.googleSolarApiCount],
                  ['Timeline', report.timelineEnabled ? `${String(report.solarTimeHour).padStart(2, '0')}:00 ${report.solarSeason}` : 'Disabled'],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg border border-white/10 bg-white/[0.035] p-3">
                    <p className="text-xs text-slate-500">{label}</p>
                    <p className="mt-1 break-words text-lg font-bold text-white">{value}</p>
                  </div>
                ))}
              </section>

              <section className="rounded-lg border border-cyan-300/15 bg-cyan-300/[0.045] p-4">
                <h3 className="text-sm font-semibold text-cyan-100">AI Recommendation Summary</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">{report.aiRecommendationSummary}</p>
                <p className="mt-1 text-sm leading-6 text-slate-300">{report.roiSummary}</p>
                <p className="mt-1 text-sm leading-6 text-slate-300">
                  Results mode: {report.resultsMode}
                  {report.adjustedTotalEnergyKwh ? `, adjusted energy ${formatEnergy(report.adjustedTotalEnergyKwh)}/yr.` : '.'}
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500">{report.roiNote}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">{report.timelineDisclaimer}</p>
              </section>

              {report.bestRecommendedLocation && (
                <section>
                  <h3 className="mb-2 text-sm font-semibold text-lime-100">Best Recommended Location</h3>
                  <div className="rounded-lg border border-lime-300/15 bg-lime-300/[0.045] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-white">{report.bestRecommendedLocation.name}</p>
                        <p className="mt-1 text-sm text-slate-400">{report.bestRecommendedLocation.recommendedAction}</p>
                      </div>
                      <Badge variant="success" size="sm">
                        {report.bestRecommendedLocation.aiSuitabilityScore}
                      </Badge>
                    </div>
                  </div>
                </section>
              )}

              <section>
                <h3 className="mb-2 text-sm font-semibold text-white">Top Recommended Locations</h3>
                <div className="space-y-2">
                  {report.topRecommendedLocations.map((location) => (
                    <div key={location.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-white">{location.rank}. {location.name}</p>
                        <Badge variant={location.solarEngineResult.source === 'google_solar' ? 'success' : 'secondary'} size="sm">
                        {sourceLabel(location.solarEngineResult.source)}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                        {formatEnergy(location.timeAdjustedAnnualEnergyKwh ?? location.annualEnergyKwh)}/yr,
                        {` ${formatCurrency(location.estimatedAnnualSavingsUsd)}/yr savings,`}
                        {` ${location.estimatedPaybackYears} yr payback`}
                      </p>
                      {report.timelineEnabled && location.timelineNotes && location.timelineNotes.length > 0 && (
                        <p className="mt-1 text-xs text-amber-100/80">{location.timelineNotes[0]}</p>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="mb-2 text-sm font-semibold text-red-100">Rejected Locations</h3>
                <div className="space-y-2">
                  {report.rejectedLocations.length === 0 ? (
                    <p className="text-sm text-slate-500">No rejected locations in the current filtered result set.</p>
                  ) : (
                    report.rejectedLocations.map((location) => (
                      <div key={location.id} className="rounded-lg border border-red-400/15 bg-red-400/[0.045] p-3">
                        <p className="font-semibold text-white">{location.name}</p>
                        <p className="mt-1 text-xs leading-5 text-red-100">{location.rejectionReason}</p>
                      </div>
                    ))
                  )}
                </div>
              </section>

              <section className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                <h3 className="text-sm font-semibold text-white">Data Source Summary</h3>
                <p className="mt-2 text-sm text-slate-300">
                  {report.googleSolarApiCount} rooftop candidates used Google Solar API data. {report.aiGisEstimateCount} non-building
                  or fallback candidates used AI GIS estimation.
                </p>
              </section>

              <p className="rounded-lg border border-amber-300/15 bg-amber-300/[0.045] p-3 text-xs leading-5 text-amber-100">
                {report.disclaimer} {report.timelineDisclaimer}
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
};
