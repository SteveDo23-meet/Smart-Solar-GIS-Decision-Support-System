export interface ScoringFactors {
  solarExposure: number;
  surfaceType: number;
  weatherConditions: number;
  shading: number;
}

export const calculateSolarScore = (factors: ScoringFactors): number => {
  const rawScore =
    factors.solarExposure + factors.surfaceType + factors.weatherConditions - factors.shading;

  return Math.round(Math.max(0, Math.min(100, rawScore / 3)));
};

export const getScoreBreakdown = (factors: ScoringFactors) => ({
  solarExposure: factors.solarExposure,
  surfaceType: factors.surfaceType,
  weatherConditions: factors.weatherConditions,
  shading: -factors.shading,
});

export const getScoreColor = (score: number): string => {
  if (score >= 85) return '#22c55e';
  if (score >= 75) return '#84cc16';
  if (score >= 60) return '#facc15';
  return '#fb7185';
};

export const getScoreLabel = (score: number): 'Prime' | 'Strong' | 'Moderate' | 'Review' => {
  if (score >= 85) return 'Prime';
  if (score >= 75) return 'Strong';
  if (score >= 60) return 'Moderate';
  return 'Review';
};
