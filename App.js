import React, { useEffect, useState } from "react";
import * as SplashScreen from "expo-splash-screen";
import { AuthProvider } from "./app/navigation/AuthProvider";
import RootNavigator from "./app/navigation/RootNavigator";

// Не скрывать splash автоматически
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Имитация загрузки данных (например, шрифтов/ассетов)
        await new Promise(resolve => setTimeout(resolve, 2000)); // ✅ фиксированная задержка 2с
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
        await SplashScreen.hideAsync(); // ✅ убираем splash вручную
      }
    }

    prepare();
  }, []);

  if (!appIsReady) {
    return null; // Пока splash показывается
  }

  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}

