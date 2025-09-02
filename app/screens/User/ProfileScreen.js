// app/screens/User/ProfileScreen.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../context/ThemeContext";
import { auth, db } from "../../../firebase";
import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { signOut, deleteUser } from "firebase/auth";
import { setFlash } from "../../utils/flash"; // 👈 ДОБАВЛЕНО: импорт flash-утилиты

export default function ProfileScreen() {
  const { appTheme, setAppTheme, mapTheme, setMapTheme } = useTheme();
  const isDark = appTheme === "dark";

  const [nickname, setNickname] = useState("");
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const theme = {
    bg: isDark ? "#111" : "#fff",
    text: isDark ? "#fff" : "#111",
    subText: isDark ? "#9caeaf" : "#6b7280",
    inputBg: isDark ? "#1b1b1b" : "#fafafa",
    border: isDark ? "#2a2a2a" : "#e5e7eb",
    btnBg: isDark ? "#333" : "#111",
    btnText: "#fff",
    card: isDark ? "#1b1b1b" : "#f9f9f9",
    danger: "#E53935",
  };

  // Load user's nickname from Firestore
  useEffect(() => {
    (async () => {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) return;
        const ref = doc(db, "users", uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          if (data.nickname) setNickname(String(data.nickname));
        }
      } catch (e) {
        console.log("load profile:", e.message);
      }
    })();
  }, []);

  const validateNickname = (name) => {
    const trimmed = name.trim();
    if (trimmed.length < 3 || trimmed.length > 30) {
      return "Nickname must be between 3 and 30 characters.";
    }
    // letters / numbers / spaces / _ / -
    if (!/^[\p{L}\p{N}_\-\s]+$/u.test(trimmed)) {
      return "Allowed: letters, numbers, spaces, '-', '_'.";
    }
    return null;
  };

  const saveProfile = async () => {
    const err = validateNickname(nickname);
    if (err) {
      Alert.alert("Error", err);
      return;
    }
    try {
      setLoading(true);
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error("Unable to identify the user.");
      await updateDoc(doc(db, "users", uid), { nickname: nickname.trim() });
      setEditing(false);
      Alert.alert("Success", "All changes are saved.");
    } catch (e) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  const renderThemeButton = (label, value, current, setValue) => {
    const active = current === value;
    return (
      <TouchableOpacity
        onPress={() => setValue(value)}
        style={[
          styles.optionButton,
          {
            backgroundColor: active ? theme.btnBg : theme.card,
            borderColor: active ? theme.btnBg : theme.border,
          },
        ]}
      >
        <Text style={{ color: active ? theme.btnText : theme.text }}>{label}</Text>
      </TouchableOpacity>
    );
  };

  const handleLogout = async () => {
    try {
      setLoading(true);
      await signOut(auth);
      // RootNavigator сам вернёт в Auth, можно также (необязательно) добавить flash:
      // await setFlash({ target: "Login", message: "You have logged out." });
    } catch (e) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      "Delete account",
      "Are you sure you want to delete your account? This action cannot be undone.",
      [
        { text: "No", style: "cancel" },
        { text: "Yes", style: "destructive", onPress: deleteAccount },
      ]
    );
  };

  const deleteAccount = async () => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      setLoading(true);

      // 1) Delete user's tickets (if rules permit)
      const q = query(collection(db, "tickets"), where("createdBy", "==", user.uid));
      const snap = await getDocs(q);
      await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));

      // 2) Delete user profile doc
      await deleteDoc(doc(db, "users", user.uid));

      // 👇 ДОБАВЛЕНО: устанавливаем одноразовый flash, который прочитает RootNavigator
      await setFlash({
        target: "Registration",
        message: "Your account has been deleted.",
      });

      // 3) Delete auth user (may require recent login)
      await deleteUser(user);

      // onAuthStateChanged в RootNavigator отработает,
      // прочитает flash и откроет Registration + покажет Alert.
    } catch (e) {
      if (e?.code === "auth/requires-recent-login") {
        Alert.alert(
          "Sign in required",
          "For security reasons, please sign in again and then retry deleting your account."
        );
      } else {
        Alert.alert("Error", e.message || "Unable to delete the account.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      <ScrollView
        contentContainerStyle={[styles.container, { backgroundColor: theme.bg }]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.header, { color: theme.text }]}>Profile</Text>

        {/* Nickname */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Username</Text>

          {nickname && !editing ? (
            <View style={styles.nicknameRow}>
              <Text style={[styles.nickname, { color: theme.text }]}>{nickname}</Text>
              <TouchableOpacity onPress={() => setEditing(true)}>
                <Text style={{ color: theme.subText }}>Change your name</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text },
                ]}
                placeholder="Enter your nickname"
                placeholderTextColor={theme.subText}
                value={nickname}
                onChangeText={setNickname}
                returnKeyType="done"
                blurOnSubmit
              />
              <TouchableOpacity style={[styles.button, { backgroundColor: theme.btnBg }]} onPress={saveProfile}>
                <Text style={[styles.buttonText, { color: theme.btnText }]}>Save</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* App theme */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>App theme</Text>
          <View style={styles.row}>
            {renderThemeButton("Light", "light", appTheme, setAppTheme)}
            {renderThemeButton("Dark", "dark", appTheme, setAppTheme)}
          </View>
        </View>

        {/* Map theme */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Map theme</Text>
          <View style={styles.row}>
            {renderThemeButton("Light", "light", mapTheme, setMapTheme)}
            {renderThemeButton("Dark", "dark", mapTheme, setMapTheme)}
          </View>
        </View>

        {/* Actions */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <TouchableOpacity style={[styles.button, { backgroundColor: theme.btnBg }]} onPress={handleLogout}>
            <Text style={[styles.buttonText, { color: theme.btnText }]}>Log out</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={confirmDelete} style={{ marginTop: 12, alignSelf: "center" }}>
            <Text style={{ color: theme.danger, fontSize: 13 }}>Delete account</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: Platform.OS === "ios" ? 8 : 4 }} />
      </ScrollView>

      {loading && (
        <View style={styles.loaderOverlay}>
          <ActivityIndicator color="#fff" />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { padding: 16, flexGrow: 1 },
  header: { fontSize: 28, fontWeight: "700", marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: "600", marginBottom: 10 },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },
  nicknameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
  },
  nickname: { fontSize: 20, fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    marginBottom: 10,
  },
  row: { flexDirection: "row", gap: 10 },
  optionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  button: {
    marginTop: 6,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: { fontWeight: "600", fontSize: 16 },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
});
