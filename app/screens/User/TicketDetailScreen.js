import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Image, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { db, storage } from "../../../firebase";
import { doc, getDoc } from "firebase/firestore";
import { ref, getDownloadURL } from "firebase/storage";
import { useTheme } from "../../context/ThemeContext"; 

async function normalizeImageUrl(url) {
  if (!url) return null;
  if (url.startsWith("gs://")) {
    try {
      const r = ref(storage, url);
      return await getDownloadURL(r);
    } catch {
      return null;
    }
  }
  return url;
}

export default function TicketDetailScreen({ route }) {
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
          data.imageUrl = await normalizeImageUrl(data.imageUrl);
          setTicket(data);
        } else {
          setTicket(null);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [ticketId]);

  if (loading) {
    return (
      <SafeAreaView edges={["top"]} style={[styles.center, { backgroundColor: isDark ? "#111" : "#fff" }]}>
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  if (!ticket) {
    return (
      <SafeAreaView edges={["top"]} style={[styles.center, { backgroundColor: isDark ? "#111" : "#fff" }]}>
        <Text style={{ color: isDark ? "#fff" : "#111" }}>Ticket not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: isDark ? "#111" : "#fff" }}>
      <ScrollView contentContainerStyle={{ padding: 16 }} contentInsetAdjustmentBehavior="automatic">
        {ticket.imageUrl ? <Image source={{ uri: ticket.imageUrl }} style={styles.image} /> : null}

        <Text style={[styles.label, { color: isDark ? "#aaa" : "#666" }]}>Description</Text>
        <Text style={[styles.value, { color: isDark ? "#fff" : "#111" }]}>{ticket.description || "No description"}</Text>

        <Text style={[styles.label, { color: isDark ? "#aaa" : "#666" }]}>Status</Text>
        <Text style={[styles.value, { color: isDark ? "#fff" : "#111" }]}>{ticket.status || "new"}</Text>

        <Text style={[styles.label, { color: isDark ? "#aaa" : "#666" }]}>Location</Text>
        <Text style={[styles.value, { color: isDark ? "#fff" : "#111" }]}>
          {ticket.latitude}, {ticket.longitude}
        </Text>

        <Text style={[styles.label, { color: isDark ? "#aaa" : "#666" }]}>Created</Text>
        <Text style={[styles.value, { color: isDark ? "#fff" : "#111" }]}>
          {ticket.createdAt?.toDate ? ticket.createdAt.toDate().toLocaleString() : "N/A"}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  image: { width: "100%", height: 220, borderRadius: 12, marginBottom: 16, backgroundColor: "#222" },
  label: { fontSize: 13, marginTop: 10 },
  value: { fontSize: 16, marginBottom: 6 },
});
