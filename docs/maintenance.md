# Maintenance Guide

## Overview

This guide provides step-by-step instructions for common maintenance tasks in Mietchecker, including adding metrics, onboarding new cities, database migrations, monitoring, and troubleshooting.

## How to Add a New Metric

### 1. Define Metric Configuration

Add metric to `lib/score.ts`:

```typescript
// lib/score.ts

export const METRIC_CONFIGS: Record<MetricKey, MetricConfig> = {
  // ... existing metrics ...

  air_quality: {
    weight: 0.15,
    min: 0,
    max: 500,
    inverted: true, // Lower AQI is better
    label: 'Luftqualität',
    icon: '💨',
    unit: 'AQI',
  },
};
```

### 2. Update Type Definitions

Add to `types/database.ts`:

```typescript
// types/database.ts

export type MetricKey =
  | 'noise'
  | 'light'
  | 'crime'
  | 'internet_speed'
  | 'demographics'
  | 'grocery_stores'
  | 'laundromats'
  | 'parking'
  | 'air_quality'; // NEW

export interface ProjectMetric {
  // ... existing fields ...
  metric_key: MetricKey;
}
```

### 3. Add Data Source Integration

Create a new function in relevant data provider:

```typescript
// lib/osm.ts (if sourcing from OSM) or lib/providers/berlinProvider.ts

export async function fetchAirQuality(lat: number, lon: number): Promise<number> {
  try {
    const response = await fetch(
      `https://api.waqi.info/feed/geo:${lat};${lon}/?token=${process.env.WAQI_API_KEY}`
    );
    const data = await response.json();
    return data.data.aqi; // Return raw AQI value
  } catch (error) {
    console.error('Failed to fetch air quality:', error);
    throw error;
  }
}
```

### 4. Integrate into Data Ingestion

Update the ingestion endpoint:

```typescript
// app/api/projects/[projectId]/ingest/route.ts

import { fetchAirQuality } from '@/lib/airQuality';

async function ingestProjectMetrics(projectId: string, latitude: number, longitude: number) {
  const [
    grocery,
    laundromats,
    parking,
    light,
    noise,
    crime,
    internet,
    demographics,
    airQuality, // NEW
  ] = await Promise.all([
    fetchGroceryStores(latitude, longitude),
    fetchLaundromats(latitude, longitude),
    fetchParking(latitude, longitude),
    estimateLightPollution(latitude, longitude),
    // ... city data providers ...
    fetchAirQuality(latitude, longitude), // NEW
  ]);

  // Normalize air quality
  const airQualityScore = normalizeMetric(
    airQuality,
    METRIC_CONFIGS.air_quality
  );

  // Store in database
  await supabase.from('project_metrics').insert({
    project_id: projectId,
    metric_key: 'air_quality',
    metric_value: airQuality,
    normalized_score: airQualityScore,
    source: 'WAQI API',
    fetched_at: new Date(),
  });

  return {
    air_quality: {
      raw_value: airQuality,
      normalized_score: airQualityScore,
      unit: 'AQI',
    },
  };
}
```

### 5. Update Overall Score Calculation

The `calculateOverallScore` function will automatically include the new metric based on its weight in METRIC_CONFIGS.

### 6. Test the New Metric

```typescript
// lib/airQuality.test.ts

import { fetchAirQuality } from '@/lib/airQuality';
import { normalizeMetric, METRIC_CONFIGS } from '@/lib/score';

describe('Air Quality Metric', () => {
  it('should fetch and normalize air quality', async () => {
    const aqi = await fetchAirQuality(52.52, 13.405); // Berlin

    expect(aqi).toBeGreaterThan(0);
    expect(aqi).toBeLessThan(500);

    const score = normalizeMetric(aqi, METRIC_CONFIGS.air_quality);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('should handle high AQI (worse health)', () => {
    const score = normalizeMetric(250, METRIC_CONFIGS.air_quality); // Unhealthy
    expect(score).toBeLessThan(50);
  });

  it('should handle low AQI (better health)', () => {
    const score = normalizeMetric(50, METRIC_CONFIGS.air_quality); // Good
    expect(score).toBeGreaterThan(80);
  });
});
```

### 7. Update Frontend to Display Metric

Add to dashboard/metrics display:

```typescript
// components/MetricsDisplay.tsx

import { METRIC_CONFIGS } from '@/lib/score';

function MetricCard({ metricKey, score, value }: MetricProps) {
  const config = METRIC_CONFIGS[metricKey];

  return (
    <div className="metric-card" data-metric={metricKey}>
      <span className="icon">{config.icon}</span>
      <h3>{config.label}</h3>
      <p className="value">
        {value} {config.unit}
      </p>
      <div className="score-bar">
        <div
          className="score-fill"
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="score">{score}/100</span>
    </div>
  );
}
```

### 8. Update Database Schema (if needed)

If the new metric requires new columns:

```sql
-- db/migrations/202411180001_add_air_quality.sql

-- Update schema to ensure air_quality is in the enum
ALTER TYPE metric_key ADD VALUE 'air_quality';

-- Create index for faster queries
CREATE INDEX idx_metrics_air_quality
ON project_metrics(metric_key, normalized_score)
WHERE metric_key = 'air_quality';
```

### 9. Deploy

```bash
# 1. Run tests
npm test

# 2. Run type check
npm run type-check

# 3. Commit changes
git add .
git commit -m "feat: add air quality metric"

# 4. Merge to main
git push origin feature/air-quality-metric

# 5. Deploy (automatic via Vercel)
# Vercel automatically deploys on main branch push
```

## How to Add a New City Data Source

See detailed instructions in [data-sources.md](./data-sources.md) under "How to Add a New City" section.

**Quick Summary**:

1. Identify authoritative data sources for the city
2. Create city provider file (`lib/providers/[cityName]Provider.ts`)
3. Implement fetch functions for each metric
4. Register city in `lib/cityData.ts`
5. Add coordinate bounds for geographic validation
6. Test with sample locations in the city
7. Update documentation with example endpoints

### Example: Adding Frankfurt

```typescript
// lib/providers/frankfurtProvider.ts

import { CityMetricProvider } from '@/types/cityData';

export const frankfurtNoiseProvider: CityMetricProvider = {
  name: 'Frankfurt Noise Maps',
  endpoint: 'https://offenedaten.frankfurt.de/api/lärm',
  method: 'api',
  async fetch(lat: number, lon: number): Promise<number> {
    // Frankfurt-specific API call
    const response = await fetch(
      `https://offenedaten.frankfurt.de/api/lärm?lat=${lat}&lon=${lon}`
    );
    const data = await response.json();
    return data.noise_db;
  }
};

// ... more providers ...

// Register in lib/cityData.ts
export const cityDataSources = {
  // ... existing cities ...

  frankfurt: {
    name: 'Frankfurt am Main',
    country: 'Germany',
    bounds: {
      north: 50.1914,
      south: 49.9652,
      east: 8.7914,
      west: 8.4141,
    },
    providers: {
      noise: frankfurtNoiseProvider,
      crime: frankfurtCrimeProvider,
      internet_speed: frankfurtInternetProvider,
      demographics: frankfurtDemographicsProvider,
    },
  },
};
```

## Database Migrations

### Creating Migrations

Supabase auto-creates the schema, but for custom changes:

```sql
-- db/migrations/202411180002_add_new_column.sql

-- Add new column with default value
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_projects_notes
ON projects(notes);

-- Add constraint
ALTER TABLE project_metrics
ADD CONSTRAINT check_valid_score
CHECK (normalized_score BETWEEN 0 AND 100);
```

### Running Migrations

#### Local Development
```bash
# Using Supabase CLI
supabase db pull  # Sync local schema with remote

# Make changes to db/migrations/
# Test locally
npm run test

# Push to remote
supabase db push
```

#### Production
```bash
# Supabase Dashboard:
# 1. Go to SQL Editor
# 2. Paste migration script
# 3. Run (automatically creates backup)
# 4. Verify in Table Editor

# Or via CLI:
supabase db push --linked
```

### Rollback Plan

Always have a rollback script:

```sql
-- db/rollbacks/202411180002_rollback.sql

-- Remove column (if added)
ALTER TABLE projects DROP COLUMN IF EXISTS notes;

-- Remove index
DROP INDEX IF EXISTS idx_projects_notes;

-- Remove constraint
ALTER TABLE project_metrics DROP CONSTRAINT check_valid_score;
```

**Important**: Test rollback locally before deploying migrations to production.

## Monitoring & Logging

### Current Monitoring

Mietchecker currently uses basic console logging.

### Recommended Monitoring Setup

#### 1. Error Tracking (Sentry)

```bash
# Install Sentry
npm install @sentry/nextjs

# Configure in next.config.js
withSentryConfig(nextConfig, {
  org: 'mietchecker',
  project: 'mietchecker-api',
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  widenClientFileUpload: true,
});

# Set environment variable
SENTRY_AUTH_TOKEN=your-token
```

**Usage in Code**:
```typescript
import * as Sentry from "@sentry/nextjs";

try {
  // risky operation
} catch (error) {
  Sentry.captureException(error);
}
```

#### 2. Performance Monitoring (Vercel Analytics)

Already integrated with Vercel deployment. Check:
- Function execution time
- API latency
- Database query performance

**Dashboard**: https://vercel.com/dashboard

#### 3. Database Monitoring

```typescript
// Log slow queries
export async function logSlowQuery(query: string, duration: number) {
  if (duration > 1000) { // > 1 second
    console.warn(`Slow query (${duration}ms):`, query);

    // Send alert
    await alertSlackChannel(
      `Slow query detected: ${query} (${duration}ms)`
    );
  }
}
```

#### 4. Uptime Monitoring

Service: Uptime Robot, Pingdom, or Vercel Health Checks

```bash
# Vercel automatically checks health
# Configure in vercel.json:
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "outputDirectory": ".next",
  "regions": ["iad1"]
}
```

#### 5. API Metrics

Track key metrics:

```typescript
// lib/metrics.ts

export interface APIMetric {
  endpoint: string;
  method: string;
  status_code: number;
  duration_ms: number;
  timestamp: Date;
}

const metrics: APIMetric[] = [];

export function recordMetric(metric: APIMetric) {
  metrics.push(metric);

  // Send to analytics service every minute
  if (metrics.length > 100) {
    sendMetricsToAnalytics(metrics);
    metrics.length = 0;
  }
}

// Use in API routes
async function handleRequest(req: Request) {
  const start = Date.now();

  try {
    // ... handle request ...
    recordMetric({
      endpoint: req.url,
      method: req.method,
      status_code: 200,
      duration_ms: Date.now() - start,
      timestamp: new Date(),
    });
  } catch (error) {
    recordMetric({
      endpoint: req.url,
      method: req.method,
      status_code: 500,
      duration_ms: Date.now() - start,
      timestamp: new Date(),
    });
  }
}
```

### Log Levels

```typescript
// lib/logger.ts

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

const LOG_LEVEL = process.env.LOG_LEVEL || LogLevel.INFO;

export function log(level: LogLevel, message: string, data?: any) {
  if (level >= LOG_LEVEL) {
    const timestamp = new Date().toISOString();
    const levelName = LogLevel[level];

    if (data) {
      console.log(`[${timestamp}] ${levelName}: ${message}`, data);
    } else {
      console.log(`[${timestamp}] ${levelName}: ${message}`);
    }
  }
}

export const logger = {
  debug: (msg: string, data?: any) => log(LogLevel.DEBUG, msg, data),
  info: (msg: string, data?: any) => log(LogLevel.INFO, msg, data),
  warn: (msg: string, data?: any) => log(LogLevel.WARN, msg, data),
  error: (msg: string, data?: any) => log(LogLevel.ERROR, msg, data),
};
```

**Usage**:
```typescript
logger.info('User created', { userId: user.id, email: user.email });
logger.error('Failed to fetch metrics', { projectId, error });
```

## Common Troubleshooting

### Issue: Data Ingestion Failing

**Symptoms**:
- Projects stuck with no metrics
- 500 error on `/api/projects/:id/ingest`

**Diagnosis**:
```bash
# Check server logs
vercel logs

# Check for external API errors
# - Overpass API 429: Rate limited
# - City API timeout: Provider down
# - Gemini API error: Token invalid
```

**Solutions**:
```typescript
// Increase timeout
const timeouts = {
  overpass: 30000, // 30 seconds
  city_api: 15000,
  gemini: 20000,
};

// Implement better retry logic
async function fetchWithExponentialBackoff(
  fn: () => Promise<any>,
  maxRetries = 5
) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      const delay = Math.pow(2, i) * 1000;
      logger.warn(`Retry attempt ${i + 1} after ${delay}ms`, error);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw error;
}
```

### Issue: Chat Response Slow or Timing Out

**Symptoms**:
- Chat requests hang for 30+ seconds
- Users see "Request timeout" error

**Diagnosis**:
```typescript
// Add timing logs
logger.info('Chat request started', { projectId });

const startTime = Date.now();
const response = await generateChatResponse(project, metrics, message);
logger.info('Chat response generated', {
  projectId,
  duration: Date.now() - startTime,
});
```

**Solutions**:
1. Reduce context window (conversation history limited to 10 messages) ✓ Already implemented
2. Use streaming response instead of waiting for full response ✓ Already implemented
3. Enable Gemini API caching (future enhancement)
4. Increase function timeout in Vercel

```json
{
  "functions": {
    "app/api/projects/*/chat/route.ts": {
      "maxDuration": 30
    }
  }
}
```

### Issue: Rate Limit Errors (429)

**Symptoms**:
- Users hitting rate limits on chat API
- External API errors from Overpass

**Solutions**:

```typescript
// Adjust rate limit per user
const RATE_LIMIT_PER_MINUTE = process.env.RATE_LIMIT_PER_MINUTE || 10;

// Implement request queuing for high load
class RequestQueue {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;

  async add<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          resolve(await fn());
        } catch (error) {
          reject(error);
        }
      });

      if (!this.processing) {
        this.process();
      }
    });
  }

  private async process() {
    this.processing = true;

    while (this.queue.length > 0) {
      const fn = this.queue.shift();
      if (fn) {
        await fn();
        await new Promise(r => setTimeout(r, 100)); // Throttle
      }
    }

    this.processing = false;
  }
}
```

### Issue: Database Connection Errors

**Symptoms**:
- "connection timeout" errors
- Projects can't be created

**Diagnosis**:
```bash
# Check Supabase status
curl https://api.github.com/repos/supabase/supabase/issues \
  | grep -i "database\|outage"

# Test connection locally
psql $DATABASE_URL -c "SELECT 1"
```

**Solutions**:
1. Check connection string in environment variables
2. Verify IP whitelist (if restricted)
3. Increase connection pool size:

```typescript
const supabase = createClient(url, key, {
  db: {
    schema: 'public',
  },
  global: {
    headers: { 'x-connection-timeout': '10000' },
  },
});
```

### Issue: Payment Webhook Not Processing

**Symptoms**:
- User payment completes but subscription not activated
- No payment records in database

**Diagnosis**:
```bash
# Check Stripe webhook delivery
# Stripe Dashboard → Developers → Webhooks → Events

# Verify signature in logs
logger.info('Webhook signature verified', { eventId });
logger.error('Webhook signature failed', { error });
```

**Solutions**:
```typescript
// Implement webhook retry logic
async function processWebhookWithRetry(event: Stripe.Event) {
  const maxRetries = 3;

  for (let i = 0; i < maxRetries; i++) {
    try {
      // Process event (database update, etc.)
      return await handleStripeEvent(event);
    } catch (error) {
      logger.error(`Webhook processing failed (attempt ${i + 1})`, error);

      if (i < maxRetries - 1) {
        await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000));
      }
    }
  }

  // Send alert if all retries fail
  await alertSlackChannel(`Critical: Webhook ${event.id} failed after ${maxRetries} retries`);
}
```

### Issue: High Memory Usage

**Symptoms**:
- Lambda function killed (out of memory)
- Slow performance under load

**Solutions**:
```typescript
// Clear caches periodically
const OSM_CACHE_MAX_SIZE = 1000;

function setCachedData(key: string, data: unknown): void {
  // Implement LRU (Least Recently Used) eviction
  if (cache.size > OSM_CACHE_MAX_SIZE) {
    const firstKey = cache.keys().next().value;
    cache.delete(firstKey);
  }

  cache.set(key, { data, timestamp: Date.now() });
}

// Limit conversation history in memory
const MAX_CACHED_CONVERSATIONS = 100;

// Use streaming for large responses
// Don't buffer entire OSM response in memory
```

## Maintenance Checklist

### Daily
- [ ] Monitor error logs (Sentry)
- [ ] Check API response times
- [ ] Verify payment processing
- [ ] Review user feedback

### Weekly
- [ ] Review chat quality (sample conversations)
- [ ] Check database storage usage
- [ ] Verify all data sources are responding
- [ ] Test data ingestion with sample project

### Monthly
- [ ] Analyze usage metrics
- [ ] Review and rotate API keys
- [ ] Update dependencies (security patches)
- [ ] Database backup verification
- [ ] Audit user access logs
- [ ] Review cost optimizations

### Quarterly
- [ ] Performance optimization review
- [ ] Security audit
- [ ] Update documentation
- [ ] Plan feature additions
- [ ] GDPR compliance check

### Annually
- [ ] Full system audit
- [ ] Architecture review
- [ ] Disaster recovery testing
- [ ] Dependency updates
- [ ] Security penetration testing

## Useful Commands

```bash
# Development
npm run dev                    # Start dev server
npm test                      # Run tests
npm run lint                  # Check linting
npm run type-check            # TypeScript check

# Database
supabase db pull             # Sync schema locally
supabase db push             # Deploy migrations
supabase db reset            # Reset local DB (dev only!)

# Deployment
git push origin main         # Trigger Vercel deploy
vercel logs                  # View production logs
vercel env                   # Manage env vars

# Monitoring
curl https://mietchecker.de/api/health  # Health check
# (implement health endpoint if needed)
```

## Contact & Escalation

**For urgent issues**:
1. Check status page
2. Review recent logs
3. Contact on-call engineer
4. Escalate to DevOps if infrastructure issue

**For feature requests**:
- Use GitHub Issues (https://github.com/mietchecker/mietchecker/issues)
- Tag with `enhancement` label

**For security issues**:
- Email security@mietchecker.de
- Do NOT open public GitHub issues
