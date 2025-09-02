// firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  initializeAuth,
  getReactNativePersistence,
  getAuth
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyAJ7qdXOppnyCZu4FLNzzu0jAzYyRsTRPw",
  authDomain: "issueradar-28a54.firebaseapp.com",
  projectId: "issueradar-28a54",
  storageBucket: "issueradar-28a54.appspot.com",
  messagingSenderId: "412754000606",
  appId: "1:412754000606:web:f9c5bbdb0e39291c52604f",
  measurementId: "G-FXNK2NX1RC"
};

// ✅ App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// ✅ Auth (один раз инициализируем)
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage),
  });
} catch (e) {
  auth = getAuth(app); // если уже инициализирован
}

export { auth };
export const db = getFirestore(app);
export const storage = getStorage(app);
