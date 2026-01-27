//React and React Native imports
import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { View, ActivityIndicator } from 'react-native';
// Firebase imports
import { auth } from "./src/services/FirebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
// Import Screens
import LoginScreen from "./src/screens/loginScreen";
import SignUpScreen from "./src/screens/SignUpScreen";
import ProductDetailScreen from "./src/screens/ProductDetailScreen";
import AddressesScreen from "./src/screens/AddressesScreen";
import PaymentScreen from "./src/screens/PaymentScreen";
import CheckoutScreen from "./src/screens/CheckoutScreen";
import OrdersScreen from "./src/screens/OrdersScreen";
import AboutScreen from "./src/screens/AboutScreen";
import HelpScreen from "./src/screens/HelpScreen";
import WishlistScreen from "./src/screens/WishlistScreen";
import HomeTabs from "./src/navigation/Home";
// Create Stack Navigator
const Stack = createNativeStackNavigator();

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false); 
  const [loading, setLoading] = useState(true);

  // Monitor Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setLoggedIn(!!user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);
  // Show loading indicator while checking auth state
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#00A34A" />
      </View>
    );
  }

  //Return Screens
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: true, headerTitleAlign: "center", headerTintColor: "#FFFFFF", headerStyle: { backgroundColor: "#1E6F60" }, fontWeight: "bold", fontSize: 20, }}>
        {!loggedIn ? (
          <>
          {/* Screens for unauthenticated users */}
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="SignUp" component={SignUpScreen} options={{ headerShown: false }} />
          </>
        ) : (
          <>
          {/* Screens for authenticated users */}
            <Stack.Screen name="HomeTabs" component={HomeTabs} options={{ headerShown: false }} />
            <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
            <Stack.Screen name="Addresses" component={AddressesScreen} />
            <Stack.Screen name="Payment" component={PaymentScreen} />
            <Stack.Screen name="Checkout" component={CheckoutScreen} />
            <Stack.Screen name="Orders" component={OrdersScreen} />
            <Stack.Screen name="About" component={AboutScreen} />
            <Stack.Screen name="HelpSupport" component={HelpScreen} />
            <Stack.Screen name="Wishlist" component={WishlistScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
