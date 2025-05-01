import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBI2QcXtqvPbKOAn-TUBw2mSmDU9C0y1Bo",
    authDomain: "capstone-ancestree.firebaseapp.com",
    projectId: "capstone-ancestree",
    storageBucket: "capstone-ancestree.firebasestorage.app",
    messagingSenderId: "811410228975",
    appId: "1:811410228975:web:5b0755757bd87605267d1a"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
