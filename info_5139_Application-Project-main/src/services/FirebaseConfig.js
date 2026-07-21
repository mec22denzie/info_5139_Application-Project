// Firebase configuration
import { initializeApp, getApp, getApps } from "firebase/app";
import { initializeAuth, getAuth, getReactNativePersistence } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyCjvBYAMcoTFGkMIOPWL5QqFt5GCYQQvDs",
  authDomain: "info5139-falconshop.firebaseapp.com",
  projectId: "info5139-falconshop",
  storageBucket: "info5139-falconshop.firebasestorage.app",
  messagingSenderId: "797759027695",
  appId: "1:797759027695:web:ae555755c1fbb57cb1de1a",
  measurementId: "G-Y1T0SG7NWK"
};


// Prevent duplicate initialization during hot reload
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Export the services
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (error) {
  auth = getAuth(app);
}
const db = getDatabase(app);
const firestore = getFirestore(app);
const storage = getStorage(app);

export { auth, db, firestore, storage };
