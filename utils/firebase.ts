import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAnalytics } from 'firebase/analytics';
import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import {
  getFirestore,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getPerformance } from 'firebase/performance';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.EXPO_PUBLIC_DATABASE_URL,
  projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_APP_ID,
};

const firebase = initializeApp(firebaseConfig);

const auth = initializeAuth(firebase, {
  persistence: getReactNativePersistence(AsyncStorage),
});

const firestore = getFirestore(firebase);

let analytics;
let performance;
if (typeof window !== 'undefined' && window.Promise) {
  analytics = getAnalytics(firebase);
  performance = getPerformance(firebase);
} else {
  console.log('Firebase Performance ou Analytics désactivé dans cet environnement');
}
const storage = getStorage(firebase);
const functions = getFunctions(firebase);
const database = getDatabase(firebase);

export default firebase;
export { auth, firestore, analytics, storage, functions, database, performance };
