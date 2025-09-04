// app/screens/Auth/RegistrationScreen.js
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Picker } from "@react-native-picker/picker";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut,
} from "firebase/auth";
import { auth, db } from "../../../firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useTheme } from "../../context/ThemeContext";

export default function RegistrationScreen({ navigation }) {
  const { appTheme } = useTheme();
  const isDark = appTheme === "dark";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("user"); // default
  const [orgCode, setOrgCode] = useState("");

  const ui = {
    bg: isDark ? "#111" : "#fff",
    text: isDark ? "#fff" : "#111",
    subtext: isDark ? "#9ca3af" : "#6b7280",
    inputBg: isDark ? "#1b1b1b" : "#fafafa",
    border: isDark ? "#2a2a2a" : "#e5e7eb",
    buttonBg: "#007AFF",
    buttonText: "#fff",
    pickerBg: isDark ? "#1b1b1b" : "#fafafa",
    pickerText: isDark ? "#fff" : "#111",
  };

  const handleRegister = async () => {
    if (!email.trim() || !password) {
      Alert.alert("Error", "Email and password are required.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );
      const user = userCredential.user;
      let finalRole = role;

      // USER: стандартный флоу
      if (role === "user") {
        await sendEmailVerification(user);

        // сначала пишем в users
        await setDoc(doc(db, "users", user.uid), {
          email: user.email,
          role: "user",
          createdAt: new Date(),
        });

        Alert.alert(
          "Success",
          "Account created! Please check your email to verify before logging in."
        );

        await signOut(auth);
        navigation.navigate("Login");
        return;
      }

      // ORGANIZATION
      if (role === "organization" || role === "client") {
        if (!orgCode.trim()) {
          Alert.alert("Error", "Organization code is required.");
          return;
        }

        const orgDocRef = doc(db, "orgCodes", orgCode.trim());
        const orgDoc = await getDoc(orgDocRef);

        if (!orgDoc.exists() || orgDoc.data().used) {
          Alert.alert("Error", "Invalid or already used organization code.");
          finalRole = "pending_org";
        } else {
          // 1. сначала сохраняем пользователя
          await setDoc(doc(db, "users", user.uid), {
            email: user.email,
            role: "organization",
            orgCode: orgCode.trim(),
            createdAt: new Date(),
          });

          // 2. создаём организацию
          await setDoc(doc(db, "organizations", user.uid), {
            orgCode: orgCode.trim(),
            orgName: orgDoc.data().orgName || "Unnamed Organization",
            createdAt: new Date(),
            createdBy: user.uid,
            email: user.email,
            phone: "",
            territory: [], // пустой массив
          });

          // 3. помечаем код использованным
          await setDoc(orgDocRef, {
            ...orgDoc.data(),
            used: true,
            updatedAt: new Date(),
          });

          finalRole = "organization";
        }
      }

      Alert.alert("Success", "You are registered now. Please log in.");
      navigation.navigate("Login");
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  return (
    <SafeAreaView edges={["top"]} style={[styles.safe, { backgroundColor: ui.bg }]}>
      <View style={[styles.container, { backgroundColor: ui.bg }]}>
        <Text style={[styles.title, { color: ui.text }]}>Registration</Text>

        <TextInput
          placeholder="Email"
          placeholderTextColor={ui.subtext}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          style={[
            styles.input,
            { backgroundColor: ui.inputBg, borderColor: ui.border, color: ui.text },
          ]}
        />

        <TextInput
          placeholder="Password"
          placeholderTextColor={ui.subtext}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={[
            styles.input,
            { backgroundColor: ui.inputBg, borderColor: ui.border, color: ui.text },
          ]}
        />

        <TextInput
          placeholder="Confirm Password"
          placeholderTextColor={ui.subtext}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          style={[
            styles.input,
            { backgroundColor: ui.inputBg, borderColor: ui.border, color: ui.text },
          ]}
        />

        <Text style={[styles.label, { color: ui.text }]}>Select Role</Text>

        <View
          style={[
            styles.pickerBox,
            { backgroundColor: ui.pickerBg, borderColor: ui.border },
          ]}
        >
          <Picker
            selectedValue={role}
            onValueChange={(value) => setRole(value)}
            mode={Platform.OS === "ios" ? "dialog" : "dropdown"}
            style={{ color: ui.pickerText }}
            dropdownIconColor={ui.pickerText}
            itemStyle={Platform.OS === "ios" ? { color: ui.pickerText } : undefined}
          >
            <Picker.Item label="User" value="user" color={ui.pickerText} />
            <Picker.Item label="Organization" value="organization" color={ui.pickerText} />
          </Picker>
        </View>

        {role === "organization" && (
          <TextInput
            placeholder="Enter Organization Code"
            placeholderTextColor={ui.subtext}
            value={orgCode}
            onChangeText={setOrgCode}
            autoCapitalize="characters"
            style={[
              styles.input,
              { backgroundColor: ui.inputBg, borderColor: ui.border, color: ui.text },
            ]}
          />
        )}

        <TouchableOpacity
          onPress={handleRegister}
          style={[styles.button, { backgroundColor: ui.buttonBg }]}
        >
          <Text style={[styles.buttonText, { color: ui.buttonText }]}>Submit</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, justifyContent: "center", padding: 20 },
  title: { fontSize: 22, fontWeight: "800", marginBottom: 20, textAlign: "center" },
  label: { marginTop: 10, marginBottom: 6, fontWeight: "600" },
  input: {
    borderWidth: 1,
    marginVertical: 10,
    padding: 12,
    borderRadius: 12,
    fontSize: 16,
  },
  pickerBox: {
    borderWidth: 1,
    borderRadius: 12,
    marginVertical: 10,
    overflow: "hidden",
  },
  button: {
    padding: 15,
    borderRadius: 12,
    marginTop: 16,
    alignItems: "center",
  },
  buttonText: { fontWeight: "700", fontSize: 16 },
});
