/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { usePolygon } from '../../hooks/usePolygon';
import type { PlanningArea } from '../../hooks/usePolygon';
import { useMapLayers } from '../../hooks/useMapLayers';
import type { Polygon } from '../../utils/geo';
import type { GeoPoint } from '../../utils/geo';
import type { MapLayers } from '../../hooks/useMapLayers';

export type MapMode = 'explore' | 'driving' | 'satellite' | 'heatmap';

interface MapContextType {
  // Polygon drawing
  polygon: Polygon | null;
  polygonPoints: GeoPoint[];
  planningAreas: PlanningArea[];
  isDrawing: boolean;
  setIsDrawing: (value: boolean) => void;
  addPoint: (point: GeoPoint) => void;
  setPolygonPoints: (points: GeoPoint[]) => void;
  addPlanningArea: (points: GeoPoint[]) => PlanningArea | null;
  removePlanningArea: (areaId: string) => void;
  removeLastPoint: () => void;
  completePolygon: () => Polygon | null;
  resetPolygon: () => void;
  generateGridPoints: (spacing?: number) => GeoPoint[];
  checkPointInPolygon: (point: GeoPoint) => boolean;

  // Map center
  mapCenter: { lat: number; lng: number };
  setMapCenter: (center: { lat: number; lng: number }) => void;
  mapZoom: number;
  setMapZoom: (zoom: number) => void;
  mapMode: MapMode;
  setMapMode: (mode: MapMode) => void;

  // Layers
  layers: MapLayers;
  toggleLayer: (layerName: keyof Omit<MapLayers, 'poiFilter'>) => void;
  togglePOIFilter: (poiType: string) => void;
  setPOIFilter: (types: string[]) => void;
  resetLayers: () => void;
}

const MapContext = createContext<MapContextType | undefined>(undefined);

export const useMapContext = () => {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error('useMapContext must be used within MapProvider');
  }
  return context;
};

interface MapProviderProps {
  children: ReactNode;
}

export const MapProvider: React.FC<MapProviderProps> = ({ children }) => {
  const polygonLogic = usePolygon();
  const { layers, toggleLayer, togglePOIFilter, setPOIFilter, resetLayers } = useMapLayers();

  const [mapCenter, setMapCenter] = React.useState({ lat: 32.0853, lng: 34.7818 });
  const [mapZoom, setMapZoom] = React.useState(13);
  const [mapMode, setMapMode] = React.useState<MapMode>('explore');

  const value: MapContextType = {
    // Polygon
    polygon: polygonLogic.polygon,
    polygonPoints: polygonLogic.points,
    planningAreas: polygonLogic.planningAreas,
    isDrawing: polygonLogic.isDrawing,
    setIsDrawing: polygonLogic.setIsDrawing,
    addPoint: polygonLogic.addPoint,
    setPolygonPoints: polygonLogic.setPolygonPoints,
    addPlanningArea: polygonLogic.addPlanningArea,
    removePlanningArea: polygonLogic.removePlanningArea,
    removeLastPoint: polygonLogic.removeLastPoint,
    completePolygon: polygonLogic.completePolygon,
    resetPolygon: polygonLogic.reset,
    generateGridPoints: polygonLogic.generateGrid,
    checkPointInPolygon: polygonLogic.checkPointInPolygon,

    // Map
    mapCenter,
    setMapCenter,
    mapZoom,
    setMapZoom,
    mapMode,
    setMapMode,

    // Layers
    layers,
    toggleLayer,
    togglePOIFilter,
    setPOIFilter,
    resetLayers,
  };

  return <MapContext.Provider value={value}>{children}</MapContext.Provider>;
};
