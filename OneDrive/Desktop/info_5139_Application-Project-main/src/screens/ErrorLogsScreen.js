// Error Logs Screen
// Admin screen to browse and filter system error logs from Firestore.

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
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { firestore } from "../services/FirebaseConfig";
import { logError } from "../services/errorLogger";

// Severity filter options
const SEVERITY_FILTERS = ["all", "error", "warn", "info"];

// Severity colors and icons
const SEVERITY_CONFIG = {
  error: { color: "#FF3B30", icon: "close-circle" },
  warn: { color: "#FF9500", icon: "warning" },
  info: { color: "#007AFF", icon: "information-circle" },
};

export default function ErrorLogsScreen() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("all");
  const [expandedId, setExpandedId] = useState(null);

  // Fetch all logs from Firestore
  const fetchLogs = async () => {
    try {
      const q = query(collection(firestore, "systemLogs"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      setLogs(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (error) {
      logError(error, { screen: "ErrorLogsScreen", metadata: { action: "fetchLogs" } });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Pull-to-refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchLogs();
  }, []);

  // Filter logs by severity
  const filteredLogs = logs.filter((log) => filter === "all" || log.level === filter);

  // Format timestamp for display
  const formatDate = (timestamp) => {
    if (!timestamp) return "—";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Toggle expand/collapse for a log entry
  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  // Render a single log entry
  const renderLog = ({ item }) => {
    const config = SEVERITY_CONFIG[item.level] || SEVERITY_CONFIG.info;
    const isExpanded = expandedId === item.id;

    return (
      <TouchableOpacity style={styles.logCard} onPress={() => toggleExpand(item.id)}>
        <View style={styles.logHeader}>
          <Ionicons name={config.icon} size={20} color={config.color} />
          <Text style={styles.logMessage} numberOfLines={isExpanded ? undefined : 1}>
            {item.message}
          </Text>
        </View>
        <View style={styles.logMeta}>
          <Text style={styles.metaText}>{item.screen || "Unknown"}</Text>
          <Text style={styles.metaText}>{formatDate(item.createdAt)}</Text>
        </View>

        {/* Expanded details */}
        {isExpanded && (
          <View style={styles.details}>
            {item.code && <DetailRow label="Code" value={item.code} />}
            {item.userId && <DetailRow label="User ID" value={item.userId} />}
            {item.platform && <DetailRow label="Platform" value={item.platform} />}
            {item.appVersion && <DetailRow label="App Version" value={item.appVersion} />}
            {item.metadata && (
              <DetailRow label="Metadata" value={JSON.stringify(item.metadata, null, 2)} />
            )}
            {item.stackTrace && (
              <View style={styles.stackContainer}>
                <Text style={styles.stackLabel}>Stack Trace:</Text>
                <Text style={styles.stackText}>{item.stackTrace}</Text>
              </View>
            )}
          </View>
        )}
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

  return (
    <View style={styles.container}>
      {/* Severity filter pills */}
      <View style={styles.filters}>
        {SEVERITY_FILTERS.map((f) => (
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
        {filteredLogs.length} log{filteredLogs.length !== 1 ? "s" : ""}
      </Text>

      {/* Log list */}
      <FlatList
        data={filteredLogs}
        keyExtractor={(item) => item.id}
        renderItem={renderLog}
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1E6F60" />}
        ListEmptyComponent={
          <View style={styles.center}>
            <Ionicons name="checkmark-circle-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No errors logged.</Text>
          </View>
        }
      />
    </View>
  );
}

// Helper component for detail rows
function DetailRow({ label, value }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}:</Text>
      <Text style={styles.detailValue}>{value}</Text>
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
  logCard: {
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
  logHeader: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  logMessage: { fontSize: 14, fontWeight: "600", color: "#222", flex: 1, marginLeft: 8 },
  logMeta: { flexDirection: "row", justifyContent: "space-between" },
  metaText: { fontSize: 12, color: "#999" },
  details: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: "#f0f0f0" },
  detailRow: { flexDirection: "row", marginBottom: 4 },
  detailLabel: { fontSize: 12, color: "#666", fontWeight: "600", width: 90 },
  detailValue: { fontSize: 12, color: "#333", flex: 1 },
  stackContainer: { marginTop: 8 },
  stackLabel: { fontSize: 12, color: "#666", fontWeight: "600", marginBottom: 4 },
  stackText: { fontSize: 11, color: "#999", fontFamily: "monospace" },
  emptyText: { fontSize: 16, color: "#999", marginTop: 12 },
});
