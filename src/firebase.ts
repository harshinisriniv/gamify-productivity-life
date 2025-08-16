// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDk_cSTTYVCznYlYZw-RoJm1dCtaVu8m68",
  authDomain: "questy-4e399.firebaseapp.com",
  projectId: "questy-4e399",
  storageBucket: "questy-4e399.firebasestorage.app",
  messagingSenderId: "935694603208",
  appId: "1:935694603208:web:9e6bbbb95d529e6e8466fd",
  measurementId: "G-9ZKX2B9M92"
};


const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
