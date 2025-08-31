import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { signOut } from "firebase/auth";
import { auth } from "../../../firebase";

export default function ProfileScreen() {
  const handleLogout = async () => {
    try {
      await signOut(auth);
      Alert.alert("Logged out", "You have been logged out successfully.");
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Profile Screen</Text>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" },
  text: { fontSize: 20, fontWeight: "bold", color: "black", marginBottom: 20 },
  logoutButton: {
    backgroundColor: "red",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  logoutText: { color: "#fff", fontWeight: "bold" },
});

