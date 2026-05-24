import type { PoiType } from '../data/mockPois';

const SCORING_CALIBRATION_NOTE =
  'The scoring model uses configurable default thresholds. These values are not fixed physical constants and can be calibrated by solar engineers, physicists, municipal planners, or project clients according to real field data and project requirements.';

// Default planning configuration for the weighted decision-support model.
// These values are initial assumptions, not final physical constants.
// They are intentionally centralized so engineers, planners, and clients can calibrate them later.
export const scoringConfig = {
  calibrationMetadata: {
    modelType: 'Configurable weighted decision-support model',
    calibrationStatus: 'Default planning assumptions',
    intendedCalibrationBy: [
      'solar engineers',
      'physicists',
      'municipal planners',
      'project clients',
    ],
    note: SCORING_CALIBRATION_NOTE,
  },
  // Default contribution weights for each scoring signal.
  // These weights can be tuned against measured production data or project policy.
  featureWeights: {
    solarExposure: 0.24,
    weatherConditions: 0.12,
    surfaceType: 0.12,
    baseSolarScore: 0.22,
    area: {
      maxContribution: 18,
      logarithmicScale: 8,
      logarithmicOffset: 16,
      minimumInputArea: 100,
    },
    annualOutput: {
      maxContribution: 14,
      normalizationKwh: 1_000_000,
    },
    shadingPenalty: 0.34,
    highRiskPenalty: 10,
    mediumRiskPenalty: 4,
  },
  // Default surface preference weights. Positive values increase priority, negative values reduce it.
  surfaceTypeWeights: {
    parking: 12,
    building: 10,
    public_building: 10,
    paved_area: 8,
    open_space: 4,
    bus_station: 3,
    transport_corridor: 0,
    road_shoulder: -2,
    highway: -3,
    road: -5,
    park: -10,
  } as Record<PoiType, number>,
  // Default implementation-risk weights by surface class.
  riskSurfaceWeights: {
    default: 6,
    park: 24,
    road: 18,
    highway: 22,
    road_shoulder: 20,
    transport_corridor: 18,
    bus_station: 8,
  } as Partial<Record<PoiType, number>> & { default: number },
  // Default risk contribution values added when configurable threshold rules are triggered.
  riskFactorWeights: {
    mediumShading: 9,
    highShading: 18,
    smallArea: 10,
  },
  scoreBounds: {
    min: 0,
    max: 100,
  },
  // Default surface groups used by the model to apply configurable planning rules.
  surfaceGroups: {
    transportRisk: ['road_shoulder', 'road', 'highway', 'transport_corridor'] as PoiType[],
    practicalInstallation: ['parking', 'building', 'public_building', 'paved_area'] as PoiType[],
    roofInstallation: ['building', 'public_building'] as PoiType[],
  },
  // Default decision thresholds for classification labels and recommendation status.
  decisionThresholds: {
    recommendedMinScore: 75,
    conditionalMinScore: 50,
    conditionalMaxScore: 74,
    excellentMinScore: 86,
    highMinScore: 72,
    mediumMinScore: 52,
    highRiskMinScore: 32,
    mediumRiskMinScore: 16,
  },
  // Default ROI/output thresholds used for explainability signals.
  roiThresholds: {
    strongAnnualOutputKwh: 500_000,
    referenceAnnualOutputKwh: 1_000_000,
  },
  // Default shading thresholds used by risk and rejection logic.
  shadingThresholds: {
    lowShading: 10,
    mediumShading: 16,
    elevatedShading: 22,
    highShading: 28,
    rejectionShading: 30,
    parkTreeConflict: 22,
  },
  // Default area thresholds used by risk, confidence, and rejection logic.
  areaThresholds: {
    minimumMeaningfulArea: 900,
    limitedSurfaceArea: 1_200,
    openSpaceMinimumArea: 1_500,
    confidenceAreaBonus: 2_500,
    roadMinimumArea: 3_000,
    largeUsableSurface: 8_000,
    smallAreaRisk: 850,
  },
  // Default quality thresholds used for human-readable positive/negative factors.
  qualityThresholds: {
    strongSolarExposure: 88,
    favorableWeather: 88,
    lowWeatherReliability: 82,
    surfaceReview: 70,
    parkingPriorityScore: 74,
    buildingSurveyScore: 70,
    shortlistScore: 62,
  },
  // Default confidence parameters for the explainable recommendation confidence score.
  confidenceWeights: {
    base: 0.58,
    positiveFactorBoost: 0.055,
    negativeFactorPenalty: 0.025,
    areaConfidenceBoost: 0.06,
    min: 0.42,
    max: 0.94,
  },
  explanation: {
    methodology: 'Configurable weighted decision-support model',
    note: SCORING_CALIBRATION_NOTE,
  },
  notes: [
    'Values are default planning assumptions, not fixed scientific constants.',
    'Solar engineers, physicists, municipal planners, and clients can tune these parameters according to surveys, policy priorities, and measured production data.',
    'The scoring engine is explainable by design so each recommendation can be traced back to weighted criteria.',
  ],
};

export type ScoringConfig = typeof scoringConfig;

export const getScoringCalibrationNote = () => SCORING_CALIBRATION_NOTE;
