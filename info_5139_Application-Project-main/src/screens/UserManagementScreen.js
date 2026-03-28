// User Management Screen
// Allows admins to view all users with search/filter and navigate to user details.

import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getAllUsers } from "../services/adminService";
import { logError } from "../services/errorLogger";

// Filter options for role
const ROLE_FILTERS = ["All", "Student", "Donor", "Admin"];

export default function UserManagementScreen({ navigation }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");

  // Fetch all users from Firestore
  const fetchUsers = async () => {
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch (error) {
      logError(error, { screen: "UserManagementScreen" });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Refresh when navigating back from UserDetail (user may have been updated)
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      fetchUsers();
    });
    return unsubscribe;
  }, [navigation]);

  // Pull-to-refresh handler
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchUsers();
  }, []);

  // Filter users by search text and role
  const filteredUsers = users.filter((user) => {
    const matchesRole = roleFilter === "All" || user.role === roleFilter;
    const searchLower = search.toLowerCase();
    const fullName = `${user.firstName || ""} ${user.lastName || ""}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchLower) ||
      (user.email || "").toLowerCase().includes(searchLower);
    return matchesRole && matchesSearch;
  });

  // Render a single user row
  const renderUser = ({ item }) => {
    const isDisabled = item.status === "disabled";
    return (
      <TouchableOpacity
        style={[styles.userCard, isDisabled && styles.userCardDisabled]}
        onPress={() => navigation.navigate("UserDetail", { userId: item.id })}
      >
        <View style={styles.userInfo}>
          <Text style={styles.userName}>
            {item.firstName || "—"} {item.lastName || ""}
          </Text>
          <Text style={styles.userEmail}>{item.email}</Text>
          <View style={styles.badges}>
            <View style={[styles.badge, styles[`badge_${item.role}`]]}>
              <Text style={styles.badgeText}>{item.role || "Unknown"}</Text>
            </View>
            {isDisabled && (
              <View style={[styles.badge, styles.badge_disabled]}>
                <Text style={styles.badgeText}>Disabled</Text>
              </View>
            )}
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#ccc" />
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
      {/* Search bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or email..."
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      {/* Role filter pills */}
      <View style={styles.filters}>
        {ROLE_FILTERS.map((r) => (
          <TouchableOpacity
            key={r}
            style={[styles.filterPill, roleFilter === r && styles.filterPillActive]}
            onPress={() => setRoleFilter(r)}
          >
            <Text style={[styles.filterText, roleFilter === r && styles.filterTextActive]}>
              {r}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Results count */}
      <Text style={styles.resultCount}>
        {filteredUsers.length} user{filteredUsers.length !== 1 ? "s" : ""}
      </Text>

      {/* User list */}
      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.id}
        renderItem={renderUser}
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1E6F60" />}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>No users found.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f4f6", padding: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 40 },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  searchInput: { flex: 1, fontSize: 16, color: "#222" },
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
  userCard: {
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
  userCardDisabled: { opacity: 0.6 },
  userInfo: { flex: 1 },
  userName: { fontSize: 16, fontWeight: "600", color: "#222" },
  userEmail: { fontSize: 13, color: "#666", marginTop: 2 },
  badges: { flexDirection: "row", marginTop: 6 },
  badge: {
    paddingVertical: 2,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginRight: 6,
  },
  badge_Student: { backgroundColor: "#E3F2FD" },
  badge_Donor: { backgroundColor: "#FFF3E0" },
  badge_Admin: { backgroundColor: "#EDE7F6" },
  badge_disabled: { backgroundColor: "#FFEBEE" },
  badgeText: { fontSize: 11, fontWeight: "600", color: "#333" },
  emptyText: { fontSize: 16, color: "#999" },
});
