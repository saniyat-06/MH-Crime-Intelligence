# Deploying to Zoho Catalyst

## Architecture — read this first

Catalyst does **not** provide managed PostgreSQL. Its own "Data Store" is a
proprietary relational database queried via ZCQL (Zoho's own query language), not
real SQL/psycopg2, and it does not support the PostGIS extension this project's
schema depends on (`stations.jurisdiction_polygon` is a PostGIS `GEOMETRY` type).

So the deployment has **three separate pieces**, only two of which live on Catalyst:

| Piece | Where it runs |
|---|---|
| PostgreSQL + PostGIS database | **NOT on Catalyst** — an external Postgres host (see below) |
| FastAPI backend | Catalyst **AppSail**, as a custom Docker runtime |
| React frontend (built static files) | Catalyst **Client** (static web hosting) |

This isn't a limitation of this particular project — it's true of any PostGIS-dependent
app on Catalyst. Worth knowing before you commit to this platform if geospatial features
are core to the pitch.

## 1. Host PostgreSQL + PostGIS externally

Pick one (not tested here — pick based on what you're comfortable setting up quickly):

- **Supabase** (free tier, PostGIS is a one-click extension toggle in their dashboard,
  gives you a connection string immediately) — probably the fastest path for a
  hackathon deadline
- **Render** or **Railway** managed Postgres (check PostGIS extension availability
  before committing)
- **A small VM** (Oracle Cloud free tier, AWS EC2, DigitalOcean) with Postgres+PostGIS
  installed the same way this project's dev environment was set up — more control,
  more setup time

Once you have it running, apply the schema and generate data against it directly:
```bash
psql "postgresql://user:pass@your-host:5432/ksp_crime" -f backend/schema.sql
# then, with DB_HOST etc. env vars pointing at the same host:
python3 backend/generate_data.py
```

## 2. Deploy the backend to Catalyst AppSail

The backend now reads DB connection details from environment variables (`DB_HOST`,
`DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`) instead of hardcoded `localhost`
values — this was changed specifically to make this deployment possible. Defaults
still fall back to `localhost`/`postgres` for local dev, so nothing broke locally.

**Recommended: deploy as a custom Docker runtime**, not Catalyst's managed Python
runtime — the ML dependencies (xgboost, shap, pandas, scikit-learn) are heavier than
typical managed-runtime Python functions are sized for, and a container sidesteps any
package-size limits entirely. A `Dockerfile` is already in `backend/`.

**I was not able to test this Dockerfile build in the environment I'm working in
(no Docker available here)** — review it before relying on it, and build it locally
first to confirm before deploying:
```bash
cd backend
docker build -t ksp-backend .
docker run -p 8000:8000 -e DB_HOST=your-external-host -e DB_PASSWORD=yourpass ksp-backend
curl http://localhost:8000/api/health   # confirm it actually starts
```

Once confirmed locally, push it somewhere Catalyst can pull from (Docker Hub is
simplest), then:
```bash
npm install -g zcatalyst-cli     # Catalyst CLI, if not already installed
catalyst login
catalyst init                     # in the project root; choose to add AppSail
# When prompted for AppSail runtime type, choose "Docker Image" (custom runtime)
# Point it at your pushed image (docker://your-registry/ksp-backend:tag)
catalyst deploy --only appsail
```

In the Catalyst console, set the AppSail service's environment variables
(`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`) to point at your external
Postgres instance — do **not** hardcode real credentials into the Dockerfile or repo.

After deploy, Catalyst will give you a public URL for the AppSail service
(something like `https://your-project.catalystserverless.in/server/ksp-backend`).
Confirm it works before moving to the frontend:
```bash
curl https://<your-appsail-url>/api/health
```

## 3. Deploy the frontend as a Catalyst Client

The frontend's API base URL is now configurable via a Vite env variable
(`VITE_API_BASE`) instead of hardcoded `localhost:8000` — also changed specifically
for this deployment. See `frontend/.env.example`.

```bash
cd frontend
cp .env.example .env
# edit .env: set VITE_API_BASE to the AppSail URL from step 2
npm install
npm run build          # outputs to frontend/dist
```

Two ways to host the `dist/` output on Catalyst:

- **Simplest — Web Client Hosting via the console**: zip the contents of `dist/`
  (the zip's root must contain `index.html` directly, not a wrapping folder) and
  upload it under Web Client Hosting in the Catalyst console. This is the fastest
  path and doesn't require scaffolding a full Catalyst "Client" project structure.
- **Via CLI as a proper Catalyst Client component**: `catalyst init` a client
  component, point its build output at `frontend/dist`, then `catalyst deploy --only client`.
  More setup, more integrated with the rest of a multi-component Catalyst project —
  probably not worth it for a single hackathon demo unless you're also using other
  Catalyst services (auth, functions) that benefit from being in the same project.

## 4. CORS

The backend's CORS is currently wide open (`allow_origins=["*"]`) — fine for a
hackathon demo, but if you want to tighten it once you have the real Client URL:

```python
# backend/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-client-url.catalystserverless.in"],
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Honest recommendation given your timeline

Given you're on a hackathon deadline: this is a real, workable path, but it has more
moving parts than a platform with native Postgres support would (Render and Railway,
for example, let you deploy Postgres + a Python web service + a static frontend all
within one platform, no external DB juggling). If judges just need to see a live demo
link and you're not otherwise invested in Zoho's ecosystem, weigh whether the extra
external-database step is worth it against a deadline. If there's a specific reason
Catalyst matters for this hackathon (e.g. it's a Zoho-sponsored track), then the path
above is the way to do it correctly.
