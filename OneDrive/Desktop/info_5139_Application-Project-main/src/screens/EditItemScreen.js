//React and React Native imports
import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Image, ActivityIndicator } from "react-native";
// Firebase imports
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, firestore, storage } from "../services/FirebaseConfig";
// Image picker and manipulator imports
import * as ImagePicker from "expo-image-picker";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { sanitizeText, isValidPrice, toPriceNumber } from "../utils/validation";
import { logError } from "../services/errorLogger";
import { showAlert } from "../utils/alert";

// Available categories for items
const CATEGORIES = ["Apparel", "Electronics", "Footwear", "Books", "Furniture", "Other"];
const CONDITIONS = ["New", "Like New", "Good", "Fair"];

// Edit Item Screen Component - Allows donors to edit their posted items
export default function EditItemScreen({ route, navigation }) {
  const { item } = route.params;

  const [name, setName] = useState(item.name || "");
  const [description, setDescription] = useState(item.description || "");
  const [category, setCategory] = useState(item.category || "");
  const [price, setPrice] = useState(item.price ? String(item.price) : "");
  const [isDonation, setIsDonation] = useState(item.isDonation || false);
  const [condition, setCondition] = useState(item.condition || "New");
  const [imageUri, setImageUri] = useState(item.imageUri || null);
  const [loading, setLoading] = useState(false);

  // Pick an image from the device gallery
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      showAlert("Permission Denied", "Camera roll permission is needed to upload images.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      //aspect: [3, 4],
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  // Image editing: rotate 90 degrees clockwise
  const handleRotate = async () => {
    if (!imageUri) return;
    try {
      const result = await manipulateAsync(imageUri, [{ rotate: 90 }], { format: SaveFormat.JPEG });
      setImageUri(result.uri);
    } catch (err) {
      logError(err, { screen: "EditItemScreen", metadata: { action: "rotateImage" } });
      showAlert("Error", "Failed to rotate image.");
    }
  };

  // Image editing: resize to 800px width
  const handleResize = async () => {
    if (!imageUri) return;
    try {
      const result = await manipulateAsync(imageUri, [{ resize: { width: 800 } }], { format: SaveFormat.JPEG });
      setImageUri(result.uri);
    } catch (err) {
      logError(err, { screen: "EditItemScreen", metadata: { action: "resizeImage" } });
      showAlert("Error", "Failed to resize image.");
    }
  };

  // Image editing: crop to centered square
  const handleCrop = async () => {
    if (!imageUri) return;
    try {
      const { width, height } = await new Promise((resolve, reject) => {
        Image.getSize(imageUri, (w, h) => resolve({ width: w, height: h }), reject);
      });
      const size = Math.min(width, height);
      const originX = (width - size) / 2;
      const originY = (height - size) / 2;
      const result = await manipulateAsync(
        imageUri,
        [{ crop: { originX, originY, width: size, height: size } }],
        { format: SaveFormat.JPEG }
      );
      setImageUri(result.uri);
    } catch (err) {
      logError(err, { screen: "EditItemScreen", metadata: { action: "cropImage" } });
      showAlert("Error", "Failed to crop image.");
    }
  };

  // Upload image to Firebase Storage and return the download URL
  const uploadImage = async (uri) => {
    const response = await fetch(uri);
    const blob = await response.blob();
    const filename = `products/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.jpg`;
    const storageRef = ref(storage, filename);
    await uploadBytes(storageRef, blob);
    return await getDownloadURL(storageRef);
  };

  // Validate and update the item in Firestore
  const handleUpdate = async () => {
    const cleanName = sanitizeText(name);
    const cleanDescription = sanitizeText(description);
    const cleanPrice = String(price).trim();

    // Input validation
    if (!cleanName) {
      return showAlert("Validation", "Please enter an item name.");
    }
    if (cleanName.length < 3 || cleanName.length > 80) {
      return showAlert("Validation", "Item name must be 3-80 characters.");
    }
    if (!cleanDescription) {
      return showAlert("Validation", "Please enter a description.");
    }
    if (cleanDescription.length < 10 || cleanDescription.length > 1000) {
      return showAlert("Validation", "Description must be 10-1000 characters.");
    }
    if (!category) {
      return showAlert("Validation", "Please select a category.");
    }
    if (!isDonation) {
      if (!cleanPrice) {
        return showAlert("Validation", "Please enter a price or mark as donation.");
      }
      if (!isValidPrice(cleanPrice)) {
        return showAlert("Validation", "Enter a valid price (e.g. 10 or 10.99).");
      }
    }

    try {
      setLoading(true);
      const itemRef = doc(firestore, "products", item.id);

      // Verify ownership before updating
      const productDoc = await getDoc(itemRef);
      if (!productDoc.exists() || productDoc.data().donorId !== auth.currentUser?.uid) {
        showAlert("Error", "You can only edit your own listings.");
        return;
      }

      // Upload new image if it's a local file (not already a Firebase URL)
      let finalImageUri = imageUri;
      if (imageUri && !imageUri.startsWith("https://")) {
        finalImageUri = await uploadImage(imageUri);
      }

      await updateDoc(itemRef, {
        name: cleanName,
        description: cleanDescription,
        category,
        condition,
        price: isDonation ? 0 : toPriceNumber(cleanPrice),
        isDonation,
        imageUri: finalImageUri || null,
        updatedAt: new Date().toISOString(),
      });

      showAlert("Success", "Item updated successfully!", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      logError(err, { screen: "EditItemScreen", metadata: { action: "updateItem", itemId: item.id } });
      const errMsg = err.message || "";
      if (errMsg.toLowerCase().includes("quota") || errMsg.includes("storage/quota-exceeded")) {
        showAlert("Error", "Image upload failed — storage limit reached. Please try again later.");
      } else {
        showAlert("Error", "Failed to update item. Please try again.");
      }
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
            <Image
              source={{ uri: imageUri }}
              style={styles.previewImage}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.placeholderText}>No image</Text>
            </View>
          )}
        <TouchableOpacity style={styles.imageBtn} onPress={pickImage}>
          <Text style={styles.imageBtnText}>Change Image</Text>
        </TouchableOpacity>
        {imageUri && (
          <View style={styles.editRow}>
            <TouchableOpacity style={styles.editBtn} onPress={handleCrop}>
              <Text style={styles.editBtnText}>Crop</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.editBtn} onPress={handleRotate}>
              <Text style={styles.editBtnText}>Rotate</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.editBtn} onPress={handleResize}>
              <Text style={styles.editBtnText}>Resize</Text>
            </TouchableOpacity>
          </View>
        )}
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

      {/* Condition selection */}
      <Text style={styles.label}>Condition *</Text>
      <View style={styles.categoryContainer}>
        {CONDITIONS.map((cond) => (
          <TouchableOpacity
            key={cond}
            style={[styles.categoryBtn, condition === cond && styles.categoryBtnActive]}
            onPress={() => setCondition(cond)}
          >
            <Text style={[styles.categoryText, condition === cond && styles.categoryTextActive]}>{cond}</Text>
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
  previewImage: {
    width: "100%",
    height: 250,
    borderRadius: 12,
    marginBottom: 10,
  },
  imagePlaceholder: { width: "100%", height: 200, borderRadius: 12, backgroundColor: "#e8e8e8", justifyContent: "center", alignItems: "center", marginBottom: 10, borderWidth: 2, borderColor: "#ddd", borderStyle: "dashed" },
  placeholderText: { color: "#999", fontSize: 15 },
  imageBtn: { backgroundColor: "#5FB8A1", paddingVertical: 10, borderRadius: 10, alignItems: "center" },
  imageBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  editRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  editBtn: { flex: 1, backgroundColor: "#1E6F60", paddingVertical: 10, borderRadius: 10, alignItems: "center", marginHorizontal: 4 },
  editBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },
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
