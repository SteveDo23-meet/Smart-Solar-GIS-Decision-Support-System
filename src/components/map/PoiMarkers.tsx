import type { POI } from '../../data/mockPois';
import { useAnalysisContext } from '../../app/providers/AnalysisProvider';
import { MockMapMarker } from './MockMapMarker';

interface PoiMarkersProps {
  pois: POI[];
}

export const PoiMarkers: React.FC<PoiMarkersProps> = ({ pois }) => {
  const { selectedLocation, setSelectedLocation } = useAnalysisContext();

  return (
    <>
      {pois.map((poi) => (
        <MockMapMarker
          key={poi.id}
          poi={poi}
          selected={selectedLocation?.id === poi.id}
          onClick={() => setSelectedLocation(poi)}
        />
      ))}
    </>
  );
};
