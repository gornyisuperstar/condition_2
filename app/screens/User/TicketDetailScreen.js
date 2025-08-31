import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { db } from "../../../firebase";
import { doc, getDoc } from "firebase/firestore";

export default function TicketDetailsScreen({ route }) {
  const { ticketId } = route.params; // 👈 получаем ID из параметров
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const ticketDoc = await getDoc(doc(db, "tickets", ticketId));
        if (ticketDoc.exists()) {
          setTicket(ticketDoc.data());
        } else {
          Alert.alert("Error", "Ticket not found");
        }
      } catch (error) {
        Alert.alert("Error", error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTicket();
  }, [ticketId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="blue" />
      </View>
    );
  }

  if (!ticket) {
    return (
      <View style={styles.center}>
        <Text>No ticket data</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ticket Details</Text>
      <Text style={styles.label}>Description:</Text>
      <Text style={styles.value}>{ticket.description || "No description"}</Text>

      <Text style={styles.label}>Status:</Text>
      <Text style={styles.value}>{ticket.status || "New"}</Text>

      <Text style={styles.label}>Location:</Text>
      <Text style={styles.value}>
        {ticket.latitude}, {ticket.longitude}
      </Text>

      <Text style={styles.label}>Created At:</Text>
      <Text style={styles.value}>
        {ticket.createdAt?.toDate
          ? ticket.createdAt.toDate().toLocaleString()
          : "N/A"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 20 },
  label: { fontSize: 16, fontWeight: "600", marginTop: 10 },
  value: { fontSize: 16, color: "#333" },
});
