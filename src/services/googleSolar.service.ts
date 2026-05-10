export interface GoogleSolarBuildingInsights {
  annualEnergyKwh?: number;
  solarPotentialScore?: number;
  sunshineHours?: number;
  roofAreaMeters2?: number;
  maxArrayPanelsCount?: number;
  carbonOffsetKgPerYear?: number;
  notes: string[];
}

interface GoogleSolarApiResponse {
  solarPotential?: {
    maxArrayPanelsCount?: number;
    panelCapacityWatts?: number;
    yearlyEnergyDcKwh?: number;
    maxSunshineHoursPerYear?: number;
    wholeRoofStats?: {
      areaMeters2?: number;
      sunshineQuantiles?: number[];
    };
    carbonOffsetFactorKgPerMwh?: number;
  };
}

const getBackendSolarUrl = (lat: number, lng: number) => {
  const params = new URLSearchParams({
    lat: String(lat),
    lng: String(lng),
  });

  return `/api/google-solar/building-insights?${params.toString()}`;
};

const getDirectSolarUrl = (lat: number, lng: number, apiKey: string) => {
  const params = new URLSearchParams({
    'location.latitude': String(lat),
    'location.longitude': String(lng),
    key: apiKey,
  });

  return `https://solar.googleapis.com/v1/buildingInsights:findClosest?${params.toString()}`;
};

const normalizeGoogleSolarResponse = (data: GoogleSolarApiResponse): GoogleSolarBuildingInsights | null => {
  const potential = data.solarPotential;
  if (!potential) return null;

  const annualEnergyKwh = potential.yearlyEnergyDcKwh;
  const maxArrayPanelsCount = potential.maxArrayPanelsCount;
  const roofAreaMeters2 = potential.wholeRoofStats?.areaMeters2;
  const sunshineHours = potential.maxSunshineHoursPerYear;
  const carbonOffsetKgPerYear =
    typeof annualEnergyKwh === 'number' && typeof potential.carbonOffsetFactorKgPerMwh === 'number'
      ? (annualEnergyKwh / 1000) * potential.carbonOffsetFactorKgPerMwh
      : undefined;

  if (!annualEnergyKwh && !maxArrayPanelsCount && !roofAreaMeters2) return null;

  return {
    annualEnergyKwh,
    maxArrayPanelsCount,
    roofAreaMeters2,
    sunshineHours,
    carbonOffsetKgPerYear,
    solarPotentialScore: Math.round(
      Math.max(
        35,
        Math.min(
          98,
          (sunshineHours ? sunshineHours / 26 : 72) +
            (roofAreaMeters2 ? Math.min(16, roofAreaMeters2 / 80) : 0) +
            (maxArrayPanelsCount ? Math.min(10, maxArrayPanelsCount / 30) : 0)
        )
      )
    ),
    notes: ['Google Solar buildingInsights data normalized for rooftop candidate.'],
  };
};

export const fetchGoogleSolarBuildingInsights = async (
  lat: number,
  lng: number,
  signal?: AbortSignal
): Promise<GoogleSolarBuildingInsights | null> => {
  const backendResponse = await fetch(getBackendSolarUrl(lat, lng), { signal }).catch((error: unknown) => {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    return null;
  });

  if (backendResponse?.ok) {
    try {
      const data = (await backendResponse.json()) as GoogleSolarApiResponse;
      return normalizeGoogleSolarResponse(data);
    } catch {
      return null;
    }
  }

  const browserApiKey = import.meta.env.VITE_GOOGLE_SOLAR_API_KEY as string | undefined;
  if (!browserApiKey) return null;

  // TODO: Move Solar API calls to backend/proxy before production.
  const response = await fetch(getDirectSolarUrl(lat, lng, browserApiKey), { signal }).catch((error: unknown) => {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    return null;
  });
  if (!response?.ok) return null;

  try {
    const data = (await response.json()) as GoogleSolarApiResponse;
    return normalizeGoogleSolarResponse(data);
  } catch {
    return null;
  }
};
