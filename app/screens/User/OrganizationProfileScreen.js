import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Switch,
  Linking,
  ActivityIndicator,
} from "react-native";
import { auth, db } from "../../../firebase";
import { doc, getDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useTheme } from "../../context/ThemeContext";

export default function OrganizationProfileScreen({ navigation }) {
  const { appTheme, setAppTheme } = useTheme();
  const isDark = appTheme === "dark";
  const [org, setOrg] = useState(null);
  const [loading, setLoading] = useState(true);

  const ui = {
    bg: isDark ? "#111" : "#fff",
    text: isDark ? "#fff" : "#111",
    subtext: isDark ? "#9ca3af" : "#6b7280",
    buttonBg: "#007AFF",
    buttonText: "#fff",
  };

  useEffect(() => {
    const loadOrg = async () => {
      try {
        const orgRef = doc(db, "organizations", auth.currentUser.uid);
        const snap = await getDoc(orgRef);
        if (snap.exists()) {
          setOrg(snap.data());
        } else {
          console.warn("No organization profile found for:", auth.currentUser.uid);
        }
      } catch (e) {
        console.error("Error loading org profile:", e);
        Alert.alert("Error", "Could not load organization profile.");
      } finally {
        setLoading(false);
      }
    };
    loadOrg();
  }, []);

    const handleLogout = async () => {
        try {
        await signOut(auth); // 👈 этого достаточно
    } catch (e) {
    Alert.alert("Error", e.message);
    }
    };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: ui.bg }]}>
        <ActivityIndicator size="large" color={ui.text} />
      </View>
    );
  }

  if (!org) {
    return (
      <View style={[styles.center, { backgroundColor: ui.bg }]}>
        <Text style={{ color: ui.text }}>No organization data</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: ui.bg }]}>
      <Text style={[styles.title, { color: ui.text }]}>
        Good day, <Text style={styles.orgName}>{org.orgName}</Text>
      </Text>
      <Text style={[styles.info, { color: ui.text }]}>Email: {org.email}</Text>
      <Text style={[styles.info, { color: ui.text }]}>Phone: {org.phone}</Text>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: ui.buttonBg }]}
        onPress={() => Linking.openURL("mailto:issueradar_support@gmail.com")}
      >
        <Text style={[styles.buttonText, { color: ui.buttonText }]}>
          Email Support
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: ui.buttonBg }]}
        onPress={() => Linking.openURL("tel:+12047777777")}
      >
        <Text style={[styles.buttonText, { color: ui.buttonText }]}>
          Call Support
        </Text>
      </TouchableOpacity>

      <View style={styles.switchRow}>
        <Text style={[styles.info, { color: ui.text }]}>Dark Mode</Text>
        <Switch
          value={isDark}
          onValueChange={(val) => setAppTheme(val ? "dark" : "light")}
        />
      </View>

      <TouchableOpacity
        style={[styles.logoutButton, { backgroundColor: "red" }]}
        onPress={handleLogout}
      >
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 20 },
  orgName: { color: "#007AFF" },
  info: { fontSize: 16, marginBottom: 10 },
  button: {
    padding: 15,
    borderRadius: 12,
    marginTop: 10,
    alignItems: "center",
  },
  buttonText: { fontWeight: "600" },
  logoutButton: {
    padding: 15,
    borderRadius: 12,
    marginTop: 20,
    alignItems: "center",
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
  },
});
