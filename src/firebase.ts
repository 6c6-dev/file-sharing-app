// src/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyDSKaR-g1iCrtR-PkWzC7mpTc1SIfbPSvU",

    authDomain: "skjermkontor.firebaseapp.com",
  
    databaseURL: "https://skjermkontor.firebaseio.com",
  
    projectId: "skjermkontor",
  
    storageBucket: "skjermkontor.appspot.com",
  
    messagingSenderId: "209765577162",
  
    appId: "1:209765577162:web:73c84f905d3186a548df33"
  
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);
