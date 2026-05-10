import { MOCK_POIS } from '../data/mockPois';
import type { POI, PoiType } from '../data/mockPois';
import type { GeoPoint, Polygon } from '../utils/geo';
import {
  calculatePolygonArea,
  generateGridPoints,
  getPolygonCenter,
  isPointInPolygon,
} from '../utils/geo';

interface SurfaceSpec {
  type: PoiType;
  label: string;
  areaMin: number;
  areaMax: number;
  surfaceBase: number;
  exposureBase: number;
  shadingBase: number;
  usableRatio: number;
}

const SURFACE_SPECS: SurfaceSpec[] = [
  {
    type: 'parking',
    label: 'Parking canopy zone',
    areaMin: 1800,
    areaMax: 22_000,
    surfaceBase: 91,
    exposureBase: 92,
    shadingBase: 9,
    usableRatio: 0.68,
  },
  {
    type: 'building',
    label: 'Public roof cluster',
    areaMin: 900,
    areaMax: 12_000,
    surfaceBase: 87,
    exposureBase: 88,
    shadingBase: 14,
    usableRatio: 0.52,
  },
  {
    type: 'open_space',
    label: 'Open municipal parcel',
    areaMin: 2600,
    areaMax: 34_000,
    surfaceBase: 78,
    exposureBase: 94,
    shadingBase: 8,
    usableRatio: 0.58,
  },
  {
    type: 'park',
    label: 'Solar shade structure corridor',
    areaMin: 1600,
    areaMax: 18_000,
    surfaceBase: 70,
    exposureBase: 84,
    shadingBase: 25,
    usableRatio: 0.22,
  },
  {
    type: 'bus_station',
    label: 'Transit canopy and depot roof',
    areaMin: 700,
    areaMax: 8500,
    surfaceBase: 86,
    exposureBase: 87,
    shadingBase: 13,
    usableRatio: 0.46,
  },
  {
    type: 'road',
    label: 'Urban road solar cover segment',
    areaMin: 900,
    areaMax: 9500,
    surfaceBase: 76,
    exposureBase: 86,
    shadingBase: 18,
    usableRatio: 0.18,
  },
  {
    type: 'highway',
    label: 'Highway right-of-way solar corridor',
    areaMin: 3500,
    areaMax: 42_000,
    surfaceBase: 82,
    exposureBase: 94,
    shadingBase: 7,
    usableRatio: 0.34,
  },
  {
    type: 'road_shoulder',
    label: 'Road shoulder PV strip',
    areaMin: 1200,
    areaMax: 16_000,
    surfaceBase: 80,
    exposureBase: 91,
    shadingBase: 10,
    usableRatio: 0.29,
  },
  {
    type: 'transport_corridor',
    label: 'Rail or bus rapid-transit corridor',
    areaMin: 1700,
    areaMax: 20_000,
    surfaceBase: 84,
    exposureBase: 90,
    shadingBase: 11,
    usableRatio: 0.38,
  },
  {
    type: 'paved_area',
    label: 'Large paved logistics area',
    areaMin: 2600,
    areaMax: 38_000,
    surfaceBase: 89,
    exposureBase: 95,
    shadingBase: 5,
    usableRatio: 0.62,
  },
];

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const seeded = (seed: number) => {
  const value = Math.sin(seed * 12.9898) * 43_758.5453;
  return value - Math.floor(value);
};

const getRegionProfile = (center: GeoPoint) => {
  if (center.lat < 31.35) {
    return {
      name: 'Negev / Arava',
      weather: 96,
      exposureBoost: 5,
      shadingDelta: -4,
      surfaceShift: 2,
    };
  }

  if (center.lat > 32.55) {
    return {
      name: 'Northern Israel',
      weather: 84,
      exposureBoost: -2,
      shadingDelta: 4,
      surfaceShift: 0,
    };
  }

  if (center.lng < 35.05) {
    return {
      name: 'Coastal / Central Israel',
      weather: 91,
      exposureBoost: 1,
      shadingDelta: 2,
      surfaceShift: 1,
    };
  }

  return {
    name: 'Judean hills / inland',
    weather: 88,
    exposureBoost: 0,
    shadingDelta: 1,
    surfaceShift: -1,
  };
};

const getTargetCount = (area: number) => clamp(Math.round(area / 55_000) + 7, 7, 30);

const getSpacing = (area: number) => {
  if (area < 100_000) return 115;
  if (area < 750_000) return 210;
  if (area < 2_500_000) return 360;
  if (area > 50_000_000) return 1800;
  return 620;
};

const getAreaForSurface = (spec: SurfaceSpec, polygonArea: number, seed: number) => {
  const randomArea = spec.areaMin + seeded(seed) * (spec.areaMax - spec.areaMin);
  return Math.round(clamp(randomArea, 550, Math.max(800, polygonArea * 0.18)));
};

const getCapacityKw = (area: number, usableRatio: number) => {
  const usableArea = area * usableRatio;
  const panelCount = Math.max(6, Math.floor(usableArea / 2.1));
  return Math.round(panelCount * 0.45);
};

export const generateDynamicPoisInsidePolygon = (polygon: Polygon, types: string[]): POI[] => {
  const polygonArea = calculatePolygonArea(polygon);
  const center = getPolygonCenter(polygon);
  const profile = getRegionProfile(center);
  const grid = generateGridPoints(polygon, getSpacing(polygonArea));
  const targetCount = getTargetCount(polygonArea);
  const sourcePoints = grid.length ? grid : [center];
  const candidates: POI[] = [];
  const stride = Math.max(1, Math.floor(sourcePoints.length / targetCount));

  for (let index = 0; index < targetCount * 2 && candidates.length < targetCount; index += 1) {
    const source = sourcePoints[(index * stride + Math.floor(seeded(index + center.lat) * sourcePoints.length)) % sourcePoints.length];
    const jitterLat = (seeded(index + 7.1) - 0.5) * 0.0018;
    const jitterLng = (seeded(index + 13.7) - 0.5) * 0.0018;
    const point = {
      lat: source.lat + jitterLat,
      lng: source.lng + jitterLng,
    };

    if (!isPointInPolygon(point, polygon)) continue;

    const spec = SURFACE_SPECS[(index + Math.round(center.lat * 10) + Math.round(center.lng * 10)) % SURFACE_SPECS.length];
    if (!types.includes(spec.type)) continue;

    const seed = index + point.lat * 100 + point.lng * 10;
    const area = getAreaForSurface(spec, polygonArea, seed);
    const variation = Math.round(seeded(seed + 4) * 10 - 5);
    const solarExposure = clamp(spec.exposureBase + profile.exposureBoost + variation, 55, 99);
    const surfaceType = clamp(spec.surfaceBase + profile.surfaceShift + Math.round(seeded(seed + 6) * 8 - 4), 45, 98);
    const weatherConditions = clamp(profile.weather + Math.round(seeded(seed + 8) * 4 - 2), 55, 99);
    const shading = clamp(spec.shadingBase + profile.shadingDelta + Math.round(seeded(seed + 10) * 12 - 6), 0, 45);

    candidates.push({
      id: `dynamic-${spec.type}-${index}`,
      name: `${spec.label} ${candidates.length + 1}`,
      lat: point.lat,
      lng: point.lng,
      type: spec.type,
      address: `${profile.name} candidate generated inside selected polygon`,
      area,
      solarExposure,
      surfaceType,
      weatherConditions,
      shading,
      estimatedCapacityKw: getCapacityKw(area, spec.usableRatio),
      ownership: spec.type === 'building' ? 'public' : spec.type.includes('road') || spec.type.includes('corridor') ? 'transit' : 'municipal',
      surfaceLabel: spec.label,
      roofCondition: spec.type === 'building' || spec.type === 'parking' ? 'good' : undefined,
    });
  }

  if (types.includes('park') && candidates.length > 0 && !candidates.some((candidate) => candidate.shading >= 34 || candidate.area < 1_200)) {
    const point = sourcePoints[Math.floor(sourcePoints.length / 2)] ?? center;
    candidates.push({
      id: 'dynamic-rejected-park-shade',
      name: 'Tree-covered recreation pocket',
      lat: point.lat,
      lng: point.lng,
      type: 'park',
      address: `${profile.name} low-suitability candidate generated for AI rejection review`,
      area: 950,
      solarExposure: 63,
      surfaceType: 52,
      weatherConditions: profile.weather,
      shading: 38,
      estimatedCapacityKw: 18,
      ownership: 'municipal',
      surfaceLabel: 'Tree-covered public recreation area',
    });
  }

  return candidates;
};

export const getMockPois = (): POI[] => MOCK_POIS;

export const getPoisByType = (type: PoiType): POI[] => MOCK_POIS.filter((poi) => poi.type === type);

export const getVisibleMockPois = (types: string[], polygon?: Polygon | null): POI[] => {
  if (polygon) {
    return generateDynamicPoisInsidePolygon(polygon, types);
  }

  return MOCK_POIS.filter((poi) => types.includes(poi.type));
};

export const getPoisInsidePolygon = (polygon: Polygon | null, types: string[]): POI[] => {
  if (!polygon) return getVisibleMockPois(types);

  return generateDynamicPoisInsidePolygon(polygon, types);
};
