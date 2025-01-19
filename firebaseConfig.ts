// firebaseConfig.ts

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAcczsMvhHQUQsCH6BhSTSRQHcAARilBb4",
    authDomain: "taxonomy-creator.firebaseapp.com",
    projectId: "taxonomy-creator",
    storageBucket: "taxonomy-creator.firebasestorage.app",
    messagingSenderId: "980632102895", // Replace with your actual Messaging Sender ID
    appId: "1:980632102895:web:3bd7173e0d4e14137d381a",              // Replace with your actual App ID
    measurementId: "G-7XXZD7BWN5" // Replace with your actual Measurement ID
};

const app = initializeApp(firebaseConfig);

// Initialize Firestore and export it
const db = getFirestore(app);

export { db };