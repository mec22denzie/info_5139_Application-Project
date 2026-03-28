// Notification Bell Component
// Displays a bell icon with an unread count badge. Uses real-time Firestore
// listener so the badge updates automatically without manual refresh.

import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { auth } from "../services/FirebaseConfig";
import { subscribeToUnreadCount } from "../services/notificationService";

export default function NotificationBell({ navigation }) {
  const [unreadCount, setUnreadCount] = useState(0);

  // Subscribe to real-time unread count on mount
  useEffect(() => {
    if (!auth.currentUser) return;

    const unsubscribe = subscribeToUnreadCount(auth.currentUser.uid, (count) => {
      setUnreadCount(count);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => navigation.navigate("Notifications")}
    >
      <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {unreadCount > 99 ? "99+" : unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginRight: 12,
    padding: 4,
  },
  badge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "#FF3B30",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
});
