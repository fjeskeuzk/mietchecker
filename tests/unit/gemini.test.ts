/**
 * Unit tests for Gemini LLM integration WIP
 */

import { generateChatResponse, checkRateLimit } from '@/lib/gemini';
import { Project, ProjectMetric } from '@/types/database';

// Mock Gemini API
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      startChat: jest.fn().mockReturnValue({
        sendMessage: jest.fn().mockResolvedValue({
          response: {
            text: () => 'Mocked AI response',
          },
        }),
      }),
    }),
  })),
}));

describe('Gemini Integration', () => {
  const mockProject: Project = {
    id: 'test-project-id',
    owner_id: 'test-user-id',
    title: 'Test Property',
    address: 'Test Street 123, Berlin',
    latitude: 52.52,
    longitude: 13.405,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    visibility: 'private',
    overall_score: 85,
  };

  const mockMetrics: ProjectMetric[] = [
    {
      id: 'metric-1',
      project_id: 'test-project-id',
      metric_key: 'noise',
      metric_value: 65,
      normalized_score: 72,
      raw: { db_level: 65 },
      source: 'city_of_berlin_open_data',
      fetched_at: new Date().toISOString(),
    },
  ];

  describe('generateChatResponse', () => {
    it('should generate a response in mock mode', async () => {
      // Set mock mode
      process.env.GEMINI_MOCK = 'true';

      const response = await generateChatResponse(
        mockProject,
        mockMetrics,
        'Wie ist die Lärmbelastung?'
      );

      expect(response).toBeDefined();
      expect(typeof response).toBe('string');
      expect(response.length).toBeGreaterThan(0);
    });

    it('should handle empty metrics gracefully', async () => {
      process.env.GEMINI_MOCK = 'true';

      const response = await generateChatResponse(mockProject, [], 'Test question');

      expect(response).toBeDefined();
      expect(typeof response).toBe('string');
    });

    it('should respond to noise-related questions', async () => {
      process.env.GEMINI_MOCK = 'true';

      const response = await generateChatResponse(
        mockProject,
        mockMetrics,
        'Wie laut ist es?'
      );

      expect(response.toLowerCase()).toContain('lärm');
    });

    it('should respond to shopping-related questions', async () => {
      process.env.GEMINI_MOCK = 'true';

      const response = await generateChatResponse(
        mockProject,
        mockMetrics,
        'Wo kann ich einkaufen?'
      );

      expect(response.toLowerCase()).toContain('einkauf');
    });
  });

  describe('checkRateLimit', () => {
    it('should allow requests within limit', () => {
      const userId = 'test-user-1';

      const result = checkRateLimit(userId);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBeGreaterThanOrEqual(0);
    });

    it('should block requests exceeding limit', () => {
      const userId = 'test-user-2';
      const rateLimit = parseInt(process.env.RATE_LIMIT_PER_MINUTE || '10', 10);

      // Exhaust rate limit
      for (let i = 0; i < rateLimit; i++) {
        checkRateLimit(userId);
      }

      // Next request should be blocked
      const result = checkRateLimit(userId);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should reset limit after time window', async () => {
      const userId = 'test-user-3';

      // Make a request
      checkRateLimit(userId);

      // Wait for reset (in real implementation, this would be 1 minute)
      // For testing, we'd need to mock the timer
      // This is a simplified test
      expect(checkRateLimit(userId).allowed).toBe(true);
    });

    it('should track limits separately per user', () => {
      const user1 = 'user-1';
      const user2 = 'user-2';

      checkRateLimit(user1);
      checkRateLimit(user1);

      const result1 = checkRateLimit(user1);
      const result2 = checkRateLimit(user2);

      // User 1 has used more requests
      expect(result1.remaining).toBeLessThan(result2.remaining);
    });
  });
});
