import { useState, useCallback } from 'react';
import type { GeoPoint, Polygon } from '../utils/geo';
import { convertLatLngArrayToPolygon, generateGridPoints, isPointInPolygon } from '../utils/geo';

export interface PlanningArea {
  id: string;
  label: string;
  points: GeoPoint[];
  polygon: Polygon;
}

export const usePolygon = () => {
  const [polygon, setPolygon] = useState<Polygon | null>(null);
  const [points, setPoints] = useState<GeoPoint[]>([]);
  const [planningAreas, setPlanningAreas] = useState<PlanningArea[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);

  const addPoint = useCallback(
    (point: GeoPoint) => {
      setPoints((currentPoints) => {
        const newPoints = [...currentPoints, point];

        if (newPoints.length >= 3) {
          try {
            setPolygon(convertLatLngArrayToPolygon(newPoints));
          } catch (error) {
            console.error('Error creating polygon:', error);
          }
        }

        return newPoints;
      });
    },
    []
  );

  const setPolygonPoints = useCallback((newPoints: GeoPoint[]) => {
    setPoints(newPoints);
    if (newPoints.length >= 3) {
      setPolygon(convertLatLngArrayToPolygon(newPoints));
      setIsDrawing(false);
      return;
    }

    setPolygon(null);
  }, []);

  const addPlanningArea = useCallback((newPoints: GeoPoint[]) => {
    if (newPoints.length < 3) return null;

    const newPolygon = convertLatLngArrayToPolygon(newPoints);
    let createdArea: PlanningArea | null = null;

    setPlanningAreas((currentAreas) => {
      const nextIndex = currentAreas.length + 1;
      createdArea = {
        id: `area-${Date.now()}-${nextIndex}`,
        label: `Area ${nextIndex}`,
        points: newPoints,
        polygon: newPolygon,
      };

      return [...currentAreas, createdArea];
    });

    setPoints(newPoints);
    setPolygon(newPolygon);
    setIsDrawing(false);

    return createdArea;
  }, []);

  const removePlanningArea = useCallback((areaId: string) => {
    setPlanningAreas((currentAreas) => {
      const nextAreas = currentAreas.filter((area) => area.id !== areaId);
      const activeArea = nextAreas.at(-1);

      setPoints(activeArea?.points ?? []);
      setPolygon(activeArea?.polygon ?? null);

      return nextAreas.map((area, index) => ({ ...area, label: `Area ${index + 1}` }));
    });
  }, []);

  const removeLastPoint = useCallback(() => {
    const newPoints = points.slice(0, -1);
    setPoints(newPoints);

    if (newPoints.length < 3) {
      setPolygon(null);
    } else {
      try {
        const newPolygon = convertLatLngArrayToPolygon(newPoints);
        setPolygon(newPolygon);
      } catch (error) {
        console.error('Error updating polygon:', error);
      }
    }
  }, [points]);

  const completePolygon = useCallback(() => {
    if (points.length >= 3) {
      setPolygon(convertLatLngArrayToPolygon(points));
      setIsDrawing(false);
      return convertLatLngArrayToPolygon(points);
    }
    return null;
  }, [points]);

  const generateGrid = useCallback(
    (spacing: number = 50) => {
      if (!polygon) return [];
      return generateGridPoints(polygon, spacing);
    },
    [polygon]
  );

  const checkPointInPolygon = useCallback(
    (point: GeoPoint) => {
      if (!polygon) return false;
      return isPointInPolygon(point, polygon);
    },
    [polygon]
  );

  const reset = useCallback(() => {
    setPolygon(null);
    setPoints([]);
    setPlanningAreas([]);
    setIsDrawing(false);
  }, []);

  return {
    polygon,
    points,
    planningAreas,
    isDrawing,
    setIsDrawing,
    addPoint,
    setPolygonPoints,
    addPlanningArea,
    removePlanningArea,
    removeLastPoint,
    completePolygon,
    generateGrid,
    checkPointInPolygon,
    reset,
  };
};
