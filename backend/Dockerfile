# Dockerfile for deploying the KSP backend as a Zoho Catalyst AppSail
# "custom runtime" service. Built as a plain Docker image because the ML
# dependencies (xgboost, shap, pandas, scikit-learn) are heavier than what
# Catalyst's managed Python runtime is typically sized for — a container gives
# full control and avoids surprises.
#
# IMPORTANT: this container runs ONLY the FastAPI backend. PostgreSQL/PostGIS is
# NOT included here and must be a separately-hosted external database — Catalyst's
# own "Data Store" is a proprietary relational DB (ZCQL-based) that does not
# support PostGIS, so it can't host this schema. See DEPLOYMENT.md.

FROM python:3.11-slim

WORKDIR /app

# psycopg2 needs libpq at build time even with the -binary wheel on some platforms
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Catalyst AppSail injects the PORT it expects the app to listen on via the
# PORT environment variable — the app must bind to it, not a hardcoded port.
ENV PORT=8000
EXPOSE 8000

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT}"]
