import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';

import { app } from './firebase';

let auth = null;

if (app) {
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (error) {
    // O Fast Refresh pode reencontrar uma instância já inicializada.
    if (error.code !== 'auth/already-initialized') {
      throw error;
    }
    auth = getAuth(app);
  }
}

export { auth };
