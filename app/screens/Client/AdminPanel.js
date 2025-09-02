import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { collection, getDocs, doc, setDoc } from "firebase/firestore";
import { db } from "../../../firebase";
import { useAuth } from "../../navigation/AuthProvider";

function generateOrgCode(length = 8) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export default function AdminPanel() {
  const { user, loading } = useAuth();
  const [codes, setCodes] = useState([]);
  const [busy, setBusy] = useState(false);

  const fetchCodes = async () => {
    try {
      setBusy(true);
      const snapshot = await getDocs(collection(db, "orgCodes"));
      setCodes(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (e) {
      Alert.alert("Error", e.message);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!loading && user) fetchCodes();
  }, [loading, user]);

  const createNewCode = async () => {
    try {
      setBusy(true);
      const newCode = generateOrgCode();
      await setDoc(doc(db, "orgCodes", newCode), {
        orgName: "New Organization",
        used: false,
        createdAt: new Date(),
        createdBy: user?.uid || null,
      });
      fetchCodes();
    } catch (e) {
      Alert.alert("Error", e.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin Panel</Text>

      <TouchableOpacity style={styles.button} onPress={createNewCode} disabled={busy}>
        <Text style={styles.buttonText}>Generate New Code</Text>
      </TouchableOpacity>

      {busy ? <ActivityIndicator style={{ marginVertical: 10 }} /> : null}

      <Text style={styles.subtitle}>Existing Organization Codes:</Text>
      <FlatList
        data={codes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.codeItem}>
            <Text style={styles.codeText}>
              {item.id} → {item.orgName} | {item.used ? "Used" : "Available"}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 20 },
  subtitle: { fontSize: 18, marginTop: 20, marginBottom: 10 },
  button: { backgroundColor: "blue", padding: 15, borderRadius: 8, marginBottom: 20 },
  buttonText: { color: "white", textAlign: "center", fontWeight: "bold" },
  codeItem: { padding: 10, borderBottomWidth: 1, borderColor: "#ccc" },
  codeText: { fontSize: 16 },
});
