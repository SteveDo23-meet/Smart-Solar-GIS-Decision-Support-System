import { useState, useCallback, useRef } from 'react';
import { MOCK_POIS } from '../data/mockPois';
import { analyzeSolarPotential } from '../services/solarAnalysis.service';
import type { AnalysisResult } from '../services/solarAnalysis.service';
import type { POI } from '../data/mockPois';

export const useMockAnalysis = () => {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(() => analyzeSolarPotential(MOCK_POIS));
  const [candidatePois, setCandidatePois] = useState<POI[]>(MOCK_POIS);
  const [isAnalyzed, setIsAnalyzed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [overlayResetKey, setOverlayResetKey] = useState(0);
  const pendingAnalysisRef = useRef<number | null>(null);

  const runAnalysis = useCallback((pois: POI[]) => {
    if (pendingAnalysisRef.current) {
      window.clearTimeout(pendingAnalysisRef.current);
    }

    setIsLoading(true);
    setError(null);
    setOverlayResetKey((key) => key + 1);
    setCandidatePois(pois);
    setIsAnalyzed(true);

    try {
      pendingAnalysisRef.current = window.setTimeout(() => {
        const result = analyzeSolarPotential(pois);
        setAnalysis(result);
        setIsLoading(false);
        pendingAnalysisRef.current = null;
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
      setIsLoading(false);
    }
  }, []);

  const clearAnalysis = useCallback(() => {
    if (pendingAnalysisRef.current) {
      window.clearTimeout(pendingAnalysisRef.current);
      pendingAnalysisRef.current = null;
    }

    setAnalysis(null);
    setCandidatePois([]);
    setIsAnalyzed(false);
    setIsLoading(false);
    setError(null);
    setOverlayResetKey((key) => key + 1);
  }, []);

  return {
    analysis,
    candidatePois,
    isAnalyzed,
    isLoading,
    error,
    overlayResetKey,
    runAnalysis,
    clearAnalysis,
  };
};
