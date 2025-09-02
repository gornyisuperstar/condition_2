import React from "react";
import { View, Text, Button, Alert } from "react-native";
import { auth } from "../../../firebase";
import { sendEmailVerification, signOut } from "firebase/auth";

export default function VerifyEmailScreen() {
  const resendEmail = async () => {
    try {
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
        Alert.alert("Success", "Verification email sent again.");
      }
    } catch (e) {
      Alert.alert("Error", e.message);
    }
  };

  const backToLogin = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      Alert.alert("Error", e.message);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ marginBottom: 20 }}>
        Please verify your email before continuing
      </Text>
      <Button title="Resend email" onPress={resendEmail} />
      <View style={{ height: 12 }} />
      <Button title="Back to Login" onPress={backToLogin} />
    </View>
  );
}
