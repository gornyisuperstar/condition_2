// app/screens/User/TicketFormScreen.js
import React, { useState } from "react";
import {
  View, Text, ScrollView, TextInput, TouchableOpacity, Image,
  StyleSheet, Platform, Alert, Keyboard,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../../../firebase";
import { useTheme } from "../../context/ThemeContext";
import { uploadImageFromBase64 } from "../../utils/uploadImage";

export default function TicketFormScreen({ route, navigation }) {
  const { appTheme } = useTheme();
  const isDark = appTheme === "dark";

  const pin = route.params?.pin; // { latitude, longitude }
  const [imageUri, setImageUri] = useState(route.params?.imageUri || null);
  const [imageBase64, setImageBase64] = useState(route.params?.imageBase64 || null);
  const [imageMime, setImageMime] = useState(route.params?.imageMime || "jpg");
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const pickMore = async () => {
    const p = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (p.status !== "granted") return;
    const res = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, quality: 0.85, base64: true });
    if (!res.canceled && res.assets?.[0]) {
      const a = res.assets[0];
      setImageUri(a.uri);
      setImageBase64(a.base64 || null);
      setImageMime((a.type && a.type.startsWith("image/")) ? a.type : "jpg");
    }
  };

  const takeMore = async () => {
    const p = await ImagePicker.requestCameraPermissionsAsync();
    if (p.status !== "granted") return;
    const res = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.85, base64: true });
    if (!res.canceled && res.assets?.[0]) {
      const a = res.assets[0];
      setImageUri(a.uri);
      setImageBase64(a.base64 || null);
      setImageMime((a.type && a.type.startsWith("image/")) ? a.type : "jpg");
    }
  };

  const createTicket = async () => {
    Keyboard.dismiss();

    if (!pin) {
      Alert.alert("Error", "Please go back and drop a pin on the map");
      return;
    }
    if (!description.trim()) {
      Alert.alert("Error", "Description is required");
      return;
    }
    if (!auth.currentUser?.uid) {
      Alert.alert("Error", "Please log in first.");
      return;
    }

    try {
      setIsSaving(true);

      let imageUrl = null;
      if (imageBase64) {
        imageUrl = await uploadImageFromBase64(imageBase64, imageMime);
      }

      await addDoc(collection(db, "tickets"), {
        description: description.trim(),
        latitude: pin.latitude,
        longitude: pin.longitude,
        imageUrl,
        status: "new",
        createdAt: serverTimestamp(),
        createdBy: auth.currentUser.uid,
      });

      Alert.alert("Success", "Ticket created!");
      navigation.popToTop();
      navigation.getParent()?.navigate("Create");
    } catch (e) {
      Alert.alert("Upload error", e?.message || String(e));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: isDark ? "#111" : "#fff" }]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={[styles.title, { color: isDark ? "#fff" : "#111" }]}>Create Ticket</Text>

        <Text style={{ marginBottom: 8, color: isDark ? "#9ca3af" : "#6b7280" }}>
          Lat: {pin?.latitude?.toFixed(6)}   |   Lng: {pin?.longitude?.toFixed(6)}
        </Text>

        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.photo} />
        ) : (
          <View style={[styles.photoPlaceholder, { borderColor: isDark ? "#2a2a2a" : "#e5e7eb" }]}>
            <Text style={{ color: isDark ? "#8b8b8b" : "#666" }}>No photo</Text>
          </View>
        )}

        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.btn, styles.btnGhost, { borderColor: isDark ? "#2a2a2a" : "#d1d5db" }]}
            onPress={takeMore}
            disabled={isSaving}
          >
            <Text style={{ color: isDark ? "#fff" : "#111" }}>Take photo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn, styles.btnGhost, { borderColor: isDark ? "#2a2a2a" : "#d1d5db" }]}
            onPress={pickMore}
            disabled={isSaving}
          >
            <Text style={{ color: isDark ? "#fff" : "#111" }}>Choose from library</Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={[
            styles.input,
            {
              color: isDark ? "#fff" : "#111",
              backgroundColor: isDark ? "#141414" : "#fafafa",
              borderColor: isDark ? "#2a2a2a" : "#e5e7eb",
            },
          ]}
          placeholder="Describe the issue (required)"
          placeholderTextColor={isDark ? "#9ca3af" : "#6b7280"}
          multiline
          value={description}
          onChangeText={setDescription}
          returnKeyType="done"
          blurOnSubmit
          editable={!isSaving}
        />

        <TouchableOpacity
          style={[styles.btn, styles.btnPrimary, isSaving && { opacity: 0.6 }]}
          onPress={createTicket}
          disabled={isSaving}
        >
          <Text style={styles.btnPrimaryText}>{isSaving ? "Saving..." : "Create Ticket"}</Text>
        </TouchableOpacity>

        {imageUri ? (
          <TouchableOpacity
            style={[styles.btn, styles.btnGhost, { marginTop: 8, borderColor: isDark ? "#2a2a2a" : "#d1d5db" }]}
            onPress={() => { setImageUri(null); setImageBase64(null); }}
            disabled={isSaving}
          >
            <Text style={{ color: isDark ? "#fff" : "#111" }}>Remove photo</Text>
          </TouchableOpacity>
        ) : null}

        <View style={{ height: Platform.OS === "ios" ? 24 : 12 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: 16 },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 8 },
  photo: { width: 140, height: 140, borderRadius: 12, alignSelf: "center", marginBottom: 12 },
  photoPlaceholder: {
    width: 140, height: 140, alignSelf: "center", marginBottom: 12,
    borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center",
  },
  row: { flexDirection: "row", gap: 10, marginBottom: 12, justifyContent: "space-between" },
  input: {
    minHeight: 110, borderWidth: 1, borderRadius: 12, padding: 12,
    textAlignVertical: "top", marginBottom: 12,
  },
  btn: { paddingVertical: 14, borderRadius: 12, alignItems: "center", borderWidth: 1, flex: 1 },
  btnPrimary: { backgroundColor: "#007AFF", borderColor: "#007AFF" },
  btnPrimaryText: { color: "#fff", fontWeight: "700" },
  btnGhost: { backgroundColor: "transparent" },
});
