import { initializeApp } from 'firebase/app';
import {
  initializeAuth,
  // @ts-ignore – react-native persistence export
  getReactNativePersistence,
  browserLocalPersistence,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: 'AIzaSyAXXSLOD5IheoYuonOo2XqjoNLhJCKII3U',
  authDomain: 'swift-logger-f7cf2.firebaseapp.com',
  projectId: 'swift-logger-f7cf2',
  storageBucket: 'swift-logger-f7cf2.firebasestorage.app',
  messagingSenderId: '660725636008',
  appId: '1:660725636008:web:e2d0d592d3fbe8fc9bdb9d',
};

const app = initializeApp(firebaseConfig);

// Use appropriate persistence based on platform
let persistenceConfig;
if (Platform.OS === 'web') {
  persistenceConfig = { persistence: browserLocalPersistence };
} else {
  persistenceConfig = { persistence: getReactNativePersistence(AsyncStorage) };
}

export const auth = initializeAuth(app, persistenceConfig);

export const db = getFirestore(app);
export const storage = getStorage(app);
