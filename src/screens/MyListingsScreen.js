//React and React Native imports
import React, { useEffect, useState, useCallback } from "react";
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from "react-native";
// Firebase imports
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";
import { auth, firestore } from "../services/FirebaseConfig";

// My Listings Screen Component - Shows items posted by the current donor
export default function MyListingsScreen({ navigation }) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch donor's listings from Firestore
  const fetchListings = useCallback(async () => {
    if (!auth || !auth.currentUser) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const uid = auth.currentUser.uid;
      const q = query(collection(firestore, "products"), where("donorId", "==", uid));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setListings(data);
    } catch (err) {
      console.error("Error fetching listings:", err);
      Alert.alert("Error", "Failed to load your listings.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch listings on mount and when screen comes into focus
  useEffect(() => {
    fetchListings();
    const unsub = navigation.addListener("focus", fetchListings);
    return unsub;
  }, [navigation, fetchListings]);

  // Delete a listing from Firestore
  const deleteListing = async (id) => {
    Alert.alert("Delete Listing", "Are you sure you want to delete this item?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteDoc(doc(firestore, "products", id));
            setListings((prev) => prev.filter((item) => item.id !== id));
            Alert.alert("Deleted", "Item removed successfully.");
          } catch (err) {
            console.error("Error deleting listing:", err);
            Alert.alert("Error", "Failed to delete item.");
          }
        },
      },
    ]);
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
      <Text style={styles.title}>My Listings</Text>

      {listings.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>You haven't posted any items yet.</Text>
          <TouchableOpacity style={styles.postBtn} onPress={() => navigation.navigate("PostItem")}>
            <Text style={styles.postBtnText}>Post Your First Item</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 20 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              {/* Item image */}
              {item.imageUri ? (
                <Image source={{ uri: item.imageUri }} style={styles.image} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Text style={styles.placeholderText}>No Image</Text>
                </View>
              )}

              {/* Item info */}
              <View style={styles.info}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.category}>{item.category}</Text>
                {item.isDonation ? (
                  <Text style={styles.donation}>Free (Donation)</Text>
                ) : (
                  <Text style={styles.price}>${Number(item.price).toFixed(2)}</Text>
                )}
                <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
              </View>

              {/* Action buttons */}
              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.editBtn}
                  onPress={() => navigation.navigate("EditItem", { item })}
                >
                  <Text style={styles.editBtnText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteListing(item.id)}>
                  <Text style={styles.deleteBtnText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

//Style
const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f4f4f6" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 16, color: "#222" },
  emptyText: { fontSize: 16, color: "#666", marginBottom: 20, textAlign: "center" },
  postBtn: { backgroundColor: "#1E6F60", paddingVertical: 14, paddingHorizontal: 30, borderRadius: 12 },
  postBtnText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  image: { width: "100%", height: 180, borderRadius: 10, resizeMode: "cover", marginBottom: 10 },
  imagePlaceholder: { width: "100%", height: 180, borderRadius: 10, backgroundColor: "#eee", justifyContent: "center", alignItems: "center", marginBottom: 10 },
  placeholderText: { color: "#999", fontSize: 14 },
  info: { marginBottom: 10 },
  name: { fontSize: 18, fontWeight: "600", color: "#222" },
  category: { fontSize: 13, color: "#888", marginTop: 2 },
  price: { fontSize: 16, fontWeight: "500", color: "#00A34A", marginTop: 4 },
  donation: { fontSize: 16, fontWeight: "500", color: "#1E6F60", marginTop: 4 },
  description: { fontSize: 14, color: "#666", marginTop: 4 },
  actions: { flexDirection: "row", justifyContent: "flex-end" },
  editBtn: { backgroundColor: "#5FB8A1", paddingVertical: 8, paddingHorizontal: 20, borderRadius: 8, marginRight: 10 },
  editBtnText: { color: "#fff", fontWeight: "600" },
  deleteBtn: { backgroundColor: "#d00", paddingVertical: 8, paddingHorizontal: 20, borderRadius: 8 },
  deleteBtnText: { color: "#fff", fontWeight: "600" },
});
