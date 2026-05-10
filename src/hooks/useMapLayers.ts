import { useState, useCallback } from 'react';

const DEFAULT_POI_FILTER = [
  'parking',
  'building',
  'public_building',
  'bus_station',
  'open_space',
  'park',
  'road',
  'highway',
  'road_shoulder',
  'transport_corridor',
  'paved_area',
];

export interface MapLayers {
  showPOI: boolean;
  showHeatmap: boolean;
  showGrid: boolean;
  showPolygon: boolean;
  poiFilter: string[];
}

export const useMapLayers = () => {
  const [layers, setLayers] = useState<MapLayers>({
    showPOI: true,
    showHeatmap: true,
    showGrid: false,
    showPolygon: true,
    poiFilter: DEFAULT_POI_FILTER,
  });

  const toggleLayer = useCallback((layerName: keyof Omit<MapLayers, 'poiFilter'>) => {
    setLayers(prev => ({
      ...prev,
      [layerName]: !prev[layerName],
    }));
  }, []);

  const togglePOIFilter = useCallback((poiType: string) => {
    setLayers(prev => ({
      ...prev,
      poiFilter: prev.poiFilter.includes(poiType)
        ? prev.poiFilter.filter(t => t !== poiType)
        : [...prev.poiFilter, poiType],
    }));
  }, []);

  const setPOIFilter = useCallback((types: string[]) => {
    setLayers(prev => ({
      ...prev,
      poiFilter: types,
    }));
  }, []);

  const resetLayers = useCallback(() => {
    setLayers({
      showPOI: true,
      showHeatmap: true,
      showGrid: false,
      showPolygon: true,
      poiFilter: DEFAULT_POI_FILTER,
    });
  }, []);

  return {
    layers,
    toggleLayer,
    togglePOIFilter,
    setPOIFilter,
    resetLayers,
  };
};
