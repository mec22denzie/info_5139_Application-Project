//React and React Native imports
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
// Import Screens
import LoginScreen from "./screens/loginScreen";
import SignUpScreen from "./screens/SignUpScreen";
import HomeTabs from "./Home";

// Create Stack and Tab Navigator instances
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Stack Navigator for Authentication Screens
export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* Auth screens */}
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />

         <Stack.Screen name="HomeTabs" component={HomeTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
