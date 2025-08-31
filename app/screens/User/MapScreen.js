// MapScreen.js
import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import MapView, { Marker, Polygon } from "react-native-maps";
import * as Location from "expo-location";

export default function MapScreen({ navigation }) {
  const [location, setLocation] = useState(null);
  const [pin, setPin] = useState(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission denied", "Location permission is required");
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords);
    })();
  }, []);

  if (!location) {
    return (
      <View style={styles.center}>
        <Text>Loading your location...</Text>
      </View>
    );
  }

  // main map 100% (broad view)
  const initialRegion = {
    latitude: location.latitude,
    longitude: location.longitude,
    latitudeDelta: 0.07,
    longitudeDelta: 0.07,
  };

  return (
    <View style={styles.container}>
      <MapView style={styles.map} initialRegion={initialRegion} showsUserLocation>
        {pin && <Marker coordinate={pin} />}
      </MapView>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => {
          // Navigate to TicketCreation — that screen will be pre-zoomed (2x)
          navigation.navigate("TicketCreation");
        }}
      >
        <Text style={styles.addButtonText}>Add ticket</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  map: { flex: 1 },
  addButton: {
    position: "absolute",
    right: 20,
    bottom: 40,
    backgroundColor: "#ff6b6b",
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 30,
    elevation: 3,
  },
  addButtonText: { color: "#fff", fontWeight: "700" },
});
