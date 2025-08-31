import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../../firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";

export default function RegistrationScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("user"); // default
  const [orgCode, setOrgCode] = useState("");

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    try {
      // 1. Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      let finalRole = role;

      // 2. If organization → check orgCode
      if (role === "organization") {
        const orgDoc = await getDoc(doc(db, "orgCodes", orgCode));

        if (!orgDoc.exists() || orgDoc.data().used) {
          Alert.alert("Error", "Invalid or already used organization code. Account created, but pending approval.");
          finalRole = "pending_org"; // 🚨 временный статус
        } else {
          // Mark orgCode as used
          await setDoc(doc(db, "orgCodes", orgCode), { ...orgDoc.data(), used: true });

          // Create organization entry
          await setDoc(doc(db, "organizations", orgCode), {
            orgCode,
            orgName: orgDoc.data().orgName || "Unnamed Organization",
            createdAt: new Date(),
            createdBy: user.uid,
          });
        }
      }

      // 3. Save user profile in Firestore (всегда)
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        role: finalRole,
        orgCode: finalRole === "organization" ? orgCode : null,
        createdAt: new Date(),
      });

      console.log("✅ User document created:", user.uid, finalRole);

      Alert.alert("Success", "You are registered now. Please log in.");
      navigation.navigate("Login");

    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Registration</Text>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
      />

      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />

      <TextInput
        placeholder="Confirm Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        style={styles.input}
      />

      {/* Role selector */}
      <Text style={styles.label}>Select Role</Text>
      <Picker
        selectedValue={role}
        onValueChange={(value) => setRole(value)}
        style={styles.input}
      >
        <Picker.Item label="User" value="user" />
        <Picker.Item label="Organization" value="organization" />
      </Picker>

      {/* Organization code input */}
      {role === "organization" && (
        <TextInput
          placeholder="Enter Organization Code"
          value={orgCode}
          onChangeText={setOrgCode}
          style={styles.input}
        />
      )}

      <TouchableOpacity onPress={handleRegister} style={styles.button}>
        <Text style={styles.buttonText}>Submit</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20 },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  label: { marginTop: 10, marginBottom: 5, fontWeight: "600" },
  input: { borderWidth: 1, marginVertical: 10, padding: 10, borderRadius: 5 },
  button: { backgroundColor: "blue", padding: 15, borderRadius: 5, marginTop: 20 },
  buttonText: { color: "white", textAlign: "center", fontWeight: "600" },
});
