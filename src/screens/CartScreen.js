//React and React Native imports
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
// Firebase imports
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import { auth, firestore } from "../services/FirebaseConfig";

// Cart Screen Component
export default function CartScreen({ navigation }) {
  const [cartDocId, setCartDocId] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch cart items on component mount
  useEffect(() => {
    const fetchCart = async () => {
      if (!auth || !auth.currentUser) {
        setItems([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const uid = auth.currentUser.uid;
        const q = query(collection(firestore, "carts"), where("userId", "==", uid));
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
          setItems([]);
          setCartDocId(null);
        } else {
          const docSnap = snapshot.docs[0];
          setCartDocId(docSnap.id);
          const data = docSnap.data();
          setItems(Array.isArray(data.items) ? data.items : []);
        }
      } catch (err) {
        console.error("Error fetching cart:", err);
        Alert.alert("Error", "Failed to load cart. Check console for details.");
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, []);

  // Update cart items in Firestore
  const updateCart = async (newItems) => {
    try {
      if (!cartDocId) {
        const uid = auth.currentUser.uid;
        const docRef = doc(collection(firestore, "carts"));
        await setDoc(docRef, { userId: uid, items: newItems, updatedAt: new Date().toISOString() });
        setCartDocId(docRef.id);
      } else {
        const docRef = doc(firestore, "carts", cartDocId);
        await setDoc(docRef, { items: newItems, updatedAt: new Date().toISOString() }, { merge: true });
      }
      setItems(newItems);
    } catch (err) {
      console.error("Error updating cart:", err);
      Alert.alert("Error", "Failed to update cart.");
    }
  };

  // Change quantity of an item
  const changeQuantity = (index, delta) => {
    const newItems = items.map((it, i) => (i === index ? { ...it, quantity: Math.max(1, (it.quantity || 1) + delta) } : it));
    updateCart(newItems);
  };

  // Remove an item from the cart
  const removeItem = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    updateCart(newItems);
  };

  // Clear the entire cart
  const clearCart = async () => {
    if (!cartDocId) {
      setItems([]);
      return;
    }
    try {
      await deleteDoc(doc(firestore, "carts", cartDocId));
      setCartDocId(null);
      setItems([]);
      Alert.alert("Cart cleared");
    } catch (err) {
      console.error("Error clearing cart:", err);
      Alert.alert("Error", "Failed to clear cart.");
    }
  };

  // Calculate subtotal of cart items
  const subtotal = items.reduce((sum, it) => sum + (Number(it.price || 0) * Number(it.quantity || 1)), 0);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // Render component
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Shopping Cart</Text>
      {items.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.empty}>Your cart is empty.</Text>
        </View>
      ) : (
        <FlatList
        // Render cart items
          data={items}
          keyExtractor={(_, index) => String(index)}
          contentContainerStyle={{ paddingBottom: 100 }}
          renderItem={({ item, index }) => (
            <View style={styles.item}>
              <Image source={{ uri: item.image || "https://via.placeholder.com/80" }} style={styles.image} />
              <View style={styles.info}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.price}>${item.price} x {item.quantity}</Text>
                <View style={styles.controls}>
                  <TouchableOpacity style={styles.controlBtn} onPress={() => changeQuantity(index, -1)}>
                    <Text style={styles.controlText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.qty}>{item.quantity}</Text>
                  <TouchableOpacity style={styles.controlBtn} onPress={() => changeQuantity(index, 1)}>
                    <Text style={styles.controlText}>+</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.removeBtn} onPress={() => removeItem(index)}>
                    <Text style={styles.removeText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        />
      )}

      {/* Calculation and buttons */}
      <View style={styles.footer}>
        <Text style={styles.total}>Subtotal: ${subtotal.toFixed(2)}</Text>
        <View style={styles.footerButtons}>
          <TouchableOpacity style={styles.clearBtn} onPress={() => {
            Alert.alert("Clear cart", "Are you sure?", [
              { text: "Cancel", style: "cancel" },
              { text: "Clear", style: "destructive", onPress: clearCart }
            ]);
          }}>
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.checkoutBtn} onPress={() => navigation.navigate('Checkout')}>
            <Text style={styles.checkoutText}>Checkout</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 12 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 20, textAlign: "left", color: "#222" },
  empty: { fontSize: 16, color: "#666" },
  item: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  image: { width: 80, height: 80, borderRadius: 8, marginRight: 12 },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: "600", color: "#222" },
  price: { fontSize: 14, color: "#00A34A", marginVertical: 6 },
  controls: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  controlBtn: { backgroundColor: "#00A34A", paddingVertical: 4, paddingHorizontal: 12, borderRadius: 6 },
  controlText: { color: "#fff", fontSize: 16, textAlign: "center" },
  qty: { marginHorizontal: 10, fontWeight: "bold", fontSize: 16 },
  removeBtn: { marginLeft: 12 },
  removeText: { color: "#d00", fontWeight: "600" },
  footer: { paddingVertical: 16, borderTopWidth: 1, borderColor: "#eee", backgroundColor: "#fff" },
  total: { fontSize: 18, fontWeight: "bold", textAlign: "center", marginBottom: 12 },
  footerButtons: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 12 },
  clearBtn: { flex: 1, marginRight: 8, padding: 14, borderRadius: 10, backgroundColor: "#5FB8A1", alignItems: "center" },
  clearText: { color: "#FFFFFF", fontWeight: "600", fontSize: 16 },
  checkoutBtn: { flex: 1, marginLeft: 8, padding: 14, borderRadius: 10, backgroundColor: "#1E6F60", alignItems: "center" },
  checkoutText: { color: "#fff", fontWeight: "600", fontSize: 16 },
});
