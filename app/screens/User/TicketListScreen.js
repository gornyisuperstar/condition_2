import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "../../../firebase";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../navigation/AuthProvider";
import { normalizeImageUrl } from "../../utils/imageUrl";

export default function TicketListScreen({ navigation }) {
  const { appTheme } = useTheme();
  const isDark = appTheme === "dark";

  const { user, role, orgCode, loading } = useAuth();
  const [tickets, setTickets] = useState([]);

  // формируем запрос под роль
  const ticketsQuery = useMemo(() => {
    if (loading || !user?.uid) return null;
    const base = collection(db, "tickets");

    if (role === "organization" && orgCode) {
      return query(
        base,
        where("orgCode", "==", orgCode),
        orderBy("createdAt", "desc")
      );
    }
    if (role === "admin" || role === "superadmin") {
      return query(base, orderBy("createdAt", "desc"));
    }
    return query(
      base,
      where("createdBy", "==", user.uid),
      orderBy("createdAt", "desc")
    );
  }, [loading, user?.uid, role, orgCode]);

  useEffect(() => {
    if (!ticketsQuery) return;
    const unsub = onSnapshot(ticketsQuery, async (snap) => {
      const rows = await Promise.all(
        snap.docs.map(async (d) => {
          const data = d.data();
          const img = await normalizeImageUrl(data.imageUrl || null);
          return { id: d.id, ...data, imageUrl: img };
        })
      );
      setTickets(rows);
    });
    return () => unsub();
  }, [ticketsQuery]);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: isDark ? "#1b1b1b" : "#f9f9f9",
          borderColor: isDark ? "#2a2a2a" : "#eee",
        },
      ]}
      onPress={() => navigation.navigate("TicketDetail", { ticketId: item.id })}
    >
      {item.imageUrl ? (
        <Image
          source={{ uri: item.imageUrl }}
          style={styles.image}
          resizeMode="cover"
        />
      ) : (
        <View
          style={[styles.image, { backgroundColor: isDark ? "#333" : "#ddd" }]}
        />
      )}
      <Text
        style={[styles.desc, { color: isDark ? "#e5e7eb" : "#111" }]}
        numberOfLines={3}
      >
        {item.description || "No description"}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView
      edges={["top"]}
      style={[
        styles.container,
        { backgroundColor: isDark ? "#111" : "#fff" },
      ]}
    >
      {tickets.length === 0 ? (
        <Text
          style={{ marginTop: 20, color: isDark ? "#e5e7eb" : "#111" }}
        >
          No tickets yet
        </Text>
      ) : (
        <FlatList
          data={tickets}
          renderItem={renderItem}
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
  card: { flex: 1, borderRadius: 12, padding: 10, borderWidth: 1 },
  image: { width: "100%", height: 120, borderRadius: 8, marginBottom: 8 },
  desc: { fontSize: 13 },
});
