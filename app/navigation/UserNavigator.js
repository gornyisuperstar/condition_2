import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MapScreen from '../screens/User/MapScreen';
import MapView from 'react-native-maps';
import TicketListScreen from '../screens/User/TicketListScreen';
import ProfileScreen from '../screens/User/ProfileScreen';
import colors from '../constants/colors';
import Ionicons from 'react-native-vector-icons/Ionicons';

const Tab = createBottomTabNavigator();

export default function UserNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === 'Map') iconName = 'map-outline';
          else if (route.name === 'Tickets') iconName = 'list-outline';
          else iconName = 'person-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: 'gray',
      })}>
      <Tab.Screen
        name="TicketCreation"
        component={TicketCreationScreen}
        options={{ title: 'Create Ticket' }}
      />
      <Tab.Screen name="Map" component={MapScreen} options={{ title: 'Map' }} />
      <Tab.Screen
        name="Tickets"
        component={TicketListScreen}
        options={{ title: 'Tickets' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
}
