// firebase.js
import { initializeApp } from "firebase/app";
import {  
      initializeAuth,
      getReactNativePersistence 
    } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
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

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});

export const db = getFirestore(app);

