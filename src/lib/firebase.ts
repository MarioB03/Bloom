import { initializeApp } from 'firebase/app';
// @ts-ignore -- getReactNativePersistence exists in RN bundle but not in web typings
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: 'AIzaSyBbykJQRJtRnvnvcHZLxbIBqluQlMM5WV4',
  authDomain: 'bloom-57653.firebaseapp.com',
  projectId: 'bloom-57653',
  storageBucket: 'bloom-57653.firebasestorage.app',
  messagingSenderId: '873083945404',
  appId: '1:873083945404:web:ba0aea83ba1e4ce1426bb9',
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const db = getFirestore(app);

export default app;
