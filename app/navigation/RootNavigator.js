import React, { useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import MapScreen from "../screens/User/MapScreen";
import TicketCreationScreen from "../screens/User/TicketCreationScreen";
import RegistrationScreen from "../screens/Auth/RegistrationScreen";
import LoginScreen from "../screens/Auth/LoginScreen";

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const [isLoggedIn, setIsLoggedIn] = useState(true);

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Map">
        <Stack.Screen name="Map" options={{ headerShown: false }}>
      
          {props => <MapScreen {...props} isLoggedIn={isLoggedIn} />}
        </Stack.Screen>
        <Stack.Screen name="TicketCreation" component={TicketCreationScreen} />
        <Stack.Screen name="Login">
          {props => <LoginScreen {...props} onLogin={() => setIsLoggedIn(true)} />}
        </Stack.Screen>
        <Stack.Screen name="Register" component={RegistrationScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}