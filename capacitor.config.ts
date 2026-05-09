import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.memoryes.app',
  appName: 'memoryes',
  webDir: 'out', // Matches Next.js static export folder
  server: {
    androidScheme: 'https', // Ensures secure context for APIs
    cleartext: true,        // Allows local dev testing
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#FDFCFB", // Matches our pastel background
      showSpinner: false,
      androidScaleType: "CENTER_CROP"
    },
    NativeBiometric: {
      // Custom configuration for biometrics plugin
    }
  }
};

export default config;
