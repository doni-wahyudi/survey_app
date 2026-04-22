# Implementation Plan - KTP OCR Integration (Revised)

This plan outlines the steps to integrate Optical Character Recognition (OCR) into the SurveyKu app to automatically extract comprehensive data from KTP (Indonesian ID Card) photos.

## User Review Required

> [!IMPORTANT]
> This feature depends on native mobile capabilities (Google ML Kit on Android and Vision Framework on iOS). Web-browser testing will use a fallback or manual entry mode.

> [!NOTE]
> We will extract the following fields to pre-fill the Surveyor Profile:
> - **NIK** (16 digits)
> - **Nama Lengkap**
> - **Tempat/Tgl Lahir**
> - **Alamat** (Basic parsing)
> - **Kelurahan/Desa**
> - **Kecamatan**
> - **Pekerjaan** (to be mapped to occupation choices)

## Proposed Changes

### 1. Dependency Installation
- Install `@jcesarmobile/capacitor-ocr`.
- Run `npx cap sync` to update native projects.

### 2. OCR Parser Utility
#### [NEW] [ocrParser.ts](file:///c:/Users/whydo/D9043DB2025/code/explore/apk/survey_apps/src/utils/ocrParser.ts)
- Implement `parseKTP(textBlocks: string[])` to handle:
    - **NIK extraction**: Look for 16-digit sequences.
    - **Label-based extraction**: Find keywords like "Nama", "Kel/Desa", "Kecamatan", "Pekerjaan" and capture the text that follows.
    - **Data Cleaning**: Normalize text (uppercase, remove noise/special characters).

### 3. UI Integration (Onboarding)
#### [MODIFY] [KTPCapture.tsx](file:///c:/Users/whydo/D9043DB2025/code/explore/apk/survey_apps/src/components/onboarding/KTPCapture.tsx)
- After camera capture, show a "Memproses KTP..." overlay.
- Execute the OCR process.
- Redirect to Profile Setup with the results.

#### [MODIFY] [ProfileSetup.tsx](file:///c:/Users/whydo/D9043DB2025/code/explore/apk/survey_apps/src/components/onboarding/ProfileSetup.tsx)
- Enable receiving pre-filled data from the OCR step via React state/navigation.
- Populate form fields automatically while allowing manual correction.

## Open Questions
1. **Selection Logic**: Should we try to auto-match "Kecamatan" and "Desa" from the OCR text to our existing list of regions in `seedData`? (This could help reduce errors but might be tricky if the OCR result has slight typos).
2. **Confidence Threshold**: Should we warn the user if the OCR confidence is low?

## Verification Plan

### Manual Verification
1. Log in as a new user.
2. Upload/Take a photo of a KTP.
3. Observe that all fields (NIK, Name, Kelurahan, Kecamatan, Occupation) are populated in the next step.
4. Verify that manual editing still works for any misidentified characters.
