import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.surveyku.app',
    appName: 'SurveyKu',
    webDir: 'dist',
    server: {
        androidScheme: 'https'
    },
    plugins: {
        SplashScreen: {
            launchShowDuration: 2000,
            backgroundColor: '#FFF8F0',
            showSpinner: false
        },
        Camera: {
            quality: 80,
            allowEditing: false,
            resultType: 'base64'
        }
    }
};

export default config;
