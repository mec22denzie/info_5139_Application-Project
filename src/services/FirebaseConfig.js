//Firebase configuration
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";


// Web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAVrt-W6i1Am4Lu0xJJ_3GMqaPVLg-b9eQ",
  authDomain: "project-22aaa.firebaseapp.com",
  projectId: "project-22aaa",
  storageBucket: "project-22aaa.firebasestorage.app",
  messagingSenderId: "532063907345",
  appId: "1:532063907345:web:5394b84591064aad038bb0",
  measurementId: "G-DHY9E07Z7V"
};


// Initialize Firebase
let app;
try {
  app = initializeApp(firebaseConfig);
  console.log("Firebase initialized successfully");
} catch (error) {
  console.error("Error initializing Firebase:", error);
}

//export the services
let auth, db, firestore;
try {
  auth = getAuth(app);
  db = getDatabase(app);
  firestore = getFirestore(app);
  console.log("Firebase services initialized successfully");
} catch (error) {
  console.error("Error initializing Firebase services:", error);
}

export { auth, db, firestore };