import React, { useEffect, useMemo, useState } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Image, ActivityIndicator
} from "react-native";
import { db, auth } from "../../../firebase";
import {
  collection, query, where, getDocs, orderBy, limit, doc, getDoc
} from "firebase/firestore";
import { useTheme } from "../../context/ThemeContext";
import { api } from "../../utils/serverConfig";

const priorityColors = { High: "#ef4444", Medium: "#f97316", Low: "#22c55e" };

function pointInPolygon(point, polygon) {
  if (!polygon || polygon.length < 3) return false;
  let x = point.latitude, y = point.longitude, inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    let xi = polygon[i].latitude, yi = polygon[i].longitude;
    let xj = polygon[j].latitude, yj = polygon[j].longitude;
    const intersect = ((yi > y) !== (yj > y)) &&
      (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

export default function TicketManagement() {
  const { appTheme } = useTheme();
  const isDark = appTheme === "dark";

  const [loading, setLoading] = useState(true);
  const [orgCode, setOrgCode] = useState(null);
  const [territory, setTerritory] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [filter, setFilter] = useState("All");
  const [sortBy, setSortBy] = useState("createdAt");

  const ui = {
    bg: isDark ? "#111" : "#fff",
    text: isDark ? "#fff" : "#111",
    subtext: isDark ? "#9ca3af" : "#6b7280",
    cardBg: isDark ? "#1b1b1b" : "#f9f9f9",
    border: isDark ? "#2a2a2a" : "#e5e7eb",
    buttonBg: isDark ? "#1b1b1b" : "#e5e7eb",
    buttonText: isDark ? "#fff" : "#111",
    accent: "#007AFF",
  };

  useEffect(() => {
    const load = async () => {
      try {
        if (!auth.currentUser) return;

        // 1) тянем организацию (orgCode + territory)
        const orgRef = doc(db, "organizations", auth.currentUser.uid);
        const orgSnap = await getDoc(orgRef);
        if (orgSnap.exists()) {
          const org = orgSnap.data();
          setOrgCode(org.orgCode);
          setTerritory((org.territory || []).map(p => ({
            latitude: p.latitude ?? p.lat,
            longitude: p.longitude ?? p.lng,
          })));
        }

        // 2) читаем тикеты данной организации
        if (orgCode || orgSnap?.data()?.orgCode) {
          const oc = orgCode || orgSnap.data().orgCode;
          const q = query(
            collection(db, "tickets"),
            where("orgCode", "==", oc),
            orderBy("createdAt", "desc"),
            limit(200)
          );
          const snap = await getDocs(q);
          const data = [];
          snap.forEach(d => data.push({ id: d.id, ...d.data() }));
          setTickets(data);
        }
      } catch (e) {
        console.error("Error loading tickets:", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [orgCode]);

  const visible = useMemo(() => {
    let items = tickets.filter(t =>
      territory.length === 0
        ? true
        : pointInPolygon(
            { latitude: t.latitude, longitude: t.longitude },
            territory
          )
    );

    if (filter !== "All") items = items.filter(t => t.status === filter);

    if (sortBy === "priority") {
      const order = { High: 1, Medium: 2, Low: 3 };
      items.sort((a,b) => (order[a.priority]||9) - (order[b.priority]||9));
    } else if (sortBy === "status") {
      items.sort((a,b) => (a.status||"").localeCompare(b.status||""));
    } else {
      items.sort((a,b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
    }
    return items;
  }, [tickets, territory, filter, sortBy]);

  // ✅ теперь обновляем через сервер
  const cycleStatus = async (t) => {
    const order = ["Open","In Progress","Resolved"];
    const next = order[(order.indexOf(t.status||"Open")+1) % order.length];
    try {
      await api(`/tickets/${t.id}/update`, {
        method: "POST",
        body: JSON.stringify({
          status: next,
          userId: auth.currentUser?.uid,
        }),
      });
      setTickets(prev => prev.map(x => x.id===t.id ? {...x, status: next} : x));
    } catch (e) {
      console.warn("Update denied:", e.message);
    }
  };

  const cyclePriority = async (t) => {
    const order = ["Low","Medium","High"];
    const next = order[(order.indexOf(t.priority||"Low")+1) % order.length];
    try {
      await api(`/tickets/${t.id}/update`, {
        method: "POST",
        body: JSON.stringify({
          priority: next,
          userId: auth.currentUser?.uid,
        }),
      });
      setTickets(prev => prev.map(x => x.id===t.id ? {...x, priority: next} : x));
    } catch (e) {
      console.warn("Update denied:", e.message);
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      onLongPress={() => cycleStatus(item)}
      onPress={() => cyclePriority(item)}
      activeOpacity={0.8}
      style={[styles.card, { backgroundColor: ui.cardBg, borderColor: ui.border }]}
    >
      {item.imageUrl
        ? <Image source={{ uri: item.imageUrl }} style={styles.thumbnail} />
        : <View style={[styles.thumbnail, { backgroundColor: "#d1d5db" }]} />
      }

      <View style={styles.info}>
        <View style={styles.row}>
          <View
            style={[
              styles.priorityDot,
              { backgroundColor: priorityColors[item.priority] || "#9ca3af" },
            ]}
          />
          <Text style={[styles.priorityText, { color: ui.text }]}>
            {item.priority || "N/A"} · <Text style={{ color: ui.subtext }}>{item.status || "Open"}</Text>
          </Text>
        </View>

        <Text style={[styles.desc, { color: ui.text }]} numberOfLines={1}>
          {item.description || "No description"}
        </Text>

        <Text style={{ color: ui.subtext, fontSize: 12 }}>
          {new Date(item.createdAt?.toMillis?.() || Date.now()).toLocaleString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: ui.bg }]}>
        <ActivityIndicator size="large" color={ui.text} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: ui.bg }]}>
      {/* фильтры */}
      <View style={styles.filterRow}>
        {["All","Open","In Progress","Resolved"].map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, { backgroundColor: filter===f ? ui.accent : ui.buttonBg }]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, { color: filter===f ? "#fff" : ui.buttonText }]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* сортировка */}
      <View style={styles.filterRow}>
        {["createdAt","priority","status"].map(s => (
          <TouchableOpacity
            key={s}
            style={[styles.filterBtn, { backgroundColor: sortBy===s ? ui.accent : ui.buttonBg }]}
            onPress={() => setSortBy(s)}
          >
            <Text style={[styles.filterText, { color: sortBy===s ? "#fff" : ui.buttonText }]}>
              Sort: {s}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={visible}
        keyExtractor={i => i.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    padding: 10,
    marginHorizontal: 15,
    marginVertical: 5,
    borderRadius: 12,
    height: 80,
  },
  thumbnail: { width: 60, height: 60, borderRadius: 8, marginRight: 10 },
  info: { flex: 1 },
  row: { flexDirection: "row", alignItems: "center" },
  priorityDot: { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
  priorityText: { fontSize: 14, fontWeight: "600" },
  desc: { fontSize: 14, marginTop: 4, fontWeight: "500" },
  filterRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 5,
    paddingHorizontal: 10,
  },
  filterBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 },
  filterText: { fontSize: 14, fontWeight: "600" },
});
