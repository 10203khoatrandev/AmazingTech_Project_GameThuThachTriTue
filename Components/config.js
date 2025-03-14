// import { initializeApp } from 'firebase/app';
// import { getFirestore } from 'firebase/firestore';
// import { getAuth } from 'firebase/auth';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/database';

// const firebaseConfig = {
//   apiKey: "AIzaSyD6asKZ9uPJ3XZ45sWnT5I9m2577eZwYT8",
//   authDomain: "applicationquiz-7183e.firebaseapp.com",
//   databaseURL: "https://applicationquiz-7183e-default-rtdb.asia-southeast1.firebasedatabase.app",
//   projectId: "applicationquiz-7183e",
//   storageBucket: "applicationquiz-7183e.firebasestorage.app",
//   messagingSenderId: "985974012184",
//   appId: "1:985974012184:web:1a3d79797c9e1e7ec9c66d",
//   measurementId: "G-FK55671FXP"
// };

const firebaseConfig = {
  apiKey: "AIzaSyCD_sAzgT9hE6VrmwxOlKZegRPH8d9S5qE",
  authDomain: "quizgameapplication-49dc1.firebaseapp.com",
  databaseURL: "https://quizgameapplication-49dc1-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "quizgameapplication-49dc1",
  storageBucket: "quizgameapplication-49dc1.firebasestorage.app",
  messagingSenderId: "175189069348",
  appId: "1:175189069348:web:c533d1b2e028a0420552b1",
  measurementId: "G-9RB4BJS63Z"
};

// const app = initializeApp(firebaseConfig);

// export const db = getFirestore(app);
// export const auth = getAuth(app);

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Lấy các dịch vụ Firebase
export const auth = firebase.auth(); // Firebase Authentication
export const db = firebase.firestore(); // Firestore
export const realtimeDb = firebase.database(); // Realtime Database