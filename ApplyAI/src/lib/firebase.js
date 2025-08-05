import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAzG-Mp85gJzBnQoAzxck774t9LB4EY18k",
  authDomain: "applyai-3f11d.firebaseapp.com",
  projectId: "applyai-3f11d",
  storageBucket: "applyai-3f11d.firebasestorage.app",
  messagingSenderId: "211627308491",
  appId: "1:211627308491:web:02da3d2a95e8323b23324e",
  measurementId: "G-7MV0MT3VD5"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth }; 