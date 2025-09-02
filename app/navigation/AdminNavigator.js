// app/navigation/AdminNavigator.js
import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Ionicons from "react-native-vector-icons/Ionicons";

import AdminPanel from "../screens/Client/AdminPanel";
import TicketManagement from "../screens/Client/TicketManagement";
import ProfileScreen from "../screens/User/ProfileScreen";
import colors from "../constants/colors";

const Tab = createBottomTabNavigator();

export default function AdminNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="Panel"
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName = "grid-outline";
          if (route.name === "Panel") iconName = "grid-outline";
          else if (route.name === "Tickets") iconName = "construct-outline";
          else if (route.name === "Profile") iconName = "person-outline";
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors?.primary || "blue",
        tabBarInactiveTintColor: "gray",
      })}
    >
      <Tab.Screen
        name="Panel"
        component={AdminPanel}
        options={{ title: "Panel" }}
      />
      <Tab.Screen
        name="Tickets"
        component={TicketManagement}
        options={{ title: "Control" }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: "Profile" }}
      />
    </Tab.Navigator>
  );
}
