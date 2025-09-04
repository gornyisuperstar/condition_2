// app/screens/User/TicketCreationScreen.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Platform,
  Modal,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import { useTheme } from "../../context/ThemeContext";
import darkMapStyle from "../../constants/darkMapStyle.json";

export default function TicketCreationScreen({ navigation }) {
  const { appTheme } = useTheme();
  const isDark = appTheme === "dark";
  const insets = useSafeAreaInsets();

  const [location, setLocation] = useState(null);
  const [pin, setPin] = useState(null);
  const [chooserVisible, setChooserVisible] = useState(false);
  const [pendingCoords, setPendingCoords] = useState(null);

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

  const proceedToForm = ({
    imageUri = null,
    base64 = null,
    mime = "jpg",
    coords,
  }) => {
    navigation.navigate("TicketForm", {
      pin: coords,
      imageUri,
      imageBase64: base64,
      imageMime: mime,
    });
  };

  const openChooser = (coords) => {
    setPendingCoords(coords);
    if (Platform.OS === "ios") {
      Alert.alert("Add a photo", "", [
        {
          text: "Take photo",
          onPress: async () => {
            const p = await ImagePicker.requestCameraPermissionsAsync();
            if (p.status === "granted") {
              const res = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                quality: 0.85,
                base64: true,
              });
              if (!res.canceled && res.assets?.[0]) {
                const a = res.assets[0];
                proceedToForm({
                  imageUri: a.uri,
                  base64: a.base64,
                  mime: a.type || "jpg",
                  coords,
                });
              } else {
                proceedToForm({ coords });
              }
            }
          },
        },
        {
          text: "Choose from library",
          onPress: async () => {
            const p = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (p.status === "granted") {
              const res = await ImagePicker.launchImageLibraryAsync({
                allowsEditing: true,
                quality: 0.85,
                base64: true,
              });
              if (!res.canceled && res.assets?.[0]) {
                const a = res.assets[0];
                proceedToForm({
                  imageUri: a.uri,
                  base64: a.base64,
                  mime: a.type || "jpg",
                  coords,
                });
              } else {
                proceedToForm({ coords });
              }
            }
          },
        },
        { text: "Without photo", onPress: () => proceedToForm({ coords }) },
        { text: "Cancel", style: "cancel" },
      ]);
    } else {
      setChooserVisible(true);
    }
  };

  const onMapPress = (e) => {
    const coords = e.nativeEvent.coordinate;
    setPin(coords);
    Alert.alert("Create ticket at this location?", "", [
      { text: "No", style: "cancel" },
      { text: "Yes", onPress: () => openChooser(coords) },
    ]);
  };

  if (!location) {
    return (
      <SafeAreaView
        edges={["top"]}
        style={[
          styles.center,
          { backgroundColor: isDark ? "#111" : "#fff" },
        ]}
      >
        <Text style={{ color: isDark ? "#fff" : "#111" }}>
          Loading your location...
        </Text>
      </SafeAreaView>
    );
  }

  const initialRegion = {
    latitude: location.latitude,
    longitude: location.longitude,
    latitudeDelta: 0.004,
    longitudeDelta: 0.004,
  };

  return (
    <SafeAreaView
      edges={["top"]}
      style={{ flex: 1, backgroundColor: isDark ? "#111" : "#fff" }}
    >
      <MapView
        style={{ flex: 1 }}
        initialRegion={initialRegion}
        onPress={onMapPress}
        showsUserLocation
        provider="google"
        customMapStyle={isDark ? darkMapStyle : []}
      >
        {pin && <Marker coordinate={pin} />}
      </MapView>

      {/* ✅ Подсказка теперь ниже камеры/чёлки и не перекрывает UI */}
      <View
        style={[
          styles.tip,
          {
            top: insets.top + 14,
            left: 16,
            right: 80,
            backgroundColor: isDark ? "#1b1b1b" : "#f4f4f5",
            borderColor: isDark ? "#2a2a2a" : "#e5e7eb",
          },
        ]}
      >
        <Text
          style={{
            color: isDark ? "#e5e7eb" : "#374151",
            fontSize: 12,
            textAlign: "left",
          }}
        >
          Drop a pin on the map to report an issue location
        </Text>
      </View>

      {/* ANDROID chooser */}
      <Modal
        transparent
        visible={Platform.OS !== "ios" && chooserVisible}
        onRequestClose={() => setChooserVisible(false)}
        animationType="fade"
      >
        <View style={styles.overlay}>
          <SafeAreaView
            style={[
              styles.sheet,
              { backgroundColor: isDark ? "#1b1b1b" : "#fff" },
            ]}
          >
            <Text
              style={[
                styles.sheetTitle,
                { color: isDark ? "#fff" : "#111" },
              ]}
            >
              Add a photo
            </Text>

            <TouchableOpacity
              style={styles.sheetItem}
              onPress={async () => {
                const p = await ImagePicker.requestCameraPermissionsAsync();
                if (p.status === "granted") {
                  const res = await ImagePicker.launchCameraAsync({
                    allowsEditing: true,
                    quality: 0.85,
                    base64: true,
                  });
                  if (!res.canceled && res.assets?.[0]) {
                    const a = res.assets[0];
                    proceedToForm({
                      imageUri: a.uri,
                      base64: a.base64,
                      mime: a.type || "jpg",
                      coords: pendingCoords,
                    });
                  } else {
                    proceedToForm({ coords: pendingCoords });
                  }
                }
                setChooserVisible(false);
              }}
            >
              <Text style={{ color: isDark ? "#fff" : "#111" }}>
                Take photo
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sheetItem}
              onPress={async () => {
                const p = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (p.status === "granted") {
                  const res = await ImagePicker.launchImageLibraryAsync({
                    allowsEditing: true,
                    quality: 0.85,
                    base64: true,
                  });
                  if (!res.canceled && res.assets?.[0]) {
                    const a = res.assets[0];
                    proceedToForm({
                      imageUri: a.uri,
                      base64: a.base64,
                      mime: a.type || "jpg",
                      coords: pendingCoords,
                    });
                  } else {
                    proceedToForm({ coords: pendingCoords });
                  }
                }
                setChooserVisible(false);
              }}
            >
              <Text style={{ color: isDark ? "#fff" : "#111" }}>
                Choose from library
              </Text>
            </TouchableOpacity>

            {/* ✅ теперь выглядит как обычный пункт */}
            <TouchableOpacity
              style={styles.sheetItem}
              onPress={() => {
                setChooserVisible(false);
                proceedToForm({ coords: pendingCoords });
              }}
            >
              <Text style={{ color: isDark ? "#fff" : "#111" }}>
                Without photo
              </Text>
            </TouchableOpacity>

            {/* ✅ Cancel теперь серый и отделён */}
            <TouchableOpacity
              style={[styles.sheetItem, styles.cancelItem]}
              onPress={() => setChooserVisible(false)}
            >
              <Text style={{ color: isDark ? "#fff" : "#111", fontWeight: "600" }}>
                Cancel
              </Text>
            </TouchableOpacity>
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  tip: {
    position: "absolute",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  sheetTitle: { fontWeight: "700", marginBottom: 8, fontSize: 16 },
  sheetItem: {
    paddingVertical: 16,
    borderRadius: 12,
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  cancelItem: {
    marginTop: 8,
    backgroundColor: "gray",
  },
});
