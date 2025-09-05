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
import { doc, getDoc, deleteDoc } from "firebase/firestore";
import { useTheme } from "../../context/ThemeContext";
import { normalizeImageUrl } from "../../utils/imageUrl";

export default function TicketDetailScreen({ route, navigation }) {
  const { ticketId } = route.params;
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const { appTheme } = useTheme?.() || { appTheme: "light" };
  const isDark = appTheme === "dark";

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, "tickets", ticketId));
        if (snap.exists()) {
          const data = snap.data();
          const img = await normalizeImageUrl(data.imageUrl || null);
          setTicket({ id: snap.id, ...data, imageUrl: img });
        } else {
          setTicket(null);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [ticketId]);

  const handleDelete = () => {
    Alert.alert("Confirm", "Delete this ticket?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteDoc(doc(db, "tickets", ticketId));
            navigation.goBack();
          } catch (e) {
            Alert.alert("Error", e.message || "Failed to delete");
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView
        edges={["top"]}
        style={[styles.center, { backgroundColor: isDark ? "#111" : "#fff" }]}
      >
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  if (!ticket) {
    return (
      <SafeAreaView
        edges={["top"]}
        style={[styles.center, { backgroundColor: isDark ? "#111" : "#fff" }]}
      >
        <Text style={{ color: isDark ? "#fff" : "#111" }}>Ticket not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={["top"]}
      style={{ flex: 1, backgroundColor: isDark ? "#111" : "#fff" }}
    >
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {ticket.imageUrl ? (
          <Image
            source={{ uri: ticket.imageUrl }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <Image
            source={require("../../assets/issue-radar-logo.png")}
            style={[
              styles.image,
              { tintColor: isDark ? "#666" : "#999", opacity: 0.3 },
            ]}
            resizeMode="contain"
          />
        )}

        <Text style={[styles.label, { color: isDark ? "#aaa" : "#666" }]}>
          Description
        </Text>
        <Text style={[styles.value, { color: isDark ? "#fff" : "#111" }]}>
          {ticket.description || "No description"}
        </Text>

        <Text style={[styles.label, { color: isDark ? "#aaa" : "#666" }]}>
          Status
        </Text>
        <Text style={[styles.value, { color: isDark ? "#fff" : "#111" }]}>
          {ticket.status || "new"}
        </Text>

        <Text style={[styles.label, { color: isDark ? "#aaa" : "#666" }]}>
          Location
        </Text>
        <Text style={[styles.value, { color: isDark ? "#fff" : "#111" }]}>
          {ticket.latitude}, {ticket.longitude}
        </Text>

        <Text style={[styles.label, { color: isDark ? "#aaa" : "#666" }]}>
          Created
        </Text>
        <Text style={[styles.value, { color: isDark ? "#fff" : "#111" }]}>
          {ticket.createdAt?.toDate
            ? ticket.createdAt.toDate().toLocaleString()
            : "N/A"}
        </Text>

        {ticket.createdBy === auth.currentUser?.uid && (
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: "red", marginTop: 20 }]}
            onPress={handleDelete}
          >
            <Text style={{ color: "#fff", fontWeight: "700" }}>
              Delete Ticket
            </Text>
          </TouchableOpacity>
        )}
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
