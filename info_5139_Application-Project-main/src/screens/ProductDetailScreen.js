import React, { useState } from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { auth, firestore } from "../services/FirebaseConfig";
import { collection, addDoc, updateDoc, arrayUnion, query, where, getDocs, serverTimestamp } from "firebase/firestore";
import { logError } from "../services/errorLogger";
import { showAlert } from "../utils/alert";

// Product Detail Screen Component
export default function ProductDetailScreen({ route, navigation }) {
  const { product } = route.params;
  const [quantity, setQuantity] = useState(1);

  // Function to add the current product to the user's cart in Firestore
  const addToCart = async () => {
    try {
      if (!auth.currentUser) {
        showAlert("Error", "Please login to add items to cart");
        return;
      }

      const userId = auth.currentUser.uid;

      // Prevent donor from adding own item
      if (product?.donorId === userId) {
        showAlert("Error", "You cannot add your own item to cart.");
        return;
      }

      // Check if product is already unavailable or completed
      if (
        product?.status === "completed" ||
        product?.status === "unavailable" ||
        product?.isAvailable === false
      ) {
        showAlert("Unavailable", "This item is no longer available.");
        return;
      }

      // Check if buyer already has an active request for this product
      const existingRequestQuery = query(
        collection(firestore, "orders"),
        where("buyerId", "==", userId),
        where("productId", "==", product?.id),
        where("status", "in", ["pending", "accepted"])
      );

      const existingRequestSnap = await getDocs(existingRequestQuery);

      if (!existingRequestSnap.empty) {
        showAlert("Notice", "You already requested this item.");
        return;
      }

      // Query the "carts" collection for the current user's cart
      const q = query(collection(firestore, "carts"), where("userId", "==", userId));
      const snapshot = await getDocs(q);

      const cartItem = {
        productId: product?.id,
        donorId: product?.donorId,
        name: product?.name,
        price: product?.price,
        quantity: quantity ?? 1,
        image: product?.imageSource ?? "",
        addedAt: new Date().toISOString(),
      };

      console.log("product:", product);
      console.log("user:", auth.currentUser);
      console.log("cartItem:", cartItem);

      Object.entries(cartItem).forEach(([key, value]) => {
        console.log(key, value, value === undefined ? "❌ UNDEFINED" : "✅ OK");
      });

      const hasUndefined = Object.values(cartItem).some((value) => value === undefined);

      if (hasUndefined) {
        console.log("❌ ERROR: cartItem has undefined values", cartItem);
        showAlert("Error", "Some product data is missing.");
        return;
      }

      // Add item to cart only once
      if (snapshot.empty) {
        await addDoc(collection(firestore, "carts"), {
          userId,
          items: [cartItem],
          updatedAt: new Date().toISOString(),
        });
      } else {
        const cartDoc = snapshot.docs[0];
        await updateDoc(cartDoc.ref, {
          items: arrayUnion(cartItem),
          updatedAt: new Date().toISOString(),
        });
      }

      // Create notification for donor
      const donorId =
        product?.donorId ||
        product?.userId ||
        product?.ownerId ||
        product?.createdBy;

      if (donorId && donorId !== userId) {
        await addDoc(collection(firestore, "notifications"), {
          userId: donorId,
          title: "Item Added to Cart",
          message: `${auth.currentUser?.displayName || "A buyer"} added "${product?.name}" to cart.`,
          type: "cart_added",
          productId: product?.id || "",
          buyerId: userId,
          read: false,
          createdAt: serverTimestamp(),
        });
      }

      // Create order/request
      await addDoc(collection(firestore, "orders"), {
        buyerId: userId,
        donorId: product?.donorId || null,
        productId: product?.id || null,
        productName: product?.name || "",
        quantity: quantity ?? 1,
        status: "pending",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      showAlert("Success", "Item added to cart");
      navigation.navigate("HomeTabs", { screen: "Products" });
    } catch (error) {
      console.log("[ERROR][ProductDetailScreen]", error);
      logError(error, {
        screen: "ProductDetailScreen",
        metadata: { action: "addToCart", productId: product?.id },
      });
      showAlert("Error", error.message || "Failed to add item to cart. Please try again.");
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={product?.imageSource}
        style={styles.image}
      />
      <Text style={styles.name}>{product?.name}</Text>
      <Text style={styles.price}>${Number(product?.price ?? 0).toFixed(2)}</Text>
      <Text style={styles.description}>{product?.description}</Text>
      <Text style={styles.category}>Category: {product?.category}</Text>

      {/* Quantity Selector */}
      <View style={styles.quantityContainer}>
        <TouchableOpacity
          style={styles.quantityButton}
          onPress={() => quantity > 1 && setQuantity(quantity - 1)}
        >
          <Text style={styles.quantityButtonText}>−</Text>
        </TouchableOpacity>

        <Text style={styles.quantity}>{quantity}</Text>

        <TouchableOpacity
          style={styles.quantityButton}
          onPress={() => setQuantity(quantity + 1)}
        >
          <Text style={styles.quantityButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Add to Cart Button */}
      <TouchableOpacity style={styles.addToCartButton} onPress={addToCart}>
        <Text style={styles.addToCartText}>Add to Cart</Text>
      </TouchableOpacity>

      {/* Report Listing Button */}
      <TouchableOpacity
        style={styles.reportButton}
        onPress={() =>
          navigation.navigate("ReportListing", {
            productId: product?.id,
            productName: product?.name,
          })
        }
      >
        <Ionicons name="flag-outline" size={16} color="#FF3B30" />
        <Text style={styles.reportText}>Report this listing</Text>
      </TouchableOpacity>
    </View>
  );
}

//Style
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
    alignItems: "center",
  },
  image: {
    width: 320,
    height: 320,
    borderRadius: 12,
    marginBottom: 20,
    resizeMode: 'contain', // or 'cover'
  },
  name: {
    fontSize: 26,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
    color: "#333333",
  },
  price: {
    fontSize: 22,
    fontWeight: "500",
    color: "#00A34A",
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    textAlign: "center",
    color: "#666666",
    marginBottom: 10,
    lineHeight: 22,
  },
  category: {
    fontSize: 14,
    color: "#888",
    marginBottom: 20,
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 25,
    borderWidth: 2,
    borderColor: "#1E6F60",
    borderRadius: 8,
    backgroundColor: "#F5F1EB",
  },
  quantityButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  quantityButtonText: {
    fontSize: 20,
    color: "#00A34A",
  },
  quantity: {
    fontSize: 18,
    fontWeight: "500",
    marginHorizontal: 15,
    color: "#333333",
  },
  addToCartButton: {
    backgroundColor: "#1E6F60",
    paddingVertical: 15,
    paddingHorizontal: 60,
    borderRadius: 10,
  },
  addToCartText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  reportButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    paddingVertical: 8,
  },
  reportText: {
    color: "#FF3B30",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 6,
  },
});
