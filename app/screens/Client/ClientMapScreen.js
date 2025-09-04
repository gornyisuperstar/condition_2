import React, { useEffect, useState, useRef } from "react";
import { View, ActivityIndicator, StyleSheet, TouchableOpacity, Text } from "react-native";
import MapView, { Polygon, Marker } from "react-native-maps";
import { auth, db } from "../../../firebase";
import { doc, getDoc } from "firebase/firestore";
import { useTheme } from "../../context/ThemeContext";
import darkMapStyle from "../../constants/darkMapStyle.json"; // ✅ импортируем стиль

export default function ClientMapScreen() {
  const { appTheme } = useTheme();
  const isDark = appTheme === "dark";
  const mapRef = useRef(null);
  const [territory, setTerritory] = useState([]);
  const [loading, setLoading] = useState(true);

  const ui = {
    bg: isDark ? "#111" : "#fff",
    text: isDark ? "#fff" : "#111",
    subtext: isDark ? "#9ca3af" : "#6b7280",
    buttonBg: isDark ? "#1b1b1b" : "#e5e7eb",
    buttonText: isDark ? "#fff" : "#111",
  };

  useEffect(() => {
    const fetchOrg = async () => {
      try {
        if (!auth.currentUser) return;
        const orgRef = doc(db, "organizations", auth.currentUser.uid);
        const orgSnap = await getDoc(orgRef);
        if (orgSnap.exists()) {
          const data = orgSnap.data();
          if (data.territory) {
            const formatted = data.territory.map(p => ({
              latitude: p.latitude ?? p.lat,
              longitude: p.longitude ?? p.lng,
            }));
            setTerritory(formatted);
          }
        }
      } catch (e) {
        console.error("Error loading territory:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchOrg();
  }, []);

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
          latitude: 49.89968,
          longitude: -97.136715,
          latitudeDelta: 0.002,
          longitudeDelta: 0.002,
        }}
        provider="google" // ✅ нужен для стилей
        customMapStyle={isDark ? darkMapStyle : []} // ✅ применяем dark mode
      >
        {territory.length > 0 && (
          <>
            <Polygon
              coordinates={territory}
              strokeColor={isDark ? "#00FFAA" : "#007AFF"}
              fillColor={isDark ? "rgba(0,255,170,0.2)" : "rgba(0,122,255,0.2)"}
              strokeWidth={2}
            />
            <Marker coordinate={territory[0]} title="Organization territory" />
          </>
        )}
      </MapView>

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
    </View>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  buttonContainer: { position: "absolute", bottom: 20, left: 20, right: 20 },
  button: { padding: 15, borderRadius: 12, alignItems: "center" },
  buttonText: { fontWeight: "700", fontSize: 16 },
});
