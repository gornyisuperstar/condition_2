import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import AdminPanel from "../screens/Client/AdminPanel";
import TicketManagement from "../screens/Client/TicketManagement";
import ProfileScreen from "../screens/User/ProfileScreen";
import Ionicons from "react-native-vector-icons/Ionicons";
import MapScreen from "../screens/User/MapScreen";

const Tab = createBottomTabNavigator();

export default function AdminNavigator() {
  return (
    <Tab.Navigator initialRouteName="Map"
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === "Panel") iconName = "grid-outline";
          else if (route.name === "Tickets") iconName = "construct-outline";
          else iconName = "person-outline";
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "blue",
        tabBarInactiveTintColor: "gray",
      })}
    >
        <Tab.Screen name="Map" component={MapScreen} />
        <Tab.Screen name="Panel" component={AdminPanel} />
        <Tab.Screen name="Tickets" component={TicketManagement} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
