import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Image,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Animated,
  Keyboard,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import { db, auth } from "../../../firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

export default function TicketCreationScreen({ navigation }) {
  const [location, setLocation] = useState(null);
  const [pin, setPin] = useState(null);
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [imageUri, setImageUri] = useState(null);
  const [description, setDescription] = useState("");

  // анимации
  const slideAnim = useRef(new Animated.Value(300)).current;
  const keyboardAnim = useRef(new Animated.Value(0)).current;

  // слушаем клавиатуру
  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const onKeyboardShow = (e) => {
      const height = e.endCoordinates ? e.endCoordinates.height : 300;
      const duration = e.duration ?? 250;
      Animated.timing(keyboardAnim, {
        toValue: height,
        duration,
        useNativeDriver: true,
      }).start();
    };

    const onKeyboardHide = (e) => {
      const duration = e.duration ?? 200;
      Animated.timing(keyboardAnim, {
        toValue: 0,
        duration,
        useNativeDriver: true,
      }).start();
    };

    const showSub = Keyboard.addListener(showEvent, onKeyboardShow);
    const hideSub = Keyboard.addListener(hideEvent, onKeyboardHide);

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [keyboardAnim]);

  // получаем текущее местоположение
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

  // следим за появлением фото
  useEffect(() => {
    if (imageUri) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 300,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [imageUri, slideAnim]);

  const getStartRegion = () => {
    if (!location) return null;
    return {
      latitude: location.latitude,
      longitude: location.longitude,
      latitudeDelta: 0.004,
      longitudeDelta: 0.004,
    };
  };

  const onMapPress = (event) => {
    setPin(event.nativeEvent.coordinate);
    setShowConfirmPopup(true);
  };

  const confirmPin = () => {
    setShowConfirmPopup(false);
    setShowPhotoModal(true);
  };
  const cancelPin = () => {
    setPin(null);
    setShowConfirmPopup(false);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission denied", "Gallery permission is required");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
      setShowPhotoModal(false);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission denied", "Camera permission is required");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
      setShowPhotoModal(false);
    }
  };

  const createTicket = async () => {
    if (!pin) {
      Alert.alert("Error", "Please select issue location on the map");
      return;
    }

    try {
      await addDoc(collection(db, "tickets"), {
        description: description || "No description",
        latitude: pin.latitude,
        longitude: pin.longitude,
        imageUri: imageUri || null,
        status: "new",
        createdAt: serverTimestamp(),
        createdBy: auth.currentUser?.uid || null,
      });

      Alert.alert("Ticket created!", "Thank you for your report");

      // очистка состояния
      setPin(null);
      setImageUri(null);
      setDescription("");

      // редирект на главную вкладку (Map)
      navigation.navigate("Map");
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  if (!location) {
    return (
      <View style={styles.center}>
        <Text>Loading your location...</Text>
      </View>
    );
  }

  const startRegion = getStartRegion();
  const translateY = Animated.add(slideAnim, Animated.multiply(keyboardAnim, -1));

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
    >
      <View style={styles.container}>
        <MapView
          style={styles.map}
          initialRegion={startRegion}
          onPress={onMapPress}
          showsUserLocation
        >
          {pin && <Marker coordinate={pin} />}
        </MapView>

        <View style={styles.instructionBox}>
          <Text style={styles.instructionText}>
            Drop a pin on the map to report an issue location
          </Text>
        </View>

        {/* Popup confirmation */}
        {showConfirmPopup && (
          <View style={styles.confirmPopup}>
            <Text style={{ marginBottom: 10 }}>Fix the issue location?</Text>
            <View style={styles.popupButtons}>
              <TouchableOpacity onPress={confirmPin} style={styles.popupButton}>
                <Text style={styles.popupButtonText}>Yes</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={cancelPin} style={styles.popupButton}>
                <Text style={styles.popupButtonText}>No</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Photo modal */}
        <Modal
          animationType="slide"
          transparent
          visible={showPhotoModal}
          onRequestClose={() => setShowPhotoModal(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1, justifyContent: "flex-end" }}
            keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={{ fontWeight: "bold", marginBottom: 10 }}>Add a photo</Text>
                <TouchableOpacity onPress={takePhoto} style={styles.modalButton}>
                  <Text>Take photo</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={pickImage} style={styles.modalButton}>
                  <Text>Choose from library</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setShowPhotoModal(false)}
                  style={[styles.modalButton, { backgroundColor: "#ccc" }]}
                >
                  <Text>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* Фото + описание */}
        <Animated.View
          pointerEvents={imageUri ? "auto" : "none"}
          style={[
            styles.photoContainer,
            { transform: [{ translateY: translateY }] },
          ]}
        >
          {imageUri ? (
            <ScrollView
              contentContainerStyle={{ paddingBottom: 20 }}
              keyboardShouldPersistTaps="handled"
            >
              <Image source={{ uri: imageUri }} style={styles.photoPreview} />
              <TextInput
                style={styles.descriptionInput}
                placeholder="Describe and detailize the issue (optional)"
                multiline
                value={description}
                onChangeText={setDescription}
                returnKeyType="done"
                blurOnSubmit={true}
              />
              <TouchableOpacity onPress={createTicket} style={styles.submitButton}>
                <Text style={styles.submitButtonText}>Create Ticket</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setImageUri(null);
                  setDescription("");
                }}
                style={[styles.submitButton, { marginTop: 8, backgroundColor: "#ccc" }]}
              >
                <Text style={{ color: "#000" }}>Remove photo</Text>
              </TouchableOpacity>
            </ScrollView>
          ) : null}
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  map: { flex: 1 },
  confirmPopup: {
    position: "absolute",
    bottom: 140,
    left: 20,
    right: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 14,
    elevation: 4,
    alignItems: "center",
  },
  popupButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "60%",
  },
  popupButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  popupButtonText: { color: "#fff", fontWeight: "bold" },

  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalButton: {
    paddingVertical: 15,
    alignItems: "center",
    borderBottomColor: "#ddd",
    borderBottomWidth: 1,
  },

  instructionBox: {
    backgroundColor: "#f0f0f0",
    padding: 17,
    borderRadius: 8,
    marginVertical: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  instructionText: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
  },

  photoContainer: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    backgroundColor: "#fff",
    padding: 12,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 6,
  },
  photoPreview: {
    width: 120,
    height: 120,
    borderRadius: 10,
    alignSelf: "center",
    marginBottom: 10,
  },
  descriptionInput: {
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    height: 100,
    marginBottom: 10,
    textAlignVertical: "top",
  },
  submitButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  submitButtonText: { color: "#fff", fontWeight: "bold" },
});
