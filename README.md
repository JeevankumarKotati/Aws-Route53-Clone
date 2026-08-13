# AWS Route53 Clone

A clone of the AWS Route53 web console built with Next.js, FastAPI, and SQLite.

## Live Links
- **Hosted Demo**: [https://aws-route53-clone-gamma.vercel.app/hosted-zones](https://aws-route53-clone-gamma.vercel.app/hosted-zones)
- **GitHub Repository**: [https://github.com/JeevankumarKotati/Aws-Route53-Clone](https://github.com/JeevankumarKotati/Aws-Route53-Clone)

---

## Tech Stack
- **Frontend**: Next.js (TypeScript) + Tailwind CSS
- **Backend**: FastAPI (Python)
- **Database**: SQLite (SQLAlchemy)

---

## Features

### 1. Hosted Zones
- View list of hosted zones with search and type filter (Public/Private).
- Create new public or private hosted zones.
- Automatically generates 4 NS and 1 SOA records on creation.
- Edit zone description and tags.
- Delete hosted zones.

### 2. DNS Records
- View and search records inside a hosted zone.
- Create records with common types: `A`, `AAAA`, `CNAME`, `TXT`, `MX`, `NS`, `PTR`, `SRV`, `CAA`.
- Edit and delete records.
- Support for basic routing policies (Simple, Weighted, etc.).

### 3. Authentication (Mocked)
- Simple mock IAM login and session switching.

### 4. Placeholders
- "Coming Soon" placeholder pages for Dashboard, Traffic Policies, Health Checks, Resolver, and Profiles.

---

## Project Structure
```
├── backend/
│   ├── app/
│   │   ├── models/        # SQLAlchemy models (HostedZone, DNSRecord)
│   │   ├── routers/       # API endpoints (hosted_zones, records, auth)
│   │   └── services/      # Seed data & BIND parser
│   ├── main.py            # FastAPI entry point
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app/           # Next.js pages (hosted-zones, dashboard, etc.)
│   │   ├── components/    # UI components (tables, modals, layout)
│   │   └── lib/           # API helper
│   └── package.json
└── README.md
```

---

## Database Schema

### `hosted_zones`
- `id` (string, primary key)
- `name` (string)
- `comment` (string)
- `zone_type` (PUBLIC / PRIVATE)
- `vpc_id` (string, optional)
- `record_count` (integer)
- `created_at` (datetime)

### `dns_records`
- `id` (string, primary key)
- `hosted_zone_id` (foreign key -> hosted_zones.id)
- `name` (string)
- `type` (A, CNAME, TXT, MX, etc.)
- `ttl` (integer)
- `values` (JSON list of strings)
- `routing_policy` (string)
- `created_at` (datetime)

---

## API Overview

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/hosted-zones` | List all hosted zones |
| `POST` | `/api/hosted-zones` | Create a new hosted zone |
| `GET` | `/api/hosted-zones/{id}` | Get hosted zone details |
| `PUT` | `/api/hosted-zones/{id}` | Update hosted zone |
| `DELETE` | `/api/hosted-zones/{id}` | Delete hosted zone |
| `GET` | `/api/hosted-zones/{id}/records` | List records in a zone |
| `POST` | `/api/hosted-zones/{id}/records` | Create a DNS record |
| `PUT` | `/api/hosted-zones/{id}/records/{rec_id}` | Edit a DNS record |
| `DELETE` | `/api/hosted-zones/{id}/records/{rec_id}` | Delete a DNS record |

---

## How to Run Locally

### 1. Backend Setup
```bash
cd backend
python -m venv venv

# Windows:
venv\Scripts\activate
# Mac/Linux:
# source venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload
```
Backend runs at `http://127.0.0.1:8000`.

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at `http://localhost:3000`.
