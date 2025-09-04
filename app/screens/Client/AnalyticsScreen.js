import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../../context/ThemeContext";

export default function AnalyticsScreen() {
  const { appTheme } = useTheme();
  const isDark = appTheme === "dark";

  const ui = {
    bg: isDark ? "#111" : "#fff",
    text: isDark ? "#fff" : "#111",
    subtext: isDark ? "#9ca3af" : "#6b7280",
  };

  return (
    <View style={[styles.container, { backgroundColor: ui.bg }]}>
      <Text style={[styles.text, { color: ui.text }]}>
        Analytics – In development
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  text: { fontSize: 18, fontWeight: "600" },
});
