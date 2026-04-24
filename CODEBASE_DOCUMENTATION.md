# SurveyKu - Comprehensive Codebase Documentation

Welcome to the **SurveyKu** codebase. This document provides a high-level and detailed overview of the project architecture, features, and technical implementation to help AI agents and developers understand the system without scanning every file.

---

## 🚀 Project Overview
**SurveyKu** is a specialized data collection and monitoring platform built for surveyors in the field. It features a mobile-first design (via Capacitor) and a robust backend (via Supabase) to handle surveys, census data, media monitoring, and public aspirations.

### Key Pillars:
- **Mobile First**: Optimized for field use with camera and GPS integration.
- **Offline Ready**: Robust synchronization logic for areas with poor connectivity.
- **Role-Based**: Distinct workflows for **Admins** (Management/Analytics) and **Surveyors** (Data Collection).
- **Dynamic**: Questionnaires are fully configurable with branching logic.

---

## 🛠 Tech Stack
| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite |
| **Mobile** | Capacitor (Camera, Geolocation) |
| **Backend/DB** | Supabase (PostgreSQL, Storage, Auth) |
| **State Management** | Zustand |
| **Styling** | Vanilla CSS (Modern CSS Variables) |
| **Icons** | Lucide React |
| **Analytics** | Chart.js, React-Chartjs-2 |
| **Data Export** | XLSX (Excel), File-Saver |

---

## 📂 Project Structure
```
survey_apps/
├── src/
│   ├── components/       # UI Components grouped by feature
│   │   ├── admin/        # Admin management tools
│   │   ├── aspiration/   # Public feedback module
│   │   ├── common/       # Reusable UI (Toast, Modal, etc.)
│   │   ├── dashboard/    # Role-specific stats
│   │   ├── media/        # Media monitoring module
│   │   ├── onboarding/   # KTP Capture & Profile Setup
│   │   ├── sensus/       # Census data module
│   │   └── survey/       # Dynamic survey engine
│   ├── lib/              # Core libraries (Supabase client)
│   ├── store/            # Zustand stores (Auth, App, Sync, Logs)
│   ├── types/            # TypeScript definitions (Models, Interfaces)
│   ├── utils/            # Helper functions (Geo, Formatters)
│   ├── App.tsx           # Main routing and layout logic
│   └── main.tsx          # Application entry point
├── supabase/             # Database migrations and config (if any)
├── public/               # Static assets
└── docs/                 # Implementation plans and design drafts
```

---

## 🔐 Core Modules & Logic

### 1. Authentication & Onboarding (`src/store/useAuth.ts`)
- **Role Detection**: Users are either `admin` or `surveyor`.
- **Onboarding Flow**: Surveyors must complete a two-step onboarding:
    1. **KTP Capture**: Photo of Identity Card using `@capacitor/camera`.
    2. **Profile Setup**: Basic info and regional assignment (Provinsi, Kabupaten, Kecamatan, Desa).

### 2. Survey Engine (`src/components/survey/`)
- **Question Types**: Supports text, number, select, radio, checkbox, textarea, date, and **Matrix/Table** types.
- **Branching Logic**: Questions can have `conditions` (e.g., only show Q2 if Q1 == "Yes").
- **Verification**: Automatically captures GPS coordinates and a photo proof for every survey submission.

### 3. Offline Synchronization (`src/store/useOfflineSync.ts`)
- **Queueing**: If the device is offline, submissions are saved to a local queue.
- **Auto-Sync**: The app monitors connection status and automatically pushes pending data to Supabase when back online.
- **Indicators**: Visual badges in the header show "Offline" status and the number of pending items.

### 4. Admin Dashboard (`src/components/dashboard/DashboardAdmin.tsx`)
- Provides high-level metrics using `Chart.js`.
- Exports survey results and respondent data to Excel (`xlsx`).
- Manages user accounts and questionnaire templates.

### 5. Media & Aspiration Tracking
- **Media Monitoring**: Tracks news sentiments (Positive/Neutral/Negative) across various sources (Social Media, Online News, etc.).
- **Aspirations**: A ticketing-style system for reporting community needs (Infrastructure, Education, etc.) with priority levels.

---

## 📊 Data Models (`src/types/index.ts`)
- **`Profile`**: User account data, including regional assignment and onboarding status.
- **`RespondentSample`**: Target individuals for surveys.
- **`Questionnaire`**: Template containing a list of `Question` objects with logic.
- **`SurveyResponse`**: Completed survey data linked to a respondent and surveyor.
- **`CensusData`**: Independent population data collection records.
- **`Aspiration`**: Public feedback/complaint records.

---

## 🔧 Infrastructure (Supabase)
The app interacts with several PostgreSQL tables:
- `profiles`: Core user data.
- `respondent_samples`: Target list for surveys.
- `questionnaires`: Survey templates.
- `survey_responses`: Resulting data.
- `aspirations` / `census_data` / `media_monitoring`: Module-specific data.
- `activity_logs`: Audit trail for all user actions.
- `notifications`: User-specific alerts.

---

## 🛠 Development Commands
- `npm run dev`: Start local development server.
- `npm run build`: Build production web assets.
- `npm run deploy`: Deploy to GitHub Pages.

---

## 💡 Notes for AI Agents
- **State Management**: Always use the Zustand stores in `src/store/` for global state (Auth, Sync, etc.).
- **API Calls**: Most database interactions should go through `src/lib/supabase.ts` which acts as a service layer.
- **Styling**: The project uses a centralized design system in `src/index.css`. Use the CSS variables defined there for consistency.
- **Mobile Features**: When testing camera or geolocation, remember these rely on Capacitor plugins which may require a real device or specific browser permissions.

---
*Documentation generated on: 2026-04-24*
