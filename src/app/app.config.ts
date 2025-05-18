import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';

export const appConfig: ApplicationConfig = {
  providers: [provideZoneChangeDetection({ eventCoalescing: true }), provideRouter(routes), provideFirebaseApp(() => initializeApp({ projectId: "fakeneptun-cccfa", appId: "1:86884816842:web:6edfee815f5dfeea31a133", storageBucket: "fakeneptun-cccfa.firebasestorage.app", apiKey: "AIzaSyDn1ml7NRwq9w1i0A3tS_Z_YyWcMreK5g0", authDomain: "fakeneptun-cccfa.firebaseapp.com", messagingSenderId: "86884816842" })), provideAuth(() => getAuth()), provideFirestore(() => getFirestore())]
};
