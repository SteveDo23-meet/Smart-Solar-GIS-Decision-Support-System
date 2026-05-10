import { POI_TYPE_LABELS } from '../data/mockPois';
import type { POI } from '../data/mockPois';
import type { Polygon } from '../utils/geo';
import { generateDynamicPoisInsidePolygon } from './mockData.service';
import { fetchOsmFeaturesInPolygon } from './overpass.service';

export interface SurfaceDetectionRequest {
  polygon: Polygon;
  enabledSources: Array<'google_places' | 'google_roads' | 'osm_overpass' | 'municipal_gis' | 'satellite_imagery'>;
  signal?: AbortSignal;
}

export interface SurfaceDetectionResult {
  source: SurfaceDetectionRequest['enabledSources'][number];
  candidates: POI[];
}

export const detectInfrastructureSurfaces = async (
  request: SurfaceDetectionRequest
): Promise<SurfaceDetectionResult[]> => {
  const results: SurfaceDetectionResult[] = [];

  if (request.enabledSources.includes('osm_overpass')) {
    try {
      const osmCandidates = await fetchOsmFeaturesInPolygon(
        request.polygon,
        Object.keys(POI_TYPE_LABELS),
        request.signal
      );
      results.push({
        source: 'osm_overpass',
        candidates: osmCandidates,
      });
    } catch {
      results.push({
        source: 'osm_overpass',
        candidates: [],
      });
    }
  }

  return results;
};

export const detectSolarCandidates = async (
  polygon: Polygon,
  types: string[],
  signal?: AbortSignal
): Promise<POI[]> => {
  try {
    const osmCandidates = await fetchOsmFeaturesInPolygon(polygon, types, signal);
    if (osmCandidates.length >= 3) {
      return osmCandidates;
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error;
    }
    // Public Overpass servers can rate-limit or timeout; keep the analysis usable.
  }

  return generateDynamicPoisInsidePolygon(polygon, types);
};
