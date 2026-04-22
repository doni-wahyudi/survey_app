# Task: Migrate to Real Supabase Backend

- [x] Migrate Authentication Store (`useAuth.ts`)
    - [x] Update `login` call
    - [x] Update `logout` call
    - [x] Implement `getUserProfile` from Supabase
    - [x] Update `updateProfile` for Supabase persistence
- [x] Migrate Offline Sync Store (`useOfflineSync.ts`)
    - [x] Implement `syncAll` logic for each table
- [x] Update Data Fetching in Components
    - [x] `DashboardAdmin`
    - [x] `DashboardSurveyor`
    - [x] `SurveyList`
    - [x] `RespondentManager`
    - [x] `SurveyResults`
    - [x] `CensusList`
    - [x] `AspirationList`
    - [x] `MediaMonitoringList`
- [x] Consolidate SQL Queries to `supabase/schema.sql`
- [x] Final Verification of Migration
    - [x] Fix `getPriorityLabel` export error
    - [x] Install missing `xlsx` and `file-saver` dependencies
    - [x] Resolve `src/store/useAuth.ts` null safety issue
    - [x] Correct `.env` Supabase URL configuration
    - [x] Build & Type-check (Successful Build)
    - [x] Full flow verification (Login -> Onboarding -> Survey -> Sync)

# Upcoming: OCR Integration (Deferred)
- [ ] Install OCR Plugin (`npm install @jcesarmobile/capacitor-ocr`)
- [ ] Create `src/utils/ocrParser.ts` for KTP data extraction
- [ ] Integrate OCR into `KTPCapture.tsx`
- [ ] Connect extracted data to `ProfileSetup.tsx`
