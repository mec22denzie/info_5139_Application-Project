import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { auth, firestore } from "../services/FirebaseConfig";
import { showAlert } from "../utils/alert";
import { logError } from "../services/errorLogger";

export default function RequestItemScreen({ navigation }) {
  const [itemName, setItemName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      if (!auth.currentUser) {
        showAlert("Error", "Please login first.");
        return;
      }

      if (!itemName.trim()) {
        showAlert("Validation", "Please enter an item name.");
        return;
      }

      if (!description.trim()) {
        showAlert("Validation", "Please enter a short description.");
        return;
      }

      setLoading(true);

      // 1. Save request
      await addDoc(collection(firestore, "itemRequests"), {
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || "Student",
        itemName: itemName.trim(),
        description: description.trim(),
        status: "open",
        createdAt: serverTimestamp(),
      });

      // 2. Create notification for the same student (confirmation notification)
      await addDoc(collection(firestore, "notifications"), {
        userId: auth.currentUser.uid,
        title: "Request Submitted",
        message: `Your request for "${itemName.trim()}" was submitted successfully.`,
        type: "request_submitted",
        read: false,
        createdAt: serverTimestamp(),
      });

      showAlert("Success", "Your item request has been posted.");

      setItemName("");
      setDescription("");

      navigation.goBack();
    } catch (error) {
      console.log("[ERROR][RequestItemScreen]", error);
      logError(error, {
        screen: "RequestItemScreen",
        metadata: { action: "handleSubmit" },
      });
      showAlert("Error", error.message || "Failed to submit request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Request an Item</Text>
      <Text style={styles.subtitle}>
        Post a simple request for an item you need.
      </Text>

      <Text style={styles.label}>Item Name</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Calculator, Winter Jacket, Textbook"
        value={itemName}
        onChangeText={setItemName}
      />

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Write a short description of what you need..."
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={5}
        textAlignVertical="top"
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Submitting..." : "Submit Request"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#fff",
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    color: "#666",
    marginBottom: 24,
    textAlign: "center",
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#D9D9D9",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    backgroundColor: "#F9F9F9",
  },
  textArea: {
    minHeight: 120,
  },
  button: {
    backgroundColor: "#1E6F60",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 28,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
