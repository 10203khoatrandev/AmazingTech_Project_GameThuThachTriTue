import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyD6asKZ9uPJ3XZ45sWnT5I9m2577eZwYT8",
  authDomain: "applicationquiz-7183e.firebaseapp.com",
  databaseURL: "https://applicationquiz-7183e-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "applicationquiz-7183e",
  storageBucket: "applicationquiz-7183e.appspot.com",
  messagingSenderId: "985974012184",
  appId: "1:985974012184:web:1a3d79797c9e1e7ec9c66d",
  measurementId: "G-FK55671FXP"
};

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);

// Khởi tạo Firestore
export const db = getFirestore(app);

// Khởi tạo Realtime Database
export const realtimeDb = getDatabase(app);

// Khởi tạo Auth với AsyncStorage
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});