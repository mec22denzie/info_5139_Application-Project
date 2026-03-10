// Moderation Detail Screen
// Shows full report details and product info. Admin can dismiss or remove the listing.

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getProductById, dismissReport, removeListing } from "../services/moderationService";
import { auth } from "../services/FirebaseConfig";
import { logError } from "../services/errorLogger";

export default function ModerationDetailScreen({ route, navigation }) {
  const { reportId, report } = route.params;
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch the reported product details
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const data = await getProductById(report.productId);
        setProduct(data);
      } catch (error) {
        logError(error, { screen: "ModerationDetailScreen" });
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [report.productId]);

  // Format timestamp for display
  const formatDate = (timestamp) => {
    if (!timestamp) return "—";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Dismiss the report (listing stays active)
  const handleDismiss = () => {
    Alert.alert(
      "Dismiss Report",
      "This will mark the report as dismissed. The listing will stay active.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Dismiss",
          onPress: async () => {
            try {
              setActionLoading(true);
              await dismissReport(reportId, auth.currentUser.uid);
              Alert.alert("Done", "Report dismissed.", [
                { text: "OK", onPress: () => navigation.goBack() },
              ]);
            } catch (error) {
              logError(error, { screen: "ModerationDetailScreen", metadata: { action: "dismiss" } });
              Alert.alert("Error", "Failed to dismiss report.");
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  // Remove the listing (product hidden from browse)
  const handleRemove = () => {
    Alert.alert(
      "Remove Listing",
      "This will remove the listing from the platform. This action cannot be easily undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              setActionLoading(true);
              await removeListing(reportId, report.productId, auth.currentUser.uid);
              Alert.alert("Done", "Listing removed.", [
                { text: "OK", onPress: () => navigation.goBack() },
              ]);
            } catch (error) {
              logError(error, { screen: "ModerationDetailScreen", metadata: { action: "remove" } });
              Alert.alert("Error", "Failed to remove listing.");
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

  const isPending = report.status === "pending";

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {actionLoading && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#1E6F60" />
        </View>
      )}

      {/* Report info card */}
      <Text style={styles.sectionTitle}>Report Details</Text>
      <View style={styles.card}>
        <InfoRow label="Status" value={report.status} />
        <InfoRow label="Reason" value={report.reason} />
        {report.description ? <InfoRow label="Description" value={report.description} /> : null}
        <InfoRow label="Reported At" value={formatDate(report.createdAt)} />
        <InfoRow label="Reporter ID" value={report.reportedBy} />
      </View>

      {/* Product info card */}
      <Text style={styles.sectionTitle}>Product Details</Text>
      {product ? (
        <View style={styles.card}>
          <InfoRow label="Name" value={product.name} />
          <InfoRow label="Category" value={product.category} />
          <InfoRow label="Price" value={product.isDonation ? "Free (Donation)" : `$${product.price}`} />
          <InfoRow label="Report Count" value={String(product.reportCount || 0)} />
          <InfoRow label="Status" value={product.status || "active"} />
          {product.donorEmail && <InfoRow label="Donor" value={product.donorEmail} />}
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.notFound}>Product not found or has been deleted.</Text>
        </View>
      )}

      {/* Action buttons — only show for pending reports */}
      {isPending && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.dismissBtn]}
            onPress={handleDismiss}
            disabled={actionLoading}
          >
            <Ionicons name="checkmark-circle" size={20} color="#fff" />
            <Text style={styles.actionBtnText}>Dismiss Report</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.removeBtn]}
            onPress={handleRemove}
            disabled={actionLoading}
          >
            <Ionicons name="trash" size={20} color="#fff" />
            <Text style={styles.actionBtnText}>Remove Listing</Text>
          </TouchableOpacity>
        </View>
      )}

      {!isPending && (
        <View style={styles.resolvedBanner}>
          <Ionicons name="information-circle" size={20} color="#666" />
          <Text style={styles.resolvedText}>
            This report has been {report.status}.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

// Helper component for label-value rows
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
  overlay: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(255,255,255,0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#333", marginBottom: 10, marginTop: 8 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
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
  notFound: { fontSize: 14, color: "#999", fontStyle: "italic" },
  actions: { marginTop: 8 },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  actionBtnText: { color: "#fff", fontWeight: "600", fontSize: 16, marginLeft: 8 },
  dismissBtn: { backgroundColor: "#34C759" },
  removeBtn: { backgroundColor: "#FF3B30" },
  resolvedBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F0F0",
    padding: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  resolvedText: { marginLeft: 8, color: "#666", fontSize: 14 },
});
