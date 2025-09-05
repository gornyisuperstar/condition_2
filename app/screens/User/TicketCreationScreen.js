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

import { db, auth } from "../../../firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { api } from "../../utils/serverConfig";

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

  // ✅ Создание тикета в Firestore + assignOrgCode на сервере
  const createTicket = async ({ description = "", coords, imageUrl = null }) => {
    try {
      const user = auth.currentUser;
      const docRef = await addDoc(collection(db, "tickets"), {
        description,
        latitude: coords.latitude,
        longitude: coords.longitude,
        imageUrl,
        status: "Open",
        priority: "Low",
        createdBy: user?.uid || null,
        createdAt: serverTimestamp(),
      });

      // присваиваем orgCode через сервер
      await api("/assignOrgCode", {
        method: "POST",
        body: JSON.stringify({
          ticketId: docRef.id,
          latitude: coords.latitude,
          longitude: coords.longitude,
        }),
      });

      Alert.alert("✅ Ticket created");
    } catch (e) {
      Alert.alert("Error", e.message);
    }
  };

  const proceedToForm = ({
    imageUri = null,
    base64 = null,
    mime = "jpg",
    coords,
  }) => {
    // здесь можно грузить картинку на сервер /upload
    // пока для примера отправляем тикет без фото
    createTicket({ coords, imageUrl: null });
    navigation.goBack();
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
                proceedToForm({ coords });
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
                proceedToForm({ coords });
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
      <SafeAreaView edges={["top"]} style={[styles.center, { backgroundColor: isDark ? "#111" : "#fff" }]}>
        <Text style={{ color: isDark ? "#fff" : "#111" }}>Loading your location...</Text>
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
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: isDark ? "#111" : "#fff" }}>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
});
