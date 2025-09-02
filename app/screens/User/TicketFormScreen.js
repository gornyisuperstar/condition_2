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
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../../../firebase";
import { useTheme } from "../../context/ThemeContext";

export default function TicketFormScreen({ route, navigation }) {
  const { appTheme } = useTheme();
  const isDark = appTheme === "dark";

  // Приходим СЮДА уже с координатами и (опционально) фото
  const pin = route.params?.pin; // { latitude, longitude }
  const initialImage = route.params?.imageUri || null;

  const [imageUri, setImageUri] = useState(initialImage);
  const [description, setDescription] = useState("");

  const pickMore = async () => {
    const p = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (p.status !== "granted") return;
    const res = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, quality: 0.85 });
    if (!res.canceled && res.assets?.[0]?.uri) setImageUri(res.assets[0].uri);
  };

  const takeMore = async () => {
    const p = await ImagePicker.requestCameraPermissionsAsync();
    if (p.status !== "granted") return;
    const res = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.85 });
    if (!res.canceled && res.assets?.[0]?.uri) setImageUri(res.assets[0].uri);
  };

  const createTicket = async () => {
    Keyboard.dismiss();

    if (!pin?.latitude || !pin?.longitude) {
      Alert.alert("Error", "Please go back and drop a pin on the map.");
      return;
    }
    if (!description.trim()) {
      Alert.alert("Error", "Description is required.");
      return;
    }

    try {
      await addDoc(collection(db, "tickets"), {
        description: description.trim(),
        latitude: pin.latitude,
        longitude: pin.longitude,
        // Пока без загрузки в Storage — imageUrl: null. (Вернёмся позже)
        imageUrl: null,
        status: "new",
        createdAt: serverTimestamp(),
        createdBy: auth.currentUser?.uid || null,
      });

      Alert.alert("Success", "Ticket created!");
      // Вернёмся на карту (вкладка Create / первый экран стека)
      navigation.popToTop();
      navigation.getParent()?.navigate("Create");
    } catch (e) {
      Alert.alert("Error", e.message);
    }
  };

  const theme = {
    bg: isDark ? "#111" : "#fff",
    text: isDark ? "#fff" : "#111",
    sub: isDark ? "#9ca3af" : "#6b7280",
    inputBg: isDark ? "#141414" : "#fafafa",
    border: isDark ? "#2a2a2a" : "#e5e7eb",
    btn: "#007AFF",
  };

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="automatic"
      >
        <Text style={[styles.title, { color: theme.text }]}>Create Ticket</Text>

        <Text style={{ marginBottom: 8, color: theme.sub }}>
          Lat: {pin?.latitude?.toFixed(6)}   |   Lng: {pin?.longitude?.toFixed(6)}
        </Text>

        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.photo} />
        ) : (
          <View style={[styles.photoPlaceholder, { borderColor: theme.border }]}>
            <Text style={{ color: theme.sub }}>No photo</Text>
          </View>
        )}

        <View style={styles.row}>
          <TouchableOpacity style={[styles.btnGhost, { borderColor: theme.border }]} onPress={takeMore}>
            <Text style={{ color: theme.text }}>Take photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btnGhost, { borderColor: theme.border }]} onPress={pickMore}>
            <Text style={{ color: theme.text }}>Choose from library</Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={[
            styles.input,
            { color: theme.text, backgroundColor: theme.inputBg, borderColor: theme.border },
          ]}
          placeholder="Describe the issue (required)"
          placeholderTextColor={theme.sub}
          multiline
          value={description}
          onChangeText={setDescription}
          returnKeyType="done"
          blurOnSubmit
        />

        <TouchableOpacity style={[styles.btnPrimary, { backgroundColor: theme.btn }]} onPress={createTicket}>
          <Text style={styles.btnPrimaryText}>Create Ticket</Text>
        </TouchableOpacity>

        {imageUri ? (
          <TouchableOpacity
            style={[styles.btnGhost, { marginTop: 8, borderColor: theme.border }]}
            onPress={() => setImageUri(null)}
          >
            <Text style={{ color: theme.text }}>Remove photo</Text>
          </TouchableOpacity>
        ) : null}

        <View style={{ height: Platform.OS === "ios" ? 12 : 6 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  btnPrimary: { paddingVertical: 14, borderRadius: 12, alignItems: "center" },
  btnPrimaryText: { color: "#fff", fontWeight: "700" },
  btnGhost: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    backgroundColor: "transparent",
  },
});
