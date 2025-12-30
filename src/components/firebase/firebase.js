// Import the functions you need from the SDKs
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAuxYxZ6q1FQ8JEBPEIawtlgn8QDEZ1le8",
  authDomain: "task-planner-96f8a.firebaseapp.com",
  projectId: "task-planner-96f8a",
  storageBucket: "task-planner-96f8a.appspot.com",
  messagingSenderId: "473539062878",
  appId: "1:473539062878:web:2261c3c14694c6344ed8cf"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);
