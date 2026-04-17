# 🛡️ ShieldRoute
### AI-Powered Parametric Income Insurance for Food Delivery Partners

<p>
  <img src="https://img.shields.io/badge/Guidewire-DEVTrails%202026-orange?style=flat-square" />
  <img src="https://img.shields.io/badge/Phase-1%20Submission-blue?style=flat-square" />
  <img src="https://img.shields.io/badge/Stack-React%20%7C%20Supabase%20%7C%20Tailwind-green?style=flat-square" />
  <img src="https://img.shields.io/badge/Coverage-Income%20Loss%20Only-red?style=flat-square" />
  <img src="https://img.shields.io/badge/Pricing-Weekly-purple?style=flat-square" />
</p>

> Protecting India's 5M+ Zomato & Swiggy delivery partners from income loss caused by weather, pollution, and civic disruptions — with zero-touch parametric payouts.

---

## Quick Start (Local)

### 1. Prerequisites
- Node.js 20+ and npm 10+
- A Supabase project

### 2. Configure Environment
Create a `.env` file in the project root with:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
VITE_ADMIN_USERNAME=admin
VITE_ADMIN_PASSWORD=choose-a-strong-password
```

### 3. Apply Database Schema
Run the SQL in:
- `supabase/migrations/20260328171424_create_shieldroute_schema.sql`

in your Supabase SQL Editor.

Important:
- This app assumes Supabase anonymous authentication is enabled.
- In Supabase dashboard: Authentication -> Providers -> Anonymous -> Enable.

### 4. Install and Run

```bash
npm install
npm run dev
```

Then open the local URL shown by Vite (usually `http://localhost:5173`).

### 5. Build for Production

```bash
npm run build
npm run preview
```

---

## Project Completion Checklist

- Set all 4 required environment variables.
- Enable Supabase Anonymous Auth.
- Apply migration SQL to your Supabase database.
- Verify onboarding creates worker profile.
- Verify plan purchase creates policy.
- Verify dashboard simulation creates claim only for covered triggers.
- Verify admin login works with `VITE_ADMIN_USERNAME` and `VITE_ADMIN_PASSWORD`.
- Verify production build succeeds.

---

## Table of Contents

1. [Problem Context](#1-problem-context)
2. [Our Solution](#2-our-solution)
3. [Persona & Scenarios](#3-persona--scenarios)
4. [Application Workflow](#4-application-workflow)
5. [Weekly Premium Model](#5-weekly-premium-model)
6. [Parametric Triggers](#6-parametric-triggers)
7. [AI/ML Integration Plan](#7-aiml-integration-plan)
8. [Fraud Detection Architecture](#8-fraud-detection-architecture)
9. [Adversarial Defense & Anti-Spoofing Strategy](#9-adversarial-defense--anti-spoofing-strategy)
10. [Tech Stack](#10-tech-stack)
11. [Development Plan](#11-development-plan)
12. [Why Web Platform](#12-why-web-platform)
13. [Limitations & Future Work](#13-limitations--future-work)
14. [Team](#14-team)

---

## 1. Problem Context

India's food delivery ecosystem runs on the backs of over **5 million gig workers** (NITI Aayog, 2023) employed by platforms like Zomato and Swiggy. These workers operate entirely outdoors — exposed every day to weather volatility, dangerous air quality, and sudden civic disruptions.

When a disruption strikes:

| Disruption | Impact on Worker |
|---|---|
| Heavy rainfall / flooding | Deliveries halt. Routes become inaccessible. |
| Extreme heat (>44°C) | Platforms issue voluntary off-work advisories |
| Severe AQI (>400) | Outdoor activity becomes medically dangerous |
| Curfew / local bandh | Pickup and drop zones become unreachable |

The result: **20–40% loss in weekly income**, with no financial protection of any kind.

Existing insurance products fail this segment because they:
- Cover **health or accidents**, not income loss
- Operate on **monthly or annual cycles**, misaligned with weekly gig payouts
- Require **manual claim filing** — slow, opaque, and inaccessible to workers with low digital literacy

**ShieldRoute is purpose-built to close this gap.**

---

## 2. Our Solution

**ShieldRoute** is an AI-powered **parametric income insurance platform** built exclusively for Zomato and Swiggy delivery partners.

### What Is Parametric Insurance?

Unlike traditional insurance — which requires a worker to *prove* their loss — **parametric insurance pays automatically** when a predefined external data condition (a "trigger") is met. No claim forms. No paperwork. No waiting.

> Example: If rainfall exceeds 35mm in 6 hours in a worker's delivery zone, the payout fires automatically. The worker does nothing.

### Core Value Proposition

| Feature | Description |
|---|---|
| **Weekly micro-premiums** | ₹29–₹79/week, aligned with weekly gig payouts |
| **Zero-touch claims** | Disruptions detected via APIs — no worker action needed |
| **Instant UPI payouts** | Credited within ~2 hours of trigger confirmation |
| **Hyper-local coverage** | Risk and payouts tied to the worker's actual delivery zone |
| **Income-only scope** | Strictly excludes health, life, vehicle, and accident coverage |

---

## 3. Persona & Scenarios

### Primary Persona

| Attribute | Detail |
|---|---|
| Representative Name | Ravi Kumar |
| Role | Food Delivery Partner (Zomato / Swiggy) |
| City | Hyderabad / Bengaluru / Mumbai / Delhi |
| Weekly Earnings | ₹3,500 – ₹7,000 |
| Work Pattern | 8–12 hrs/day, ~6 days/week |
| Device | Entry-level Android smartphone |
| Platform Activity | Tracked via delivery app login/session signals |
| Core Pain Point | Loses 20–40% weekly income during disruptions, with zero safety net |

---

### Scenario 1 — Heavy Rainfall, Bengaluru

> Ravi is enrolled on ShieldRoute's Standard plan (₹49/week, up to ₹1,000 payout).
> Tuesday afternoon, IMD data reports **68mm rainfall in 6 hours** in his delivery zone (Koramangala).
> ShieldRoute's trigger engine detects the breach at **11:42 AM**.
> Fraud validation completes in 4 minutes — Ravi's GPS history confirms he was in the zone.
> By **1:15 PM**, ₹600 is credited to his UPI ID. He received no notification asking him to act. He did nothing.

### Scenario 2 — Extreme Heat, Delhi

> Delhi records **46°C for 5 consecutive hours**. Zomato issues a voluntary heat advisory.
> ShieldRoute's heat trigger (T02) activates across affected pin codes.
> Workers on Standard and Plus plans in those zones receive proportional payouts based on estimated lost hours — without filing anything.

### Scenario 3 — AQI Emergency, Delhi-NCR

> CPCB data reports **AQI = 463** in North Delhi for 4 hours — GRAP Stage IV declared.
> ShieldRoute's AQI trigger (T03) fires automatically.
> All active Plus plan workers in flagged zones receive income protection payouts within 2 hours.

### Scenario 4 — Curfew / Local Bandh, Hyderabad

> A sudden district-level bandh is announced. Government API and news NLP sources confirm the disruption.
> ShieldRoute's social disruption trigger (T05) activates for affected zones.
> Workers registered in those areas receive automatic payouts. No manual reporting needed.

---

## 4. Application Workflow

### Worker Journey

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   ONBOARD    │───▶│ SELECT PLAN  │──-─▶│  PAY WEEKLY  │───▶│  DISRUPTION  │────▶│    PAYOUT    │
│              │     │              │     │              │     │  DETECTED    │     │              │
│ Phone + ID   │     │ AI recommends│     │ UPI auto-    │     │ API threshold│     │ UPI credited │
│ Zone select  │     │ ₹29/₹49/₹79  │     │ debit weekly │     │ breached →   │     │ within 2 hrs │
│ Risk scored  │     │ Triggers     │     │ Coverage     │     │ Fraud check  │     │ SMS + app    │
│ instantly    │     │ shown clearly│     │ activates    │     │ Auto-approve │     │ notification │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
```

**Key principle:** After onboarding and plan selection, the worker never needs to take any action. The entire claim-to-payout pipeline is fully automated.

### Insurer / Admin Dashboard

```
┌─────────────────────────────────────────────────────────────────┐
│  INSURER DASHBOARD                                              │
│                                                                 │
│  ┌──────────────────┐  ┌─────────────────┐  ┌───────────────┐   │
│  │  Live Trigger Map│  │  Claims Queue   │  │  Loss Ratios  │   │
│  │  Zone-wise view  │  │  + Fraud Scores │  │  Per zone     │   │
│  └──────────────────┘  └─────────────────┘  └───────────────┘   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Predictive Risk Forecast — Next 7 Days                  │   │
│  │  Expected claim volume + payout exposure per zone        │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Weekly Premium Model

### Why Weekly Pricing?

Zomato and Swiggy pay delivery partners **weekly**. A monthly or annual premium creates an immediate cash-flow mismatch — workers cannot pre-commit a large sum when income arrives in small weekly cycles. Weekly pricing means the insurance cost is **always proportional to one pay period**.

### Plan Structure

| Plan | Weekly Premium | Max Weekly Payout | Triggers Covered |
|---|---|---|---|
| **Basic** | ₹29 | ₹500 | Rain (T01) only |
| **Standard** ⭐ | ₹49 | ₹1,000 | Rain + Heat + AQI (T01–T03) |
| **Plus** | ₹79 | ₹2,000 | All 5 triggers (T01–T05) |

### Dynamic Premium Formula

The base plan price is adjusted weekly by ShieldRoute's AI Risk Engine:

```
Final Weekly Premium = Base × Zone Risk Multiplier × Tenure Discount × Claim History Factor

Zone Risk Multiplier  : 0.8 (historically safe zone)  →  1.4 (flood-prone zone)
Tenure Discount       : 1.0 (new)  →  0.95 (4+ weeks)  →  0.90 (12+ weeks)
Claim History Factor  : 1.0 (no claims)  →  1.15 (1 claim / 8 wks)  →  1.30 (2+ claims / 8 wks)
```

**Worked Example:**
> Ravi, Standard plan (₹49 base). Zone: Koramangala, moderate flood risk (multiplier = 1.1).
> Enrolled 6 weeks (tenure discount = 0.95). No prior claims (factor = 1.0).
> `₹49 × 1.1 × 0.95 × 1.0 = ₹51.2 → rounded to ₹51/week`

### Payout Formula

```
Payout = MIN( Daily Earnings Estimate × Disruption Hours / 8,  Max Weekly Payout )

Where:
  Daily Earnings Estimate  =  onboarding-declared value, cross-validated with zone benchmarks
  Disruption Hours         =  derived from trigger severity + zone-level API data
```

---

## 6. Parametric Triggers

Every 15 minutes, ShieldRoute's trigger engine polls external data sources across all active worker zones. When a threshold is crossed, the payout pipeline initiates automatically.

| ID | Event Type | Data Source | Trigger Threshold | Zone Scope |
|---|---|---|---|---|
| **T01** | Heavy Rainfall | OpenWeatherMap / IMD RSS | ≥ 35mm in 6 hours | Pin code |
| **T02** | Extreme Heat | OpenWeatherMap | ≥ 44°C sustained for ≥ 4 hours | City zone |
| **T03** | Severe AQI | OpenAQ / CPCB | AQI ≥ 400 for ≥ 3 hours | City zone |
| **T04** | Flood Warning | IMD / NDMA alert feed | Official flood warning issued | District |
| **T05** | Curfew / Bandh | Government API + News NLP | Verified disruption event confirmed | District |

### Trigger Pipeline

```
Every 15 minutes:
  1. Fetch weather / AQI data for all active worker zones
  2. Compare values against trigger thresholds
  3. If threshold breached:
       a. Log trigger event (timestamp, zone, severity, data source)
       b. Cross-reference with active enrolled policies in that zone
       c. Run fraud validation stack (Sections 8 & 9)
       d. Fraud score  0–30  →  Auto-approve  →  Initiate UPI payout
       e. Fraud score 31–60  →  Soft flag  →  Delayed 4 hours  →  Re-review
       f. Fraud score  61+   →  Hold  →  Manual insurer review
```

---

## 7. AI/ML Integration Plan

### Module 1 — Dynamic Premium Calculation

| Attribute | Detail |
|---|---|
| **Model** | XGBoost (Gradient Boosted Trees) |
| **Input Features** | Zone historical disruption frequency, worker tenure (weeks), average delivery hours/week, past claim count (rolling 8-week window), current season/month, zone flood-risk classification |
| **Output** | Weekly risk multiplier (0.8 – 1.5) applied to base premium |
| **Training Data** | OpenWeatherMap historical records (3 years), simulated worker profiles (bootstrapped for prototype) |
| **Why XGBoost** | Handles tabular data efficiently, provides interpretable feature importance, fast inference for real-time weekly repricing |

### Module 2 — Earnings Estimation & Validation

| Attribute | Detail |
|---|---|
| **Method** | Ridge regression model + rule-based adjustment layer |
| **Input Features** | Self-declared earnings, delivery zone, average work hours, platform (Zomato/Swiggy), zone-level income benchmarks |
| **Output** | Validated daily earnings baseline used in payout calculation |
| **Purpose** | Workers may under-declare (tax reasons) or over-declare (maximize payout). The model cross-validates declarations against zone-level benchmarks to produce a fair, defensible earnings estimate. |

### Module 3 — Predictive Risk Forecasting

| Attribute | Detail |
|---|---|
| **Model** | Facebook Prophet (short-term) + LSTM (longer horizon) |
| **Input** | 7-day weather forecast, historical claim data per zone, seasonal disruption patterns |
| **Output** | Expected claim volume and total payout exposure forecast for next 7 days, broken down by zone and trigger type |
| **Used By** | Insurer admin dashboard for reserve planning and liquidity management |

### Module 4 — Fraud Detection

See Sections 8 and 9 for full architecture.

---

## 8. Fraud Detection Architecture

Fraud in parametric insurance is structurally different from traditional insurance fraud. Workers cannot fake the weather — but they can misrepresent their location, activity status, or identity to appear eligible for a payout they don't deserve.

### Detection Layers

| Layer | Method | What It Catches |
|---|---|---|
| **L1 — Zone Validation** | GPS history cross-check vs declared delivery zone at time of trigger | Workers claiming from outside their registered zone |
| **L2 — Activity Signal** | Platform app session and login activity in the 2 hours preceding trigger | Inactive workers claiming disruption payouts |
| **L3 — Anomaly Detection** | Isolation Forest on claim frequency, timing, and earnings-to-payout ratio | Statistical outliers and abnormal claim behaviour |
| **L4 — Duplicate Prevention** | Phone number + Partner ID + device fingerprint deduplication | Multi-account abuse with shared identity signals |
| **L5 — Historical Validation** | Claimed disruption dates cross-referenced against actual IMD / AQI records | Retroactive or fabricated trigger claims |

### Fraud Risk Score

Each auto-generated claim receives a **Fraud Risk Score (0–100)** computed across the above layers:

| Score Range | Action | Rationale |
|---|---|---|
| **0–30** | Auto-approve → Instant payout | High-confidence legitimate claim |
| **31–60** | Soft review → Payout delayed 4 hours | Borderline signals; passive re-check |
| **61–80** | Hold → Worker notified; 24-hr verification window | Worker can clear with a timestamped selfie at location |
| **81–100** | Block → Escalated to insurer review team | Strong fraud signals; manual investigation required |

> **Design Principle:** A worker with a clean 6-week activity history, consistent delivery zone, and normal GPS movement will always score below 30. Only accounts with missing history, suspicious device signals, or location mismatches ever face friction.

---

## 9. Adversarial Defense & Anti-Spoofing Strategy

> **Market Crash Scenario:** A coordinated fraud ring of ~500 fake delivery partners is exploiting parametric triggers using GPS spoofing to drain the platform's liquidity pool. This section outlines ShieldRoute's multi-layer adversarial defense — designed to neutralize organized attacks without penalizing genuine workers.

---

### The Attack Vector

In a parametric system, payouts fire when a trigger threshold is met in a worker's registered zone. A fraud ring exploits this by:

1. **GPS Spoofing** — Faking device location to appear inside a disruption zone while physically elsewhere
2. **Coordinated Claiming** — Dozens of fake accounts submitting simultaneously during the same trigger event
3. **Synthetic Identities** — Registering with fabricated or stolen Zomato/Swiggy Partner IDs
4. **Pre-event Account Inflation** — Bulk-registering accounts in the days before a predicted weather event

---

### Layer 1 — Location Integrity Verification

**Goal:** Distinguish spoofed GPS signals from genuine location data.

| Signal | Genuine Worker | GPS Spoofer |
|---|---|---|
| Movement pattern | Irregular, delivery-path-like movement with natural stops | Stationary or teleporting between coordinates |
| GPS accuracy metadata | Varies naturally (5–20m typical error) | Spoofed GPS often reports 0m accuracy — physically impossible |
| Speed plausibility | Realistic travel speeds between location pings | Instant coordinate jumps with no travel time |
| IP vs GPS cross-check | Device IP geolocation roughly matches GPS zone | GPS shows Koramangala; IP resolves to Noida |
| Cell tower triangulation | Tower signal consistent with GPS coordinates | Tower data contradicts claimed GPS position |

**Action:** GPS data points with 0m accuracy, impossible velocity, or IP/tower mismatch are flagged. Accumulated flags within a single claim window significantly elevate the fraud score.

---

### Layer 2 — Behavioral Activity Analysis

**Goal:** Verify the worker was genuinely active before the disruption, not merely "present" in the zone.

A genuine worker caught in a flood has a **trail of activity leading up to the event** — platform logins, order completions, GPS movement through delivery routes. Fraudsters have no such trail.

Signals analyzed:
- Platform app session activity in the 2 hours before trigger event
- Historical delivery heatmap — does this zone match the worker's regular operating area?
- Time-of-day pattern — is this claim arriving at an hour consistent with the worker's history?
- First-appearance check — has the worker ever operated in this zone before today?

---

### Layer 3 — Graph-Based Fraud Ring Detection

**Goal:** Catch coordinated rings that individual-level checks miss.

A ring of 500 accounts leaves graph-level signatures that are invisible at the individual level but obvious when viewed as a network:

```
Build a relational graph:
  Nodes  =  individual accounts
  Edges  =  shared signals between accounts:
              - Same device fingerprint (IMEI hash / browser fingerprint)
              - Same IP subnet or ISP identifier
              - Same or adjacent UPI account prefix
              - Registration timestamps within the same 48-hour window
              - Claim submissions within the same 15-minute trigger window

Detection rule:
  If a connected subgraph of N accounts (N > 15) shares ≥ 2 edge types
  AND all submitted claims fall within the same trigger event window
  → FLAG entire cluster as coordinated ring
  → Freeze payouts for all accounts in cluster
  → Escalate to insurer review
```

This approach catches the ring **as a network** — even when individual accounts appear borderline-legitimate in isolation.

---

### Layer 4 — Real-Time Velocity & Registration Anomaly Detection

**Goal:** Detect pre-attack account inflation and synchronized claim bursts.

**Registration velocity monitoring:**
- A spike in new registrations from the same city zone within a 48-hour window is treated as a pre-attack signal
- New accounts registered within 72 hours of their first claim are automatically placed in the **30-day grace tier** (50% payout rate until activity history builds)
- This removes the incentive to bulk-register accounts before a predicted weather disruption

**Claim velocity monitoring:**
```
If N claims (N > configured threshold) arrive from the same trigger zone
within the same 15-minute window
AND share device fingerprint, IP subnet, or UPI prefix signals
→ Trigger coordinated-ring flag
→ Rate-limit payouts for that zone
→ Queue for batch review before processing
```

---

### Layer 5 — Financial Infrastructure Clustering

**Goal:** Surface the money trail of a fraud ring.

- Any UPI ID receiving payouts from more than 2 different accounts in a single trigger event is flagged
- Bank account prefix clustering across multiple accounts signals shared financial infrastructure
- These signals are combined with graph data from Layer 3 to confirm ring membership

---

### False Positive Mitigation — Protecting Genuine Workers

The hardest problem in adversarial fraud detection is avoiding false positives during the exact moments genuine workers need protection most (i.e., during an actual disruption).

**ShieldRoute's tiered response ensures no legitimate worker is hard-blocked:**

| Fraud Score | Response | Worker Experience |
|---|---|---|
| 0–30 | Auto-approve | Instant payout, zero friction |
| 31–60 | Soft review | Payout delayed 4 hours; worker notified via SMS |
| 61–80 | Verification request | Worker submits a 10-second timestamped selfie to clear the hold |
| 81–100 | Manual review | Payout held; insurer investigates before release |

**The "New Worker" problem:** Legitimate workers enrolling just before a major weather event naturally have no activity history and may score above 30. Solution: all accounts under 30 days old receive payouts at **50% rate** during their first month, regardless of fraud score. This removes the attack incentive while ensuring genuine new workers still receive meaningful partial protection.

---

### System-Level Safeguards

- **Immutable audit logs** for every trigger event, fraud score computation, and payout decision
- **Cross-API trigger verification** — a trigger must be confirmed by ≥ 2 independent data sources before payouts fire across large zones
- **Rate limiting** — maximum payout volume per zone per trigger event; anomalous spikes are paused and queued
- **Delayed batch processing** — suspicious clusters are held for 4-hour batch review rather than instant processing

---

### Defense Stack Summary

```
Attack Surface               →  ShieldRoute Defense
─────────────────────────────────────────────────────────────────────
GPS Spoofing                 →  Movement pattern analysis + IP/tower
                                cross-check + accuracy metadata detection
Coordinated Ring             →  Graph-based clustering + device fingerprint
                                collision + registration spike detection
Synthetic Identities         →  Partner ID validation + platform activity
                                check + device fingerprint deduplication
Financial Laundering         →  UPI / bank account clustering detection
Pre-event Account Inflation  →  Registration velocity monitoring
                                + 30-day grace tier for new accounts
False Positives              →  Tiered fraud score + selfie recovery path
                                + no hard blocks below score 80
```

> **Core Philosophy:** Fraud detection in parametric insurance must be asymmetric. The cost of wrongly blocking a genuine flood-stranded worker is higher than the cost of a short review delay. ShieldRoute defaults to *pay with monitoring* — not *block until proven innocent.*

---

## 10. Tech Stack

### Frontend

| Layer | Technology | Rationale |
|---|---|---|
| Framework | React + Vite | Fast builds, component-driven, instant hot reload |
| Styling | Tailwind CSS | Rapid, consistent design system |
| State Management | Zustand | Lightweight global state; no Redux overhead |
| Charts / Analytics | Recharts | React-native charting for worker and admin dashboards |

### Backend

| Layer | Technology | Rationale |
|---|---|---|
| API Server | FastAPI (Python) | Async, high-performance, auto-docs; ideal for ML co-location |
| Authentication | JWT + OTP (MSG91 mock) | Phone-based auth suited to delivery worker demographics |
| Task Queue | Celery + Redis | Background trigger polling every 15 minutes |
| Payment (Mock) | Razorpay Test Mode | End-to-end UPI payout simulation |

### Database

| Layer | Technology | Rationale |
|---|---|---|
| Primary DB | MongoDB Atlas | Flexible schema for evolving policy and claim structures |
| Cache / Queue | Redis | Trigger state caching, task queuing, rate limiting |

### AI / ML

| Module | Technology |
|---|---|
| Dynamic Premium Model | XGBoost + scikit-learn |
| Fraud Detection | Isolation Forest (scikit-learn) |
| Predictive Forecasting | Facebook Prophet |
| Data Processing | Pandas + NumPy |

### External APIs

| API | Purpose | Mode |
|---|---|---|
| OpenWeatherMap | Real-time rainfall and temperature data | Free tier |
| OpenAQ | AQI monitoring by city zone | Free tier |
| IMD RSS Feed | Official flood and cyclone alerts | Public feed |
| Razorpay | Payment and UPI payout simulation | Test / Sandbox |
| MSG91 | OTP-based phone authentication | Trial mode |

### Infrastructure

| Layer | Technology |
|---|---|
| Frontend Hosting | Vercel |
| Backend Hosting | Render |
| Containerization | Docker (local development) |
| Version Control | GitHub |
| CI/CD | GitHub Actions |

---

## 11. Development Plan

### Phase 1 — Ideation & Foundation (March 4–20) ✅

- [x] Problem research and persona definition
- [x] System architecture design
- [x] Weekly premium model and parametric trigger design
- [x] AI/ML module planning and model selection
- [x] Fraud detection and adversarial defense architecture
- [x] Tech stack finalization
- [x] README documentation
- [x] Prototype wireframes
- [x] Phase 1 demo video

### Phase 2 — Automation & Protection (March 21–April 4)

- [x] Worker onboarding with phone-based OTP authentication
- [x] Delivery zone selection and AI risk scoring at signup
- [x] Policy creation with dynamic weekly premium calculation (XGBoost)
- [x] 5-trigger monitoring engine (OpenWeatherMap + OpenAQ + IMD)
- [x] Automated claim initiation pipeline on trigger breach
- [x] Fraud detection layers L1 + L4 (GPS zone check + duplicate detection)
- [x] Razorpay mock payout integration (UPI simulation end-to-end)
- [x] Worker dashboard (active policy, coverage status, payout history)

### Phase 3 — Scale & Optimise (April 5–17)

- [x] Advanced fraud detection layers L2 + L3 + L5
- [x] Graph-based fraud ring detection (coordinated attack defense)
- [x] Insurer admin dashboard with zone-level loss ratios and predictive forecasting
- [x] Full payout simulation walkthrough (trigger → fraud check → UPI credit)
- [x] Mobile-responsive PWA optimization
- [ ] Performance profiling and load testing

---

## 12. Why Web Platform

| Factor | Rationale |
|---|---|
| **Development speed** | Single codebase; no App Store review delays |
| **Demo quality** | Full-screen walkthroughs are cleaner for video submissions and live judging |
| **Accessibility** | Workers access via any Android browser — no installation required |
| **Admin dashboard** | Insurer-side analytics are best experienced on larger screens |
| **PWA capability** | Installable, offline-capable, push-notification support — near-native Android UX |

---

## 13. Limitations & Future Work

### Current Limitations

- Trigger data depends on third-party APIs — outages or latency can affect payout speed
- No direct API integration with Zomato/Swiggy (earnings and activity signals are simulated in prototype)
- Earnings estimation uses semi-simulated inputs in Phase 1
- Fraud signal validation is limited to mocked data until real-world training data is available

### Planned Future Enhancements

- Direct platform API integration with Zomato/Swiggy for verified earnings and real-time activity data
- Expansion to other gig segments — e-commerce, hyperlocal delivery, ride-sharing
- On-chain parametric trigger logging for tamper-proof, auditable payout records
- Multilingual support (Hindi, Telugu, Tamil, Kannada) for broader worker accessibility
- Advanced ML-based fraud detection trained on real-world claim data post-launch

---

## 14. Team

| Member | Role |
|---|---|
| Pavan Kumar Somalanka | Full Stack Development & Machine Learning Lead |
| Vennela Velagapudi | Frontend & UX |
| Jaya Krishna Gude | Backend & DevOps |

**University:** SRM University AP, Amaravati

**Batch:** 2023–2027

---

## Links

| Resource | Link |
|---|---|
| GitHub Repository | *https://github.com/pavankumar28052006/ShieldRoute* |
| Phase 1 Demo Video | *https://drive.google.com/file/d/1-bSVwRqpcRNB13Ezh2Eb-IczZI1AFOL1/view?usp=sharing* |

---

<p align="center">
  <b>ShieldRoute — Because every delivery partner deserves a safety net.</b><br/>
  <i>Guidewire DEVTrails 2026 &nbsp;|&nbsp; SRM University AP &nbsp;|&nbsp; Team VibeCoders</i>
</p>
