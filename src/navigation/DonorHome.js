//React and React Native imports
import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
// Import Donor Screens
import MyListingsScreen from "../screens/MyListingsScreen";
import PostItemScreen from "../screens/PostItemScreen";
import DonorProfileScreen from "../screens/DonorProfileScreen";

// Creating a Bottom Tab Navigator instance for Donor
const Tab = createBottomTabNavigator();

// Main component for the donor bottom tab navigation
export default function DonorHomeTabs({ navigation }) {
  const [fontsLoaded] = useFonts({
    ...Ionicons.font,
  });

  if (!fontsLoaded) return null;

  // Configuring the Tab Navigator for Donor
  return (
    <Tab.Navigator
      initialRouteName="MyListings"
      screenOptions={({ route }) => ({
        headerShown: true,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          //Render Icons
          if (route.name === "MyListings") iconName = focused ? "list" : "list-outline";
          else if (route.name === "PostItem") iconName = focused ? "add-circle" : "add-circle-outline";
          else if (route.name === "DonorProfile") iconName = focused ? "person" : "person-outline";

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
      {/* Defining individual screens in the Donor Tab Navigator */}
      <Tab.Screen name="MyListings" component={MyListingsScreen} options={{ title: "My Listings", headerTitleAlign: "left", headerTintColor: "#FFFFFF", headerStyle: { backgroundColor: "#1E6F60" } }} />
      <Tab.Screen name="PostItem" component={PostItemScreen} options={{ title: "Post Item", headerTitleAlign: "left", headerTintColor: "#FFFFFF", headerStyle: { backgroundColor: "#1E6F60" } }} />
      <Tab.Screen name="DonorProfile" component={DonorProfileScreen} options={{ title: "Profile", headerTitleAlign: "left", headerTintColor: "#FFFFFF", headerStyle: { backgroundColor: "#1E6F60" } }} />
    </Tab.Navigator>
  );
}
