import * as turf from '@turf/turf';

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface Polygon {
  type: 'Polygon';
  coordinates: number[][][];
}

export interface Bounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

export const convertLatLngArrayToPolygon = (points: GeoPoint[]): Polygon => {
  if (points.length < 3) {
    throw new Error('Polygon requires at least 3 points');
  }

  const ringCoords = points.map((point) => [point.lng, point.lat]);
  ringCoords.push([points[0].lng, points[0].lat]);

  return {
    type: 'Polygon',
    coordinates: [ringCoords],
  };
};

export const calculatePolygonArea = (polygon: Polygon): number => {
  return turf.area(turf.polygon(polygon.coordinates));
};

export const isPointInPolygon = (point: GeoPoint, polygon: Polygon): boolean => {
  return turf.booleanPointInPolygon(
    turf.point([point.lng, point.lat]),
    turf.polygon(polygon.coordinates)
  );
};

export const getPolygonCenter = (polygon: Polygon): GeoPoint => {
  const center = turf.center(turf.polygon(polygon.coordinates));
  return {
    lng: center.geometry.coordinates[0],
    lat: center.geometry.coordinates[1],
  };
};

export const getPolygonBounds = (polygon: Polygon): Bounds => {
  const coordinates = polygon.coordinates[0];
  const lats = coordinates.map((coordinate) => coordinate[1]);
  const lngs = coordinates.map((coordinate) => coordinate[0]);

  return {
    minLat: Math.min(...lats),
    maxLat: Math.max(...lats),
    minLng: Math.min(...lngs),
    maxLng: Math.max(...lngs),
  };
};

export const padBounds = (bounds: Bounds, padding = 0.006): Bounds => ({
  minLat: bounds.minLat - padding,
  maxLat: bounds.maxLat + padding,
  minLng: bounds.minLng - padding,
  maxLng: bounds.maxLng + padding,
});

export const generateGridPoints = (polygon: Polygon, spacingMeters = 130): GeoPoint[] => {
  const bounds = getPolygonBounds(polygon);
  const metersPerDegree = 111_320;
  const latStep = spacingMeters / metersPerDegree;
  const lngStep = spacingMeters / (metersPerDegree * Math.cos((bounds.minLat * Math.PI) / 180));
  const points: GeoPoint[] = [];

  for (let lat = bounds.minLat; lat <= bounds.maxLat; lat += latStep) {
    for (let lng = bounds.minLng; lng <= bounds.maxLng; lng += lngStep) {
      const point = { lat, lng };
      if (isPointInPolygon(point, polygon)) {
        points.push(point);
      }
    }
  }

  return points;
};

export const coordinateToPercent = (point: GeoPoint, bounds: Bounds) => {
  const x = ((point.lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * 100;
  const y = (1 - (point.lat - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * 100;

  return {
    x: Math.max(0, Math.min(100, x)),
    y: Math.max(0, Math.min(100, y)),
  };
};
