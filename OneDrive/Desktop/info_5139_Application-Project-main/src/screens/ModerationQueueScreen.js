// Moderation Queue Screen
// Shows admins all pending reports, sorted by date. Tap a report to review it.

import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getAllReports } from "../services/moderationService";
import { logError } from "../services/errorLogger";

// Status badge colors
const STATUS_COLORS = {
  pending: "#FF9500",
  dismissed: "#8E8E93",
  removed: "#FF3B30",
};

export default function ModerationQueueScreen({ navigation }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("pending");

  // Fetch all reports from Firestore
  const fetchReports = async () => {
    try {
      const data = await getAllReports();
      setReports(data);
    } catch (error) {
      logError(error, { screen: "ModerationQueueScreen" });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // Refresh when navigating back from detail screen
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      fetchReports();
    });
    return unsubscribe;
  }, [navigation]);

  // Pull-to-refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchReports();
  }, []);

  // Filter reports by status
  const filteredReports = reports.filter((r) => filter === "all" || r.status === filter);

  // Format the timestamp for display
  const formatDate = (timestamp) => {
    if (!timestamp) return "—";
    // Firestore Timestamps have a toDate() method
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Render a single report row
  const renderReport = ({ item }) => (
    <TouchableOpacity
      style={styles.reportCard}
      onPress={() => navigation.navigate("ModerationDetail", { reportId: item.id, report: item })}
    >
      <View style={styles.reportHeader}>
        <Text style={styles.productName} numberOfLines={1}>{item.productName || "Unknown Product"}</Text>
        <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status] || "#ccc" }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      <Text style={styles.reason}>Reason: {item.reason}</Text>
      {item.description ? <Text style={styles.description} numberOfLines={2}>{item.description}</Text> : null}
      <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1E6F60" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Filter pills */}
      <View style={styles.filters}>
        {["pending", "dismissed", "removed", "all"].map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterPill, filter === f && styles.filterPillActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Results count */}
      <Text style={styles.resultCount}>
        {filteredReports.length} report{filteredReports.length !== 1 ? "s" : ""}
      </Text>

      {/* Report list */}
      <FlatList
        data={filteredReports}
        keyExtractor={(item) => item.id}
        renderItem={renderReport}
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1E6F60" />}
        ListEmptyComponent={
          <View style={styles.center}>
            <Ionicons name="checkmark-circle-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No reports found.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f4f6", padding: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 40 },
  filters: { flexDirection: "row", marginBottom: 12 },
  filterPill: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ccc",
    marginRight: 8,
    backgroundColor: "#fff",
  },
  filterPillActive: { borderColor: "#1E6F60", backgroundColor: "#E8F5E9" },
  filterText: { fontSize: 13, color: "#666" },
  filterTextActive: { color: "#1E6F60", fontWeight: "700" },
  resultCount: { fontSize: 13, color: "#999", marginBottom: 8 },
  reportCard: {
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
  reportHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  productName: { fontSize: 16, fontWeight: "600", color: "#222", flex: 1, marginRight: 8 },
  statusBadge: { paddingVertical: 2, paddingHorizontal: 10, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: "600", color: "#fff" },
  reason: { fontSize: 13, color: "#666", marginBottom: 4 },
  description: { fontSize: 13, color: "#999", marginBottom: 4 },
  date: { fontSize: 12, color: "#aaa" },
  emptyText: { fontSize: 16, color: "#999", marginTop: 12 },
});
