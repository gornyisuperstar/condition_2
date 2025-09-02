import React, { useEffect, useState } from "react";
import { View, Text, Alert, StyleSheet, Platform, Modal, TouchableOpacity, SafeAreaView, ActionSheetIOS } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import { useTheme } from "../../context/ThemeContext";  // ✅ правильный импорт

export default function TicketCreationScreen({ navigation }) {
  const { appTheme } = useTheme();                      // ✅ получаем тему из провайдера
  const isDark = appTheme === "dark";

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

  const proceedToForm = (imageUri = null, coords) => {
    navigation.navigate("TicketForm", { pin: coords, imageUri });
  };

  const openChooser = (coords) => {
    setPendingCoords(coords);
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: "Add a photo",
          options: ["Take photo", "Choose from library", "Without photo", "Cancel"],
          cancelButtonIndex: 3,
          userInterfaceStyle: isDark ? "dark" : "light",
        },
        async (idx) => {
          if (idx === 0) {
            const p = await ImagePicker.requestCameraPermissionsAsync();
            if (p.status !== "granted") return;
            const res = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.85 });
            if (!res.canceled && res.assets?.[0]?.uri) proceedToForm(res.assets[0].uri, coords);
            else proceedToForm(null, coords);
          } else if (idx === 1) {
            const p = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (p.status !== "granted") return;
            const res = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, quality: 0.85 });
            if (!res.canceled && res.assets?.[0]?.uri) proceedToForm(res.assets[0].uri, coords);
            else proceedToForm(null, coords);
          } else if (idx === 2) {
            proceedToForm(null, coords);
          }
        }
      );
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
      <RNSafeAreaView edges={["top"]} style={[styles.center, { backgroundColor: isDark ? "#111" : "#fff" }]}>
        <Text style={{ color: isDark ? "#fff" : "#111" }}>Loading your location...</Text>
      </RNSafeAreaView>
    );
  }

  const initialRegion = {
    latitude: location.latitude,
    longitude: location.longitude,
    latitudeDelta: 0.004,
    longitudeDelta: 0.004,
  };

  return (
    <RNSafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: isDark ? "#111" : "#fff" }}>
      {/* ВАЖНО: карта не absoluteFill, а flex:1, чтобы учитывать safe-area сверху */}
      <MapView style={{ flex: 1 }} initialRegion={initialRegion} onPress={onMapPress} showsUserLocation>
        {pin && <Marker coordinate={pin} />}
      </MapView>

      <View
        style={[
          styles.tip,
          { backgroundColor: isDark ? "#1b1b1b" : "#f4f4f5", borderColor: isDark ? "#2a2a2a" : "#e5e7eb" },
        ]}
      >
        <Text style={{ color: isDark ? "#e5e7eb" : "#374151" }}>
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
          <SafeAreaView style={[styles.sheet, { backgroundColor: isDark ? "#1b1b1b" : "#fff" }]}>
            <Text style={[styles.sheetTitle, { color: isDark ? "#fff" : "#111" }]}>Add a photo</Text>

            <TouchableOpacity
              style={styles.sheetItem}
              onPress={async () => {
                const p = await ImagePicker.requestCameraPermissionsAsync();
                if (p.status === "granted") {
                  const res = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.85 });
                  if (!res.canceled && res.assets?.[0]?.uri) proceedToForm(res.assets[0].uri, pendingCoords);
                  else proceedToForm(null, pendingCoords);
                }
                setChooserVisible(false);
              }}
            >
              <Text style={{ color: isDark ? "#fff" : "#111" }}>Take photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sheetItem}
              onPress={async () => {
                const p = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (p.status === "granted") {
                  const res = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, quality: 0.85 });
                  if (!res.canceled && res.assets?.[0]?.uri) proceedToForm(res.assets[0].uri, pendingCoords);
                  else proceedToForm(null, pendingCoords);
                }
                setChooserVisible(false);
              }}
            >
              <Text style={{ color: isDark ? "#fff" : "#111" }}>Choose from library</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sheetItem, { backgroundColor: isDark ? "#2a2a2a" : "#f3f4f6" }]}
              onPress={() => {
                setChooserVisible(false);
                proceedToForm(null, pendingCoords);
              }}
            >
              <Text style={{ color: isDark ? "#fff" : "#111" }}>Without photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sheetItem, { backgroundColor: isDark ? "#2a2a2a" : "#f3f4f6" }]}
              onPress={() => setChooserVisible(false)}
            >
              <Text style={{ color: isDark ? "#fff" : "#111" }}>Cancel</Text>
            </TouchableOpacity>
          </SafeAreaView>
        </View>
      </Modal>
    </RNSafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  tip: {
    position: "absolute",
    left: 16,
    right: 16,
    top: 12,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "flex-end" },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 12, paddingBottom: 12, paddingHorizontal: 16 },
  sheetTitle: { fontWeight: "700", marginBottom: 8, fontSize: 16 },
  sheetItem: { paddingVertical: 16, borderRadius: 12, paddingHorizontal: 10, marginBottom: 8 },
});
