// Scoring and normalization system for property metrics

import { MetricKey } from '@/types/database';

export interface MetricConfig {
  weight: number;
  min: number;
  max: number;
  inverted: boolean; // If true, lower values are better
  label: string;
  icon: string;
  unit?: string;
}

// Default metric configurations
export const METRIC_CONFIGS: Record<MetricKey, MetricConfig> = {
  noise: {
    weight: 0.2,
    min: 30,
    max: 85,
    inverted: true, // Lower noise is better
    label: 'Lärmbelastung',
    icon: '🔊',
    unit: 'dB',
  },
  light: {
    weight: 0.1,
    min: 1,
    max: 9,
    inverted: true, // Lower light pollution is better (Bortle scale)
    label: 'Lichtverschmutzung',
    icon: '💡',
  },
  crime: {
    weight: 0.2,
    min: 0,
    max: 50,
    inverted: true, // Lower crime is better
    label: 'Kriminalität',
    icon: '🛡️',
    unit: 'pro 1000',
  },
  internet_speed: {
    weight: 0.2,
    min: 10,
    max: 1000,
    inverted: false, // Higher speed is better
    label: 'Internetgeschwindigkeit',
    icon: '🌐',
    unit: 'Mbps',
  },
  demographics: {
    weight: 0.05,
    min: 20,
    max: 50,
    inverted: false, // Depends on preference, but we'll use a target of 30-40 as optimal
    label: 'Demografie',
    icon: '👥',
    unit: 'Durchschnittsalter',
  },
  grocery_stores: {
    weight: 0.15,
    min: 0,
    max: 15,
    inverted: false, // More stores is better
    label: 'Lebensmittelgeschäfte',
    icon: '🛒',
    unit: 'Anzahl',
  },
  laundromats: {
    weight: 0.05,
    min: 0,
    max: 5,
    inverted: false, // More laundromats is better
    label: 'Waschsalons',
    icon: '🧺',
    unit: 'Anzahl',
  },
  parking: {
    weight: 0.15,
    min: 0,
    max: 10,
    inverted: false, // More parking is better
    label: 'Parkmöglichkeiten',
    icon: '🅿️',
    unit: 'Anzahl',
  },
};

/**
 * Normalize a raw metric value to a 0-100 score
 * @param value Raw metric value
 * @param config Metric configuration
 * @returns Normalized score (0-100, higher is better)
 */
export function normalizeMetric(value: number, config: MetricConfig): number {
  // Clamp value to min/max range
  const clampedValue = Math.max(config.min, Math.min(config.max, value));

  // Calculate percentage within range
  let score = ((clampedValue - config.min) / (config.max - config.min)) * 100;

  // Invert if lower is better
  if (config.inverted) {
    score = 100 - score;
  }

  // Special case for demographics: optimal range is 30-40
  if (value >= 30 && value <= 40) {
    score = 100;
  } else if (value < 30) {
    score = ((value - config.min) / (30 - config.min)) * 100;
  } else {
    score = 100 - ((value - 40) / (config.max - 40)) * 100;
  }

  return Math.round(Math.max(0, Math.min(100, score)));
}

/**
 * Calculate weighted overall score for a project
 * @param metrics Map of metric keys to normalized scores
 * @param customWeights Optional custom weights
 * @returns Overall weighted score (0-100)
 */
export function calculateOverallScore(
  metrics: Partial<Record<MetricKey, number>>,
  customWeights?: Partial<Record<MetricKey, number>>
): number {
  let totalWeight = 0;
  let weightedSum = 0;

  for (const [key, score] of Object.entries(metrics)) {
    const metricKey = key as MetricKey;
    const config = METRIC_CONFIGS[metricKey];
    if (!config || score === null || score === undefined) continue;

    const weight = customWeights?.[metricKey] ?? config.weight;
    totalWeight += weight;
    weightedSum += score * weight;
  }

  if (totalWeight === 0) return 0;

  return Math.round(weightedSum / totalWeight);
}

/**
 * Get score interpretation
 * @param score Normalized score (0-100)
 * @returns Interpretation object
 */
export function getScoreInterpretation(score: number): {
  label: string;
  color: string;
  emoji: string;
} {
  if (score >= 90) {
    return { label: 'Ausgezeichnet', color: 'green', emoji: '🌟' };
  } else if (score >= 75) {
    return { label: 'Sehr gut', color: 'lime', emoji: '✅' };
  } else if (score >= 60) {
    return { label: 'Gut', color: 'yellow', emoji: '👍' };
  } else if (score >= 40) {
    return { label: 'Befriedigend', color: 'orange', emoji: '⚠️' };
  } else {
    return { label: 'Verbesserungsbedürftig', color: 'red', emoji: '⚠️' };
  }
}

/**
 * Get detailed metric description
 * @param metricKey Metric key
 * @param value Raw value
 * @param score Normalized score
 * @returns Description string
 */
export function getMetricDescription(
  metricKey: MetricKey,
  value: number,
  score: number
): string {
  const config = METRIC_CONFIGS[metricKey];
  const interpretation = getScoreInterpretation(score);

  const valueStr = config.unit ? `${value} ${config.unit}` : value.toString();

  const descriptions: Record<MetricKey, string> = {
    noise: `Die Lärmbelastung beträgt ${valueStr}. ${interpretation.label} (${score}/100).`,
    light: `Lichtverschmutzung Stufe ${Math.round(value)} auf der Bortle-Skala. ${interpretation.label} (${score}/100).`,
    crime: `Kriminalitätsrate von ${valueStr}. ${interpretation.label} (${score}/100).`,
    internet_speed: `Internetgeschwindigkeit von ${valueStr}. ${interpretation.label} (${score}/100).`,
    demographics: `Durchschnittsalter ${valueStr}. ${interpretation.label} (${score}/100).`,
    grocery_stores: `${Math.round(value)} Lebensmittelgeschäfte in der Nähe. ${interpretation.label} (${score}/100).`,
    laundromats: `${Math.round(value)} Waschsalons in der Nähe. ${interpretation.label} (${score}/100).`,
    parking: `${Math.round(value)} Parkmöglichkeiten verfügbar. ${interpretation.label} (${score}/100).`,
  };

  return descriptions[metricKey];
}
