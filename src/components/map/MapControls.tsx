import { BarChart3, Layers, RotateCcw, ScanLine } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRef, useState } from 'react';
import { useAnalysisContext } from '../../app/providers/AnalysisProvider';
import { useMapContext } from '../../app/providers/MapProvider';
import { POI_TYPE_LABELS } from '../../data/mockPois';
import type { PoiType } from '../../data/mockPois';
import { detectSolarCandidates } from '../../services/gisSurface.service';
import { applyHybridSolarEngineToCandidates } from '../../services/hybridSolarEngine.service';

const layerItems = [
  { key: 'showPOI', label: 'POI' },
  { key: 'showHeatmap', label: 'Solar' },
  { key: 'showPolygon', label: 'Area' },
] as const;

export const MapControls: React.FC = () => {
  const map = useMapContext();
  const { clearAnalysis, isLoading, runAnalysis } = useAnalysisContext();
  const [isDetecting, setIsDetecting] = useState(false);
  const analysisRequestRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const canAnalyze = map.planningAreas.length > 0 || Boolean(map.polygon);
  const runPolygonAnalysis = async () => {
    const analysisAreas =
      map.planningAreas.length > 0
        ? map.planningAreas
        : map.polygon
          ? [{ id: 'area-active', label: 'Area 1', polygon: map.polygon, points: map.polygonPoints }]
          : [];

    if (!analysisAreas.length) return;

    const requestId = analysisRequestRef.current + 1;
    analysisRequestRef.current = requestId;
    abortControllerRef.current?.abort();
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    setIsDetecting(true);
    try {
      const candidatesByArea = await Promise.all(
        analysisAreas.map(async (area) => {
          const areaCandidates = await detectSolarCandidates(area.polygon, map.layers.poiFilter, abortController.signal);

          return areaCandidates.map((candidate) => ({
            ...candidate,
            id: `${area.id}-${candidate.id}`,
            planningAreaId: area.id,
            planningAreaLabel: area.label,
          }));
        })
      );
      const enrichedCandidates = await applyHybridSolarEngineToCandidates(
        candidatesByArea.flat(),
        abortController.signal
      );
      if (analysisRequestRef.current === requestId) {
        runAnalysis(enrichedCandidates);
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        throw error;
      }
    } finally {
      if (analysisRequestRef.current === requestId) {
        setIsDetecting(false);
        abortControllerRef.current = null;
      }
    }
  };

  const resetMapAnalysis = () => {
    analysisRequestRef.current += 1;
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsDetecting(false);
    map.resetPolygon();
    map.setMapMode('explore');
    map.resetLayers();
    clearAnalysis();
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute bottom-4 left-4 z-30 w-[min(350px,calc(100%-2rem))] rounded-lg border border-white/10 bg-slate-950/70 p-3 shadow-2xl backdrop-blur-xl"
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-100">Solar Area</p>
            <p className="text-xs text-slate-400">
              {map.polygonPoints.length ? `${map.polygonPoints.length} polygon vertices` : 'Draw a polygon on Google Maps'}
              {map.planningAreas.length > 0 ? ` / ${map.planningAreas.length} selected areas` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={resetMapAnalysis}
            className="grid h-8 w-8 place-items-center rounded-md border border-white/10 bg-white/[0.04] text-slate-200"
            title="Reset map analysis"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-[1fr_1.2fr] gap-2">
          <button
            type="button"
            onClick={() => {
              if (!map.isDrawing) {
                clearAnalysis();
              }
              map.setIsDrawing(!map.isDrawing);
            }}
            className="flex h-10 items-center justify-center gap-2 rounded-md bg-cyan-300 px-3 text-sm font-semibold text-slate-950 hover:bg-cyan-200"
          >
            <ScanLine className="h-4 w-4" />
            {map.isDrawing ? 'Drawing' : 'Draw'}
          </button>
          <button
            type="button"
            onClick={runPolygonAnalysis}
            disabled={!canAnalyze || isLoading || isDetecting}
            className="flex h-10 items-center justify-center gap-2 rounded-md bg-lime-300 px-3 text-sm font-bold text-slate-950 shadow-[0_0_22px_rgba(190,242,100,0.18)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <BarChart3 className="h-4 w-4" />
            {isDetecting ? 'Detecting...' : isLoading ? 'Analyzing...' : map.planningAreas.length > 1 ? 'Analyze Areas' : 'Analyze'}
          </button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute bottom-4 left-1/2 z-30 hidden w-[min(520px,calc(100%-820px))] -translate-x-1/2 rounded-lg border border-white/10 bg-slate-950/65 p-3 shadow-2xl backdrop-blur-xl xl:block"
      >
        <div className="mb-2 flex items-center gap-2">
          <Layers className="h-4 w-4 text-cyan-300" />
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-100">Solar Overlay Layers</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {layerItems.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => map.toggleLayer(item.key)}
              className={`h-8 rounded-md border px-3 text-xs font-semibold ${
                map.layers[item.key]
                  ? 'border-cyan-300/60 bg-cyan-300/15 text-cyan-100'
                  : 'border-white/10 bg-white/[0.03] text-slate-400'
              }`}
            >
              {item.label}
            </button>
          ))}

          {(Object.keys(POI_TYPE_LABELS) as PoiType[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => map.togglePOIFilter(type)}
              className={`h-8 rounded-md border px-2.5 text-[11px] font-semibold ${
                map.layers.poiFilter.includes(type)
                  ? 'border-lime-300/50 bg-lime-300/10 text-lime-100'
                  : 'border-white/10 bg-white/[0.03] text-slate-400'
              }`}
            >
              {POI_TYPE_LABELS[type]}
            </button>
          ))}
        </div>
      </motion.div>
    </>
  );
};
