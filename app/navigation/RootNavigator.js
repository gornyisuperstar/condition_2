import React, { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";

import { NavigationContainer, DefaultTheme, DarkTheme } from "@react-navigation/native";
import AuthNavigator from "./AuthNavigator";
import UserNavigator from "./UserNavigator";
import ClientNavigator from "./ClientNavigator";
import AdminNavigator from "./AdminNavigator";
import SplashScreen from "../screens/SplashScreen";
import { useTheme } from "../context/ThemeContext";

export default function RootNavigator() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const { appTheme } = useTheme();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          setUser(firebaseUser);
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          if (userDoc.exists()) {
            setRole(userDoc.data().role);
          } else {
            console.log("⚠️ No user document found for:", firebaseUser.uid);
          }
        } else {
          setUser(null);
          setRole(null);
        }
      } catch (error) {
        console.log("🔥 Error while fetching user role:", error.message);
      } finally {
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  if (loading) return <SplashScreen />;

  return (
    <NavigationContainer theme={appTheme === "dark" ? DarkTheme : DefaultTheme}>
      {!user ? (
        <AuthNavigator />
      ) : role === "superadmin" || role === "admin" ? (
        <AdminNavigator />
      ) : role === "organization" ? (
        <ClientNavigator />
      ) : role === "user" ? (
        <UserNavigator />
      ) : (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text>⚠️ Unknown role: {role}</Text>
        </View>
      )}
    </NavigationContainer>
  );
}
