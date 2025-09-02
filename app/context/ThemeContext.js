// app/context/ThemeContext.js
import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ThemeContext = createContext(undefined);

const APP_THEME_KEY = "issueRadar:appTheme";
const MAP_THEME_KEY = "issueRadar:mapTheme";

export function ThemeProvider({ children }) {
  const [appTheme, setAppThemeState] = useState("light"); // "light" | "dark"
  const [mapTheme, setMapThemeState] = useState("light"); // "light" | "dark"
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [storedApp, storedMap] = await Promise.all([
          AsyncStorage.getItem(APP_THEME_KEY),
          AsyncStorage.getItem(MAP_THEME_KEY),
        ]);
        if (storedApp === "light" || storedApp === "dark") setAppThemeState(storedApp);
        if (storedMap === "light" || storedMap === "dark") setMapThemeState(storedMap);
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  const setAppTheme = async (val) => {
    setAppThemeState(val);
    try { await AsyncStorage.setItem(APP_THEME_KEY, val); } catch {}
  };
  const setMapTheme = async (val) => {
    setMapThemeState(val);
    try { await AsyncStorage.setItem(MAP_THEME_KEY, val); } catch {}
  };

  const value = useMemo(
    () => ({ appTheme, setAppTheme, mapTheme, setMapTheme, hydrated }),
    [appTheme, mapTheme, hydrated]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  // чтобы явно видеть ошибку конфигурации, если забыли провайдер
  if (!ctx) {
    throw new Error("useTheme() must be used within <ThemeProvider />");
  }
  return ctx;
}
