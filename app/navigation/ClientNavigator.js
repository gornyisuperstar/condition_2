import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import TicketManagement from "../screens/Client/TicketManagement"; // ⚠️ проверь путь
import OrganizationProfileScreen from "../screens/User/OrganizationProfileScreen";
import AnalyticsScreen from "../screens/Client/AnalyticsScreen";
import ClientMapScreen from "../screens/Client/ClientMapScreen";
import TicketDetailScreen from "../screens/User/TicketDetailScreen";
import colors from "../constants/colors";
import Ionicons from "react-native-vector-icons/Ionicons";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// 👉 табы организации
function ClientTabs() {
  return (
    <Tab.Navigator
      initialRouteName="ManageTickets"
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === "Map") iconName = "map-outline";
          else if (route.name === "ManageTickets") iconName = "construct-outline";
          else if (route.name === "Analytics") iconName = "analytics-outline";
          else iconName = "person-outline";
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: "gray",
      })}
    >
      <Tab.Screen
        name="Map"
        component={ClientMapScreen}
        options={{ title: "Map" }}
      />
      <Tab.Screen
        name="ManageTickets"
        component={TicketManagement}
        options={{ title: "Tickets" }}
      />
      <Tab.Screen
        name="Analytics"
        component={AnalyticsScreen}
        options={{ title: "Analytics" }}
      />
      <Tab.Screen
        name="Profile"
        component={OrganizationProfileScreen}
        options={{ title: "Profile" }}
      />
    </Tab.Navigator>
  );
}

// 👉 стек: табы + экран деталей
export default function ClientNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ClientTabs"
        component={ClientTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="TicketDetail"
        component={TicketDetailScreen}
        options={{ title: "Ticket Detail" }}
      />
    </Stack.Navigator>
  );
}
