import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.querencialabs.temencasa',
  appName: 'Tem em Casa',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ['google.com'],
    },
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '457700332490-qob2688jdjme3vkgv6og4urqailfapgi.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    },
    FirebaseMessaging: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#1E3A5F',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0F2347',
    },
  },
};

export default config;
