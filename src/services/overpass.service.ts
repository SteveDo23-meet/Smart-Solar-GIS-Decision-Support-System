import * as turf from '@turf/turf';
import type { POI, PoiType } from '../data/mockPois';
import type { GeoPoint, Polygon } from '../utils/geo';
import { getPolygonBounds, isPointInPolygon } from '../utils/geo';

const OVERPASS_ENDPOINT = 'https://overpass-api.de/api/interpreter';

type OsmTags = Record<string, string | undefined>;

interface OsmElement {
  id: number;
  type: 'node' | 'way' | 'relation';
  lat?: number;
  lon?: number;
  center?: {
    lat: number;
    lon: number;
  };
  geometry?: Array<{
    lat: number;
    lon: number;
  }>;
  tags?: OsmTags;
}

interface OverpassResponse {
  elements: OsmElement[];
}

interface SurfaceProfile {
  type: PoiType;
  label: string;
  surfaceType: number;
  exposure: number;
  shading: number;
  usableRatio: number;
  corridorWidthMeters?: number;
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const seeded = (seed: number) => {
  const value = Math.sin(seed * 12.9898) * 43_758.5453;
  return value - Math.floor(value);
};

const getWeatherForIsrael = (point: GeoPoint) => {
  if (point.lat < 31.35) return 96;
  if (point.lat > 32.55) return 84;
  if (point.lng < 35.05) return 91;
  return 88;
};

const buildOverpassQuery = (polygon: Polygon) => {
  const bounds = getPolygonBounds(polygon);
  const bbox = `${bounds.minLat},${bounds.minLng},${bounds.maxLat},${bounds.maxLng}`;

  return `
    [out:json][timeout:25];
    (
      node["highway"="bus_stop"](${bbox});
      node["amenity"="bus_station"](${bbox});
      node["public_transport"~"platform|station"](${bbox});
      way["amenity"="parking"](${bbox});
      relation["amenity"="parking"](${bbox});
      way["building"](${bbox});
      relation["building"](${bbox});
      way["leisure"="park"](${bbox});
      relation["leisure"="park"](${bbox});
      way["landuse"~"industrial|commercial|retail|brownfield|construction"](${bbox});
      relation["landuse"~"industrial|commercial|retail|brownfield|construction"](${bbox});
      way["highway"~"motorway|trunk|primary|secondary|tertiary|residential|service|unclassified"](${bbox});
    );
    out center tags geom;
  `;
};

const getPointForElement = (element: OsmElement): GeoPoint | null => {
  if (typeof element.lat === 'number' && typeof element.lon === 'number') {
    return { lat: element.lat, lng: element.lon };
  }

  if (element.center) {
    return { lat: element.center.lat, lng: element.center.lon };
  }

  if (element.geometry?.length) {
    const center = turf.center(
      turf.featureCollection(
        element.geometry.map((point) => turf.point([point.lon, point.lat]))
      )
    );

    return {
      lat: center.geometry.coordinates[1],
      lng: center.geometry.coordinates[0],
    };
  }

  return null;
};

const getSurfaceProfile = (tags: OsmTags, id: number): SurfaceProfile | null => {
  if (tags.amenity === 'parking') {
    return {
      type: 'parking',
      label: 'OSM parking surface',
      surfaceType: 91,
      exposure: 91,
      shading: 10,
      usableRatio: 0.66,
    };
  }

  if (tags.building) {
    return {
      type: 'building',
      label: 'OSM building roof',
      surfaceType: 86,
      exposure: 88,
      shading: 14,
      usableRatio: 0.48,
    };
  }

  if (tags.highway === 'bus_stop' || tags.amenity === 'bus_station' || tags.public_transport) {
    return {
      type: 'bus_station',
      label: 'OSM transit stop canopy',
      surfaceType: 84,
      exposure: 87,
      shading: 14,
      usableRatio: 0.34,
    };
  }

  if (tags.leisure === 'park') {
    return {
      type: 'park',
      label: 'OSM park shade structure zone',
      surfaceType: 70,
      exposure: 84,
      shading: 26,
      usableRatio: 0.2,
    };
  }

  if (tags.landuse && ['industrial', 'commercial', 'retail', 'brownfield', 'construction'].includes(tags.landuse)) {
    return {
      type: 'paved_area',
      label: `OSM ${tags.landuse} paved area`,
      surfaceType: 88,
      exposure: 93,
      shading: 8,
      usableRatio: 0.58,
    };
  }

  if (tags.highway) {
    if (['motorway', 'trunk', 'primary'].includes(tags.highway)) {
      return {
        type: id % 2 === 0 ? 'highway' : 'road_shoulder',
        label: 'OSM highway solar corridor',
        surfaceType: 81,
        exposure: 92,
        shading: 8,
        usableRatio: 0.3,
        corridorWidthMeters: 18,
      };
    }

    if (['secondary', 'tertiary'].includes(tags.highway)) {
      return {
        type: 'transport_corridor',
        label: 'OSM transport corridor',
        surfaceType: 82,
        exposure: 89,
        shading: 12,
        usableRatio: 0.28,
        corridorWidthMeters: 12,
      };
    }

    return {
      type: 'road',
      label: 'OSM urban road segment',
      surfaceType: 74,
      exposure: 85,
      shading: 18,
      usableRatio: 0.16,
      corridorWidthMeters: 8,
    };
  }

  return null;
};

const getFeatureArea = (element: OsmElement, profile: SurfaceProfile) => {
  const geometry = element.geometry ?? [];

  if (geometry.length >= 4 && geometry[0].lat === geometry[geometry.length - 1].lat && geometry[0].lon === geometry[geometry.length - 1].lon) {
    const coordinates = geometry.map((point) => [point.lon, point.lat]);
    return Math.round(clamp(turf.area(turf.polygon([coordinates])), 80, 120_000));
  }

  if (geometry.length >= 2) {
    const lengthKm = turf.length(
      turf.lineString(geometry.map((point) => [point.lon, point.lat])),
      { units: 'kilometers' }
    );
    return Math.round(clamp(lengthKm * 1000 * (profile.corridorWidthMeters ?? 10), 120, 90_000));
  }

  return Math.round(profile.type === 'bus_station' ? 240 + seeded(element.id) * 900 : 700 + seeded(element.id) * 2600);
};

const getCapacityKw = (area: number, usableRatio: number) => {
  const panelCount = Math.max(4, Math.floor((area * usableRatio) / 2.1));
  return Math.round(panelCount * 0.45);
};

const getElementName = (element: OsmElement, profile: SurfaceProfile, index: number) => {
  const tags = element.tags ?? {};
  return tags.name || tags['name:he'] || tags.operator || `${profile.label} ${index + 1}`;
};

export const fetchOsmFeaturesInPolygon = async (
  polygon: Polygon,
  types: string[],
  signal?: AbortSignal
): Promise<POI[]> => {
  const response = await fetch(OVERPASS_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=UTF-8',
    },
    body: buildOverpassQuery(polygon),
    signal,
  });

  if (!response.ok) {
    throw new Error(`Overpass request failed with status ${response.status}`);
  }

  const data = (await response.json()) as OverpassResponse;
  const seen = new Set<string>();

  return data.elements
    .map((element, index): POI | null => {
      const tags = element.tags ?? {};
      const profile = getSurfaceProfile(tags, element.id);
      const point = getPointForElement(element);

      if (!profile || !point || !types.includes(profile.type)) return null;
      if (!isPointInPolygon(point, polygon)) return null;

      const key = `${element.type}-${element.id}`;
      if (seen.has(key)) return null;
      seen.add(key);

      const seed = element.id + point.lat * 100 + point.lng * 10;
      const area = getFeatureArea(element, profile);
      const weatherConditions = getWeatherForIsrael(point);
      const solarExposure = clamp(profile.exposure + Math.round(seeded(seed + 1) * 10 - 5), 50, 99);
      const surfaceType = clamp(profile.surfaceType + Math.round(seeded(seed + 2) * 10 - 5), 45, 99);
      const shading = clamp(profile.shading + Math.round(seeded(seed + 3) * 12 - 6), 0, 50);

      return {
        id: `osm-${element.type}-${element.id}`,
        name: getElementName(element, profile, index),
        lat: point.lat,
        lng: point.lng,
        type: profile.type,
        address: `OpenStreetMap ${element.type} ${element.id}`,
        area,
        solarExposure,
        surfaceType,
        weatherConditions,
        shading,
        estimatedCapacityKw: getCapacityKw(area, profile.usableRatio),
        ownership: ['road', 'highway', 'road_shoulder', 'transport_corridor', 'bus_station'].includes(profile.type)
          ? 'transit'
          : tags.amenity === 'parking'
            ? 'municipal'
            : 'public',
        surfaceLabel: profile.label,
        roofCondition: profile.type === 'building' || profile.type === 'parking' ? 'good' : undefined,
      };
    })
    .filter((poi): poi is POI => Boolean(poi))
    .sort((a, b) => b.area - a.area)
    .slice(0, 50);
};
