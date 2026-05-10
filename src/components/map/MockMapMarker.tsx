import { Marker } from '@react-google-maps/api';
import { POI_TYPE_COLORS } from '../../data/mockPois';
import type { AnalyzedPOI } from '../../services/solarAnalysis.service';
import type { POI, PoiType } from '../../data/mockPois';

interface MockMapMarkerProps {
  poi: POI | AnalyzedPOI;
  selected?: boolean;
  onClick: () => void;
}

const markerLetters: Record<PoiType, string> = {
  parking: 'P',
  bus_station: 'B',
  building: 'G',
  public_building: 'G',
  open_space: 'O',
  park: 'R',
  road: 'T',
  highway: 'T',
  road_shoulder: 'T',
  transport_corridor: 'T',
  paved_area: 'T',
};

const isAnalyzedPoi = (poi: POI | AnalyzedPOI): poi is AnalyzedPOI => {
  return 'decisionStatus' in poi;
};

const markerSvg = (letter: string, color: string, selected: boolean, rejected: boolean) => {
  const size = selected ? 46 : 38;
  const radius = selected ? 17 : 14;
  const fillOpacity = rejected ? 0.42 : 0.96;
  const haloOpacity = rejected ? 0.1 : 0.24;
  const stroke = rejected ? '#ef4444' : '#020617';
  const encoded = encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <circle cx="${size / 2}" cy="${size / 2}" r="${radius + 5}" fill="${color}" fill-opacity="${haloOpacity}"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="${radius}" fill="${rejected ? '#7f1d1d' : color}" fill-opacity="${fillOpacity}" stroke="${stroke}" stroke-width="3"/>
      ${rejected ? `<circle cx="${size - 10}" cy="10" r="6" fill="#ef4444" stroke="#020617" stroke-width="2"/>` : ''}
      <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" font-family="Arial, sans-serif" font-size="13" font-weight="800" fill="#ffffff">${letter}</text>
    </svg>
  `);

  return `data:image/svg+xml;charset=UTF-8,${encoded}`;
};

export const MockMapMarker: React.FC<MockMapMarkerProps> = ({ poi, selected = false, onClick }) => {
  const color = POI_TYPE_COLORS[poi.type];
  const letter = markerLetters[poi.type];
  const size = selected ? 46 : 38;
  const rejected = isAnalyzedPoi(poi) && poi.decisionStatus === 'Not Recommended';

  return (
    <Marker
      position={{ lat: poi.lat, lng: poi.lng }}
      onClick={onClick}
      title={poi.name}
      icon={{
        url: markerSvg(letter, color, selected, rejected),
        scaledSize: new window.google.maps.Size(size, size),
        anchor: new window.google.maps.Point(size / 2, size / 2),
      }}
    />
  );
};
