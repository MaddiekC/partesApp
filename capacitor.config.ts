import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.partesapi.app',
  appName: 'partesApp',
  webDir: 'www',
  server: {
    // Esto obliga a la app a cargar por http://localhost en lugar de https://
    androidScheme: 'http', 
    cleartext: true
  }
};

export default config;
