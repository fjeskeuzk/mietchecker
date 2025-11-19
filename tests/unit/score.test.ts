/**
 * Unit tests for scoring and normalization system
 */

import {
  normalizeMetric,
  calculateOverallScore,
  getScoreInterpretation,
  METRIC_CONFIGS,
} from '@/lib/score';

describe('Score Normalization', () => {
  describe('normalizeMetric', () => {
    it('should normalize noise metric correctly (inverted)', () => {
      const config = METRIC_CONFIGS.noise;

      // Low noise (better) should give high score
      expect(normalizeMetric(30, config)).toBe(100);

      // High noise (worse) should give low score
      expect(normalizeMetric(85, config)).toBe(0);

      // Medium noise
      const midValue = (30 + 85) / 2;
      const score = normalizeMetric(midValue, config);
      expect(score).toBeGreaterThan(40);
      expect(score).toBeLessThan(60);
    });

    it('should normalize internet speed correctly (not inverted)', () => {
      const config = METRIC_CONFIGS.internet_speed;

      // High speed (better) should give high score
      expect(normalizeMetric(1000, config)).toBe(100);

      // Low speed (worse) should give low score
      expect(normalizeMetric(10, config)).toBe(0);

      // Medium speed
      expect(normalizeMetric(250, config)).toBeGreaterThan(20);
      expect(normalizeMetric(250, config)).toBeLessThan(30);
    });

    it('should clamp values outside min/max range', () => {
      const config = METRIC_CONFIGS.grocery_stores;

      // Above max
      expect(normalizeMetric(100, config)).toBe(100);

      // Below min
      expect(normalizeMetric(-5, config)).toBe(0);
    });
  });

  describe('calculateOverallScore', () => {
    it('should calculate weighted average correctly', () => {
      const metrics = {
        noise: 80,
        light: 70,
        crime: 90,
        internet_speed: 85,
        grocery_stores: 95,
        parking: 75,
      };

      const score = calculateOverallScore(metrics);

      // Should be weighted average
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThan(100);
      expect(score).toBeCloseTo(82, 0); // Approximate expected value
    });

    it('should handle partial metrics', () => {
      const metrics = {
        noise: 80,
        internet_speed: 90,
      };

      const score = calculateOverallScore(metrics);

      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThan(100);
    });

    it('should return 0 for empty metrics', () => {
      const score = calculateOverallScore({});
      expect(score).toBe(0);
    });

    it('should respect custom weights', () => {
      const metrics = { noise: 100, crime: 0 };

      const defaultScore = calculateOverallScore(metrics);

      const customScore = calculateOverallScore(metrics, {
        noise: 0.9,
        crime: 0.1,
      });

      // With custom weights favoring noise, score should be higher
      expect(customScore).toBeGreaterThan(defaultScore);
    });
  });

  describe('getScoreInterpretation', () => {
    it('should return correct interpretation for excellent score', () => {
      const result = getScoreInterpretation(95);
      expect(result.label).toBe('Ausgezeichnet');
      expect(result.color).toBe('green');
      expect(result.emoji).toBe('🌟');
    });

    it('should return correct interpretation for good score', () => {
      const result = getScoreInterpretation(70);
      expect(result.label).toBe('Gut');
      expect(result.color).toBe('yellow');
    });

    it('should return correct interpretation for poor score', () => {
      const result = getScoreInterpretation(30);
      expect(result.label).toBe('Verbesserungsbedürftig');
      expect(result.color).toBe('red');
    });

    it('should handle boundary values', () => {
      expect(getScoreInterpretation(90).label).toBe('Ausgezeichnet');
      expect(getScoreInterpretation(89).label).toBe('Sehr gut');
      expect(getScoreInterpretation(75).label).toBe('Sehr gut');
      expect(getScoreInterpretation(74).label).toBe('Gut');
    });
  });
});
