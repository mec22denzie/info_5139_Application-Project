//React and React Native imports
import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
// Import Screens
import ProductListScreen from "../screens/ProductListScreen";
import CartScreen from "../screens/CartScreen";
import ProfileScreen from "../screens/ProfileScreen";

// Creating a Bottom Tab Navigator instance
const Tab = createBottomTabNavigator();

// Main component for the bottom tab navigation
export default function HomeTabs({ navigation }) {
  const [fontsLoaded] = useFonts({
    ...Ionicons.font,
  });

  if (!fontsLoaded) return null;

  // Configuring the Tab Navigator
  return (
    <Tab.Navigator
      initialRouteName="Products"
      screenOptions={({ route }) => ({
        headerShown: true,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          //Render Icons
          if (route.name === "Products") iconName = focused ? "home" : "home-outline";
          else if (route.name === "Cart") iconName = focused ? "cart" : "cart-outline";
          else if (route.name === "Profile") iconName = focused ? "person" : "person-outline";

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
      {/* Defining individual screens in the Tab Navigator */}
      <Tab.Screen name="Products" component={ProductListScreen} options={{ title: "Home", headerTitleAlign: "left", headerTintColor: "#FFFFFF", headerStyle: { backgroundColor: "#1E6F60" }, fontWeight: "bold", fontSize: 20, }} />
      <Tab.Screen name="Cart" component={CartScreen} options={{ headerTitleAlign: "left", headerTintColor: "#FFFFFF", headerStyle: { backgroundColor: "#1E6F60" }, fontWeight: "bold", fontSize: 20, }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ headerTitleAlign: "left", headerTintColor: "#FFFFFF", headerStyle: { backgroundColor: "#1E6F60" }, fontWeight: "bold", fontSize: 20, }} />
    </Tab.Navigator>
  );
}
