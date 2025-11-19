# API Documentation

## Overview

Mietchecker provides a RESTful API for managing property projects, ingesting evaluation data, and interacting with the AI chatbot. All endpoints require authentication via JWT tokens provided by Supabase Auth.

**Base URL**: `https://mietchecker.de/api` (production) or `http://localhost:3000/api` (development)

**Response Format**: JSON

**Authentication**: Bearer token in Authorization header

## Authentication

### Supabase Auth

Mietchecker uses Supabase Auth for user authentication. Users can sign up with email or OAuth providers.

### Getting an Access Token

**Sign Up / Sign In**:
```typescript
// From Supabase client library
const { data, error } = await supabase.auth.signUpWithPassword({
  email: 'user@example.com',
  password: 'password123',
});

const token = data.session?.access_token;
```

### Using the Token

All API requests include the token in the Authorization header:

```bash
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
     https://mietchecker.de/api/projects
```

### Token Refresh

Access tokens expire after 1 hour. Refresh tokens are stored in secure HTTP-only cookies.

**Automatic refresh**: The SDK handles token refresh automatically.

**Manual refresh** (if needed):
```typescript
const { data, error } = await supabase.auth.refreshSession();
const newToken = data.session?.access_token;
```

## Error Handling

### HTTP Status Codes

| Status | Meaning | Example |
|--------|---------|---------|
| 200 | Success | Project retrieved |
| 201 | Created | New project created |
| 204 | No Content | Project deleted |
| 400 | Bad Request | Invalid parameters |
| 401 | Unauthorized | Missing/invalid token |
| 403 | Forbidden | User not project owner |
| 404 | Not Found | Project doesn't exist |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected error |
| 503 | Service Unavailable | External API down |

### Error Response Format

```json
{
  "error": "error_message",
  "code": "ERROR_CODE",
  "details": {
    "field": "description"
  }
}
```

### Example Error Responses

**400 Bad Request**:
```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "title": "Title is required",
    "latitude": "Must be between -90 and 90"
  }
}
```

**401 Unauthorized**:
```json
{
  "error": "No access token provided",
  "code": "AUTH_REQUIRED"
}
```

**403 Forbidden**:
```json
{
  "error": "You do not have permission to access this project",
  "code": "INSUFFICIENT_PERMISSIONS"
}
```

**429 Rate Limited**:
```json
{
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "details": {
    "retry_after_seconds": 60,
    "limit": "10 requests per minute"
  }
}
```

## Rate Limiting

### Global Limits

- **Chat API**: 10 requests/minute per user
- **Data Ingestion**: 1 ingestion per project per 5 minutes
- **General API**: 100 requests/minute per user

### Rate Limit Headers

All responses include rate limit information:

```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1700000000
```

### Handling Rate Limits

When you hit a rate limit, you'll receive a 429 response:

```json
{
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "details": {
    "retry_after_seconds": 60,
    "limit": "10 requests per minute"
  }
}
```

**Best Practice**: Implement exponential backoff:
```typescript
async function callAPIWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    const response = await fetch(url, options);

    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After') || 60;
      await new Promise(r => setTimeout(r, retryAfter * 1000));
      continue;
    }

    return response;
  }
}
```

## Endpoints

### Projects API

#### List Projects

**GET** `/api/projects`

Get all projects owned by the authenticated user.

**Headers**:
```
Authorization: Bearer {token}
```

**Query Parameters**:
- `sort`: "created" | "updated" | "title" (default: "created")
- `order`: "asc" | "desc" (default: "desc")
- `limit`: number (default: 20, max: 100)
- `offset`: number (default: 0)

**Response**: 200 OK
```json
{
  "projects": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "owner_id": "f5d5e5d5-e5d5-45d5-a5d5-5d5e5d5e5d5e",
      "title": "Apartment in Prenzlauer Berg",
      "address": "Schönhauser Allee 42, 10437 Berlin",
      "latitude": 52.5340,
      "longitude": 13.4115,
      "visibility": "private",
      "overall_score": 78.5,
      "created_at": "2024-11-10T08:30:00Z",
      "updated_at": "2024-11-15T14:22:00Z"
    }
  ],
  "total": 5,
  "limit": 20,
  "offset": 0
}
```

**Example Request**:
```bash
curl -X GET \
  'https://mietchecker.de/api/projects?sort=updated&order=desc&limit=10' \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

---

#### Create Project

**POST** `/api/projects`

Create a new property project.

**Headers**:
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body**:
```json
{
  "title": "Apartment in Prenzlauer Berg",
  "address": "Schönhauser Allee 42, 10437 Berlin",
  "latitude": 52.5340,
  "longitude": 13.4115
}
```

**Required Fields**:
- `title` (string, 1-255 characters)

**Optional Fields**:
- `address` (string, max 500 characters)
- `latitude` (number, -90 to 90)
- `longitude` (number, -180 to 180)

**Validation Rules**:
- If `latitude` is provided, `longitude` must also be provided (and vice versa)
- Coordinates must be valid

**Response**: 201 Created
```json
{
  "project": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "owner_id": "f5d5e5d5-e5d5-45d5-a5d5-5d5e5d5e5d5e",
    "title": "Apartment in Prenzlauer Berg",
    "address": "Schönhauser Allee 42, 10437 Berlin",
    "latitude": 52.5340,
    "longitude": 13.4115,
    "visibility": "private",
    "overall_score": null,
    "created_at": "2024-11-18T10:00:00Z",
    "updated_at": "2024-11-18T10:00:00Z"
  }
}
```

**Example Request**:
```bash
curl -X POST \
  https://mietchecker.de/api/projects \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "title": "Apartment in Prenzlauer Berg",
    "address": "Schönhauser Allee 42, 10437 Berlin",
    "latitude": 52.5340,
    "longitude": 13.4115
  }'
```

---

#### Get Project

**GET** `/api/projects/{projectId}`

Get details of a specific project.

**Headers**:
```
Authorization: Bearer {token}
```

**URL Parameters**:
- `projectId` (string, UUID)

**Response**: 200 OK
```json
{
  "project": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "owner_id": "f5d5e5d5-e5d5-45d5-a5d5-5d5e5d5e5d5e",
    "title": "Apartment in Prenzlauer Berg",
    "address": "Schönhauser Allee 42, 10437 Berlin",
    "latitude": 52.5340,
    "longitude": 13.4115,
    "visibility": "private",
    "overall_score": 78.5,
    "created_at": "2024-11-10T08:30:00Z",
    "updated_at": "2024-11-15T14:22:00Z"
  },
  "metrics": [
    {
      "id": "metric-uuid-1",
      "project_id": "550e8400-e29b-41d4-a716-446655440000",
      "metric_key": "noise",
      "metric_value": 65.5,
      "normalized_score": 72,
      "source": "OpenStreetMap",
      "fetched_at": "2024-11-15T10:00:00Z"
    }
  ]
}
```

**Example Request**:
```bash
curl -X GET \
  https://mietchecker.de/api/projects/550e8400-e29b-41d4-a716-446655440000 \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

---

#### Update Project

**PUT** `/api/projects/{projectId}`

Update project details.

**Headers**:
```
Authorization: Bearer {token}
Content-Type: application/json
```

**URL Parameters**:
- `projectId` (string, UUID)

**Request Body** (all fields optional):
```json
{
  "title": "Updated Project Title",
  "address": "New Address",
  "latitude": 52.5300,
  "longitude": 13.4100,
  "visibility": "shared"
}
```

**Response**: 200 OK
```json
{
  "project": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "owner_id": "f5d5e5d5-e5d5-45d5-a5d5-5d5e5d5e5d5e",
    "title": "Updated Project Title",
    "address": "New Address",
    "latitude": 52.5300,
    "longitude": 13.4100,
    "visibility": "shared",
    "overall_score": 78.5,
    "created_at": "2024-11-10T08:30:00Z",
    "updated_at": "2024-11-18T10:30:00Z"
  }
}
```

---

#### Delete Project

**DELETE** `/api/projects/{projectId}`

Permanently delete a project and all associated data (except payment records, retained for 7 years per tax law).

**Headers**:
```
Authorization: Bearer {token}
```

**URL Parameters**:
- `projectId` (string, UUID)

**Response**: 204 No Content

**Example Request**:
```bash
curl -X DELETE \
  https://mietchecker.de/api/projects/550e8400-e29b-41d4-a716-446655440000 \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

---

### Data Ingestion API

#### Trigger Data Ingestion

**POST** `/api/projects/{projectId}/ingest`

Fetch and compute metrics for a project from external data sources.

**Headers**:
```
Authorization: Bearer {token}
Content-Type: application/json
```

**URL Parameters**:
- `projectId` (string, UUID)

**Request Body** (optional):
```json
{
  "force_refresh": false
}
```

**Request Body Parameters**:
- `force_refresh` (boolean, default: false) - Skip cache and re-fetch all metrics

**Response**: 200 OK
```json
{
  "project_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "completed",
  "metrics": {
    "grocery_stores": {
      "metric_key": "grocery_stores",
      "metric_value": 8,
      "normalized_score": 90,
      "source": "OpenStreetMap",
      "fetched_at": "2024-11-18T10:00:00Z",
      "pois": [
        {
          "id": 12345,
          "name": "REWE Schönhauser Allee",
          "type": "supermarket",
          "distance_m": 245,
          "lat": 52.5340,
          "lon": 13.4115
        }
      ]
    },
    "noise": {
      "metric_key": "noise",
      "metric_value": 65.5,
      "normalized_score": 72,
      "source": "Berlin Senatsverwaltung",
      "fetched_at": "2024-11-15T10:00:00Z"
    },
    "crime": {
      "metric_key": "crime",
      "metric_value": 12.8,
      "normalized_score": 87,
      "source": "Polizei Berlin",
      "fetched_at": "2024-11-01T10:00:00Z"
    },
    "light": {
      "metric_key": "light",
      "metric_value": 4,
      "normalized_score": 60,
      "source": "OpenStreetMap",
      "fetched_at": "2024-11-18T10:00:00Z"
    }
  },
  "overall_score": 78.5,
  "duration_ms": 3240
}
```

**Example Request**:
```bash
curl -X POST \
  https://mietchecker.de/api/projects/550e8400-e29b-41d4-a716-446655440000/ingest \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"force_refresh": false}'
```

---

### Chat API

#### Send Message & Get Response

**POST** `/api/projects/{projectId}/chat`

Send a message to the AI chatbot for property evaluation.

**Headers**:
```
Authorization: Bearer {token}
Content-Type: application/json
```

**URL Parameters**:
- `projectId` (string, UUID)

**Request Body**:
```json
{
  "message": "How is the noise level in this area?",
  "stream": true
}
```

**Request Body Parameters**:
- `message` (string, required) - User's question or message
- `stream` (boolean, default: true) - Stream response or wait for full completion

**Streaming Response** (`stream: true`):

The response uses Server-Sent Events (SSE) for streaming:

```
HTTP/1.1 200 OK
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive

data: {"type":"chunk","text":"Die Lärmbelastung"}
data: {"type":"chunk","text":" in dieser Gegend"}
data: {"type":"chunk","text":" ist moderat."}
data: {"type":"end","message_id":"msg-uuid-123"}
```

**Non-streaming Response** (`stream: false`):

```json
{
  "message_id": "msg-uuid-123",
  "role": "assistant",
  "content": "Die Lärmbelastung in dieser Gegend ist moderat. Basierend auf den verfügbaren Daten liegt der Lärmpegel bei etwa 65 dB, was einem Score von 72/100 entspricht...",
  "created_at": "2024-11-18T10:30:00Z"
}
```

**Example Request (Streaming)**:
```typescript
const response = await fetch(
  'https://mietchecker.de/api/projects/550e8400-e29b-41d4-a716-446655440000/chat',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: 'How is the noise level in this area?',
      stream: true
    })
  }
);

const reader = response.body?.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader!.read();
  if (done) break;

  const chunk = decoder.decode(value);
  const lines = chunk.split('\n');

  for (const line of lines) {
    if (line.startsWith('data:')) {
      const json = JSON.parse(line.slice(5));
      if (json.type === 'chunk') {
        console.log(json.text);
      } else if (json.type === 'end') {
        console.log('Response complete');
      }
    }
  }
}
```

---

#### Get Chat History

**GET** `/api/projects/{projectId}/chat/history`

Get conversation history for a project.

**Headers**:
```
Authorization: Bearer {token}
```

**URL Parameters**:
- `projectId` (string, UUID)

**Query Parameters**:
- `limit`: number (default: 50, max: 500)
- `offset`: number (default: 0)
- `order`: "asc" | "desc" (default: "desc")

**Response**: 200 OK
```json
{
  "project_id": "550e8400-e29b-41d4-a716-446655440000",
  "messages": [
    {
      "id": "msg-uuid-123",
      "role": "user",
      "message": "How is the noise level in this area?",
      "created_at": "2024-11-18T10:30:00Z"
    },
    {
      "id": "msg-uuid-124",
      "role": "assistant",
      "message": "Die Lärmbelastung in dieser Gegend ist moderat...",
      "created_at": "2024-11-18T10:30:15Z"
    }
  ],
  "total": 12,
  "limit": 50,
  "offset": 0
}
```

**Example Request**:
```bash
curl -X GET \
  'https://mietchecker.de/api/projects/550e8400-e29b-41d4-a716-446655440000/chat/history?limit=20' \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

---

#### Clear Chat History

**DELETE** `/api/projects/{projectId}/chat/history`

Delete all conversation history for a project.

**Headers**:
```
Authorization: Bearer {token}
```

**URL Parameters**:
- `projectId` (string, UUID)

**Response**: 204 No Content

**Example Request**:
```bash
curl -X DELETE \
  https://mietchecker.de/api/projects/550e8400-e29b-41d4-a716-446655440000/chat/history \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

---

## Webhook Documentation

### Stripe Webhook

Mietchecker receives webhook events from Stripe for payment and subscription updates.

**Endpoint**: `POST /api/stripe/webhook`

**Webhook Events Handled**:

#### 1. Checkout Session Completed
**Event**: `checkout.session.completed`

Triggered when a user completes payment.

**Payload**:
```json
{
  "id": "evt_123...",
  "type": "checkout.session.completed",
  "data": {
    "object": {
      "id": "cs_live_123...",
      "object": "checkout.session",
      "customer": "cus_123...",
      "customer_email": "user@example.com",
      "mode": "subscription",
      "subscription": "sub_123...",
      "payment_status": "paid",
      "metadata": {
        "userId": "f5d5e5d5-e5d5-45d5-a5d5-5d5e5d5e5d5e"
      }
    }
  }
}
```

**Mietchecker Action**:
- Link Stripe subscription to user
- Mark user as premium
- Set `user_profiles.is_premium = true`
- Record payment in `payments` table

#### 2. Customer Subscription Created
**Event**: `customer.subscription.created`

Triggered when subscription is created.

**Payload**:
```json
{
  "type": "customer.subscription.created",
  "data": {
    "object": {
      "id": "sub_123...",
      "customer": "cus_123...",
      "status": "trialing" | "active",
      "metadata": {
        "userId": "f5d5e5d5-e5d5-45d5-a5d5-5d5e5d5e5d5e"
      }
    }
  }
}
```

**Mietchecker Action**:
- Store subscription ID
- Grant premium features
- Initialize free trial (if applicable)

#### 3. Customer Subscription Updated
**Event**: `customer.subscription.updated`

Triggered when subscription is changed (e.g., plan change, payment method update).

**Payload**:
```json
{
  "type": "customer.subscription.updated",
  "data": {
    "object": {
      "id": "sub_123...",
      "status": "active" | "past_due" | "cancelled",
      "metadata": {
        "userId": "f5d5e5d5-e5d5-45d5-a5d5-5d5e5d5e5d5e"
      }
    }
  }
}
```

**Mietchecker Action**:
- Update subscription status
- Revoke premium if cancelled
- Send notification to user

#### 4. Customer Subscription Deleted
**Event**: `customer.subscription.deleted`

Triggered when subscription is cancelled.

**Payload**:
```json
{
  "type": "customer.subscription.deleted",
  "data": {
    "object": {
      "id": "sub_123...",
      "status": "cancelled",
      "metadata": {
        "userId": "f5d5e5d5-e5d5-45d5-a5d5-5d5e5d5e5d5e"
      }
    }
  }
}
```

**Mietchecker Action**:
- Mark user as non-premium
- Send cancellation confirmation
- Optionally trigger retention email

#### 5. Invoice Payment Succeeded
**Event**: `invoice.payment_succeeded`

Triggered when subscription payment is collected.

**Payload**:
```json
{
  "type": "invoice.payment_succeeded",
  "data": {
    "object": {
      "id": "in_123...",
      "subscription": "sub_123...",
      "amount_paid": 499,
      "currency": "eur",
      "customer_email": "user@example.com",
      "metadata": {
        "userId": "f5d5e5d5-e5d5-45d5-a5d5-5d5e5d5e5d5e"
      }
    }
  }
}
```

**Mietchecker Action**:
- Create payment record
- Send invoice email to user
- Ensure premium status is active

#### 6. Invoice Payment Failed
**Event**: `invoice.payment_failed`

Triggered when subscription payment fails.

**Payload**:
```json
{
  "type": "invoice.payment_failed",
  "data": {
    "object": {
      "id": "in_123...",
      "subscription": "sub_123...",
      "amount": 499,
      "currency": "eur",
      "customer_email": "user@example.com"
    }
  }
}
```

**Mietchecker Action**:
- Record failed payment
- Send retry notification to user
- After max retries: downgrade to free tier

### Webhook Signature Verification

All Stripe webhooks are signed. Verify the signature before processing:

```typescript
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    // Process event based on type
    switch (event.type) {
      case 'checkout.session.completed':
        // Handle checkout
        break;
      case 'customer.subscription.updated':
        // Handle subscription update
        break;
      // ... more cases
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (error) {
    console.error('Webhook verification failed:', error);
    return new Response('Webhook error', { status: 400 });
  }
}
```

### Setting Up Webhooks

1. **Stripe Dashboard**:
   - Go to Developers > Webhooks
   - Add endpoint: `https://mietchecker.de/api/stripe/webhook`
   - Select events to listen to (see list above)
   - Copy signing secret to `STRIPE_WEBHOOK_SECRET`

2. **Testing Locally**:
   ```bash
   # Install Stripe CLI
   brew install stripe/stripe-cli/stripe

   # Authenticate
   stripe login

   # Forward webhooks to localhost
   stripe listen --forward-to localhost:3000/api/stripe/webhook

   # Trigger test events
   stripe trigger payment_intent.succeeded
   ```

3. **Error Handling**:
   - Return 200 OK for processed events
   - Return 400+ for errors (Stripe will retry)
   - Log all webhook requests for auditing
   - Set up alerts for webhook failures

---

## Pagination

List endpoints support pagination with `limit` and `offset`:

```bash
# Get first 10 items
GET /api/projects?limit=10&offset=0

# Get next 10 items
GET /api/projects?limit=10&offset=10
```

**Response**:
```json
{
  "data": [...],
  "total": 25,
  "limit": 10,
  "offset": 10,
  "hasMore": true
}
```

---

## Filtering & Sorting

List endpoints support sorting via `sort` and `order` query parameters:

```bash
# Sort by creation date, newest first
GET /api/projects?sort=created&order=desc

# Sort by title, alphabetically
GET /api/projects?sort=title&order=asc

# Combine with pagination
GET /api/projects?sort=updated&order=desc&limit=10&offset=0
```

---

## SDK Examples

### JavaScript / TypeScript

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Get access token
const { data } = await supabase.auth.getSession();
const token = data.session?.access_token;

// Create project
const response = await fetch('/api/projects', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'My Project',
    address: 'Berlin, Germany',
    latitude: 52.52,
    longitude: 13.405
  })
});

const { project } = await response.json();
console.log('Project created:', project.id);
```

### Python

```python
import requests
import json

BASE_URL = 'https://mietchecker.de/api'
TOKEN = 'your_access_token'

headers = {
    'Authorization': f'Bearer {TOKEN}',
    'Content-Type': 'application/json'
}

# List projects
response = requests.get(f'{BASE_URL}/projects', headers=headers)
projects = response.json()['projects']

# Create project
payload = {
    'title': 'My Project',
    'address': 'Berlin, Germany',
    'latitude': 52.52,
    'longitude': 13.405
}

response = requests.post(
    f'{BASE_URL}/projects',
    headers=headers,
    json=payload
)

project = response.json()['project']
print(f"Project created: {project['id']}")
```

### cURL

```bash
# Set token
TOKEN="your_access_token"

# List projects
curl -H "Authorization: Bearer $TOKEN" \
     https://mietchecker.de/api/projects

# Create project
curl -X POST \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "title": "My Project",
       "address": "Berlin, Germany",
       "latitude": 52.52,
       "longitude": 13.405
     }' \
     https://mietchecker.de/api/projects
```

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024-11-18 | Initial API release |
| 1.1 | TBD | Add bulk operations |
| 1.2 | TBD | Add advanced filtering |

## Support

For API questions or issues:
- Email: api@mietchecker.de
- Documentation: https://mietchecker.de/docs
- Status Page: https://status.mietchecker.de
