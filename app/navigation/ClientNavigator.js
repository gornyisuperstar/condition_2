import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import AdminPanel from "../screens/Client/AdminPanel";
import TicketManagement from "../screens/Client/TicketManagement";
import ProfileScreen from "../screens/User/ProfileScreen";
import colors from "../constants/colors";
import Ionicons from "react-native-vector-icons/Ionicons";

const Tab = createBottomTabNavigator();

export default function ClientNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === "Dashboard") iconName = "grid-outline";
          else if (route.name === "ManageTickets") iconName = "construct-outline";
          else iconName = "person-outline";
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: "gray"
      })}
    >
      <Tab.Screen name="Dashboard" component={AdminPanel} options={{ title: "Panel" }} />
      <Tab.Screen name="ManageTickets" component={TicketManagement} options={{ title: "Control" }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: "Profile" }} />
    </Tab.Navigator>
  );
}