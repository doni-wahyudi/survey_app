# SurveyKu

A mobile-first survey and data collection application built with React, TypeScript, Capacitor, and Supabase.

## 📖 Documentation
For a detailed technical overview of the codebase, architecture, and features, please refer to:
**[CODEBASE_DOCUMENTATION.md](./CODEBASE_DOCUMENTATION.md)**

## 🚀 Quick Start
1. Clone the repository.
2. Install dependencies: `npm install`.
3. Create a `.env` file with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_url
   VITE_SUPABASE_ANON_KEY=your_key
   ```
4. Start the development server: `npm run dev`.

## 📱 Mobile Support
This app uses Capacitor. To run on Android or iOS:
1. `npm run build`
2. `npx cap sync`
3. `npx cap open android` or `npx cap open ios`
