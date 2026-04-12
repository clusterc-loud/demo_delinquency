# VittChetak Backend

AI-powered Pre-Delinquency Intervention Engine — REST API Server

## Prerequisites

- Node.js 20+
- MongoDB running locally on port `27017`

## Setup

```bash
# 1. Navigate to backend directory
cd vittchetak-backend

# 2. Install dependencies
npm install

# 3. Configure environment (already done — .env is included)
# Edit .env if your MongoDB URI differs

# 4. Seed the database with synthetic data
npm run seed

# 5. Start the development server
npm run dev
```

The server starts at `http://localhost:3000`.

## Test Credentials

| Role     | Email                       | Password     |
|----------|-----------------------------|--------------|
| Analyst  | analyst@vittchetak.com      | password123  |
| Admin    | admin@vittchetak.com        | password123  |
| RM       | rm@vittchetak.com           | password123  |

## API Endpoints

### Authentication
| Method | Endpoint            | Auth | Description              |
|--------|---------------------|------|--------------------------|
| POST   | /api/auth/login     | No   | Login and get JWT token  |
| POST   | /api/auth/register  | No   | Register new analyst     |
| GET    | /api/auth/me        | Yes  | Get current user info    |

### Dashboard
| Method | Endpoint                              | Auth | Description                    |
|--------|---------------------------------------|------|--------------------------------|
| GET    | /api/dashboard/kpis                   | Yes  | KPI summary cards              |
| GET    | /api/dashboard/risk-heatmap           | Yes  | Product × risk band matrix     |
| GET    | /api/dashboard/score-distribution     | Yes  | Score band histogram           |
| GET    | /api/dashboard/recent-flags           | Yes  | Latest 10 flagged accounts     |
| GET    | /api/dashboard/intervention-outcomes  | Yes  | Outcome breakdown by pattern   |

### Flagged Accounts
| Method | Endpoint                          | Auth | Description                         |
|--------|-----------------------------------|------|-------------------------------------|
| GET    | /api/flagged                      | Yes  | List flagged accounts (filterable)  |
| GET    | /api/flagged/:customerId/preview  | Yes  | SHAP preview + survival probs       |

**Query params for GET /api/flagged:**
- `priority` — P1, P2, P3, P4, P5
- `customerType` — RETAIL or MSME
- `pattern` — e.g. LIQUIDITY_CRUNCH
- `fraudRisk` — true (only show fraud score > 50)
- `search` — name or customerId
- `page`, `limit`

### Customer
| Method | Endpoint                                   | Auth | Description                |
|--------|--------------------------------------------|------|----------------------------|
| GET    | /api/customer/:customerId/profile          | Yes  | Full customer + risk score |
| GET    | /api/customer/:customerId/intervention-history | Yes | All past interventions |
| GET    | /api/customer/:customerId/network-risk     | Yes  | Network contagion info     |
| POST   | /api/customer/:customerId/rescore          | Yes  | Trigger AI rescore         |

### Interventions
| Method | Endpoint                                 | Auth | Description                    |
|--------|------------------------------------------|------|--------------------------------|
| GET    | /api/interventions/queue                 | Yes  | Pending intervention queue     |
| GET    | /api/interventions/:customerId/generate-message | Yes | Generate AI message   |
| POST   | /api/interventions/:customerId/approve   | Yes  | Approve and send               |
| POST   | /api/interventions/:customerId/route-to-rm | Yes | Escalate to RM               |

### MSME
| Method | Endpoint                              | Auth | Description                  |
|--------|---------------------------------------|------|------------------------------|
| GET    | /api/msme/graph                       | Yes  | Supply chain graph           |
| GET    | /api/msme/contagion-path/:msmeId      | Yes  | Default contagion path       |

### Fraud Review
| Method | Endpoint                          | Auth | Description                 |
|--------|-----------------------------------|------|-----------------------------|
| GET    | /api/fraud                        | Yes  | All fraud cases             |
| GET    | /api/fraud/:customerId/evidence   | Yes  | Full fraud evidence         |
| PATCH  | /api/fraud/:customerId/decision   | Yes  | Record analyst decision     |

### Customer Portal
| Method | Endpoint                                      | Auth | Description               |
|--------|-----------------------------------------------|------|---------------------------|
| GET    | /api/portal/:customerId/health                | Yes  | Health summary            |
| POST   | /api/portal/:customerId/simulate              | Yes  | What-if scenario          |
| PATCH  | /api/portal/:customerId/alert-preferences     | Yes  | Update alert settings     |
| POST   | /api/portal/:customerId/request-counsellor    | Yes  | Request RM call           |

## Authentication

All protected routes require a `Bearer` token in the Authorization header:

```
Authorization: Bearer <JWT_TOKEN>
```

Token is returned from `POST /api/auth/login`.

## Database

MongoDB collections created by the seeder:
- `users` — 3 analyst/admin/rm accounts
- `customers` — 300 retail + 150 MSME
- `riskscores` — 2700 scores (current + 5 months historical)
- `interventions` — ~180 intervention records
- `fraudflags` — ~22 fraud investigation cases

## Project Structure

```
vittchetak-backend/
├── server/
│   ├── index.js              # Express app + route mounting
│   ├── config/db.js          # MongoDB connection
│   ├── models/               # Mongoose schemas
│   ├── routes/               # Express routers
│   ├── controllers/          # Business logic
│   ├── middleware/           # Auth + error handling
│   └── utils/                # JWT generator
└── seeder/seed.js            # Synthetic data generator
```
