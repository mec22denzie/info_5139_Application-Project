//React and React Native imports
import React, { useState, useEffect } from "react";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { View, ActivityIndicator } from 'react-native';

const LightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#f4f4f6',
  },
};
// Firebase imports
import { auth, firestore } from "./src/services/FirebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
// Import Screens
import LoginScreen from "./src/screens/LoginScreen";
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
// Donor screens
import DonorHomeTabs from "./src/navigation/DonorHome";
import EditItemScreen from "./src/screens/EditItemScreen";
// Admin screens
import AdminHomeTabs from "./src/navigation/AdminHome";
import UserDetailScreen from "./src/screens/UserDetailScreen";
import { logError } from "./src/services/errorLogger";
import ReportListingScreen from "./src/screens/ReportListingScreen";
import ModerationDetailScreen from "./src/screens/ModerationDetailScreen";
import NotificationsScreen from "./src/screens/NotificationsScreen";
import ErrorBoundary from "./src/components/ErrorBoundary";
// Create Stack Navigator
const Stack = createNativeStackNavigator();

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // Monitor Firebase Auth state and fetch user role
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          let userDoc = await getDoc(doc(firestore, "users", user.uid));
          // Retry once if doc not found yet (signup may still be writing)
          if (!userDoc.exists()) {
            await new Promise((r) => setTimeout(r, 1500));
            userDoc = await getDoc(doc(firestore, "users", user.uid));
          }
          if (userDoc.exists()) {
            setUserRole(userDoc.data().role || "Student");
          } else {
            setUserRole("Student");
          }
        } catch (error) {
          logError(error, { screen: "App", metadata: { action: "fetchUserRole" } });
          setUserRole("Student");
        }
        setLoggedIn(true);
      } else {
        setLoggedIn(false);
        setUserRole(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);
  // Show loading indicator while checking auth state
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f4f4f6' }}>
        <ActivityIndicator size="large" color="#00A34A" />
      </View>
    );
  }

  //Return Screens
  return (
    <ErrorBoundary>
    <NavigationContainer theme={LightTheme}>
      <Stack.Navigator screenOptions={{ headerShown: true, headerTitleAlign: "center", headerTintColor: "#FFFFFF", headerStyle: { backgroundColor: "#1E6F60" }, fontWeight: "bold", fontSize: 20, }}>
        {!loggedIn ? (
          <>
          {/* Screens for unauthenticated users */}
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="SignUp" component={SignUpScreen} options={{ headerShown: false }} />
          </>
        ) : userRole === "Admin" ? (
          <>
          {/* Screens for authenticated Admin users */}
            <Stack.Screen name="AdminHomeTabs" component={AdminHomeTabs} options={{ headerShown: false }} />
            <Stack.Screen name="UserDetail" component={UserDetailScreen} options={{ title: "User Details" }} />
            <Stack.Screen name="ModerationDetail" component={ModerationDetailScreen} options={{ title: "Report Details" }} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: "Notifications" }} />
            <Stack.Screen name="About" component={AboutScreen} />
            <Stack.Screen name="HelpSupport" component={HelpScreen} />
          </>
        ) : userRole === "Donor" ? (
          <>
          {/* Screens for authenticated Donor users */}
            <Stack.Screen name="DonorHomeTabs" component={DonorHomeTabs} options={{ headerShown: false }} />
            <Stack.Screen name="EditItem" component={EditItemScreen} options={{ title: "Edit Item" }} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: "Notifications" }} />
            <Stack.Screen name="About" component={AboutScreen} />
            <Stack.Screen name="HelpSupport" component={HelpScreen} />
          </>
        ) : (
          <>
          {/* Screens for authenticated Student users */}
            <Stack.Screen name="HomeTabs" component={HomeTabs} options={{ headerShown: false }} />
            <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
            <Stack.Screen name="ReportListing" component={ReportListingScreen} options={{ title: "Report Listing" }} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: "Notifications" }} />
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
    </ErrorBoundary>
  );
}
