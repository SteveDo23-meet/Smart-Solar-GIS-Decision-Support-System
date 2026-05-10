export type PoiType =
  | 'parking'
  | 'bus_station'
  | 'building'
  | 'public_building'
  | 'open_space'
  | 'park'
  | 'road'
  | 'highway'
  | 'road_shoulder'
  | 'transport_corridor'
  | 'paved_area';

export interface POI {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: PoiType;
  address: string;
  area: number;
  solarExposure: number;
  surfaceType: number;
  weatherConditions: number;
  shading: number;
  estimatedCapacityKw: number;
  ownership: 'municipal' | 'transit' | 'public' | 'private';
  surfaceLabel?: string;
  roofCondition?: 'excellent' | 'good' | 'needs_review';
  planningAreaId?: string;
  planningAreaLabel?: string;
  solarEngineResult?: {
    source: 'google_solar' | 'ai_gis_estimation';
    annualEnergyKwh: number;
    solarPotentialScore: number;
    sunshineHours?: number;
    roofAreaMeters2?: number;
    maxArrayPanelsCount?: number;
    carbonOffsetKgPerYear?: number;
    confidence: number;
    notes: string[];
  };
}

export const POI_TYPE_LABELS: Record<PoiType, string> = {
  parking: 'Parking Lot',
  bus_station: 'Bus / Transit',
  building: 'Public Building',
  public_building: 'Public Building',
  open_space: 'Open Area',
  park: 'Park',
  road: 'Road',
  highway: 'Highway',
  road_shoulder: 'Road Shoulder',
  transport_corridor: 'Transport Corridor',
  paved_area: 'Large Paved Area',
};

export const POI_TYPE_COLORS: Record<PoiType, string> = {
  parking: '#38bdf8',
  bus_station: '#22d3ee',
  building: '#a3e635',
  public_building: '#a3e635',
  open_space: '#facc15',
  park: '#34d399',
  road: '#f97316',
  highway: '#fb7185',
  road_shoulder: '#c084fc',
  transport_corridor: '#60a5fa',
  paved_area: '#eab308',
};

export const MOCK_POIS: POI[] = [
  {
    id: 'parking-habima',
    name: 'Habima Square Underground Parking',
    lat: 32.07286,
    lng: 34.77967,
    type: 'parking',
    address: 'Tarsat Ave, Tel Aviv-Yafo',
    area: 12800,
    solarExposure: 91,
    surfaceType: 88,
    weatherConditions: 92,
    shading: 12,
    estimatedCapacityKw: 540,
    ownership: 'municipal',
    roofCondition: 'good',
  },
  {
    id: 'parking-reading',
    name: 'Reading Terminal Surface Parking',
    lat: 32.10327,
    lng: 34.77981,
    type: 'parking',
    address: 'Rokach Blvd, Tel Aviv-Yafo',
    area: 22500,
    solarExposure: 96,
    surfaceType: 93,
    weatherConditions: 93,
    shading: 5,
    estimatedCapacityKw: 980,
    ownership: 'municipal',
    roofCondition: 'excellent',
  },
  {
    id: 'parking-sarona',
    name: 'Sarona Market Parking Roof',
    lat: 32.07193,
    lng: 34.78767,
    type: 'parking',
    address: 'Aluf Kalman Magen St, Tel Aviv-Yafo',
    area: 18400,
    solarExposure: 93,
    surfaceType: 91,
    weatherConditions: 92,
    shading: 8,
    estimatedCapacityKw: 790,
    ownership: 'private',
    roofCondition: 'excellent',
  },
  {
    id: 'bus-savidor',
    name: 'Tel Aviv Savidor Bus Terminal Canopies',
    lat: 32.08379,
    lng: 34.79806,
    type: 'bus_station',
    address: 'Al Parashat Drachim, Tel Aviv-Yafo',
    area: 7200,
    solarExposure: 88,
    surfaceType: 86,
    weatherConditions: 91,
    shading: 15,
    estimatedCapacityKw: 285,
    ownership: 'transit',
    roofCondition: 'good',
  },
  {
    id: 'bus-central',
    name: 'New Central Bus Station Roof Zone',
    lat: 32.05663,
    lng: 34.77931,
    type: 'bus_station',
    address: 'Levinsky St, Tel Aviv-Yafo',
    area: 16400,
    solarExposure: 86,
    surfaceType: 84,
    weatherConditions: 90,
    shading: 19,
    estimatedCapacityKw: 620,
    ownership: 'transit',
    roofCondition: 'needs_review',
  },
  {
    id: 'building-city-hall',
    name: 'Tel Aviv-Yafo City Hall',
    lat: 32.08161,
    lng: 34.78057,
    type: 'building',
    address: '69 Ibn Gabirol St, Tel Aviv-Yafo',
    area: 8400,
    solarExposure: 89,
    surfaceType: 90,
    weatherConditions: 92,
    shading: 13,
    estimatedCapacityKw: 365,
    ownership: 'public',
    roofCondition: 'good',
  },
  {
    id: 'building-sourasky',
    name: 'Ichilov Medical Center Service Roofs',
    lat: 32.08088,
    lng: 34.78974,
    type: 'building',
    address: 'Weizmann St, Tel Aviv-Yafo',
    area: 15600,
    solarExposure: 90,
    surfaceType: 87,
    weatherConditions: 92,
    shading: 10,
    estimatedCapacityKw: 660,
    ownership: 'public',
    roofCondition: 'good',
  },
  {
    id: 'building-university',
    name: 'Tel Aviv University Public Roof Cluster',
    lat: 32.11331,
    lng: 34.80439,
    type: 'building',
    address: 'Ramat Aviv, Tel Aviv-Yafo',
    area: 21200,
    solarExposure: 94,
    surfaceType: 89,
    weatherConditions: 93,
    shading: 7,
    estimatedCapacityKw: 920,
    ownership: 'public',
    roofCondition: 'excellent',
  },
  {
    id: 'open-yarkon',
    name: 'Yarkon River Open Municipal Area',
    lat: 32.09692,
    lng: 34.80654,
    type: 'open_space',
    address: 'Ganei Yehoshua, Tel Aviv-Yafo',
    area: 38400,
    solarExposure: 95,
    surfaceType: 79,
    weatherConditions: 93,
    shading: 9,
    estimatedCapacityKw: 1280,
    ownership: 'municipal',
  },
  {
    id: 'open-port',
    name: 'Tel Aviv Port Logistics Apron',
    lat: 32.09821,
    lng: 34.77384,
    type: 'open_space',
    address: 'Namal Tel Aviv',
    area: 24600,
    solarExposure: 97,
    surfaceType: 83,
    weatherConditions: 92,
    shading: 4,
    estimatedCapacityKw: 1040,
    ownership: 'municipal',
  },
  {
    id: 'park-hayarkon',
    name: 'Hayarkon Park Solar Shade Corridor',
    lat: 32.10074,
    lng: 34.80344,
    type: 'park',
    address: 'Rokach Blvd, Tel Aviv-Yafo',
    area: 31800,
    solarExposure: 84,
    surfaceType: 71,
    weatherConditions: 92,
    shading: 28,
    estimatedCapacityKw: 470,
    ownership: 'municipal',
  },
  {
    id: 'park-charles-clore',
    name: 'Charles Clore Park Edge Structures',
    lat: 32.06347,
    lng: 34.76075,
    type: 'park',
    address: 'Charles Clore Park, Tel Aviv-Yafo',
    area: 17300,
    solarExposure: 88,
    surfaceType: 74,
    weatherConditions: 91,
    shading: 20,
    estimatedCapacityKw: 350,
    ownership: 'municipal',
  },
];
