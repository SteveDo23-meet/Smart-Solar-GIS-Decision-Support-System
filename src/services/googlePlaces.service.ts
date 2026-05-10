import type { POI } from '../data/mockPois';

export interface PlacesSearchRequest {
  polygonPath: Array<{ lat: number; lng: number }>;
  includedTypes: string[];
}

// Future adapter boundary for Google Places API and backend enrichment.
// The UI consumes normalized POI records, so replacing mock data later is isolated here.
export const searchSolarCandidatePlaces = async (request: PlacesSearchRequest): Promise<POI[]> => {
  void request;
  throw new Error('Google Places integration is not connected in the mock build.');
};
