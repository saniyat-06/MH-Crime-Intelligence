<div align="center">

# 🚨 KSP Crime Intelligence Platform

### AI-Powered Crime Analytics, Hotspot Detection & Explainable Risk Intelligence

**Built for Karnataka State Police Datathon 2026 — Challenge 2**

[![Live Demo](https://img.shields.io/badge/Live-Demo-2ca25f?style=for-the-badge)](https://project-rainfall-60078528363.development.catalystserverless.in/app/index.html)
[![GitHub](https://img.shields.io/badge/Source-GitHub-181717?style=for-the-badge\&logo=github)](https://github.com/kkeerthanaaaa/KSP-Hackathon-Deploy)
![Team](https://img.shields.io/badge/Team-Lalala-de2d26?style=for-the-badge)

</div>

---

**Co-authored by: [Akash T](https://github.com/AkkashhT)**

---

## 📌 Overview

The **KSP Crime Intelligence Platform** is an AI-driven crime analytics and visualization system designed to help police teams move from **reactive policing to proactive, data-driven decision-making**.

Instead of relying on disconnected spreadsheets and manual analysis, the platform combines:

* 🗺️ Geospatial crime intelligence
* 🔥 Hotspot & anomaly detection
* 🕸️ Criminal network analysis
* 🤖 Machine learning risk prediction
* 🔍 Explainable AI using SHAP
* 📊 Ground-truth model validation

> **Turn raw crime records into actionable intelligence for officers and analysts.**

---

## 🎯 The Problem

Crime records are often distributed across independent Excel-based datasets and jurisdictions, making it difficult to identify larger patterns.

Key challenges include:

* Detecting emerging crime hotspots early
* Identifying abnormal crime spikes
* Discovering repeat offenders across stations
* Understanding suspect–victim–station relationships
* Forecasting station-level crime risk
* Explaining why an area is classified as high-risk

Traditional reporting explains **what happened**.

This platform focuses on:

> **Where is crime increasing, who is connected, what patterns are emerging, and why is an area becoming risky?**

---

## 💡 The Solution

The platform combines three connected intelligence layers:

| Intelligence Layer              | Capability                                                                            |
| ------------------------------- | ------------------------------------------------------------------------------------- |
| 🗺️ **Geospatial Intelligence** | Interactive crime maps, heatmaps, district drill-down and emerging red-zone detection |
| 🕸️ **Network Intelligence**    | Suspect–victim–station relationship analysis and repeat-offender ring detection       |
| 🔮 **Predictive Intelligence**  | Weekly station risk forecasting using XGBoost with SHAP explainability                |

Together, these layers provide a unified crime intelligence system for both **station officers and state-level analysts**.

---

## ✨ Key Features

### 🗺️ Geospatial Crime Analytics

Analyze crime geographically across districts and police stations.

* Crime density and hotspot analysis
* District → station drill-down
* Crime-type filtering
* Day vs night pattern analysis
* Weekday vs weekend comparison

### 🚨 Emerging Red-Zone Detection

Uses **z-score-based statistical anomaly detection** to identify unusual recent increases in specific crime categories.

The system distinguishes between persistent hotspots and newly emerging crime spikes, allowing different patterns to be analyzed separately.

### 🕸️ Criminal Network Analysis

Analyzes relationships between:

* Suspects
* Victims
* Police stations
* Modus operandi patterns

MO similarity is calculated using **cosine-similarity clustering**, helping surface potential repeat-offender groups without manual cross-referencing.

### 🔮 Explainable Crime Risk Prediction

An **XGBoost model** predicts weekly station-level crime risk.

Instead of providing only a black-box risk score, **SHAP explanations** identify the factors contributing to each prediction.

This helps answer:

> **Why is this station considered high-risk?**

---

## 🏗️ System Architecture

```text
Crime Records
      │
      ▼
Data Processing & Feature Engineering
      │
      ├──────────────┬───────────────┐
      ▼              ▼               ▼
 Geospatial       Network         ML Risk
 Analytics        Analysis        Prediction
      │              │               │
   PostGIS      MO Similarity    XGBoost + SHAP
      │              │               │
      └──────────────┴───────────────┘
                     │
                     ▼
               FastAPI Backend
                     │
                     ▼
               React Dashboard
```

---

## 🧠 Machine Learning Pipeline

```text
Historical Crime Data
        │
        ▼
Feature Engineering
        │
        ▼
Chronological Train/Test Split
        │
        ▼
XGBoost Regression
        │
        ▼
Weekly Risk Prediction
        │
        ▼
SHAP Explainability
        │
        ▼
Ground-Truth Validation
```

A chronological train/test split is used instead of a random split to reduce **future-information leakage**.

---

## 🧪 Validation & Model Rigor

The synthetic dataset contains **7 deliberately injected crime patterns**, allowing the analytics and ML components to be tested against known ground truth.

| Validation                      | Result                                                              |
| ------------------------------- | ------------------------------------------------------------------- |
| **Risk Prediction**             | Test MAE **5.00** vs naive baseline **6.66**                        |
| **Feature Importance**          | Seasonal + hotspot signals correctly ranked as strongest predictors |
| **Burglary Night Pattern**      | Observed **2.28×** vs injected **2.2×**                             |
| **Vehicle Theft Night Pattern** | Observed **1.89×** vs injected **1.9×**                             |
| **Robbery Night Pattern**       | Observed **1.5×** vs injected **1.5×**                              |
| **MO Ring Detection**           | Correctly identified all **5 injected repeat offenders**            |
| **Red-Zone Detection**          | Correctly isolated the injected recent crime spike                  |

### Validation-Driven Improvements

The validation process also identified two implementation issues:

1. **Night-time crime multiplier logic** — crime-specific night multipliers were not correctly connected to the hour-assignment logic. The issue was identified through unexpectedly similar observed ratios and corrected.

2. **Red-zone baseline logic** — the original detector allowed recent spike weeks to influence their own baseline. This was corrected by comparing a recent window against a clean earlier baseline.

This validation-first approach ensures that the platform's analytical claims are **tested rather than simply visualized**.

---

## 🧰 Tech Stack

**Frontend**

* React
* Vite
* React Leaflet
* React Force Graph 2D
* Recharts

**Backend**

* Python
* FastAPI
* Uvicorn

**AI / Machine Learning**

* XGBoost
* SHAP
* Scikit-learn
* Pandas
* NumPy

**Database & Geospatial**

* PostgreSQL
* PostGIS
* Supabase

**Deployment**

* Zoho Catalyst
* Catalyst AppSail
* Docker

---

## 🚀 Run Locally

### 1. Clone the Repository

```bash
git clone https://github.com/kkeerthanaaaa/KSP-Hackathon-Deploy.git
cd KSP-Hackathon-Deploy
```

### 2. Setup PostgreSQL

PostgreSQL 14+ with PostGIS is required.

```bash
createdb ksp_crime
psql -U postgres -d ksp_crime -f backend/schema.sql
```

### 3. Setup Backend

```bash
cd backend
python -m venv venv
```

**Windows**

```bash
venv\Scripts\activate
```

**Linux / macOS**

```bash
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Generate synthetic crime data:

```bash
python generate_data.py
```

Start FastAPI:

```bash
uvicorn main:app --reload --port 8000
```

### 4. Setup Frontend

```bash
cd frontend
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

---

## ☁️ Deployment

```text
React Frontend
      │
      ▼
Zoho Catalyst Client
      │
      ▼
FastAPI Backend
      │
      ▼
Catalyst AppSail
      │
      ▼
Supabase PostgreSQL + PostGIS
```

PostgreSQL is hosted externally using **Supabase** because Catalyst's native Data Store does not provide the PostGIS capabilities required by the geospatial analytics layer.

---

## 🔭 Future Scope

* Real CCTNS/FIR data ingestion
* NLP extraction from FIR narrative text
* Production authentication and role-based access control
* Real-time crime hotspot monitoring
* Socio-economic and demographic overlays
* Crime-type-specific forecasting
* Mobile interface for field officers
* Automated anomaly alerts
* English + Kannada multilingual support

---

## 👥 Team

### Team Lalala

**Keerthana K**

**[Akash T](https://github.com/AkkashhT)**

---

## 🔗 Project Links

**Live Demo:**
[Launch KSP Crime Intelligence Platform](https://project-rainfall-60078528363.development.catalystserverless.in/app/index.html)

**Source Code:**
[GitHub Repository](https://github.com/kkeerthanaaaa/KSP-Hackathon-Deploy)

---

<div align="center">

### 🚨 From Crime Records → Crime Intelligence

Built for **Karnataka State Police Datathon 2026 — Challenge 2**

**AI-Driven Crime Analytics & Visualization Platform**

</div>
