# Testing Guide

## Testing Strategy

Mietchecker uses a multi-layered testing approach to ensure code quality, reliability, and user experience.

### Testing Pyramid

```
         E2E Tests (5%)
           /          \
        Integration   Tests (20%)
       /              \
  Unit Tests (75%)
```

**Test Distribution**:
- **Unit Tests (75%)**: Fast, isolated, developer-focused
- **Integration Tests (20%)**: Database, API, external service interactions
- **E2E Tests (5%)**: Full user workflows, critical paths

## Unit Tests

### Framework & Setup

**Framework**: Jest 29.7
**Environment**: jsdom (for DOM testing)
**Testing Library**: @testing-library/react

**Jest Configuration** (`jest.config.js`):
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>'],
  testMatch: ['**/__tests__/**/*.test.ts(x)?', '**/?(*.)+(spec|test).ts(x)?'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  collectCoverageFrom: [
    'app/**/*.{ts,tsx}',
    'lib/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
};
```

**Jest Setup** (`jest.setup.js`):
```javascript
import '@testing-library/jest-dom';

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';
```

### Writing Unit Tests

#### Example 1: Score Normalization

**File**: `lib/score.test.ts`

```typescript
import { normalizeMetric, calculateOverallScore, METRIC_CONFIGS } from '@/lib/score';

describe('Score Normalization', () => {
  describe('normalizeMetric', () => {
    it('should normalize noise level (inverted metric)', () => {
      const config = METRIC_CONFIGS.noise;
      const score = normalizeMetric(65.5, config);

      // 65.5 dB is in the middle of the range (30-85), so ~50% score
      // But inverted, so 50% → 50 score
      expect(score).toBeGreaterThan(40);
      expect(score).toBeLessThan(80);
    });

    it('should handle minimum value', () => {
      const config = METRIC_CONFIGS.grocery_stores;
      const score = normalizeMetric(0, config); // 0 stores

      expect(score).toBe(0);
    });

    it('should handle maximum value', () => {
      const config = METRIC_CONFIGS.grocery_stores;
      const score = normalizeMetric(20, config); // Many stores

      expect(score).toBe(100);
    });

    it('should clamp out-of-range values', () => {
      const config = METRIC_CONFIGS.internet_speed;
      const score = normalizeMetric(5000, config); // Way above max

      expect(score).toBe(100);
    });
  });

  describe('calculateOverallScore', () => {
    it('should calculate weighted average', () => {
      const metrics = {
        noise: 72,
        light: 60,
        crime: 87,
        internet_speed: 95,
        grocery_stores: 90,
        laundromats: 80,
        parking: 85,
        demographics: 75,
      };

      const score = calculateOverallScore(metrics);

      // Should be between 0 and 100
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);

      // Should be influenced by weights
      // Noise (0.2 weight) has lower score, should drag overall down
      expect(score).toBeLessThan(80);
    });

    it('should handle missing metrics', () => {
      const metrics = {
        noise: 72,
        grocery_stores: 90,
      };

      const score = calculateOverallScore(metrics);

      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should use custom weights', () => {
      const metrics = {
        noise: 50,
        internet_speed: 100,
      };

      const customWeights = {
        noise: 0.8,
        internet_speed: 0.2,
      };

      const score = calculateOverallScore(metrics, customWeights);

      // Should be influenced more by noise (low score, high weight)
      expect(score).toBeLessThan(60);
    });
  });
});
```

**Run Tests**:
```bash
npm test -- lib/score.test.ts
npm test -- lib/score.test.ts --watch
npm test -- lib/score.test.ts --coverage
```

#### Example 2: Component Tests

**File**: `components/ProjectCard.test.tsx`

```typescript
import { render, screen } from '@testing-library/react';
import { ProjectCard } from '@/components/ProjectCard';

describe('ProjectCard', () => {
  const mockProject = {
    id: 'proj-123',
    title: 'Test Apartment',
    address: 'Berlin, Germany',
    overall_score: 78.5,
    created_at: new Date('2024-11-01'),
  };

  it('should render project title and address', () => {
    render(<ProjectCard project={mockProject} />);

    expect(screen.getByText('Test Apartment')).toBeInTheDocument();
    expect(screen.getByText('Berlin, Germany')).toBeInTheDocument();
  });

  it('should display overall score', () => {
    render(<ProjectCard project={mockProject} />);

    expect(screen.getByText('78.5/100')).toBeInTheDocument();
    expect(screen.getByText('Sehr gut')).toBeInTheDocument(); // Score interpretation
  });

  it('should have edit and delete buttons', () => {
    render(<ProjectCard project={mockProject} />);

    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
  });

  it('should call onEdit when edit button is clicked', () => {
    const onEdit = jest.fn();
    render(<ProjectCard project={mockProject} onEdit={onEdit} />);

    screen.getByRole('button', { name: /edit/i }).click();

    expect(onEdit).toHaveBeenCalledWith(mockProject);
  });
});
```

#### Example 3: API Utility Tests

**File**: `lib/osm.test.ts`

```typescript
import { calculateDistance, fetchNearbyPOIs } from '@/lib/osm';

// Mock fetch
global.fetch = jest.fn();

describe('OpenStreetMap Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateDistance', () => {
    it('should calculate distance between two points', () => {
      // Berlin to Hamburg (approx 290 km)
      const distance = calculateDistance(
        52.52,   // Berlin lat
        13.405,  // Berlin lon
        53.55,   // Hamburg lat
        10.0     // Hamburg lon
      );

      // Should be approximately 290 km = 290,000 m
      expect(distance).toBeGreaterThan(280000);
      expect(distance).toBeLessThan(300000);
    });

    it('should return 0 for same coordinates', () => {
      const distance = calculateDistance(52.52, 13.405, 52.52, 13.405);
      expect(distance).toBe(0);
    });
  });

  describe('fetchNearbyPOIs', () => {
    it('should fetch grocery stores within radius', async () => {
      const mockResponse = {
        elements: [
          {
            id: 123,
            tags: { name: 'REWE', shop: 'supermarket' },
            lat: 52.5340,
            lon: 13.4115,
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const pois = await fetchNearbyPOIs(
        52.52,    // lat
        13.405,   // lon
        500,      // radius
        { shop: ['supermarket', 'convenience'] }
      );

      expect(pois).toHaveLength(1);
      expect(pois[0].name).toBe('REWE');
      expect(pois[0].type).toBe('supermarket');
    });

    it('should retry on 429 status', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          statusText: 'Too Many Requests',
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ elements: [] }),
        });

      await fetchNearbyPOIs(52.52, 13.405, 500, {});

      // Should have retried
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });
});
```

### Test Coverage Goals

**Target Coverage**:
- Statements: 80%
- Branches: 75%
- Functions: 80%
- Lines: 80%

**Check Coverage**:
```bash
npm test -- --coverage

# Generate HTML report
npm test -- --coverage --coverage-reporters=lcov
# Open coverage/lcov-report/index.html
```

## Integration Tests

### Database Integration Tests

**Framework**: Jest with Supabase test client

**File**: `lib/supabase.test.ts`

```typescript
import { createServerSupabaseClient } from '@/lib/supabaseServer';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

describe('Database Integration', () => {
  beforeAll(async () => {
    // Set up test database (or use separate test DB)
  });

  afterEach(async () => {
    // Clean up test data
  });

  describe('Projects CRUD', () => {
    it('should create and retrieve a project', async () => {
      const supabase = supabaseAdmin;

      // Create
      const { data: project, error: createError } = await supabase
        .from('projects')
        .insert({
          owner_id: 'test-user-123',
          title: 'Test Project',
          address: 'Berlin, Germany',
          latitude: 52.52,
          longitude: 13.405,
        })
        .select()
        .single();

      expect(createError).toBeNull();
      expect(project?.title).toBe('Test Project');

      // Retrieve
      const { data: retrieved } = await supabase
        .from('projects')
        .select('*')
        .eq('id', project!.id)
        .single();

      expect(retrieved?.title).toBe('Test Project');
    });

    it('should enforce RLS (Row Level Security)', async () => {
      // Test that users can only see their own projects
      const supabase = createServerSupabaseClient(); // Auth-aware client

      const { data: projects } = await supabase
        .from('projects')
        .select('*')
        .eq('owner_id', 'other-user-id');

      // Should be empty or error out
      expect(projects).toBeNull();
    });
  });

  describe('Metrics Storage', () => {
    it('should store and retrieve metrics', async () => {
      const projectId = 'test-project-123';

      const { error } = await supabaseAdmin
        .from('project_metrics')
        .insert({
          project_id: projectId,
          metric_key: 'noise',
          metric_value: 65.5,
          normalized_score: 72,
          source: 'OpenStreetMap',
        });

      expect(error).toBeNull();

      const { data: metrics } = await supabaseAdmin
        .from('project_metrics')
        .select('*')
        .eq('project_id', projectId);

      expect(metrics).toHaveLength(1);
      expect(metrics![0].normalized_score).toBe(72);
    });
  });
});
```

### API Integration Tests

**File**: `app/api/projects/route.test.ts`

```typescript
import { createMocks } from 'node-mocks-http';
import { GET, POST } from '@/app/api/projects/route';

describe('Projects API', () => {
  it('should return 401 without authentication', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });

    await GET(req);

    expect(res._getStatusCode()).toBe(401);
  });

  it('should create a project with valid data', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        title: 'Test Project',
        address: 'Berlin, Germany',
        latitude: 52.52,
        longitude: 13.405,
      },
    });

    // Mock authentication
    req.headers.authorization = 'Bearer test-token';

    await POST(req);

    expect(res._getStatusCode()).toBe(201);
    const data = JSON.parse(res._getData());
    expect(data.project.title).toBe('Test Project');
  });

  it('should validate required fields', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        address: 'Berlin, Germany',
        // Missing title
      },
    });

    req.headers.authorization = 'Bearer test-token';

    await POST(req);

    expect(res._getStatusCode()).toBe(400);
  });
});
```

## E2E Tests

### Framework & Setup

**Framework**: Playwright 1.48
**Configuration**: `playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### Writing E2E Tests

**File**: `e2e/project-workflow.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Project Creation Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Log in before each test
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'test-password');
    await page.click('button:has-text("Sign In")');
    await page.waitForNavigation();
  });

  test('should create a new project and view metrics', async ({ page }) => {
    // Navigate to projects page
    await page.goto('/projects');

    // Click create button
    await page.click('button:has-text("New Project")');

    // Fill form
    await page.fill('input[placeholder="Project Title"]', 'My Apartment');
    await page.fill('input[placeholder="Address"]', 'Prenzlauer Berg, Berlin');
    await page.fill('input[placeholder="Latitude"]', '52.5340');
    await page.fill('input[placeholder="Longitude"]', '13.4115');

    // Submit
    await page.click('button:has-text("Create Project")');

    // Wait for project creation and ingestion
    await page.waitForURL(/\/projects\/[a-f0-9-]+/);

    // Verify project was created
    expect(await page.title()).toContain('My Apartment');

    // Trigger data ingestion
    await page.click('button:has-text("Analyze")');

    // Wait for metrics
    await page.waitForSelector('text=Overall Score');

    // Verify metrics are displayed
    const overallScore = await page.textContent('[data-testid="overall-score"]');
    expect(overallScore).toMatch(/\d+\/100/);

    // Verify individual metrics
    expect(await page.textContent('[data-metric="noise"]')).toBeTruthy();
    expect(await page.textContent('[data-metric="grocery_stores"]')).toBeTruthy();
  });

  test('should chat with AI assistant', async ({ page }) => {
    // Create a project first
    await page.goto('/projects');
    await page.click('button:has-text("New Project")');
    // ... fill form ...
    await page.click('button:has-text("Create Project")');
    await page.waitForURL(/\/projects\/[a-f0-9-]+/);

    // Scroll to chat
    await page.click('button:has-text("Chat")');

    // Send message
    await page.fill('[data-testid="chat-input"]', 'How is the noise level?');
    await page.click('button:has-text("Send")');

    // Wait for response
    await page.waitForSelector('[data-testid="assistant-message"]', {
      timeout: 10000,
    });

    // Verify response contains relevant info
    const response = await page.textContent('[data-testid="assistant-message"]');
    expect(response?.toLowerCase()).toContain('lärm' || 'noise');
  });

  test('should update project details', async ({ page }) => {
    // Navigate to existing project
    const projectUrl = await page.evaluate(() => window.location.href);

    // Open edit dialog
    await page.click('button[aria-label="Edit"]');

    // Update title
    await page.fill('input[placeholder="Project Title"]', 'Updated Title');
    await page.click('button:has-text("Save")');

    // Verify update
    expect(await page.title()).toContain('Updated Title');
  });

  test('should delete project', async ({ page }) => {
    // Open delete dialog
    await page.click('button[aria-label="Delete"]');

    // Confirm deletion
    await page.click('button:has-text("Yes, Delete")');

    // Should redirect to projects list
    await page.waitForURL('/projects');
    expect(page.url()).toContain('/projects');
  });
});

test.describe('Payment Workflow', () => {
  test('should upgrade to premium', async ({ page }) => {
    // Navigate to pricing
    await page.goto('/pricing');

    // Click upgrade button
    await page.click('button:has-text("Upgrade to Premium")');

    // Should redirect to Stripe checkout
    await page.waitForURL(/stripe.com|checkout/);

    // Note: Don't actually test payment with real card
    // Use Stripe test card in development
  });
});
```

### Run E2E Tests

```bash
# Run all E2E tests
npm run e2e

# Run specific test
npm run e2e -- project-workflow.spec.ts

# Run with UI (debug mode)
npm run e2e:ui

# Run in headed mode (see browser)
npx playwright test --headed

# Debug mode
npx playwright test --debug
```

## CI/CD Testing Workflow

### GitHub Actions

**File**: `.github/workflows/test.yml`

```yaml
name: Tests

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Run unit tests
        run: npm test -- --coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Run integration tests
        run: npm test -- --testPathPattern=integration
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npm run e2e
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/

  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Run linter
        run: npm run lint

      - name: Type check
        run: npm run type-check
```

## Test Coverage Expectations

### Frontend Components

- Render correctly with various props
- Handle user interactions (clicks, input)
- Display conditional content
- Call callbacks correctly
- Respond to state changes

**Minimum Coverage**: 80%

### Business Logic (Scoring, Calculations)

- Edge cases (0, max values, negative)
- Out-of-range inputs
- Special cases (demographics optimal range)
- Error handling

**Minimum Coverage**: 90%

### API Endpoints

- Authentication checks
- Authorization (user ownership)
- Input validation
- Error responses
- Database operations

**Minimum Coverage**: 85%

### External Integrations

- Mock external APIs
- Handle errors gracefully
- Retry logic
- Rate limiting

**Minimum Coverage**: 75%

## Running Tests Locally

### One-time Setup

```bash
# Install dependencies
pnpm install

# Set up test environment
cp .env.example .env.test

# Install Playwright browsers
npx playwright install
```

### Development Testing

```bash
# Watch mode (re-run on changes)
npm test -- --watch

# Specific test file
npm test -- lib/score.test.ts

# Test matching pattern
npm test -- --testNamePattern="normalizeMetric"

# With coverage
npm test -- --coverage --collectCoverageFrom='lib/**'
```

### Pre-commit Testing

```bash
# Lint and type check
npm run lint
npm run type-check

# Run affected tests
npm test -- --onlyChanged
```

## Debugging Tests

### VS Code Debugging

Add to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

### Playwright Inspector

```bash
# Debug mode with inspector
npx playwright test --debug

# Screenshot on failure
npx playwright test --screenshot=only-on-failure
```

## Best Practices

1. **Isolate tests**: Each test should be independent
2. **Mock external APIs**: Don't call real Overpass or Stripe APIs
3. **Use descriptive names**: Test name should describe what it tests
4. **Arrange-Act-Assert**: Organize tests with clear sections
5. **Keep tests fast**: Aim for < 1s per unit test
6. **Test behavior, not implementation**: Focus on outputs, not internals
7. **Avoid test interdependence**: Don't rely on test execution order
8. **Clean up**: Always clean up side effects (database, mocks, timers)

## Test Checklist

Before committing:

- [ ] All tests pass locally
- [ ] Coverage meets requirements (80%+)
- [ ] No skipped tests (`.skip`, `.only`)
- [ ] Linter passes
- [ ] Type checks pass
- [ ] New tests written for new features
- [ ] Edge cases covered
