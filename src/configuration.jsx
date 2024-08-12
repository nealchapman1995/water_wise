// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
//import { getAnalytics } from "firebase/analytics";
import { getDatabase } from "firebase/database";  // Import other services as needed
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services as needed
//const analytics = getAnalytics(app);
const database = getDatabase(app);  // Initialize Realtime Database
const auth = getAuth(app);

setPersistence(auth, browserLocalPersistence)
  .then(() => {
    // Persistence is set; now you can handle sign-in or sign-out
  })
  .catch((error) => {
    console.error("Error setting persistence:", error);
  });

// Optionally, export the initialized Firebase app if you need it elsewhere
export { app, database, auth };
