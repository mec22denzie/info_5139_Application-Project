// Notifications Screen
// Displays all notifications for the current user with real-time updates.
// Users can tap to mark as read, or mark all as read at once.

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { auth } from "../services/FirebaseConfig";
import {
  subscribeToNotifications,
  markAsRead,
  markAllAsRead,
} from "../services/notificationService";
import { logError } from "../services/errorLogger";

// Icon mapping for notification types
const TYPE_ICONS = {
  order_placed: "bag-check",
  order_status_update: "refresh-circle",
  listing_removed: "trash",
  report_dismissed: "checkmark-circle",
  account_disabled: "close-circle",
  account_enabled: "checkmark-circle",
  role_changed: "swap-horizontal",
  cart_added: "cart",
};

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToNotifications(auth.currentUser.uid, (data) => {
      setNotifications(data);
      setLoading(false);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Mark a single notification as read on tap
  const handleTap = async (item) => {
    if (!item.read) {
      try {
        await markAsRead(item.id);
      } catch (error) {
        logError(error, { screen: "NotificationsScreen", metadata: { action: "markAsRead" } });
      }
    }
  };

  // Mark all notifications as read
  const handleMarkAllRead = async () => {
    if (!auth.currentUser) return;
    try {
      await markAllAsRead(auth.currentUser.uid);
    } catch (error) {
      logError(error, { screen: "NotificationsScreen", metadata: { action: "markAllAsRead" } });
    }
  };

  // Format timestamp for display
  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Render a single notification item
  const renderItem = ({ item }) => {
    const iconName = TYPE_ICONS[item.type] || "notifications";
    return (
      <TouchableOpacity
        style={[styles.notifCard, !item.read && styles.unread]}
        onPress={() => handleTap(item)}
        activeOpacity={0.7}
      >
        <View style={styles.iconContainer}>
          <Ionicons name={iconName} size={24} color={item.read ? "#999" : "#1E6F60"} />
        </View>
        <View style={styles.content}>
          <Text style={[styles.notifTitle, !item.read && styles.unreadText]}>{item.title}</Text>
          <Text style={styles.notifMessage} numberOfLines={2}>{item.message}</Text>
          <Text style={styles.notifTime}>{formatDate(item.createdAt)}</Text>
        </View>
        {!item.read && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1E6F60" />
      </View>
    );
  }

  const hasUnread = notifications.some((n) => !n.read);

  return (
    <View style={styles.container}>
      {/* Mark all as read button */}
      {hasUnread && (
        <TouchableOpacity style={styles.markAllBtn} onPress={handleMarkAllRead}>
          <Ionicons name="checkmark-done" size={18} color="#1E6F60" />
          <Text style={styles.markAllText}>Mark all as read</Text>
        </TouchableOpacity>
      )}

      {/* Notification list */}
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={
          <View style={styles.center}>
            <Ionicons name="notifications-off-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No notifications yet.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f4f6", padding: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 40 },
  markAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-end",
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  markAllText: { color: "#1E6F60", fontWeight: "600", fontSize: 14, marginLeft: 4 },
  notifCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  unread: {
    backgroundColor: "#F0FAF7",
    borderLeftWidth: 3,
    borderLeftColor: "#1E6F60",
  },
  iconContainer: { marginRight: 12 },
  content: { flex: 1 },
  notifTitle: { fontSize: 15, fontWeight: "500", color: "#333" },
  unreadText: { fontWeight: "700", color: "#222" },
  notifMessage: { fontSize: 13, color: "#666", marginTop: 2 },
  notifTime: { fontSize: 11, color: "#aaa", marginTop: 4 },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#1E6F60",
    marginLeft: 8,
  },
  emptyText: { fontSize: 16, color: "#999", marginTop: 12 },
});
