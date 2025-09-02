// app/navigation/UserNavigator.js
import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Ionicons from "react-native-vector-icons/Ionicons";
import colors from "../constants/colors";

import TicketCreationScreen from "../screens/User/TicketCreationScreen";
import TicketFormScreen from "../screens/User/TicketFormScreen";
import TicketListScreen from "../screens/User/TicketListScreen";
import TicketDetailScreen from "../screens/User/TicketDetailScreen";
import ProfileScreen from "../screens/User/ProfileScreen";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function CreateStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TicketCreation" component={TicketCreationScreen} />
      <Stack.Screen name="TicketForm" component={TicketFormScreen} />
    </Stack.Navigator>
  );
}

function TicketsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="TicketList"
        component={TicketListScreen}
        options={{ title: "Tickets" }}
      />
      <Stack.Screen
        name="TicketDetail"
        component={TicketDetailScreen}
        options={{ title: "Ticket" }}
      />
    </Stack.Navigator>
  );
}

export default function UserNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="Create"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          let icon = "person-outline";
          if (route.name === "Create") icon = "add-circle-outline";
          else if (route.name === "TicketsTab") icon = "list-outline";
          else if (route.name === "Profile") icon = "person-outline";
          return <Ionicons name={icon} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors?.primary || "blue",
        tabBarInactiveTintColor: "gray",
      })}
    >
      <Tab.Screen name="Create" component={CreateStack} options={{ title: "Create" }} />
      <Tab.Screen name="TicketsTab" component={TicketsStack} options={{ title: "Tickets" }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: "Profile" }} />
    </Tab.Navigator>
  );
}
