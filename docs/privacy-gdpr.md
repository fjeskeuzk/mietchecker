# Privacy & GDPR Compliance Documentation

## Executive Summary

Mietchecker is committed to protecting user privacy and complying with GDPR (General Data Protection Regulation). This document outlines our data handling practices, user rights, and technical safeguards.

**Key Points**:
- User data is minimally collected and only for specified purposes
- All processing is documented and logged
- Users have full rights to access, export, and delete their data
- Data processors have Data Processing Agreements (DPAs)

## Data Collection & Retention Policy

### What Data We Collect

#### User Authentication Data
**Collected**: Email address, password hash, profile name (optional)
**Purpose**: Account authentication and identification
**Retention**: For duration of account + 30 days after deletion
**Source**: Direct user input during sign-up
**Processing Basis**: Explicit consent (Art. 6(1)(a) GDPR)

#### Project Data
**Collected**:
- Property title
- Address (street, city, postal code)
- GPS coordinates (latitude, longitude)
- Project visibility setting (private/shared)
- Creation and update timestamps

**Purpose**: Enable property evaluation functionality
**Retention**: For duration of account + 90 days after deletion
**Source**: Direct user input
**Processing Basis**: Contract execution (Art. 6(1)(b) GDPR)

#### Metric Data (Computed)
**Collected**:
- Normalized scores (0-100) for each metric
- Raw metric values (noise dB, crime rate, etc.)
- Data source attribution
- Fetch timestamps

**Purpose**: Provide property evaluation and scoring
**Retention**: For duration of account + 180 days after deletion
**Source**: Third-party APIs (Overpass, city open data, etc.)
**Processing Basis**: Legitimate interest (Art. 6(1)(f) GDPR) - providing evaluation service

#### Conversation Data (Chat History)
**Collected**:
- User messages (queries about properties)
- AI assistant responses
- Conversation timestamps
- Message metadata

**Purpose**: Improve AI chatbot accuracy and provide context for responses
**Retention**: For duration of account + 90 days after deletion
**Source**: User input during chat
**Processing Basis**: Contract execution (Art. 6(1)(b) GDPR)

#### Payment Data
**Collected**:
- Payment method type (card, SEPA debit)
- Transaction amount and currency
- Payment status (pending, completed, failed)
- Billing address (for invoice generation)

**Purpose**: Process subscriptions and payments
**Retention**: 7 years (German tax law requirement)
**Source**: Stripe payment processor
**Processing Basis**: Contract execution (Art. 6(1)(b) GDPR)

#### Analytics Data (If Enabled)
**Collected** (planned, currently disabled):
- Page views and interaction events
- Feature usage statistics
- Device type and browser
- Approximate location (country/region)

**Purpose**: Improve service and user experience
**Retention**: 90 days (aggregated)
**Source**: Browser (opt-in)
**Processing Basis**: Explicit consent (Art. 6(1)(a) GDPR)

#### Log Data
**Collected**:
- API request/response logs
- Error logs
- Authentication logs

**Purpose**: Debugging, security monitoring, compliance auditing
**Retention**: 30 days
**Source**: Server logs
**Processing Basis**: Legitimate interest (Art. 6(1)(f) GDPR)

### What Data We DON'T Collect

- Browsing history outside Mietchecker
- Location data (except for explicit coordinates provided by user)
- Health or medical information
- Biometric data
- Special categories of personal data (race, ethnicity, religion, etc.)
- Cookies or tracking pixels (unless explicitly enabled)

### Data Minimization

We follow the principle of data minimization:
- Only collect data necessary for the service
- No secondary use of data without explicit consent
- Automatic deletion after retention period
- Regular audit of collected data

## User Rights Under GDPR

### 1. Right of Access (Art. 15)

**What**: Users can request a complete copy of their personal data held by Mietchecker.

**How to Exercise**:
```
Email: privacy@mietchecker.de
Subject: "Data Access Request - GDPR Article 15"
Body: Your email address + request for data export
```

**Response Timeline**: 30 days (can be extended by 2 months for complex requests)

**What You'll Receive**:
- Complete data export in machine-readable format (JSON/CSV)
- List of all data sources and processors
- Retention schedule for each data category
- Technical and organizational measures

**API Endpoint** (authenticated users):
```http
GET /api/user/data/export
Authorization: Bearer ${JWT}
```

**Response**:
```json
{
  "user_id": "uuid-123",
  "requested_at": "2024-11-18T10:00:00Z",
  "data": {
    "profile": {
      "email": "user@example.com",
      "created_at": "2024-01-15T08:30:00Z",
      "is_premium": true
    },
    "projects": [
      {
        "id": "proj-uuid",
        "title": "Apartment in Berlin",
        "address": "Prenzlauer Berg, Berlin",
        "latitude": 52.5340,
        "longitude": 13.4115,
        "metrics": [
          {
            "key": "noise",
            "value": 65.5,
            "score": 72,
            "source": "OpenStreetMap"
          }
        ]
      }
    ],
    "conversations": [
      {
        "project_id": "proj-uuid",
        "role": "user",
        "message": "How is the noise level?",
        "timestamp": "2024-11-17T14:30:00Z"
      }
    ],
    "payments": [
      {
        "amount": 4.99,
        "currency": "EUR",
        "status": "completed",
        "date": "2024-11-01T12:00:00Z"
      }
    ]
  },
  "export_file": "mietchecker-data-export-20241118.json"
}
```

### 2. Right to Rectification (Art. 16)

**What**: Users can correct inaccurate or incomplete personal data.

**How to Exercise**:
```
Email: privacy@mietchecker.de
Subject: "Data Correction Request - GDPR Article 16"
Body: Specific data to be corrected + correct information
```

**Changes You Can Make in-app**:
- Profile name
- Email address (requires re-verification)
- Project titles and addresses
- Privacy settings

**API Endpoint** (for profile updates):
```http
PUT /api/user/profile
Authorization: Bearer ${JWT}
Content-Type: application/json

{
  "email": "newemail@example.com",
  "name": "Updated Name"
}
```

**Response Timeline**: 30 days for external requests; immediate for in-app changes

### 3. Right to Erasure (Art. 17) - "Right to Be Forgotten"

**What**: Users can request deletion of their data.

**Exceptions**:
- Payment records (7-year tax law requirement in Germany)
- Anonymized data (cannot be linked back to user)
- Data necessary for legal obligations
- Data required by law enforcement (with warrant)

**How to Exercise**:

**Option 1 - In-app Self-service**:
```
Dashboard → Settings → Account → Delete Account
Confirm with password
30-day grace period
```

**Option 2 - Email Request**:
```
Email: privacy@mietchecker.de
Subject: "Account Deletion Request - GDPR Article 17"
Body: Your email address + explicit request to delete account
```

**API Endpoint**:
```http
DELETE /api/user/account
Authorization: Bearer ${JWT}
Content-Type: application/json

{
  "password_confirmation": "user_password"
}
```

**Response**:
```json
{
  "status": "deletion_scheduled",
  "user_id": "uuid-123",
  "deletion_date": "2024-12-18T23:59:59Z",
  "grace_period_days": 30,
  "message": "Your account will be permanently deleted in 30 days. Email privacy@mietchecker.de to cancel.",
  "data_retained": {
    "reason": "Legal requirement",
    "category": "Payment records",
    "retention_until": "2031-11-18"
  }
}
```

**Deletion Process**:
1. User requests deletion
2. 30-day grace period begins
3. Account set to "inactive" (no login possible)
4. After 30 days: irreversible deletion
5. Payment records anonymized and archived
6. Confirmation email sent

**Response Timeline**: Processed within 30 days

### 4. Right to Data Portability (Art. 20)

**What**: Users can receive their data in a structured, commonly-used, machine-readable format and transmit it to another service.

**Supported Formats**:
- JSON (recommended)
- CSV
- XML

**How to Exercise**:
```http
GET /api/user/data/export?format=json
Authorization: Bearer ${JWT}
```

**What's Included**:
- All personal data
- Conversation history
- Project evaluations
- Payment history (non-sensitive details)

**What's NOT Included**:
- Service-generated insights (AI chat doesn't own conversation)
- Analytics data (aggregated)
- System logs

**Response Timeline**: 30 days

### 5. Right to Object (Art. 21)

**What**: Users can object to processing for specific purposes (primarily marketing and profiling).

**Objectives Available**:
- Direct marketing communications
- Profiling for personalized content (future feature)
- Analytics and usage tracking (if enabled)

**How to Exercise**:
```
Email: privacy@mietchecker.de
Subject: "Objection to Processing - GDPR Article 21"
Body: Specific processing to object + reason
```

**In-app Settings**:
```
Settings → Privacy & Communications
- [ ] Marketing emails
- [ ] Usage analytics
- [ ] Personalized recommendations (future)
```

**Response Timeline**: Immediate for opt-outs; 30 days for formal objections

### 6. Right to Restrict Processing (Art. 18)

**What**: Users can request limitation of data processing (useful during disputes).

**How to Exercise**:
```
Email: privacy@mietchecker.de
Subject: "Request for Processing Restriction - GDPR Article 18"
Body: Data category to restrict + reason
```

**Effect**:
- Data marked as "restricted"
- Only stored (not processed further)
- User can request periodic confirmation
- Restrictions lifted after dispute resolution

**Response Timeline**: 30 days

## API Endpoints for Data Management

### User Data Export

```http
GET /api/user/data/export
Authorization: Bearer ${JWT}

Query Parameters:
- format: "json" | "csv" | "xml" (default: "json")
- include_raw_metrics: boolean (default: false)
- include_conversations: boolean (default: true)
```

**Response**: 200 OK with file attachment

### Delete User Account

```http
DELETE /api/user/account
Authorization: Bearer ${JWT}
Content-Type: application/json

{
  "password_confirmation": "user_password",
  "reason": "optional_feedback"
}
```

**Response**: 200 OK
```json
{
  "status": "scheduled_for_deletion",
  "deletion_date": "2024-12-18T23:59:59Z",
  "grace_period_days": 30
}
```

### Cancel Deletion

```http
POST /api/user/account/cancel-deletion
Authorization: Bearer ${JWT}

{}
```

**Requires**: User to cancel within grace period
**Response**: 200 OK

### Update Privacy Preferences

```http
PUT /api/user/privacy-preferences
Authorization: Bearer ${JWT}
Content-Type: application/json

{
  "marketing_emails": false,
  "analytics_enabled": false,
  "profiling_enabled": false,
  "data_sharing_third_parties": false
}
```

**Response**: 200 OK

### View Data Retention Schedule

```http
GET /api/user/data/retention-schedule
Authorization: Bearer ${JWT}
```

**Response**:
```json
{
  "retention_schedule": [
    {
      "data_category": "Projects",
      "retention_period": "Account duration + 90 days",
      "reason": "Service functionality",
      "legal_basis": "Art. 6(1)(b) GDPR - Contract"
    },
    {
      "data_category": "Payments",
      "retention_period": "7 years",
      "reason": "German tax law (HStR)",
      "legal_basis": "Art. 6(1)(c) GDPR - Legal Obligation"
    }
  ]
}
```

## Cookie Policy

### What Are Cookies?

Small text files stored on user devices to remember preferences and track behavior.

### Cookies We Use

**Category 1: Essential Cookies** (Always active)
- `session_token` - Authentication token
- `csrf_token` - Security protection
- `language_preference` - User language choice

**Category 2: Functionality Cookies** (Optional, default disabled)
- `theme_preference` - Dark/light mode
- `sidebar_state` - UI state

**Category 3: Analytics Cookies** (Opt-in, currently disabled)
- `_ga` - Google Analytics (if enabled)
- `_gid` - Google Analytics session

**Category 4: Marketing Cookies** (Opt-in, disabled)
- Currently none implemented

### Cookie Consent

**Current Implementation**:
- Essential cookies set without consent (required for functionality)
- Optional cookies only set after explicit user opt-in
- Consent stored in database (linked to user account)
- No third-party cookie tracking

**Consent Banner**:
```
On first visit: "We use cookies to improve your experience"
- Accept All
- Reject Optional
- Settings
```

**User Can Change Anytime**:
```
Settings → Privacy → Cookie Preferences
```

### Third-Party Cookies

Mietchecker does NOT use third-party cookies for tracking.

**Exception**: Stripe payment integration sets its own cookies for payment security. Stripe's privacy policy applies to those cookies.

## Third-Party Data Processors

### Data Processing Agreements (DPAs)

All third-party services processing personal data have signed Data Processing Agreements.

### 1. Supabase (Database & Auth)

**Role**: Data Processor
**Data Processed**:
- User authentication credentials
- Project and metric data
- Conversation records
- Payment information

**Subprocessors**:
- Amazon Web Services (AWS) - Cloud infrastructure
- Auth0 - Optional OAuth provider

**Jurisdiction**: EU (Supabase servers in EU region)
**DPA**: Yes, executed
**Security**: ISO 27001 certified, TLS encryption, encryption at rest

**Data Subject Rights Handling**:
- Supabase assists with data export requests
- Supabase supports database-level deletion
- Provides audit logs for compliance

**Contact**: privacy@supabase.com

### 2. Google Gemini API

**Role**: Data Processor
**Data Processed**:
- User property evaluation queries
- Project metadata (location, metrics)
- Conversation context
- Conversation history (limited to last 10 messages)

**Data NOT Processed**:
- Personal identification data (names, emails)
- Payment information
- Account credentials

**Jurisdiction**: United States (Google Cloud)
**DPA**: Yes, via Google Cloud Agreement
**Security**: SOC 2 Type II certified, TLS encryption

**Data Retention by Google**:
- API calls retained for 30 days for abuse detection
- User can request deletion of conversations
- Google does NOT use conversation data for model training (Gemini API terms)

**Contact**: privacy@google.com

### 3. Stripe (Payment Processing)

**Role**: Data Processor & Independent Controller (dual role)
**Data Processed**:
- Email address
- Billing address
- Payment method details
- Transaction history

**Data NOT Processed by Mietchecker**:
- Full credit card numbers (PCI-DSS compliant tokenization)
- CVV codes

**Jurisdiction**: United States (Stripe maintains EU data centers)
**DPA**: Yes, executed
**Security**: PCI-DSS Level 1 certified, encryption at rest and in transit

**Compliance**:
- Stripe customers are bound by their Service Agreement
- Stripe is DPA signatory
- Users can request data from Stripe directly

**Contact**: privacy@stripe.com

### 4. Overpass API / OpenStreetMap

**Role**: Data Source (not a processor of personal data)
**Data Processed**:
- Geographic queries (no personal data)
- Coordinates and radius filters
- IP address (for rate limiting)

**Data NOT Processed**:
- User identification
- Email addresses
- Personal preferences

**Jurisdiction**: Germany (Overpass API)
**Privacy Policy**: OpenStreetMap OSMF Privacy Policy applies
**Security**: No encryption guarantee (public API)

**Note**: Queries are pseudonymous; Overpass doesn't link queries to Mietchecker users.

### 5. City Open Data Portals

**Role**: Data Source (public records)
**Data Processed**:
- Geographic queries (no personal data)
- Location coordinates

**Privacy Policy**: Respective city government privacy policies apply
**Examples**:
- Berlin: data.berlin.de privacy policy
- Hamburg: hamburg.de privacy policy

## International Data Transfers

### Mietchecker's Approach

**Jurisdictions Where Data Is Stored**:
- **Primary**: European Union (Supabase EU region)
- **Secondary**: United States (Google Gemini API, Stripe)

### Transfer Mechanisms

**EU → EU**: No transfer needed (fully within GDPR scope)

**EU → US**:
- **Stripe**: Uses Standard Contractual Clauses (SCCs)
- **Google**: Uses Standard Contractual Clauses + supplementary measures
- **Compliance**: Post-Schrems II assessment completed

### User Notification

Users are informed in the Privacy Policy about international transfers:
> "Some services use servers in the United States. We ensure compliance with GDPR through Standard Contractual Clauses and additional safeguards."

### Adequacy Decisions

Mietchecker does not transfer data to countries under adequacy decisions. All transfers use SCCs.

## Data Breach Notification

### Incident Response Plan

**Discovery**:
1. Identify the breach
2. Assess severity and affected users
3. Document time of discovery

**Notification to Authorities** (within 72 hours if applicable):
- Report to Supervisory Authority (e.g., Berlin: Die Beauftragte für Datenschutz)
- Contact: datenschutz-berlin.de

**Notification to Users** (if high risk):
- Email notification to all affected users
- Details: nature of breach, data affected, recommended actions
- Timeline: Without undue delay (typically same day)

**Notification Template**:
```
Subject: Important Security Notification - Data Breach

Dear User,

We are writing to inform you of a security incident affecting your account.

What happened:
[Description of breach]

What data was affected:
[List affected data categories]

What we're doing:
[Remediation steps]

What you should do:
[Recommended user actions, e.g., password reset]

Contact:
[Email for security-related questions]
```

**Documentation**:
- Internal incident reports
- Regulatory filings
- Breach notification log

## Privacy by Design

### Technical Measures

1. **Encryption**:
   - Data in transit: TLS 1.2+
   - Data at rest: AES-256 (database, backups)
   - API keys: Encrypted environment variables

2. **Access Control**:
   - Row-Level Security (RLS) on database
   - Service role authentication via JWT
   - Minimal privilege principle

3. **Audit Logging**:
   - All data access logged
   - Authentication events recorded
   - Admin actions tracked

### Organizational Measures

1. **Data Protection Officer**:
   - Designated: [Name/Email]
   - Accessible for privacy questions
   - Contact: dpo@mietchecker.de

2. **Privacy Policy Reviews**:
   - Quarterly review (Q1, Q2, Q3, Q4)
   - Updates published with version history
   - Users notified of material changes

3. **Staff Training**:
   - All developers trained on GDPR principles
   - Annual privacy/security training
   - Contractor agreements include confidentiality clauses

4. **Data Protection Impact Assessments (DPIA)**:
   - Completed for Gemini AI integration
   - Completed for Stripe payment processing
   - Updated annually

## Compliance Checklist

- [x] Lawful basis established for all processing
- [x] Privacy policy published and up-to-date
- [x] User rights implemented (access, deletion, portability)
- [x] Data Processing Agreements with all processors
- [x] Breach notification procedures documented
- [x] Data retention schedules implemented
- [x] Encryption and security controls in place
- [x] RLS and access controls configured
- [x] Audit logging enabled
- [ ] Data Protection Officer appointed (in progress)
- [ ] Annual Privacy Audit scheduled (planned Q1 2025)

## User Privacy Resources

**For Users**:
- Privacy Policy: https://mietchecker.de/privacy
- Terms of Service: https://mietchecker.de/terms
- Contact: privacy@mietchecker.de

**For Regulators**:
- Data Protection Officer: dpo@mietchecker.de
- Supervisory Authority: Berlin (DIE BEAUFTRAGTE FÜR DATENSCHUTZ UND INFORMATIONSFREIHEIT)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024-11-18 | Initial GDPR documentation |
| 1.1 | TBD | Added DPA details and user rights APIs |
| 1.2 | TBD | Annual compliance review |
