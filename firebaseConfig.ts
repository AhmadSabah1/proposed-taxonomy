// firebaseConfig.ts

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBkIgxCZe8qzkWAr1ChV7PiPbeL_4pWQ14",
    authDomain: "taxonomy-final.firebaseapp.com",
    projectId: "taxonomy-final",
    storageBucket: "taxonomy-final.firebasestorage.app",
    messagingSenderId: "461658066003",
    appId: "1:461658066003:web:d39c228c304517a30fcaa6",
    measurementId: "G-F3QFQLH5H4"
};

const app = initializeApp(firebaseConfig);

// Initialize Firestore and export it
const db = getFirestore(app);

export { db };