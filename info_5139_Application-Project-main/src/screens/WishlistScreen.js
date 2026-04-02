import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useWishlist } from "../context/WishlistContext";

export default function WishlistScreen({ navigation }) {
  const { favorites, toggleFavorite } = useWishlist();

  if (favorites.length === 0) {
    return (
      <View style={styles.container}>
        <Ionicons
          name="heart-outline"
          size={80}
          color="#FF3B30"
          style={styles.icon}
        />

        <Text style={styles.title}>No Wishlist Items</Text>

        <Text style={styles.text}>
          You haven't added any products to your wishlist yet.
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate("HomeTabs")}
        >
          <Text style={styles.buttonText}>Start Shopping</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.listContainer}>
      <Text style={styles.headerTitle}>My Wishlist</Text>

      <FlatList
        data={favorites}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 20 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() =>
              navigation.navigate("ProductDetail", {
                product: item,
              })
            }
          >
            {item.imageSource ? (
              <Image source={item.imageSource} style={styles.image} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Text style={styles.placeholderText}>No Image</Text>
              </View>
            )}

            <View style={styles.info}>
              <Text style={styles.itemName}>{item.name}</Text>

              {item.isDonation ? (
                <Text style={styles.donationTag}>Free (Donation)</Text>
              ) : (
                <Text style={styles.price}>${item.price}</Text>
              )}

              <Text style={styles.categoryText}>
                {item.category || "Uncategorized"}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => toggleFavorite(item)}
              style={styles.removeButton}
            >
              <Ionicons name="heart" size={22} color="#FF3B30" />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    backgroundColor: "#fff",
  },
  icon: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 10,
  },
  text: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
  },
  button: {
    backgroundColor: "#1E6F60",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  listContainer: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 16,
    color: "#333",
    textAlign: "center",
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#F8F8F8",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: "center",
  },
  image: {
    width: 85,
    height: 85,
    borderRadius: 10,
    resizeMode: "contain",
    backgroundColor: "#fff",
  },
  imagePlaceholder: {
    width: 85,
    height: 85,
    borderRadius: 10,
    backgroundColor: "#eee",
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: {
    color: "#888",
    fontSize: 12,
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    marginBottom: 6,
  },
  price: {
    fontSize: 15,
    fontWeight: "600",
    color: "#00A34A",
    marginBottom: 4,
  },
  donationTag: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E6F60",
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 13,
    color: "#777",
  },
  removeButton: {
    padding: 6,
  },
});
