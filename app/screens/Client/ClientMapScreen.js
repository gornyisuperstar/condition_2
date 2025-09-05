import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Text,
} from "react-native";
import MapView, { Polygon, Marker } from "react-native-maps";
import { auth, db } from "../../../firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from "firebase/firestore";
import { useTheme } from "../../context/ThemeContext";
import darkMapStyle from "../../constants/darkMapStyle.json";
import { normalizeImageUrl } from "../../utils/imageUrl";
import { useNavigation, useFocusEffect } from "@react-navigation/native";

// ✅ проверка попадания точки в полигон
function pointInPolygon(point, polygon) {
  if (!polygon || polygon.length < 3) return false;
  const x = point.latitude;
  const y = point.longitude;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].latitude,
      yi = polygon[i].longitude;
    const xj = polygon[j].latitude,
      yj = polygon[j].longitude;
    const intersect =
      (yi > y) !== (yj > y) &&
      x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export default function ClientMapScreen() {
  const { appTheme } = useTheme();
  const isDark = appTheme === "dark";
  const navigation = useNavigation();
  const mapRef = useRef(null);

  const [territory, setTerritory] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  const ui = {
    bg: isDark ? "#111" : "#fff",
    text: isDark ? "#fff" : "#111",
    buttonBg: isDark ? "#1b1b1b" : "#e5e7eb",
    buttonText: isDark ? "#fff" : "#111",
  };

  const loadData = async () => {
    try {
      if (!auth.currentUser) return;

      // 1) Организация: территория + orgCode
      const orgRef = doc(db, "organizations", auth.currentUser.uid);
      const orgSnap = await getDoc(orgRef);

      if (orgSnap.exists()) {
        const org = orgSnap.data();

        if (org.territory) {
          const formatted = org.territory.map((p) => ({
            latitude: p.latitude ?? p.lat,
            longitude: p.longitude ?? p.lng,
          }));
          setTerritory(formatted);
        }

        // 2) Тикеты этой организации
        if (org.orgCode) {
          const q = query(
            collection(db, "tickets"),
            where("orgCode", "==", org.orgCode),
            orderBy("createdAt", "desc"),
            limit(200)
          );
          const snap = await getDocs(q);
          const result = [];
          for (const d of snap.docs) {
            const raw = d.data();
            const img = await normalizeImageUrl(raw.imageUrl || null);
            result.push({ id: d.id, ...raw, imageUrl: img });
          }
          setTickets(result);
        }
      }
    } catch (e) {
      console.error("Error loading map data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const centerOnTerritory = () => {
    if (mapRef.current && territory.length > 0) {
      mapRef.current.fitToCoordinates(territory, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: ui.bg }]}>
        <ActivityIndicator size="large" color={ui.text} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: ui.bg }}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: territory[0]?.latitude || 49.89968,
          longitude: territory[0]?.longitude || -97.136715,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        provider="google"
        customMapStyle={isDark ? darkMapStyle : []}
      >
        {/* Полигон территории */}
        {territory.length > 0 && (
          <Polygon
            coordinates={territory}
            strokeColor={isDark ? "#00FFAA" : "#007AFF"}
            fillColor={isDark ? "rgba(0,255,170,0.2)" : "rgba(0,122,255,0.2)"}
            strokeWidth={2}
          />
        )}

        {/* Маркеры тикетов */}
        {tickets.map((t) => {
          const inside = pointInPolygon(
            { latitude: t.latitude, longitude: t.longitude },
            territory
          );

          return (
            <Marker
              key={t.id}
              coordinate={{ latitude: t.latitude, longitude: t.longitude }}
              anchor={{ x: 0.5, y: 0.5 }} // ✅ центр круга по точке
              onPress={() =>
                navigation.navigate("TicketDetail", {
                  ticketId: t.id,
                  role: "organization",
                })
              }
            >
              {/* Кастомный пин — полный круг */}
              <View
                style={[
                  styles.pin,
                  inside ? styles.pinInside : styles.pinOutside,
                ]}
              >
                <View style={styles.pinDot} />
              </View>
            </Marker>
          );
        })}
      </MapView>

      {/* Кнопка центрирования */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: ui.buttonBg }]}
          onPress={centerOnTerritory}
        >
          <Text style={[styles.buttonText, { color: ui.buttonText }]}>
            Center on Organization
          </Text>
        </TouchableOpacity>
      </View>

      {/* Легенда */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendSwatch, { backgroundColor: "#ef4444" }]} />
          <Text style={styles.legendText}>In territory</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendSwatch, { backgroundColor: "#22c55e" }]} />
          <Text style={styles.legendText}>Out of range</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  // Кастомный круглый пин
  pin: {
    width: 28,
    height: 28,
    borderRadius: 14, // полный круг
    borderWidth: 2,
    borderColor: "#111",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  pinInside: { backgroundColor: "#ef4444" }, // красный
  pinOutside: { backgroundColor: "#22c55e" }, // зелёный
  pinDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#fff",
  },

  // кнопка
  buttonContainer: { position: "absolute", bottom: 20, left: 20, right: 20 },
  button: { padding: 15, borderRadius: 12, alignItems: "center" },
  buttonText: { fontWeight: "700", fontSize: 16 },

  // легенда
  legend: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  legendItem: { flexDirection: "row", alignItems: "center", marginVertical: 2 },
  legendSwatch: { width: 12, height: 12, borderRadius: 6, marginRight: 6 },
  legendText: { color: "#fff", fontSize: 12 },
});
