// Report Listing Screen
// Allows students to report an inappropriate or misleading listing.

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { auth } from "../services/FirebaseConfig";
import { reportListing } from "../services/moderationService";
import { logError } from "../services/errorLogger";
import { sendToRole } from "../services/notificationService";
import { showAlert } from "../utils/alert";

// Available report reasons
const REASONS = ["Inappropriate", "Misleading", "Duplicate", "Other"];

export default function ReportListingScreen({ route, navigation }) {
  const { productId, productName } = route.params;
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  // Submit the report to Firestore
  const handleSubmit = async () => {
    if (!reason) {
      showAlert("Validation", "Please select a reason for reporting.");
      return;
    }

    if (!auth.currentUser) {
      showAlert("Error", "Please log in to report a listing.");
      return;
    }

    try {
      setLoading(true);
      const result = await reportListing(
        productId,
        productName,
        auth.currentUser.uid,
        auth.currentUser.email,
        reason,
        description.trim()
      );

      if (!result.success) {
        showAlert("Already Reported", result.message);
        return;
      }

      // Notify all admins about the new report
      await sendToRole(
        "Admin",
        "report",
        "Listing Reported",
        `"${productName}" was reported for: ${reason}`,
        { screen: "Moderation", productId }
      );

      showAlert("Report Submitted", "Thank you. Our team will review this listing.", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      logError(error, { screen: "ReportListingScreen", metadata: { productId } });
      showAlert("Error", "Failed to submit report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.title}>Report Listing</Text>
      <Text style={styles.productName}>"{productName}"</Text>

      {/* Reason selection */}
      <Text style={styles.label}>Reason *</Text>
      <View style={styles.reasonContainer}>
        {REASONS.map((r) => (
          <TouchableOpacity
            key={r}
            style={[styles.reasonBtn, reason === r && styles.reasonBtnActive]}
            onPress={() => setReason(r)}
          >
            <Text style={[styles.reasonText, reason === r && styles.reasonTextActive]}>{r}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Optional description */}
      <Text style={styles.label}>Additional Details (optional)</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Describe the issue..."
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />

      {/* Submit button */}
      <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitBtnText}>Submit Report</Text>
        )}
      </TouchableOpacity>

      {/* Cancel button */}
      <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.cancelBtnText}>Cancel</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f4f6", padding: 16 },
  title: { fontSize: 24, fontWeight: "bold", color: "#222", marginBottom: 4 },
  productName: { fontSize: 16, color: "#666", marginBottom: 20, fontStyle: "italic" },
  label: { fontSize: 15, fontWeight: "600", color: "#333", marginBottom: 8, marginTop: 12 },
  reasonContainer: { flexDirection: "row", flexWrap: "wrap", marginBottom: 8 },
  reasonBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ccc",
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: "#fff",
  },
  reasonBtnActive: { borderColor: "#FF3B30", backgroundColor: "#FFEBEE" },
  reasonText: { fontSize: 14, color: "#666" },
  reasonTextActive: { color: "#FF3B30", fontWeight: "700" },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    fontSize: 16,
    color: "#222",
  },
  textArea: { height: 100, paddingTop: 12 },
  submitBtn: {
    backgroundColor: "#FF3B30",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 24,
  },
  submitBtnText: { color: "#fff", fontWeight: "700", fontSize: 18 },
  cancelBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  cancelBtnText: { color: "#666", fontWeight: "600", fontSize: 16 },
});
