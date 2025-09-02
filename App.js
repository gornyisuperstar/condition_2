// App.js
import React, { useEffect, useState } from "react";
import * as SplashScreen from "expo-splash-screen";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemeProvider } from "./app/context/ThemeContext";           // 👈 подключаем провайдер темы
import { AuthProvider } from "./app/navigation/AuthProvider";
import RootNavigator from "./app/navigation/RootNavigator";

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 5000));
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
        await SplashScreen.hideAsync();
      }
    })();
  }, []);

  if (!appIsReady) return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider>       {/* 👈 ОБЯЗАТЕЛЬНО оборачиваем ВСЁ приложение */}
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
