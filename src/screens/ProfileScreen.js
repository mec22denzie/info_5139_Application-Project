import React, { useState } from 'react'; 
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../services/FirebaseConfig';
import { signOut } from 'firebase/auth';

// Import Screens
import LoginScreen from "./loginScreen";

// ProfileScreen component displaying user info and menu options
export default function ProfileScreen({ navigation }) {
  const [activeItem, setActiveItem] = useState(null);

 // Get current authenticated user
  const user = auth.currentUser;
  const displayName = user?.displayName || user?.email || "User";

 // Logout function: signs out the user (App.js handles navigation via auth state)
  const handleLogout = () => {
    signOut(auth).catch((error) => console.error(error));
  };

   // Menu items displayed in the profile screen
  const menuItems = [
    { name: "Orders", label: "My Orders", icon: "bag" },
    { name: "Wishlist", label: "Wishlist", icon: "heart" },
    { name: "Addresses", label: "Manage Addresses", icon: "location" },
    { name: "Payment", label: "Payment Methods", icon: "card" },
    { name: "HelpSupport", label: "Help & Support", icon: "help-circle" },
    { name: "About", label: "About", icon: "information-circle" },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Show user name */}
      <View style={styles.userInfo}>
        <Text style={styles.title}>Welcome, {"\n"} {displayName}!</Text>
      </View>

      {/* Render each menu item */}
      {menuItems.map((item) => (
        <TouchableOpacity
          key={item.name}
          style={styles.item}
          onPress={() => {
            setActiveItem(item.name);
            navigation.navigate(item.name);
          }}
        >
          {/* Icon for the menu item */}
          <Ionicons
            name={activeItem === item.name ? item.icon : item.icon + "-outline"}
            size={22}
            color="#007AFF"
            style={styles.icon}
          />
          <Text style={styles.itemText}>{item.label}</Text>
        </TouchableOpacity>
      ))}

      {/* Logout Button */}
      <TouchableOpacity style={styles.logout} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

//Style
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    marginBottom: 25,
    textAlign: 'center',
    color: '#222',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: '#fafafa',
  },
  icon: {
    marginRight: 15,
    color: '#00A34A',
  },
  itemText: {
    fontSize: 17,
    color: '#333',
    fontWeight: '500',
  },
  logout: {
    marginTop: 30,
    backgroundColor: '#1E6F60',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },

  logoutText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 17,
  },

  userInfo: {
  backgroundColor: '#5FB8A1', // light blue
  padding: 30,
  borderRadius: 12,
  marginBottom: 20,
  alignItems: 'center',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 3, // for Android shadow
},

userName: {
  fontSize: 20,
  fontWeight: 'bold',
  color: '#1A1A1A',
  textAlign: 'center',
},

});
