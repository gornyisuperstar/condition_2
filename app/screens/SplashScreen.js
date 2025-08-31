import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/issue-radar-logo.png")}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.title}>
        <Text style={styles.issue}>issue</Text>
        <Text> </Text>
        <Text style={styles.radar}>Radar</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" },
  logo: { width: 180, height: 180, marginBottom: 20 },
  title: { fontSize: 36, letterSpacing: 0.5 },
  issue: { color: "#E53935", fontWeight: "800" }, // красным
  radar: { fontStyle: "italic", color: "#111" },  // курсивом
});
