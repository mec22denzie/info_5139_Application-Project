// User Detail Screen
// Allows admins to view a user's info, disable/enable their account, and change their role.

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getUserById, disableUser, enableUser, changeUserRole } from "../services/adminService";
import { auth } from "../services/FirebaseConfig";
import { logError } from "../services/errorLogger";
import { showAlert } from "../utils/alert";

// Available roles an admin can assign
const ROLES = ["Student", "Donor", "Admin"];

export default function UserDetailScreen({ route, navigation }) {
  const { userId } = route.params;
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch user data on mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await getUserById(userId);
        setUser(data);
      } catch (error) {
        logError(error, { screen: "UserDetailScreen" });
        showAlert("Error", "Failed to load user details.");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [userId]);

  // Toggle account status (disable/enable)
  const handleToggleStatus = () => {
    const isDisabled = user.status === "disabled";
    const actionLabel = isDisabled ? "enable" : "disable";

    showAlert(
      `${isDisabled ? "Enable" : "Disable"} Account`,
      `Are you sure you want to ${actionLabel} this user's account?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          style: isDisabled ? "default" : "destructive",
          onPress: async () => {
            try {
              setActionLoading(true);
              const adminUid = auth.currentUser.uid;
              if (isDisabled) {
                await enableUser(userId, adminUid);
              } else {
                await disableUser(userId, adminUid);
              }
              // Refresh user data
              const updated = await getUserById(userId);
              setUser(updated);
              showAlert("Success", `Account ${actionLabel}d successfully.`);
            } catch (error) {
              logError(error, { screen: "UserDetailScreen", metadata: { action: actionLabel } });
              showAlert("Error", `Failed to ${actionLabel} account.`);
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  // Change user role with confirmation
  const handleChangeRole = (newRole) => {
    if (newRole === user.role) return;

    showAlert(
      "Change Role",
      `Change role from "${user.role}" to "${newRole}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            try {
              setActionLoading(true);
              const adminUid = auth.currentUser.uid;
              await changeUserRole(userId, newRole, adminUid);
              const updated = await getUserById(userId);
              setUser(updated);
              showAlert("Success", `Role changed to ${newRole}.`);
            } catch (error) {
              logError(error, { screen: "UserDetailScreen", metadata: { action: "changeRole", newRole } });
              showAlert("Error", "Failed to change role.");
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1E6F60" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>User not found.</Text>
      </View>
    );
  }

  const isDisabled = user.status === "disabled";
  const isSelf = auth.currentUser?.uid === userId;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Action loading overlay */}
      {actionLoading && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#1E6F60" />
        </View>
      )}

      {/* User info card */}
      <View style={styles.infoCard}>
        <Ionicons name="person-circle" size={64} color="#1E6F60" style={{ alignSelf: "center", marginBottom: 12 }} />
        <InfoRow label="Name" value={`${user.firstName || "—"} ${user.lastName || ""}`} />
        <InfoRow label="Email" value={user.email || "—"} />
        <InfoRow label="Role" value={user.role || "Unknown"} />
        <InfoRow label="Status" value={isDisabled ? "Disabled" : "Active"} />
        <InfoRow label="User ID" value={userId} />
        {user.createdAt && (
          <InfoRow
            label="Joined"
            value={typeof user.createdAt === "number"
              ? new Date(user.createdAt).toLocaleDateString()
              : "—"}
          />
        )}
      </View>

      {/* Prevent admins from modifying their own account */}
      {isSelf ? (
        <View style={styles.selfWarning}>
          <Ionicons name="information-circle" size={20} color="#FF9500" />
          <Text style={styles.selfWarningText}>You cannot modify your own account from here.</Text>
        </View>
      ) : (
        <>
          {/* Disable / Enable toggle */}
          <Text style={styles.sectionTitle}>Account Status</Text>
          <TouchableOpacity
            style={[styles.actionBtn, isDisabled ? styles.enableBtn : styles.disableBtn]}
            onPress={handleToggleStatus}
            disabled={actionLoading}
          >
            <Ionicons name={isDisabled ? "checkmark-circle" : "close-circle"} size={20} color="#fff" />
            <Text style={styles.actionBtnText}>
              {isDisabled ? "Enable Account" : "Disable Account"}
            </Text>
          </TouchableOpacity>

          {/* Role change */}
          <Text style={styles.sectionTitle}>Change Role</Text>
          <View style={styles.roleContainer}>
            {ROLES.map((r) => (
              <TouchableOpacity
                key={r}
                style={[styles.roleBtn, user.role === r && styles.roleBtnActive]}
                onPress={() => handleChangeRole(r)}
                disabled={actionLoading || user.role === r}
              >
                <Text style={[styles.roleText, user.role === r && styles.roleTextActive]}>
                  {r}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}

// Helper component for displaying a label-value row
function InfoRow({ label, value }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f4f6", padding: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorText: { fontSize: 16, color: "#999" },
  overlay: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(255,255,255,0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  infoLabel: { fontSize: 14, color: "#666", fontWeight: "500" },
  infoValue: { fontSize: 14, color: "#222", fontWeight: "600", maxWidth: "60%", textAlign: "right" },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#333", marginBottom: 10, marginTop: 4 },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 20,
  },
  actionBtnText: { color: "#fff", fontWeight: "600", fontSize: 16, marginLeft: 8 },
  disableBtn: { backgroundColor: "#FF3B30" },
  enableBtn: { backgroundColor: "#34C759" },
  roleContainer: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  roleBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#ccc",
    alignItems: "center",
    marginHorizontal: 4,
    backgroundColor: "#fff",
  },
  roleBtnActive: { borderColor: "#1E6F60", backgroundColor: "#E8F5E9" },
  roleText: { fontSize: 15, color: "#666", fontWeight: "500" },
  roleTextActive: { color: "#1E6F60", fontWeight: "700" },
  selfWarning: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF8E1",
    padding: 14,
    borderRadius: 12,
  },
  selfWarningText: { marginLeft: 8, color: "#666", fontSize: 14, flex: 1 },
});
