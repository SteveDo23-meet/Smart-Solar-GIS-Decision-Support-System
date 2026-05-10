export const formatArea = (areaInSquareMeters: number): string => {
  if (areaInSquareMeters < 10_000) {
    return `${areaInSquareMeters.toLocaleString('en-US', { maximumFractionDigits: 0 })} m2`;
  }

  return `${(areaInSquareMeters / 10_000).toLocaleString('en-US', {
    maximumFractionDigits: 1,
  })} ha`;
};

export const formatEnergy = (energyInKwh: number): string => {
  if (energyInKwh < 1_000_000) {
    return `${(energyInKwh / 1_000).toLocaleString('en-US', {
      maximumFractionDigits: 1,
    })} MWh`;
  }

  return `${(energyInKwh / 1_000_000).toLocaleString('en-US', {
    maximumFractionDigits: 2,
  })} GWh`;
};

export const formatPower = (powerInKw: number): string => {
  if (powerInKw < 1_000) {
    return `${powerInKw.toLocaleString('en-US', { maximumFractionDigits: 0 })} kW`;
  }

  return `${(powerInKw / 1_000).toLocaleString('en-US', { maximumFractionDigits: 2 })} MW`;
};

export const formatNumber = (num: number, decimals = 0): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
};

export const formatCurrency = (value: number): string => {
  if (Math.abs(value) >= 1_000_000) {
    return `$${(value / 1_000_000).toLocaleString('en-US', { maximumFractionDigits: 2 })}M`;
  }

  if (Math.abs(value) >= 1_000) {
    return `$${(value / 1_000).toLocaleString('en-US', { maximumFractionDigits: 0 })}K`;
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatPercentage = (value: number): string => `${value.toFixed(0)}%`;

export const formatCoordinate = (value: number, precision = 5): string => value.toFixed(precision);
