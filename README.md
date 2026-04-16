# InsuriFyx: AI-Powered Parametric Income Insurance 🛡️

**Protecting the Backbone of India's Platform Economy.**

InsuriFyx is a cutting-edge parametric insurance solution designed specifically for food delivery partners (Zomato, Swiggy, etc.). Unlike traditional insurance, InsuriFyx uses real-time data and AI to automatically detect income-disrupting events—such as extreme weather, platform outages, or civic restrictions—and issues instant payouts without the need for manual claims.

---

## 🚀 Features at a Glance

- **Zero-Touch Claims**: No forms, no evidence, no adjusters. Payouts are triggered automatically by third-party data.
- **Real-Time Monitoring**: Continuous polling of weather APIs, platform status, and civic alerts.
- **Smart Protection Mode**: Predictive AI (LSTM) forecasts disruptions and alerts workers to enable coverage before the storm hits.
- **Dynamic Pricing**: Weekly premiums calculated based on zone-specific risk profiles and historical data.
- **Anti-Fraud Engine**: Multi-layered defense using GPS trace physics, network triangulation, and device sensor verification.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React (Vite)
- **Styling**: Tailwind CSS / Vanilla CSS
- **Routing**: React Router
- **Icons**: Lucide React (implied)

### Backend
- **Runtime**: Node.js
- **Framework**: Express
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Real-time**: Cron-based monitoring engine

### Machine Learning
- **Forecasting**: LSTM Time-Series (for disruption probability)
- **Pricing**: Gradient Boosted Regression (for dynamic premiums)
- **Fraud Detection**: Isolation Forest & XGBoost Ensemble (for anomaly/ring detection)

---

## 🌩️ Parametric Triggers

Payouts are initiated when thresholds are crossed according to independent data sources:

| Trigger Category | Data Source | Threshold |
| :--- | :--- | :--- |
| **Heavy Rainfall** | IMD + OpenWeatherMap | > 15 mm/hr for ≥ 2 hrs |
| **Extreme Heat** | OpenWeatherMap | > 43°C for ≥ 4 hrs |
| **Air Quality (AQI)**| CPCB / IQAir API | AQI > 400 for ≥ 3 hrs |
| **Platform Outage** | App health + Downdetector| Outage > 90 mins |
| **Civic Restriction**| Govt Alerts + News API | Curfew / Bandh in zone |

---

## 🏗️ Architecture & ML Integration

### 1. Dynamic Premium Calculation
A **Gradient Boosted Regression** model ingests historical zone data and 7-day forecasts to produce a risk score. Premiums are weighted more heavily for disruptions during peak window (7–10 PM), reflecting the actual income concentration of gig workers.

### 2. Fraud & Anti-Spoofing
To defend against GPS spoofing syndicates, InsuriFyx uses a multi-signal verification layer:
- **GPS Physics**: Detection of unnaturally static drift or impossible velocity spikes.
- **Network Triangulation**: Corroborating GPS with mobile carrier tower data.
- **Device Sensors**: Validating "on-the-move" accelerometer patterns via the browser's Device Motion API.

---

## 🏁 Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL
- NPM or Yarn

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repo-url>
   cd insurance_ai/Catalysts
   ```

2. **Backend Setup**:
   ```bash
   cd backend
   npm install
   # Create a .env file with your DATABASE_URL
   npx prisma migrate dev
   npx prisma db seed
   npm run dev
   ```

3. **Frontend Setup**:
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

4. **Access the App**:
   The application will be running at `http://localhost:5173`.

---

## 🌍 Mission & Impact

In India, a single disrupted evening shift can wipe out 20-30% of a delivery partner's weekly income. This isn't just about "rain"—it's about the hours a worker never gets the chance to work. InsuriFyx aims to bridge this gap by providing an automated, trustless safety net that respects the time and effort of the gig workforce.

---

