# Mietchecker System Architecture

## High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER                                   │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │  Next.js 15 Frontend (React 19, TypeScript)                        │  │
│  │  - Project Management UI                                           │  │
│  │  - Interactive Map (Leaflet)                                       │  │
│  │  - AI Chat Interface (Streaming responses)                         │  │
│  │  - Analytics Dashboard                                             │  │
│  │  - User Settings & Preferences                                     │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                  ↓                                        │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │  State Management & Data Fetching                                  │  │
│  │  - React Query (TanStack)                                          │  │
│  │  - Supabase Auth (Client)                                          │  │
│  │  - Theme Provider, Internationalization                           │  │
│  └────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                      API LAYER (Next.js Routes)                          │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │  Authentication                          Data Operations           │  │
│  │  - /api/auth                            - /api/projects            │  │
│  │    (Supabase handled via middleware)    - /api/projects/[id]       │  │
│  │                                         - /api/projects/[id]/chat  │  │
│  │                                         - /api/projects/[id]/ingest│  │
│  │                                                                     │  │
│  │  Payment Processing                     Webhooks                   │  │
│  │  - /api/stripe/create-checkout         - /api/stripe/webhook      │  │
│  │  - /api/stripe/customer-portal         - Stripe Subscription       │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                  ↓                                        │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │  Business Logic & External Integrations                           │  │
│  │  - OSM Data Fetching (Overpass API)                                │  │
│  │  - Score Calculation (Normalization & Weighting)                   │  │
│  │  - Gemini AI Integration (Chat responses)                          │  │
│  │  - Stripe Payments                                                 │  │
│  │  - City Data Coordination                                          │  │
│  └────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                    DATA ACCESS LAYER (Supabase)                          │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │  PostgreSQL Database with PostGIS Extension                        │  │
│  │  - User Profiles & Authentication                                  │  │
│  │  - Projects (Properties to evaluate)                               │  │
│  │  - Project Metrics (Raw & Normalized scores)                       │  │
│  │  - Conversation History (Chat logs)                                │  │
│  │  - Payment Records (Stripe integration)                            │  │
│  │  - Ingestion Jobs (Data processing status)                         │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │  Authentication & Authorization                                    │  │
│  │  - Supabase Auth (Row-Level Security)                              │  │
│  │  - JWT Token Management                                            │  │
│  │  - User Roles (Free, Premium)                                      │  │
│  └────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES & DATA SOURCES                      │
│  ┌──────────────────────────────────┬──────────────────────────────────┐ │
│  │  Overpass API                    │  Google Gemini API               │ │
│  │  (OpenStreetMap data)            │  (AI chatbot responses)          │ │
│  │  - POI queries (shops, parking)  │  - Conversational responses      │ │
│  │  - Light pollution estimation    │  - Property recommendations      │ │
│  │  - Geographic features           │  - Multi-turn conversations      │ │
│  └──────────────────────────────────┴──────────────────────────────────┘ │
│  ┌──────────────────────────────────┬──────────────────────────────────┐ │
│  │  City Open Data Portals          │  Stripe API                      │ │
│  │  (Berlin, Hamburg, etc.)         │  (Payment processing)            │ │
│  │  - Noise pollution data          │  - Subscription management       │ │
│  │  - Crime statistics              │  - Invoice generation            │ │
│  │  - Demographics                  │  - Webhook events                │ │
│  │  - Internet speed metrics        │                                  │ │
│  └──────────────────────────────────┴──────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

### Frontend (Next.js + React 19)

**Responsibilities:**
- User interface for project creation and management
- Interactive map visualization of property locations
- Real-time chat interface with streaming AI responses
- Authentication flow (sign up, login, logout)
- Payment/subscription management
- User preferences (language, theme)
- Project visibility and sharing

**Key Technologies:**
- **Framework**: Next.js 15 (App Router)
- **UI Library**: Radix UI components
- **Styling**: Tailwind CSS + CSS Animations
- **Mapping**: Leaflet + React Leaflet
- **State Management**: React Query (TanStack)
- **Internationalization**: next-intl (English & German)
- **Animations**: Framer Motion

**Directory Structure:**
```
app/
├── (auth)/              # Auth routes
├── api/                 # API endpoints
├── (dashboard)/         # Main app routes
├── layout.tsx           # Root layout
└── page.tsx            # Landing page

components/
├── ui/                 # Reusable UI components
├── Dashboard/          # Dashboard components
├── ProjectForm/        # Project creation/editing
├── Chat/              # Chat interface
└── Map/               # Map visualization
```

### API Layer (Next.js Route Handlers)

**Responsibilities:**
- HTTP request routing and validation
- Authentication verification
- Business logic orchestration
- External service integration
- Response formatting and error handling

**Key Endpoints:**

```
POST   /api/projects
GET    /api/projects
GET    /api/projects/:projectId
PUT    /api/projects/:projectId
DELETE /api/projects/:projectId

POST   /api/projects/:projectId/ingest
GET    /api/projects/:projectId/metrics

POST   /api/projects/:projectId/chat
GET    /api/projects/:projectId/chat/history

POST   /api/stripe/create-checkout
GET    /api/stripe/customer-portal
POST   /api/stripe/webhook
```

**Error Handling:**
- 400: Invalid request parameters
- 401: Authentication required
- 403: Insufficient permissions
- 404: Resource not found
- 429: Rate limiting
- 500: Internal server errors

### Business Logic Layer

#### OSM (OpenStreetMap) Integration (`lib/osm.ts`)
- Queries Overpass API for points of interest
- Fetches grocery stores, laundromats, parking spaces
- Estimates light pollution based on street lamps and urban features
- Implements caching (24-hour TTL) and retry logic
- Uses Haversine formula for distance calculations
- Rate limiting with exponential backoff

#### Score Calculation (`lib/score.ts`)
- Normalizes raw metric values to 0-100 scale
- Applies metric-specific configurations (weight, range, inversion)
- Calculates weighted overall score
- Provides score interpretation and descriptions
- Metrics include: noise, light pollution, crime, internet speed, demographics, grocery stores, laundromats, parking

#### Gemini AI Integration (`lib/gemini.ts`)
- Manages conversational AI for property evaluation
- Streaming and non-streaming response modes
- Context-aware responses using conversation history
- German language support with specialized prompts
- Rate limiting per user (configurable)
- Mock mode for testing without API calls
- Fallback to mock responses on API errors

#### Stripe Integration (`lib/stripe.ts`)
- Creates checkout sessions (subscriptions and one-time payments)
- Manages customer portal URLs
- Webhook signature verification
- Subscription status tracking
- Payment cancellation handling

#### City Data Coordination (`lib/cityData.ts`)
- Maps cities to data sources
- Coordinates multi-source data fetching
- Aggregates metrics from various providers
- Handles city-specific configurations

### Database Layer (PostgreSQL + PostGIS)

**Tables:**

1. **projects** - Property listings
   - User ownership (owner_id)
   - Location (latitude, longitude)
   - Overall computed score
   - Visibility (private/shared)

2. **project_metrics** - Computed metrics per project
   - Normalized scores (0-100)
   - Raw values and source metadata
   - Fetch timestamp for caching invalidation
   - Unique constraint to prevent duplicate data

3. **conversations** - Chat history
   - User and project references
   - Role (user/assistant/system)
   - Metadata for future extensions

4. **payments** - Payment tracking
   - Stripe integration IDs
   - Payment status and amount
   - Currency support

5. **user_profiles** - Extended user information
   - Premium status
   - Stripe customer ID
   - Theme and locale preferences

6. **ingestion_jobs** - Data processing tracking
   - Job status and timing
   - Error tracking

**Key Indexes:**
- owner_id (fast user lookups)
- coordinates (geographic queries)
- metric keys (metric filtering)
- conversation timing (chat history retrieval)

### External Services

#### Overpass API (OpenStreetMap)
- **Purpose**: Geographic data and POI queries
- **Rate Limiting**: Adaptive based on server load
- **Caching**: 24-hour TTL for identical queries
- **Fallback**: Cached data on timeout

#### Google Gemini API
- **Purpose**: AI-powered property evaluation chatbot
- **Model**: gemini-2.5-flash-lite (fast responses)
- **Rate Limiting**: 10 requests/minute per user (configurable)
- **Context**: Up to 10 previous messages for conversation flow

#### City Open Data Portals
- **Berlin**: Noise maps, crime statistics, demographics
- **Hamburg**: Internet speed, demographic data
- **Extensible**: Pattern for adding new cities

#### Stripe
- **Purpose**: Subscription and payment processing
- **Webhooks**: Invoice events, subscription changes
- **Locale**: German interface (de)
- **Payment Methods**: Credit card, SEPA debit

## Data Flow for Key Operations

### 1. Project Creation Flow

```
User Input (Location, Title, Address)
            ↓
[Frontend Validation]
            ↓
POST /api/projects
            ↓
[Auth Check] ← Supabase Session
            ↓
Insert into `projects` table
            ↓
Return Project ID + Location
            ↓
Trigger Data Ingestion (Optional)
            ↓
User sees project in dashboard
```

### 2. Data Ingestion Flow

```
POST /api/projects/:id/ingest
            ↓
[Auth Check + Project Ownership]
            ↓
Query Overpass API for:
├─ Grocery stores (500m radius)
├─ Laundromats (1000m radius)
├─ Parking spaces (500m radius)
└─ Light pollution (2000m radius)
            ↓
Fetch City Data APIs:
├─ Noise levels
├─ Crime statistics
├─ Demographics
└─ Internet speed
            ↓
Normalize Metrics [score.ts]
├─ Apply metric configs
├─ Clamp to ranges
└─ Invert if lower=better
            ↓
Calculate Overall Score [weighted average]
            ↓
Insert into `project_metrics`
Update `projects.overall_score`
            ↓
Return aggregated metrics
            ↓
UI updates with scores and visualizations
```

### 3. Chat Flow (Streaming)

```
User Message Input
            ↓
POST /api/projects/:id/chat
            ↓
[Auth Check + Project Ownership]
            ↓
[Rate Limit Check]
            ↓
Load Project Details
Load Recent Conversation History
Load Project Metrics
            ↓
Generate Gemini Prompt:
├─ System prompt (assistant role)
├─ Project data (title, address, coordinates)
├─ Metrics (formatted JSON)
├─ User message
└─ Conversation context
            ↓
Stream Response from Gemini API
            ↓
Save message + response to `conversations`
            ↓
Stream chunks to frontend (Server-Sent Events)
            ↓
Frontend displays streaming response
```

### 4. Payment Flow

```
User clicks "Upgrade"
            ↓
POST /api/stripe/create-checkout
            ↓
[Auth Check]
            ↓
Create Stripe Session:
├─ Line items (pricing)
├─ Customer email
├─ Client reference (userId)
├─ Success/cancel URLs
└─ Metadata
            ↓
Redirect to Stripe Checkout
            ↓
User completes payment
            ↓
Stripe webhook to /api/stripe/webhook
            ↓
Verify signature
            ↓
Handle events:
├─ checkout.session.completed → Create subscription
├─ customer.subscription.created → Update user_profiles.is_premium
├─ invoice.paid → Create payment record
└─ customer.subscription.deleted → Revoke premium status
            ↓
Database updated
            ↓
UI reflects premium status
```

## Technology Stack Details

### Frontend Stack
- **Framework**: Next.js 15 (React 19, TypeScript)
- **Styling**: Tailwind CSS 3.4 + PostCSS
- **Components**: Radix UI (accessible primitives)
- **State**: React Query 5.59 (server state), React Context (client state)
- **Maps**: Leaflet 1.9 + React Leaflet 4.2
- **Animations**: Framer Motion 11
- **Internationalization**: next-intl 3.23
- **Icons**: Lucide React 0.46
- **Validation**: Zod 3.23
- **HTTP Client**: Built-in Fetch API

### Backend Stack
- **Runtime**: Node.js 18+
- **Framework**: Next.js 15 (App Router)
- **Database**: PostgreSQL (via Supabase) + PostGIS extension
- **ORM**: Supabase JS Client (SQL queries)
- **Authentication**: Supabase Auth (JWT-based)
- **AI/LLM**: Google Gemini 2.5 Flash Lite
- **Payment**: Stripe API
- **External Data**: Overpass API (OpenStreetMap)

### Development Stack
- **Language**: TypeScript 5.6
- **Testing**: Jest 29.7 + Playwright 1.48 (E2E)
- **Linting**: ESLint 9.14 + Prettier 3.3
- **Build**: Next.js built-in (webpack-based)
- **Environment**: .env.local, .env.example
- **Package Manager**: pnpm 8+

### Deployment
- **Platform**: Vercel (Next.js optimized)
- **Database Hosting**: Supabase (PostgreSQL managed)
- **CDN**: Vercel Edge Network
- **Environment Variables**: Vercel Dashboard
- **Monitoring**: TBD (can integrate Sentry, DataDog)

## Security Architecture

### Authentication & Authorization
- **Auth Provider**: Supabase Auth (Magic links, OAuth2 providers)
- **Session Management**: JWT tokens (short-lived access, refresh tokens)
- **Row-Level Security (RLS)**: PostgreSQL policies enforce user isolation
- **API Authentication**: Bearer token in Authorization header

### Data Protection
- **Encryption**: Supabase handles TLS encryption in transit
- **Database**: PostgreSQL authentication, selective exposure via RLS
- **API Keys**: Environment variables only, never committed to repo
- **Sensitive Data**: Stripe tokens, Gemini API keys server-side only

### Rate Limiting
- **Chat API**: 10 requests/minute per user
- **Data Ingestion**: Per-project, with caching to reduce external calls
- **Overpass API**: Automatic backoff on 429/504 responses

### GDPR Compliance
- **Data Minimization**: Only necessary user data collected
- **User Rights**: Data export and deletion endpoints (to be implemented)
- **Retention**: Configurable data retention policies
- **Processors**: Supabase (processing agreement), Stripe (payment), Gemini (AI)

## Scalability Considerations

### Current Capacity
- Single PostgreSQL instance (Supabase Free/Pro tier)
- Vercel serverless functions (auto-scaling)
- Caching: In-memory (24h TTL) for OSM queries

### Scaling Strategy
1. **Horizontal**: Vercel auto-scales API functions
2. **Database**: Supabase Pro → Enterprise (read replicas, backups)
3. **Caching**: Redis layer for shared cache (future)
4. **Queue**: Job queue for async data ingestion (future)
5. **CDN**: Vercel Edge for API responses (already included)

### Performance Optimization
- Data ingestion runs async (optional user trigger)
- Gemini responses stream to frontend (no wait for full response)
- OSM queries cached to reduce external API calls
- Metric calculations cached in database
- Conversation history limited to last 10 messages for context

## Monitoring & Logging

### Current State
- Console logs in development
- Next.js built-in logging in production

### Recommended Additions
- **Error Tracking**: Sentry for exception monitoring
- **APM**: DataDog or New Relic for performance monitoring
- **Logs**: Structured logging (Winston, Pino)
- **Metrics**: Database query performance, API latency
- **Alerts**: Automated alerts for errors and performance degradation
