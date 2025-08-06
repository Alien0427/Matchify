// lib/firebase-config.js
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "replace with your api key",
  authDomain: "replace with your project domain",
  projectId: "replace with your projectID",
  storageBucket: "replace with your storagebucket",
  messagingSenderId: " ",
  appId: " ",
  measurementId: " "
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db, collection, getDocs };
