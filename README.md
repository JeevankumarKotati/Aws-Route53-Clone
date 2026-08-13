# AWS Route53 Clone - Assignment Submission

A functional clone of the AWS Route53 web application with persistent SQLite storage, a FastAPI backend, and a Next.js (TypeScript) frontend replicating the Route 53 user experience and workflows.

---

## Deliverables Checklist

- [x] **Source Code**: Full project repository containing:
  - `frontend/` (Next.js TypeScript app)
  - `backend/` (FastAPI Python app with SQLite)
- [x] **Documentation**: `README.md` containing:
  - [x] Setup instructions
  - [x] Architecture overview
  - [x] Database schema
  - [x] API overview
  - [x] Hosted working demo link & instructions

---

## Demo (Hosted Working Link)

- **Live Hosted Application**: `https://<your-project-name>.vercel.app` *(Replace with your Vercel deployment URL)*
- **Live Backend API**: `https://<your-backend-name>.onrender.com`
- **Interactive API Docs (Swagger)**: `https://<your-backend-name>.onrender.com/api/docs`

### How to Deploy in 3 Minutes:

#### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit: AWS Route53 Clone"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo-name>.git
git push -u origin main
```

#### 2. Deploy Backend on [Render](https://render.com) (Free)
1. Go to [Render Dashboard](https://dashboard.render.com/) > **New** > **Web Service**.
2. Connect your GitHub repository.
3. Set:
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Click **Deploy Web Service** and copy your backend URL (e.g. `https://route53-backend.onrender.com`).

#### 3. Deploy Frontend on [Vercel](https://vercel.com) (Free)
1. Go to [Vercel](https://vercel.com/new) > **Import Git Repository**.
2. In Project Settings:
   - **Root Directory**: Select `frontend`
   - **Environment Variables**: Add `NEXT_PUBLIC_API_URL` = `https://<your-backend-url>.onrender.com/api`
3. Click **Deploy**. Vercel will generate your live working demo link (e.g. `https://route53-clone.vercel.app`).

---

## Architecture Overview

- **Frontend**: Next.js (TypeScript) with Tailwind CSS, styled to match the AWS Route53 / Cloudscape console.
- **Backend**: FastAPI (Python) REST API serving hosted zone and record CRUD operations.
- **Database**: SQLite with SQLAlchemy ORM for local persistent storage.

```
+----------------------------------------------------+
|             Next.js Frontend (Port 3000)           |
|  - AWS Navigation, Hosted Zones & Records UI       |
+-------------------------+--------------------------+
                          | REST Calls (/api)
+-------------------------v--------------------------+
|             FastAPI Backend (Port 8000)            |
|  - Hosted Zones CRUD & NS/SOA generator            |
|  - DNS Records CRUD & BIND import/export           |
+-------------------------+--------------------------+
                          | SQLAlchemy
+-------------------------v--------------------------+
|             SQLite Database (route53.db)           |
+----------------------------------------------------+
```

---

## Features Implemented

### 1. Authentication (Mocked)
- Mocked IAM authentication with session persistence in browser storage.
- Support for switching mock IAM roles (`AdministratorAccess`, `DevOpsEngineer`, `ReadOnlyAccess`) and account IDs.
- Login and Logout flows.

### 2. Hosted Zones (Full CRUD)
- **View & Search**: View hosted zones in an AWS-styled table, search by domain name/ID, and filter by zone type (Public/Private).
- **Create**: Create public or private hosted zones (with VPC association).
- **Auto-Generated Records**: Automatically provisions 4 AWS name servers (`ns-*.awsdns-*.com/.net/.org/.co.uk`) and 1 SOA record upon zone creation.
- **Edit**: Update zone description and key-value tags.
- **Delete**: Delete hosted zones with confirmation modal.

### 3. DNS Records (Full CRUD)
- **Supported Record Types**: `A`, `AAAA`, `CNAME`, `TXT`, `MX`, `NS`, `PTR`, `SRV`, `CAA`, and `SOA`.
- **Routing Policies**: `Simple`, `Weighted`, `Latency`, `Failover`, `Geolocation`, and `Multivalue`.
- **Alias Support**: Toggle alias routing for AWS resource targets.
- **Create & Edit**: Quick record creation and editing forms.
- **Delete**: Single record deletion and bulk deletion with safety check on Apex SOA.
- **Search & Filter**: Filter records by name, value, record type, or routing policy.

### 4. Mocked Sections (Placeholders)
- Dashboard (with zone stats, query chart preview, and quick links)
- Traffic Policies (Preview / Coming Soon)
- Health Checks (Preview / Coming Soon)
- Resolver & DNS Firewall (Preview / Coming Soon)
- Profiles & Domains (Preview / Coming Soon)

### 5. Bonus Features
- **BIND Zone File Import**: Parse and import RFC 1035 BIND zone files.
- **Export**: Export zone records to `.zone` format or Route53 JSON format.
- **Dark Mode**: Light/Dark theme toggle.
- **Keyboard Shortcuts**: `/` to focus search, `c` to create, `r` to refresh, `d` for dark mode, `?` for shortcuts modal.
- **Bulk Operations**: Bulk delete and bulk TTL updates for records.

---

## Database Schema

### `hosted_zones`
- `id` (VARCHAR, PK): Route53-style Zone ID (e.g. `Z0123456789ABC`)
- `name` (VARCHAR): Domain name (e.g. `example.com.`)
- `caller_reference` (VARCHAR): Unique creation reference
- `comment` (TEXT): Description / notes
- `zone_type` (VARCHAR): `PUBLIC` or `PRIVATE`
- `vpc_id` (VARCHAR, optional): Associated VPC ID
- `vpc_region` (VARCHAR, optional): Associated VPC region
- `record_count` (INTEGER): Cached record count
- `tags` (TEXT): JSON string of key-value tags
- `created_at` / `updated_at` (DATETIME)

### `dns_records`
- `id` (VARCHAR, PK): Record ID (e.g. `rec_...`)
- `hosted_zone_id` (VARCHAR, FK -> `hosted_zones.id`): Parent zone
- `name` (VARCHAR): Record FQDN (e.g. `api.example.com.`)
- `type` (VARCHAR): Record type (`A`, `CNAME`, `MX`, etc.)
- `ttl` (INTEGER): Time-to-live in seconds
- `values` (TEXT): JSON array of string values / IPs / targets
- `routing_policy` (VARCHAR): `SIMPLE`, `WEIGHTED`, `LATENCY`, etc.
- `routing_config` (TEXT): JSON string for policy parameters (weight, region, role)
- `is_alias` (BOOLEAN): Alias toggle
- `alias_target` (VARCHAR, optional): Alias DNS target
- `health_check_id` (VARCHAR, optional): Associated health check ID
- `created_at` / `updated_at` (DATETIME)

---

## API Overview

Interactive Swagger documentation is available at `http://127.0.0.1:8000/api/docs`.

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Mock authentication |
| `GET` | `/api/auth/me` | Current IAM session info |
| `POST` | `/api/auth/switch-account` | Switch active IAM role |
| `GET` | `/api/dashboard/stats` | Dashboard metrics and counts |
| `GET` | `/api/hosted-zones` | List hosted zones (with search & filter) |
| `POST` | `/api/hosted-zones` | Create a new hosted zone |
| `GET` | `/api/hosted-zones/{id}` | Get hosted zone details |
| `PUT` | `/api/hosted-zones/{id}` | Update hosted zone |
| `DELETE` | `/api/hosted-zones/{id}` | Delete hosted zone |
| `GET` | `/api/hosted-zones/{id}/records` | List records in a zone |
| `POST` | `/api/hosted-zones/{id}/records` | Create a DNS record |
| `GET` | `/api/hosted-zones/{id}/records/{rec_id}` | Get record by ID |
| `PUT` | `/api/hosted-zones/{id}/records/{rec_id}` | Update record |
| `DELETE` | `/api/hosted-zones/{id}/records/{rec_id}` | Delete record |
| `POST` | `/api/hosted-zones/{id}/records/bulk-delete` | Bulk delete records |
| `POST` | `/api/hosted-zones/{id}/records/bulk-ttl` | Bulk update TTL |
| `POST` | `/api/hosted-zones/{id}/import-bind` | Import BIND zone file |
| `GET` | `/api/hosted-zones/{id}/export-bind` | Export BIND `.zone` file |
| `GET` | `/api/hosted-zones/{id}/export-json` | Export Route53 JSON |

---

## Local Setup Instructions

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 1. Backend Setup
```bash
cd backend
python -m venv venv

# Activate venv:
# Windows:
venv\Scripts\activate
# macOS/Linux:
# source venv/bin/activate

pip install -r requirements.txt
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
*Note: The backend automatically creates the SQLite database (`route53.db`) with sample zones on initial launch.*

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Access the application locally at [http://localhost:3000](http://localhost:3000).

### 3. Running Backend Tests
```bash
cd backend
python -m pytest tests/
```
