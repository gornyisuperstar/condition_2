import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { db, auth } from "../../../firebase";
import { doc, getDoc } from "firebase/firestore";
import { useTheme } from "../../context/ThemeContext";
import { normalizeImageUrl } from "../../utils/imageUrl";
import { api } from "../../utils/serverConfig";
import { Picker } from "@react-native-picker/picker";

export default function TicketDetailScreen({ route, navigation }) {
  const { ticketId, role } = route.params;
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [priority, setPriority] = useState("Low");
  const [status, setStatus] = useState("Open");

  const { appTheme } = useTheme?.() || { appTheme: "light" };
  const isDark = appTheme === "dark";

  // 🎨 единая палитра
  const ui = {
    bg: isDark ? "#111" : "#fff",
    text: isDark ? "#fff" : "#111",
    subtext: isDark ? "#9ca3af" : "#666",
    cardBg: isDark ? "#1e1e1e" : "#f5f5f5",
    buttonBg: "#007AFF",
    buttonText: "#fff",
  };

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, "tickets", ticketId));
        if (snap.exists()) {
          const data = snap.data();
          const img = await normalizeImageUrl(data.imageUrl || null);
          setTicket({ id: snap.id, ...data, imageUrl: img });

          setPriority(data.priority || "Low");
          setStatus(data.status || "Open");
        } else {
          setTicket(null);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [ticketId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api(`/tickets/${ticketId}/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priority,
          status,
          userId: auth.currentUser?.uid,
        }),
      });

      setTicket({ ...ticket, priority, status });
      Alert.alert("Success", "Ticket updated");
      navigation.goBack();
    } catch (e) {
      Alert.alert("Error", e.message || "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: ui.bg }]}>
        <ActivityIndicator color={ui.text} />
      </SafeAreaView>
    );
  }

  if (!ticket) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: ui.bg }]}>
        <Text style={{ color: ui.text }}>Ticket not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: ui.bg }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* image */}
        {ticket.imageUrl ? (
          <Image
            source={{ uri: ticket.imageUrl }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <Image
            source={require("../../assets/issue-radar-logo.png")}
            style={[styles.image, { tintColor: ui.subtext, opacity: 0.3 }]}
            resizeMode="contain"
          />
        )}

        {/* description */}
        <Text style={[styles.label, { color: ui.subtext }]}>Description</Text>
        <Text style={[styles.value, { color: ui.text }]}>
          {ticket.description || "No description"}
        </Text>

        {/* поля редактирования для организации */}
        {role === "organization" ? (
          <>
            <Text style={[styles.label, { color: ui.subtext }]}>Priority</Text>
            <Picker
              selectedValue={priority}
              onValueChange={(v) => setPriority(v)}
              dropdownIconColor={ui.text}
              style={{ color: ui.text, backgroundColor: ui.cardBg }}
            >
              <Picker.Item label="Low" value="Low" />
              <Picker.Item label="Medium" value="Medium" />
              <Picker.Item label="High" value="High" />
            </Picker>

            <Text style={[styles.label, { color: ui.subtext }]}>Status</Text>
            <Picker
              selectedValue={status}
              onValueChange={(v) => setStatus(v)}
              dropdownIconColor={ui.text}
              style={{ color: ui.text, backgroundColor: ui.cardBg }}
            >
              <Picker.Item label="Open" value="Open" />
              <Picker.Item label="In Progress" value="In Progress" />
              <Picker.Item label="Resolved" value="Resolved" />
            </Picker>

            <TouchableOpacity
              style={[styles.btn, { backgroundColor: ui.buttonBg, marginTop: 20 }]}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={{ color: ui.buttonText, fontWeight: "700" }}>
                {saving ? "Saving..." : "Save Changes"}
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={[styles.label, { color: ui.subtext }]}>Priority</Text>
            <Text style={[styles.value, { color: ui.text }]}>
              {ticket.priority || "N/A"}
            </Text>

            <Text style={[styles.label, { color: ui.subtext }]}>Status</Text>
            <Text style={[styles.value, { color: ui.text }]}>
              {ticket.status || "Open"}
            </Text>
          </>
        )}

        {/* created */}
        <Text style={[styles.label, { color: ui.subtext }]}>Created</Text>
        <Text style={[styles.value, { color: ui.text }]}>
          {ticket.createdAt?.toDate
            ? ticket.createdAt.toDate().toLocaleString()
            : "N/A"}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  image: {
    width: "100%",
    height: 220,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: "#222",
  },
  label: { fontSize: 13, marginTop: 10 },
  value: { fontSize: 16, marginBottom: 6 },
  btn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
});

