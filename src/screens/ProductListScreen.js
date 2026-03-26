//React and React Native imports
import React, { useEffect, useState } from "react";
import { View, Text, TextInput, FlatList, Image, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
// Import Firestore functions for CRUD operations
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { firestore } from "../services/FirebaseConfig";
import { logError } from "../services/errorLogger";
import { seedIfEmpty } from "../utils/seedProducts";

import SearchBar from "../components/SearchBar";

// Main component for Product List Screen
export default function ProductListScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Helper to get valid image source (ignores old file:// paths)
  const getImageSource = (item) => {
    if (item.imageUri && item.imageUri.startsWith("https://")) {
      return { uri: item.imageUri };
    }
    if (item.image && localImages[item.image]) {
      return localImages[item.image];
    }
    return null;
  };

  //Local image mapping for product images
  const localImages = {
  "B_Jacket": require("../../assets/Apparel/B_Jacket.jpg"),
  "R_Hoodie": require("../../assets/Apparel/R_Hoodie.jpg"),
  "Dress1": require("../../assets/Apparel/Dress1.jpg"),
  "MacPro": require("../../assets/Electronics/MacPro.jpg"),
  "EarPods": require("../../assets/Electronics/EarPods.jpg"),
  "Camera": require("../../assets/Electronics/Camera.jpg"),
  "Headphone": require("../../assets/Electronics/HeadPhone.jpg"),
  "Air_Shoes": require("../../assets/Shoes/Air_Shoes.jpg"),
  "WP_Boots": require("../../assets/Shoes/WP_Boots.jpg"),
  "Rubber_Shoes": require("../../assets/Shoes/Rubber_Shoes.jpg"),
  "Colored_Shoes": require("../../assets/Shoes/Colored_Shoes.jpg"),
};

  // Seed sample products if the collection is empty
  useEffect(() => {
    seedIfEmpty(firestore);
  }, []);

  // Fetch products from firestore
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);

        if (!firestore) {
          setError("Database connection error");
          return;
        }

        const productsRef = collection(firestore, "products");
        const snapshot = await getDocs(productsRef);

        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProducts(data);
        setError(null);
      } catch (err) {
        logError(err, { screen: "ProductListScreen", metadata: { action: "fetchProducts" } });
        setError("Failed to load products: " + err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Filter products by Category and search input, and hide items without images
  const filteredProducts = products.filter((p) => {
    try {
      if (!p || !p.name || !p.description) return false;
      if (p.status === "removed") return false;

      const hasImage = !!getImageSource(p);
      if (!hasImage) return false;

      const matchesCategory = category === "All" || p.category === category;
      const searchLower = search.toLowerCase();
      const matchesSearch =
        p.name.toLowerCase().includes(searchLower) ||
        p.description.toLowerCase().includes(searchLower);

      return matchesCategory && matchesSearch;
    } catch (err) {
      logError(err, { screen: "ProductListScreen", metadata: { action: "filterProduct" } });
      return false;
    }
  });

  // Delete product from firestore by ID (hidden)
const deleteProduct = async (productId) => {
  try {
    await deleteDoc(doc(firestore, "products", productId));
    // Remove from local state to update UI immediately
    setProducts((prevProducts) => prevProducts.filter(p => p.id !== productId));
    alert("Product deleted successfully!");
  } catch (err) {
    logError(err, { screen: "ProductListScreen", metadata: { action: "deleteProduct", productId } });
    alert("Failed to delete product. Try again.");
  }
};

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Shop Now</Text>

      {/* Category Filter */}
      <View style={styles.categories}>
  {[
    { name: "All", image: "https://cdn-icons-png.flaticon.com/512/709/709496.png" },
    { name: "Electronics", image: "https://cdn-icons-png.flaticon.com/512/1041/1041916.png" },
    { name: "Footwear", image: "https://cdn-icons-png.flaticon.com/512/507/507985.png" },
    { name: "Apparel", image: "https://cdn-icons-png.flaticon.com/512/892/892458.png" },
  ].map((cat) => (
    <TouchableOpacity
      key={cat.name}
      onPress={() => setCategory(cat.name)}
      style={styles.categoryItem}
    >
      <Image source={{ uri: cat.image }} style={styles.categoryImage} />
      <Text
        style={[
          styles.category,
          category === cat.name && styles.activeCategory,
        ]}
      >
        {cat.name}
      </Text>
    </TouchableOpacity>
  ))}
</View>

      {/* Search Bar */}
    <View style={styles}>
      <SearchBar searchQuery={search} onChange={setSearch} />
    </View>

      {/* Loading and Error States */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : filteredProducts.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.noProducts}>No products found</Text>
        </View>
      ) : (
        /* Product Grid */
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          numColumns={2}
          renderItem={({ item }) => (
            <View style={styles.cardWrapper}>
              <TouchableOpacity
                style={styles.card}
                onPress={() =>
                  navigation.navigate("ProductDetail", {
                    product: {
                      ...item,
                      imageSource: getImageSource(item),
                    },
                  })
                }
              >
                <Image
                  source={getImageSource(item)}
                  style={styles.image}
                />
                <Text style={styles.name}>{item.name}</Text>
                {item.isDonation ? (
                  <Text style={styles.donationTag}>Free (Donation)</Text>
                ) : (
                  <Text style={styles.price}>${item.price}</Text>
                )}
              </TouchableOpacity>


            {/* Delete Button */}
            {/* <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => deleteProduct(item.id)}
            >
        <Text style={styles.deleteText}>🗑️</Text>
      </TouchableOpacity> */}
    </View>
  )}
/>
      )}
    </View>
  );
}

//Style
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,          // ensure space around content
    backgroundColor: "#f9f9f9",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
    color: "#333333",
  },
  addSampleBtn: {
    backgroundColor: "#228B22",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 12,      // space between button and categories
  },
  addSampleBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  categories: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 12,
  },
  categoryItem: {
    alignItems: "center",
  },
  categoryImage: {
    width: 40,
    height: 40,
    marginBottom: 4,
  },
  category: {
    fontSize: 12,
    color: "#333",
  },
  activeCategory: {
    fontWeight: "bold",
    color: "#00A34A",
  },
  cardWrapper: {
    flex: 1,
    margin: 10,           // spacing between cards
  },
  card: {
    backgroundColor: "#F8F8F8",
    borderRadius: 12,
    padding: 10,
    alignItems: "center",
    justifyContent: "center",

    // Shadow for iOS
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,

    // Shadow for Android
    elevation: 5,
    borderWidth: 1,
    borderColor: "#F5F1EB",
  },
  image: {
    width: 140,
    height: 140,
    resizeMode: "contain",
    marginBottom: 10,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 5,
  },
  price: {
    fontSize: 14,
    fontWeight: "500",
    color: "#00A34A",
  },
  donationTag: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E6F60",
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E6F60',
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  iconButton: {
    padding: 5,
  },
  searchIcon: {
    fontSize: 20,
  },
});
