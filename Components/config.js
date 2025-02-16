import firebase from 'firebase/compat/app';
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyD6asKZ9uPJ3XZ45sWnT5I9m2577eZwYT8",
  authDomain: "applicationquiz-7183e.firebaseapp.com",
  projectId: "applicationquiz-7183e",
  storageBucket: "applicationquiz-7183e.firebasestorage.app",
  messagingSenderId: "985974012184",
  appId: "1:985974012184:web:1a3d79797c9e1e7ec9c66d",
  measurementId: "G-FK55671FXP"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);