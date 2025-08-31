import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Alert } from "react-native";
import { db } from "../../../firebase";
import { collection, getDocs, doc, setDoc } from "firebase/firestore";

// Simple code generator
function generateOrgCode(length = 8) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export default function AdminPanel() {
  const [codes, setCodes] = useState([]);

  // Load all codes
  const fetchCodes = async () => {
    try {
      const snapshot = await getDocs(collection(db, "orgCodes"));
      const codeList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCodes(codeList);
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  useEffect(() => {
    fetchCodes();
  }, []);

  // Create new organization code
  const createNewCode = async () => {
    try {
      const newCode = generateOrgCode();
      await setDoc(doc(db, "orgCodes", newCode), {
        orgName: "New Organization",
        used: false,
        createdAt: new Date(),
      });
      Alert.alert("Success", `New code generated: ${newCode}`);
      fetchCodes();
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin Panel</Text>

      <TouchableOpacity style={styles.button} onPress={createNewCode}>
        <Text style={styles.buttonText}>Generate New Code</Text>
      </TouchableOpacity>

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
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 20 },
  subtitle: { fontSize: 18, marginTop: 20, marginBottom: 10 },
  button: { backgroundColor: "blue", padding: 15, borderRadius: 8, marginBottom: 20 },
  buttonText: { color: "white", textAlign: "center", fontWeight: "bold" },
  codeItem: { padding: 10, borderBottomWidth: 1, borderColor: "#ccc" },
  codeText: { fontSize: 16 },
});
