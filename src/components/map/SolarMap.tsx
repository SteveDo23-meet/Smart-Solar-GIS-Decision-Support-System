import {
  Circle,
  DrawingManager,
  GoogleMap,
  TrafficLayer,
  useJsApiLoader,
  type Libraries,
} from '@react-google-maps/api';
import { AlertTriangle, KeyRound, MapPinned } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useAnalysisContext } from '../../app/providers/AnalysisProvider';
import { useMapContext } from '../../app/providers/MapProvider';
import { POI_TYPE_COLORS } from '../../data/mockPois';
import type { POI } from '../../data/mockPois';
import type { AnalyzedPOI } from '../../services/solarAnalysis.service';
import { isPointInPolygon } from '../../utils/geo';
import { calculateSolarScore } from '../../utils/scoring';
import { MapLegend } from './MapLegend';
import { MapModeSelector } from './MapModeSelector';
import { MapControls } from './MapControls';
import { PoiMarkers } from './PoiMarkers';
import { PolygonEditor } from './PolygonEditor';

const GOOGLE_LIBRARIES: Libraries = ['drawing', 'places'];

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const getMapOptions = (mapMode: ReturnType<typeof useMapContext>['mapMode']): google.maps.MapOptions => ({
  mapTypeId: mapMode === 'driving' ? 'roadmap' : mapMode === 'satellite' ? 'satellite' : 'hybrid',
  disableDefaultUI: false,
  clickableIcons: true,
  fullscreenControl: true,
  mapTypeControl: true,
  scaleControl: true,
  streetViewControl: true,
  zoomControl: true,
  rotateControl: true,
  gestureHandling: 'greedy',
  tilt: 0,
  styles:
    mapMode === 'driving'
      ? [
          { featureType: 'road', elementType: 'geometry', stylers: [{ saturation: 18 }, { lightness: -8 }] },
          { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'simplified' }] },
        ]
      : undefined,
});

interface ScoreHeatCirclesProps {
  pois: Array<POI | AnalyzedPOI>;
  overlayResetKey: number;
}

interface ManagedHeatCircleProps {
  poi: POI | AnalyzedPOI;
  overlayResetKey: number;
}

const getHeatScore = (poi: POI | AnalyzedPOI) => {
  if ('timeAdjustedSolarScore' in poi && typeof poi.timeAdjustedSolarScore === 'number') return poi.timeAdjustedSolarScore;
  if ('score' in poi) return poi.score;
  return calculateSolarScore(poi);
};

const getHeatIntensity = (poi: POI | AnalyzedPOI) => {
  const score = getHeatScore(poi);
  const rejectedMultiplier = 'decisionStatus' in poi && poi.decisionStatus === 'Not Recommended' ? 0.58 : 1;
  const timelineMultiplier = 'timelineImpactLabel' in poi && poi.timelineImpactLabel === 'Low Exposure' ? 0.72 : 1;
  return { score, multiplier: rejectedMultiplier * timelineMultiplier };
};

const ManagedHeatCircle: React.FC<ManagedHeatCircleProps> = ({ poi, overlayResetKey }) => {
  const circleRef = useRef<google.maps.Circle | null>(null);
  const { score, multiplier } = getHeatIntensity(poi);
  const color = POI_TYPE_COLORS[poi.type];

  useEffect(() => {
    return () => {
      circleRef.current?.setMap(null);
      circleRef.current = null;
    };
  }, []);

  return (
    <Circle
      key={`heat-${overlayResetKey}-${poi.id}`}
      center={{ lat: poi.lat, lng: poi.lng }}
      radius={(90 + score * 8) * multiplier}
      onLoad={(circle) => {
        circleRef.current = circle;
      }}
      onUnmount={(circle) => {
        circle.setMap(null);
        if (circleRef.current === circle) {
          circleRef.current = null;
        }
      }}
      options={{
        strokeColor: color,
        strokeOpacity: 0.18,
        strokeWeight: 1,
        fillColor: color,
        fillOpacity: (0.14 + score / 720) * multiplier,
        clickable: false,
        zIndex: 1,
      }}
    />
  );
};

const ScoreHeatCircles: React.FC<ScoreHeatCirclesProps> = ({ pois, overlayResetKey }) => (
  <>
    {pois.map((poi) => (
      <ManagedHeatCircle key={`heat-${overlayResetKey}-${poi.id}`} poi={poi} overlayResetKey={overlayResetKey} />
    ))}
  </>
);

const MissingKeyState: React.FC = () => (
  <div className="absolute inset-0 grid place-items-center bg-slate-950">
    <div className="mx-4 max-w-xl rounded-lg border border-amber-300/30 bg-slate-950/90 p-5 text-slate-100 shadow-2xl">
      <div className="mb-3 flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-lg border border-amber-300/40 bg-amber-300/10">
          <KeyRound className="h-5 w-5 text-amber-200" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">Google Maps API key required</h2>
          <p className="text-sm text-slate-400">This build intentionally does not render a fake map.</p>
        </div>
      </div>
      <p className="text-sm leading-6 text-slate-300">
        Add `VITE_GOOGLE_MAPS_API_KEY` to your environment to load real Google Maps hybrid imagery,
        labels, roads, buildings, DrawingManager polygons, and map interactions.
      </p>
    </div>
  </div>
);

interface GoogleMapCanvasProps {
  apiKey: string;
  pois: POI[];
  showAnalyzedOverlays: boolean;
  overlayResetKey: number;
}

const GoogleMapCanvas: React.FC<GoogleMapCanvasProps> = ({ apiKey, pois, showAnalyzedOverlays, overlayResetKey }) => {
  const map = useMapContext();
  const mapRef = useRef<google.maps.Map | null>(null);
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    libraries: GOOGLE_LIBRARIES,
  });

  const handleLoad = useCallback((googleMap: google.maps.Map) => {
    mapRef.current = googleMap;
  }, []);

  const handlePolygonComplete = useCallback(
    (polygon: google.maps.Polygon) => {
      const path = polygon
        .getPath()
        .getArray()
        .map((point) => ({ lat: point.lat(), lng: point.lng() }));

      polygon.setMap(null);
      map.addPlanningArea(path);
    },
    [map]
  );

  const handleIdle = useCallback(() => {
    const googleMap = mapRef.current;
    if (!googleMap) return;
    const center = googleMap.getCenter();
    if (center) {
      map.setMapCenter({ lat: center.lat(), lng: center.lng() });
    }
    map.setMapZoom(googleMap.getZoom() ?? 13);
  }, [map]);

  if (loadError) {
    return (
      <div className="absolute inset-0 grid place-items-center bg-slate-950">
        <div className="mx-4 flex max-w-xl items-start gap-3 rounded-lg border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-100">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">Google Maps failed to load.</p>
            <p className="mt-1 text-red-100/80">Check the API key, billing, and Maps JavaScript API permissions.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="absolute inset-0 grid place-items-center bg-slate-950">
        <div className="rounded-lg border border-cyan-300/25 bg-cyan-300/10 px-4 py-3 text-sm text-cyan-100">
          Loading Google Maps hybrid imagery...
        </div>
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={map.mapCenter}
      zoom={map.mapZoom}
      onLoad={handleLoad}
      onIdle={handleIdle}
      options={getMapOptions(map.mapMode)}
    >
      {showAnalyzedOverlays && map.layers.showHeatmap && map.mapMode === 'heatmap' && (
        <ScoreHeatCircles key={`heat-layer-${overlayResetKey}`} pois={pois} overlayResetKey={overlayResetKey} />
      )}
      {showAnalyzedOverlays && map.layers.showPOI && <PoiMarkers key={`poi-layer-${overlayResetKey}`} pois={pois} />}
      {map.layers.showPolygon && <PolygonEditor />}
      <DrawingManager
        drawingMode={map.isDrawing ? window.google.maps.drawing.OverlayType.POLYGON : null}
        onPolygonComplete={handlePolygonComplete}
        options={{
          drawingControl: true,
          drawingControlOptions: {
            position: window.google.maps.ControlPosition.TOP_CENTER,
            drawingModes: [window.google.maps.drawing.OverlayType.POLYGON],
          },
          polygonOptions: {
            fillColor: '#06b6d4',
            fillOpacity: 0.18,
            strokeColor: '#22d3ee',
            strokeOpacity: 0.95,
            strokeWeight: 2,
            clickable: false,
            editable: true,
            zIndex: 6,
          },
        }}
      />
      {map.mapMode === 'driving' && <TrafficLayer />}
    </GoogleMap>
  );
};

export const SolarMap: React.FC = () => {
  const map = useMapContext();
  const { filteredAnalysis, isAnalyzed, overlayResetKey } = useAnalysisContext();
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
  const visiblePois = useMemo(
    () => {
      if (!isAnalyzed) return [];
      const candidateLocations = filteredAnalysis?.rankedLocations ?? [];

      if (map.planningAreas.length > 0 && candidateLocations.length > 0) {
        return candidateLocations.filter(
          (poi) =>
            map.layers.poiFilter.includes(poi.type) &&
            map.planningAreas.some((area) => isPointInPolygon(poi, area.polygon))
        );
      }

      if (map.polygon && candidateLocations.length > 0) {
        return candidateLocations.filter(
          (poi) => map.layers.poiFilter.includes(poi.type) && isPointInPolygon(poi, map.polygon!)
        );
      }

      return candidateLocations.filter((poi) => map.layers.poiFilter.includes(poi.type));
    },
    [filteredAnalysis?.rankedLocations, isAnalyzed, map.layers.poiFilter, map.planningAreas, map.polygon]
  );

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-slate-950">
      {apiKey ? (
        <GoogleMapCanvas
          apiKey={apiKey}
          pois={visiblePois}
          showAnalyzedOverlays={isAnalyzed}
          overlayResetKey={overlayResetKey}
        />
      ) : (
        <MissingKeyState />
      )}

      {apiKey && (
        <>
          <MapModeSelector value={map.mapMode} onChange={map.setMapMode} />
          <MapLegend />
          <MapControls />
        </>
      )}

      <div className="pointer-events-none absolute bottom-4 right-[390px] z-20 hidden rounded-lg border border-white/10 bg-slate-950/65 px-3 py-2 text-right text-xs text-slate-200 shadow-2xl backdrop-blur-xl xl:block">
        <div className="flex items-center gap-2 font-semibold uppercase tracking-[0.18em] text-slate-300">
          <MapPinned className="h-4 w-4 text-cyan-300" />
          Google Hybrid
        </div>
        <p className="mt-1 text-slate-400">Tel Aviv solar suitability overlays</p>
      </div>
    </div>
  );
};
