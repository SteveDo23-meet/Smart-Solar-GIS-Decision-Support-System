import { useMemo } from 'react';
import { calculateSolarScore, getScoreBreakdown, getScoreColor, getScoreLabel } from '../utils/scoring';

export interface ScoringFactors {
  solarExposure: number;
  surfaceType: number;
  weatherConditions: number;
  shading: number;
}

export const useSolarScoring = (factors: ScoringFactors) => {
  const score = useMemo(() => {
    return calculateSolarScore(factors);
  }, [factors]);

  const color = useMemo(() => {
    return getScoreColor(score);
  }, [score]);

  const label = useMemo(() => {
    return getScoreLabel(score);
  }, [score]);

  const breakdown = useMemo(() => {
    return getScoreBreakdown(factors);
  }, [factors]);

  return {
    score,
    color,
    label,
    breakdown,
  };
};
