import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Platform,
  Alert,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { addDoc, collection, getDocs, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../../../firebase";
import { useTheme } from "../../context/ThemeContext";
import { uploadImage } from "../../utils/uploadImage";
import { isPointInPolygon } from "../../utils/geo";

export default function TicketFormScreen({ route, navigation }) {
  const { appTheme } = useTheme();
  const isDark = appTheme === "dark";

  const pin = route.params?.pin;

  // ✅ если фото передано с предыдущего экрана, берём его
  const [imageUri, setImageUri] = useState(route.params?.imageUri || null);
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const pickMore = async () => {
    const p = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (p.status !== "granted") return;
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaType.image,
      allowsEditing: true,
      quality: 0.85,
    });
    if (!res.canceled && res.assets?.[0]) setImageUri(res.assets[0].uri);
  };

  const takeMore = async () => {
    const p = await ImagePicker.requestCameraPermissionsAsync();
    if (p.status !== "granted") return;
    const res = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.85,
    });
    if (!res.canceled && res.assets?.[0]) setImageUri(res.assets[0].uri);
  };

  const createTicket = async () => {
    Keyboard.dismiss();
    if (!pin) return Alert.alert("Error", "Please go back and drop a pin on the map");
    if (!description.trim()) return Alert.alert("Error", "Description is required");
    if (!auth.currentUser?.uid) return Alert.alert("Error", "Please log in first.");

    try {
      setIsSaving(true);
      let imageUrl = null;

      if (imageUri) {
        imageUrl = await uploadImage(imageUri); // ✅ передаём uri
      }

      // 🔥 Автоопределение организации
      let orgCode = null;
      const orgSnap = await getDocs(collection(db, "organizations"));
      orgSnap.forEach((doc) => {
        const data = doc.data();
        if (data.territory && isPointInPolygon(pin, data.territory)) {
          orgCode = data.orgCode;
        }
      });

      await addDoc(collection(db, "tickets"), {
        description: description.trim(),
        latitude: pin.latitude,
        longitude: pin.longitude,
        imageUrl,
        status: "new",
        createdAt: serverTimestamp(),
        createdBy: auth.currentUser.uid,
        orgCode, // ✅ теперь тикет сразу привязывается к организации
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
    <SafeAreaView
      edges={["top"]}
      style={[styles.root, { backgroundColor: isDark ? "#111" : "#fff" }]}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={[styles.title, { color: isDark ? "#fff" : "#111" }]}>
          Create Ticket
        </Text>

        <Text style={{ marginBottom: 8, color: isDark ? "#9ca3af" : "#6b7280" }}>
          Lat: {pin?.latitude?.toFixed(6)} | Lng: {pin?.longitude?.toFixed(6)}
        </Text>

        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.photo} />
        ) : (
          <View
            style={[
              styles.photoPlaceholder,
              { borderColor: isDark ? "#2a2a2a" : "#e5e7eb" },
            ]}
          >
            <Text style={{ color: isDark ? "#8b8b8b" : "#666" }}>No photo</Text>
          </View>
        )}

        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.btn, styles.btnGhost]}
            onPress={takeMore}
            disabled={isSaving}
          >
            <Text style={{ color: isDark ? "#fff" : "#111" }}>Take photo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn, styles.btnGhost]}
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
          <Text style={styles.btnPrimaryText}>
            {isSaving ? "Saving..." : "Create Ticket"}
          </Text>
        </TouchableOpacity>

        {imageUri ? (
          <TouchableOpacity
            style={[styles.btn, styles.btnGhost, { marginTop: 8 }]}
            onPress={() => setImageUri(null)}
            disabled={isSaving}
          >
            <Text style={{ color: isDark ? "#fff" : "#111" }}>Remove photo</Text>
          </TouchableOpacity>
        ) : null}

        <View style={{ height: Platform.OS === "ios" ? 24 : 12 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: 16 },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 8 },
  photo: {
    width: 140,
    height: 140,
    borderRadius: 12,
    alignSelf: "center",
    marginBottom: 12,
  },
  photoPlaceholder: {
    width: 140,
    height: 140,
    alignSelf: "center",
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
    justifyContent: "space-between",
  },
  input: {
    minHeight: 110,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    textAlignVertical: "top",
    marginBottom: 12,
  },
  btn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    flex: 1,
  },
  btnPrimary: { backgroundColor: "#007AFF", borderColor: "#007AFF" },
  btnPrimaryText: { color: "#fff", fontWeight: "700" },
  btnGhost: { backgroundColor: "transparent" },
});
