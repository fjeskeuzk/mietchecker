# Mietchecker

AI-powered property evaluation SaaS for German house hunters.

## Overview

Mietchecker helps you make informed decisions when searching for properties in Germany by collecting and analyzing data from multiple sources including OpenStreetMap and city open data portals. The platform provides:

- **Comprehensive Data Collection**: Aggregates data on noise pollution, light pollution, crime rates, internet speed, demographics, nearby amenities, and more
- **AI-Powered Analysis**: Uses Gemini AI to provide intelligent property recommendations and answer questions
- **Interactive Chat**: Ask questions about any property and get instant, data-backed answers
- **Scoring System**: Normalized scoring (0-100) for each metric and an overall property score

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes (serverless)
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **Authentication**: Supabase Auth
- **Payments**: Stripe
- **AI**: Google Gemini (`gemini-2.5-flash-lite`)
- **Data Sources**: OpenStreetMap (Overpass API), German city open data portals
- **Deployment**: Vercel

## Quick Start

### Prerequisites

- Node.js 18+ and npm/pnpm
- Supabase account and project
- (Optional) Stripe account for payments
- (Optional) Gemini API key (can use mock mode)

### Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd mietchecker
```

2. **Install dependencies**

```bash
npm install
# or
pnpm install
```

3. **Set up environment variables**

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Stripe (optional for local dev)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...

# Gemini AI (use GEMINI_MOCK=true for testing without API key)
GEMINI_API_KEY=your-api-key
GEMINI_MODEL=gemini-2.5-flash-lite
GEMINI_MOCK=true
```

4. **Set up Supabase locally (recommended)**

Install Supabase CLI:

```bash
npm install -g supabase
```

Start local Supabase:

```bash
supabase start
```

Apply migrations:

```bash
supabase db reset
```

Alternatively, for remote Supabase, apply the schema manually:
- Go to your Supabase project dashboard
- Navigate to SQL Editor
- Run the contents of `db/schema.sql`
- Then run `db/seed.sql`

Or use the setup script:

```bash
npm run db:setup
```

5. **Create a test user**

Via Supabase dashboard:
- Go to Authentication > Users
- Create a new user with email/password

6. **Run the development server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

7. **Run data ingestion for a sample project**

First, create a project via the UI or get a project ID from the seed data, then:

```bash
node scripts/ingest.js --projectId=11111111-1111-1111-1111-111111111111
```

## Project Structure

```
mietchecker/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── projects/             # Project CRUD and ingestion
│   │   └── stripe/               # Stripe checkout and webhooks
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Landing page
│   └── globals.css               # Global styles
├── components/                   # React components
│   ├── ui/                       # Reusable UI components (shadcn/ui)
│   └── ...                       # Feature components
├── lib/                          # Core library code
│   ├── supabaseClient.ts         # Browser Supabase client
│   ├── supabaseAdmin.ts          # Server Supabase client (admin)
│   ├── supabaseServer.ts         # Server Supabase client (RLS)
│   ├── osm.ts                    # OpenStreetMap data fetching
│   ├── cityData.ts               # City open data integration
│   ├── score.ts                  # Metric normalization and scoring
│   ├── gemini.ts                 # Gemini AI integration
│   ├── stripe.ts                 # Stripe integration
│   └── i18n.ts                   # Internationalization config
├── types/                        # TypeScript type definitions
│   └── database.ts               # Database entity types
├── db/                           # Database files
│   ├── schema.sql                # Database schema
│   └── seed.sql                  # Seed data
├── scripts/                      # Utility scripts
│   ├── setup-db.js               # Database setup script
│   ├── seed-local.js             # Seed script
│   └── ingest.js                 # Data ingestion CLI
├── locales/                      # i18n translations
│   ├── de.json                   # German
│   └── en.json                   # English
├── tests/                        # Test files
│   ├── unit/                     # Unit tests
│   └── e2e/                      # E2E tests (Playwright)
└── docs/                         # Documentation
    ├── architecture.md           # Architecture overview
    ├── data-sources.md           # Data sources documentation
    ├── privacy-gdpr.md           # GDPR compliance
    ├── api.md                    # API documentation
    └── testing.md                # Testing guide
```

## Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run test         # Run unit tests
npm run e2e          # Run E2E tests
npm run type-check   # Run TypeScript type checking
npm run format       # Format code with Prettier
npm run db:setup     # Set up database schema
npm run db:seed      # Seed database
npm run ingest       # Run data ingestion script
```

### Running Tests

```bash
# Unit tests
npm test

# E2E tests (requires dev server running)
npm run e2e

# E2E tests with UI
npm run e2e:ui
```

## Deployment

### Vercel Deployment

1. **Connect your repository to Vercel**
   - Import project from Git
   - Select framework: Next.js

2. **Configure environment variables**

Add all variables from `.env.example` in Vercel dashboard:
- Project Settings > Environment Variables

3. **Set up Supabase production**
   - Create a production Supabase project
   - Apply schema from `db/schema.sql`
   - Update environment variables with production credentials

4. **Set up Stripe webhook**
   - Go to Stripe Dashboard > Developers > Webhooks
   - Add endpoint: `https://your-domain.vercel.app/api/stripe/webhook`
   - Select events: `checkout.session.completed`, `invoice.payment_succeeded`, `customer.subscription.deleted`
   - Copy webhook secret to `STRIPE_WEBHOOK_SECRET`

5. **Deploy**
   - Push to main branch
   - Vercel will automatically deploy

### Post-Deployment

- Test authentication flow
- Create a test project
- Test data ingestion
- Test Stripe checkout (using test mode)

## Features

### Data Metrics

Mietchecker collects and analyzes the following metrics for each property:

1. **Noise Pollution** (dB levels from city datasets)
2. **Light Pollution** (Bortle scale estimation from OSM)
3. **Crime Rate** (incidents per 1000 residents from city data)
4. **Internet Speed** (available broadband speeds)
5. **Demographics** (average age, family distribution)
6. **Grocery Stores** (count within 500m radius)
7. **Laundromats** (count within 1km radius)
8. **Parking** (available parking facilities)

Each metric is normalized to a 0-100 score (higher is better).

### AI Chat Assistant

The Gemini-powered chatbot:
- Answers questions about property metrics
- Provides actionable recommendations
- Cites data sources and timestamps
- Responds in German by default (English on request)
- Maintains conversation history per project

### Pricing Tiers

- **Free**: Up to 3 projects, limited chat, monthly data updates
- **Premium**: Unlimited projects, unlimited chat, daily updates, PDF export

## Data Sources

### OpenStreetMap (Overpass API)

- Grocery stores, laundromats, parking facilities
- Urban features for light pollution estimation
- Public amenities

### City Open Data

Currently supported:
- **Berlin**: Noise, crime, internet, demographics
- **Hamburg**: Noise, crime, internet, demographics

To add more cities, see `docs/data-sources.md`.

## Documentation

Comprehensive documentation is available in the `docs/` directory:

- [Architecture](docs/architecture.md) - System design and data flow
- [Data Sources](docs/data-sources.md) - How to add new data sources
- [API](docs/api.md) - API endpoints and usage
- [Privacy & GDPR](docs/privacy-gdpr.md) - Data handling and compliance
- [Testing](docs/testing.md) - Testing strategy and guide

## Security & Privacy

- Row Level Security (RLS) enabled on all tables
- Server-side API keys (never exposed to client)
- GDPR-compliant data handling
- User data export and deletion capabilities
- Minimal PII collection

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

Copyright © 2024 Mietchecker. All rights reserved.

## Support

For issues and questions:
- GitHub Issues: [repository-url]/issues
- Documentation: `docs/`

## Acknowledgments

- OpenStreetMap contributors
- German city open data portals
- Supabase, Vercel, and Stripe for excellent platforms
