import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../../../firebase";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../navigation/AuthProvider"; // ← используем провайдер авторизации

export default function TicketListScreen({ navigation }) {
  const { appTheme } = useTheme();
  const isDark = appTheme === "dark";
  const { user, loading } = useAuth();

  const [tickets, setTickets] = useState([]);
  const [listening, setListening] = useState(false);

  useEffect(() => {
    if (loading || !user?.uid) return;

    const q = query(collection(db, "tickets"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setTickets(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (err) => {
        console.error("tickets onSnapshot error:", err);
      }
    );

    setListening(true);
    return () => unsub();
  }, [loading, user?.uid]);

  if (loading || (!listening && !user)) {
    return (
      <SafeAreaView edges={["top"]} style={[styles.center, { backgroundColor: isDark ? "#111" : "#fff" }]}>
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top"]} style={[styles.container, { backgroundColor: isDark ? "#111" : "#fff" }]}>
      {tickets.length === 0 ? (
        <Text style={{ marginTop: 20, color: isDark ? "#e5e7eb" : "#111" }}>No tickets yet</Text>
      ) : (
        <FlatList
          data={tickets}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.card,
                { backgroundColor: isDark ? "#1b1b1b" : "#f9f9f9", borderColor: isDark ? "#2a2a2a" : "#eee" },
              ]}
              onPress={() => navigation.navigate("TicketDetail", { ticketId: item.id })}
            >
              {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={styles.image} resizeMode="cover" />
              ) : (
                <View style={[styles.image, { backgroundColor: isDark ? "#333" : "#ddd" }]} />
              )}
              <Text style={[styles.desc, { color: isDark ? "#e5e7eb" : "#111" }]} numberOfLines={3}>
                {item.description || "No description"}
              </Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={{ gap: 10 }}
          contentContainerStyle={{ padding: 10, gap: 10 }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  card: { flex: 1, borderRadius: 12, padding: 10, borderWidth: 1 },
  image: { width: "100%", height: 120, borderRadius: 8, marginBottom: 8 },
  desc: { fontSize: 13 },
});
