import React, { useEffect, useState } from "react";
import { View, Text, Alert } from "react-native";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";

import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
} from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import AuthNavigator from "./AuthNavigator";
import UserNavigator from "./UserNavigator";
import ClientNavigator from "./ClientNavigator";
import AdminNavigator from "./AdminNavigator";
import SplashScreen from "../screens/SplashScreen";
import { useTheme } from "../context/ThemeContext";
import { consumeFlash } from "../utils/flash";

const Tab = createBottomTabNavigator();

export default function RootNavigator() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

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
          setUser(null);
          setRole(null);

          const flash = await consumeFlash();
          if (flash?.target === "Registration") {
            setInitialAuthRoute("Registration");
            if (flash.message)
              setTimeout(() => Alert.alert("Success", flash.message), 0);
          } else {
            setInitialAuthRoute("Login");
            if (flash?.message)
              setTimeout(() => Alert.alert("Info", flash.message), 0);
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
      ) : (
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarShowLabel: false, // 🔹 убираем текст под иконками
            tabBarIcon: ({ color, size }) => {
              let iconName;
              if (route.name === "Admin") iconName = "settings";
              else if (route.name === "Client") iconName = "business";
              else if (route.name === "User") iconName = "person";
              else iconName = "alert-circle";
              return <Ionicons name={iconName} size={size} color={color} />;
            },
          })}
        >
          {role === "superadmin" || role === "admin" ? (
            <Tab.Screen name="Admin" component={AdminNavigator} />
          ) : role === "organization" ? (
            <Tab.Screen name="Client" component={ClientNavigator} />
          ) : role === "user" ? (
            <Tab.Screen name="User" component={UserNavigator} />
          ) : (
            <Tab.Screen
              name="Unknown"
              component={() => (
                <View
                  style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Text>⚠️ Unknown role: {role || "none"}</Text>
                </View>
              )}
            />
          )}
        </Tab.Navigator>
      )}
    </NavigationContainer>
  );
}
