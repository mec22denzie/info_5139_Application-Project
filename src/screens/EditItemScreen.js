//React and React Native imports
import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, Image, ActivityIndicator } from "react-native";
// Firebase imports
import { doc, updateDoc } from "firebase/firestore";
import { firestore } from "../services/FirebaseConfig";
// Image picker import
import * as ImagePicker from "expo-image-picker";

// Available categories for items
const CATEGORIES = ["Apparel", "Electronics", "Footwear", "Books", "Furniture", "Other"];

// Edit Item Screen Component - Allows donors to edit their posted items
export default function EditItemScreen({ route, navigation }) {
  const { item } = route.params;

  const [name, setName] = useState(item.name || "");
  const [description, setDescription] = useState(item.description || "");
  const [category, setCategory] = useState(item.category || "");
  const [price, setPrice] = useState(item.price ? String(item.price) : "");
  const [isDonation, setIsDonation] = useState(item.isDonation || false);
  const [imageUri, setImageUri] = useState(item.imageUri || null);
  const [loading, setLoading] = useState(false);

  // Pick an image from the device gallery
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "Camera roll permission is needed to upload images.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  // Validate and update the item in Firestore
  const handleUpdate = async () => {
    // Input validation
    if (!name.trim()) {
      return Alert.alert("Validation", "Please enter an item name.");
    }
    if (name.trim().length < 3) {
      return Alert.alert("Validation", "Item name must be at least 3 characters.");
    }
    if (!description.trim()) {
      return Alert.alert("Validation", "Please enter a description.");
    }
    if (description.trim().length < 10) {
      return Alert.alert("Validation", "Description must be at least 10 characters.");
    }
    if (!category) {
      return Alert.alert("Validation", "Please select a category.");
    }
    if (!isDonation) {
      if (!price.trim()) {
        return Alert.alert("Validation", "Please enter a price or mark as donation.");
      }
      const priceNum = parseFloat(price);
      if (isNaN(priceNum) || priceNum < 0) {
        return Alert.alert("Validation", "Please enter a valid price (0 or more).");
      }
    }

    try {
      setLoading(true);
      const itemRef = doc(firestore, "products", item.id);

      await updateDoc(itemRef, {
        name: name.trim(),
        description: description.trim(),
        category,
        price: isDonation ? 0 : parseFloat(price),
        isDonation,
        imageUri: imageUri || null,
        updatedAt: new Date().toISOString(),
      });

      Alert.alert("Success", "Item updated successfully!", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      console.error("Error updating item:", err);
      Alert.alert("Error", "Failed to update item. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.title}>Edit Item Details</Text>

      {/* Image section */}
      <Text style={styles.label}>Item Image</Text>
      <View style={styles.imageSection}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.previewImage} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.placeholderText}>No image</Text>
          </View>
        )}
        <TouchableOpacity style={styles.imageBtn} onPress={pickImage}>
          <Text style={styles.imageBtnText}>Change Image</Text>
        </TouchableOpacity>
      </View>

      {/* Item name */}
      <Text style={styles.label}>Item Name *</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} />

      {/* Description */}
      <Text style={styles.label}>Description *</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />

      {/* Category selection */}
      <Text style={styles.label}>Category *</Text>
      <View style={styles.categoryContainer}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.categoryBtn, category === cat && styles.categoryBtnActive]}
            onPress={() => setCategory(cat)}
          >
            <Text style={[styles.categoryText, category === cat && styles.categoryTextActive]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Price / Donation toggle */}
      <Text style={styles.label}>Pricing *</Text>
      <View style={styles.donationToggle}>
        <TouchableOpacity
          style={[styles.toggleBtn, !isDonation && styles.toggleBtnActive]}
          onPress={() => setIsDonation(false)}
        >
          <Text style={[styles.toggleText, !isDonation && styles.toggleTextActive]}>Set Price</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, isDonation && styles.toggleBtnActive]}
          onPress={() => setIsDonation(true)}
        >
          <Text style={[styles.toggleText, isDonation && styles.toggleTextActive]}>Free Donation</Text>
        </TouchableOpacity>
      </View>

      {!isDonation && (
        <TextInput
          style={styles.input}
          placeholder="Price ($)"
          value={price}
          onChangeText={setPrice}
          keyboardType="decimal-pad"
        />
      )}

      {/* Save button */}
      <TouchableOpacity style={styles.submitBtn} onPress={handleUpdate} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitBtnText}>Save Changes</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

//Style
const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f4f4f6" },
  title: { fontSize: 24, fontWeight: "bold", color: "#222", marginBottom: 20 },
  label: { fontSize: 15, fontWeight: "600", color: "#333", marginBottom: 6, marginTop: 12 },
  input: {
    width: "100%",
    height: 50,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    fontSize: 16,
    color: "#222",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 2,
  },
  textArea: { height: 100, paddingTop: 12 },
  imageSection: { marginBottom: 8 },
  previewImage: { width: "100%", height: 200, borderRadius: 12, resizeMode: "cover", marginBottom: 10 },
  imagePlaceholder: { width: "100%", height: 200, borderRadius: 12, backgroundColor: "#e8e8e8", justifyContent: "center", alignItems: "center", marginBottom: 10, borderWidth: 2, borderColor: "#ddd", borderStyle: "dashed" },
  placeholderText: { color: "#999", fontSize: 15 },
  imageBtn: { backgroundColor: "#5FB8A1", paddingVertical: 10, borderRadius: 10, alignItems: "center" },
  imageBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  categoryContainer: { flexDirection: "row", flexWrap: "wrap", marginBottom: 8 },
  categoryBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: "#ccc", marginRight: 8, marginBottom: 8, backgroundColor: "#fff" },
  categoryBtnActive: { borderColor: "#1E6F60", backgroundColor: "#E8F5E9" },
  categoryText: { fontSize: 14, color: "#666" },
  categoryTextActive: { color: "#1E6F60", fontWeight: "700" },
  donationToggle: { flexDirection: "row", marginBottom: 10 },
  toggleBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 2, borderColor: "#ccc", alignItems: "center", marginHorizontal: 4, backgroundColor: "#fff" },
  toggleBtnActive: { borderColor: "#1E6F60", backgroundColor: "#E8F5E9" },
  toggleText: { fontSize: 15, color: "#666", fontWeight: "500" },
  toggleTextActive: { color: "#1E6F60", fontWeight: "700" },
  submitBtn: { backgroundColor: "#1E6F60", paddingVertical: 16, borderRadius: 12, alignItems: "center", marginTop: 20, shadowColor: "#1E6F60", shadowOpacity: 0.2, shadowOffset: { width: 0, height: 3 }, shadowRadius: 4, elevation: 3 },
  submitBtnText: { color: "#fff", fontWeight: "700", fontSize: 18 },
});
