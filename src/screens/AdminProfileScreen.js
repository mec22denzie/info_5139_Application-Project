// Admin Profile Screen
// Displays admin info with menu options and logout.

import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { auth } from "../services/FirebaseConfig";
import { signOut } from "firebase/auth";

export default function AdminProfileScreen({ navigation }) {
  const [activeItem, setActiveItem] = useState(null);

  // Get current authenticated user
  const user = auth.currentUser;
  const displayName = user?.displayName || user?.email || "Admin";

  // Logout function
  const handleLogout = () => {
    signOut(auth).catch((error) => console.error(error));
  };

  // Menu items for admin profile
  const menuItems = [
    { name: "HelpSupport", label: "Help & Support", icon: "help-circle" },
    { name: "About", label: "About", icon: "information-circle" },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Admin info card */}
      <View style={styles.userInfo}>
        <Text style={styles.title}>Welcome, {"\n"} {displayName}!</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleBadgeText}>Admin</Text>
        </View>
      </View>

      {/* Menu items */}
      {menuItems.map((item) => (
        <TouchableOpacity
          key={item.name}
          style={styles.item}
          onPress={() => {
            setActiveItem(item.name);
            navigation.navigate(item.name);
          }}
        >
          <Ionicons
            name={activeItem === item.name ? item.icon : item.icon + "-outline"}
            size={22}
            color="#00A34A"
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20 },
  title: {
    fontSize: 28,
    fontWeight: "600",
    marginBottom: 12,
    textAlign: "center",
    color: "#222",
  },
  userInfo: {
    backgroundColor: "#5FB8A1",
    padding: 30,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  roleBadge: {
    backgroundColor: "#EDE7F6",
    paddingVertical: 4,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  roleBadgeText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#5856D6",
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: "#fafafa",
  },
  icon: { marginRight: 15 },
  itemText: { fontSize: 17, color: "#333", fontWeight: "500" },
  logout: {
    marginTop: 30,
    backgroundColor: "#1E6F60",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  logoutText: { color: "#fff", fontWeight: "600", fontSize: 17 },
});
