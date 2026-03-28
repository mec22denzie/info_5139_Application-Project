// Admin Bottom Tab Navigator
// Provides admin-specific tabs: Dashboard and User Management.

import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useFonts } from "expo-font";

// Import Admin Screens
import AdminDashboardScreen from "../screens/AdminDashboardScreen";
import UserManagementScreen from "../screens/UserManagementScreen";
import ModerationQueueScreen from "../screens/ModerationQueueScreen";
import ErrorLogsScreen from "../screens/ErrorLogsScreen";
import AdminProfileScreen from "../screens/AdminProfileScreen";
import NotificationBell from "../components/NotificationBell";

// Creating a Bottom Tab Navigator instance for Admin
const Tab = createBottomTabNavigator();

// Main component for the admin bottom tab navigation
export default function AdminHomeTabs({ navigation }) {
  const [fontsLoaded] = useFonts({
    ...Ionicons.font,
  });

  if (!fontsLoaded) return null;

  // Configuring the Tab Navigator for Admin
  return (
    <Tab.Navigator
      initialRouteName="Dashboard"
      screenOptions={({ route }) => ({
        headerShown: true,
        headerRight: () => <NotificationBell navigation={navigation} />,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === "Dashboard") iconName = focused ? "grid" : "grid-outline";
          else if (route.name === "Users") iconName = focused ? "people" : "people-outline";
          else if (route.name === "Moderation") iconName = focused ? "flag" : "flag-outline";
          else if (route.name === "ErrorLogs") iconName = focused ? "bug" : "bug-outline";
          else if (route.name === "AdminProfile") iconName = focused ? "person" : "person-outline";

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#00A34A",
        tabBarInactiveTintColor: "#1A1A1A",
        tabBarStyle: {
          backgroundColor: "#1E6F60",
          borderTopWidth: 0,
        },
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={AdminDashboardScreen}
        options={{
          title: "Dashboard",
          headerTitleAlign: "left",
          headerTintColor: "#FFFFFF",
          headerStyle: { backgroundColor: "#1E6F60" },
        }}
      />
      <Tab.Screen
        name="Users"
        component={UserManagementScreen}
        options={{
          title: "Users",
          headerTitleAlign: "left",
          headerTintColor: "#FFFFFF",
          headerStyle: { backgroundColor: "#1E6F60" },
        }}
      />
      <Tab.Screen
        name="Moderation"
        component={ModerationQueueScreen}
        options={{
          title: "Moderation",
          headerTitleAlign: "left",
          headerTintColor: "#FFFFFF",
          headerStyle: { backgroundColor: "#1E6F60" },
        }}
      />
      <Tab.Screen
        name="ErrorLogs"
        component={ErrorLogsScreen}
        options={{
          title: "Error Logs",
          headerTitleAlign: "left",
          headerTintColor: "#FFFFFF",
          headerStyle: { backgroundColor: "#1E6F60" },
        }}
      />
      <Tab.Screen
        name="AdminProfile"
        component={AdminProfileScreen}
        options={{
          title: "Profile",
          headerTitleAlign: "left",
          headerTintColor: "#FFFFFF",
          headerStyle: { backgroundColor: "#1E6F60" },
        }}
      />
    </Tab.Navigator>
  );
}
