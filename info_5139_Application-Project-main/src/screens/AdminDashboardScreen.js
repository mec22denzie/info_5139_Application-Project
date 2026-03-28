// Admin Dashboard Screen
// Shows user statistics and quick overview of the platform.

import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, RefreshControl } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getUserStats } from "../services/adminService";
import { logError } from "../services/errorLogger";

export default function AdminDashboardScreen() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch user statistics from Firestore
  const fetchStats = async () => {
    try {
      const data = await getUserStats();
      setStats(data);
    } catch (error) {
      logError(error, { screen: "AdminDashboardScreen" });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Pull-to-refresh handler
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchStats();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1E6F60" />
      </View>
    );
  }

  // Stat card data
  const cards = [
    { label: "Total Users", value: stats?.total || 0, icon: "people", color: "#1E6F60" },
    { label: "Students", value: stats?.students || 0, icon: "school", color: "#007AFF" },
    { label: "Donors", value: stats?.donors || 0, icon: "heart", color: "#FF9500" },
    { label: "Admins", value: stats?.admins || 0, icon: "shield", color: "#5856D6" },
    { label: "Active", value: stats?.active || 0, icon: "checkmark-circle", color: "#34C759" },
    { label: "Disabled", value: stats?.disabled || 0, icon: "close-circle", color: "#FF3B30" },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1E6F60" />}
    >
      <Text style={styles.title}>Admin Dashboard</Text>

      {/* Stat cards grid */}
      <View style={styles.grid}>
        {cards.map((card) => (
          <View key={card.label} style={styles.card}>
            <Ionicons name={card.icon} size={28} color={card.color} />
            <Text style={styles.cardValue}>{card.value}</Text>
            <Text style={styles.cardLabel}>{card.label}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f4f6", padding: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 24, fontWeight: "bold", color: "#222", marginBottom: 20, textAlign: "center" },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  card: {
    width: "47%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
  },
  cardValue: { fontSize: 28, fontWeight: "bold", color: "#222", marginTop: 8 },
  cardLabel: { fontSize: 13, color: "#666", marginTop: 4 },
});
