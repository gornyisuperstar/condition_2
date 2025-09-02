import React, { useEffect, useState } from "react";
import { View, Text, Alert } from "react-native";
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
import { consumeFlash } from "../utils/flash"; 

export default function RootNavigator() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // куда по умолчанию заходить в авторизационном стеке
  const [initialAuthRoute, setInitialAuthRoute] = useState("Login");

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
            setRole(null);
          }
        } else {
          // Пользователь вышел/удалён
          setUser(null);
          setRole(null);

          // 👇 читаем одноразовое сообщение и целевой экран
          const flash = await consumeFlash();
          if (flash?.target === "Registration") {
            setInitialAuthRoute("Registration");
            if (flash.message) setTimeout(() => Alert.alert("Success", flash.message), 0);
          } else {
            setInitialAuthRoute("Login");
            if (flash?.message) setTimeout(() => Alert.alert("Info", flash.message), 0);
          }
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
        <AuthNavigator initialRouteName={initialAuthRoute} /> 
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
