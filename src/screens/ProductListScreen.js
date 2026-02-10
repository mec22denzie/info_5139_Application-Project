//React and React Native imports
import React, { useEffect, useState } from "react";
import { View, Text, TextInput, FlatList, Image, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
// Import Firestore functions for CRUD operations
import { collection, getDocs, addDoc, deleteDoc, doc } from "firebase/firestore";
import { firestore } from "../services/FirebaseConfig";

import SearchBar from "../components/SearchBar";

// Main component for Product List Screen
export default function ProductListScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  // Adding Sample products to Firestone (only used when DB is empty)
  const addSampleProducts = async () => {
    console.log("Starting to add sample products...");
    try {
      const sampleProducts = [
        // Apparel products
        {
          name: "Blue Denim Jacket",
          price: 49.99,
          category: "Apparel",
          description: "Classic men's denim jacket for all seasons.",
          image: "B_Jacket", 
        },
        {
          name: "Red Hoodie",
          price: 29.99,
          category: "Apparel",
          description: "Comfortable cotton hoodie for casual wear.",
          image: "R_Hoodie",
        },
        {
          name: "White Simple Dress",
          price: 59.99,
          category: "Apparel",
          description: "Stylish and comfortable dress for everyday use.",
          image: "Dress1",
        },
        //Electronics products
        {
          name: "Apple MacBook Pro",
          price: 1999.99,
          category: "Electronics",
          description: "Powerful Apple laptop with M1 chip for professionals.",
          image: "MacPro",
        },
        {
          name: "Apple EarPods",
          price: 29.99,
          category: "Electronics",
          description: "High-quality wired EarPods with built-in microphone.",
          image: "EarPods",
        },
        {
          name: "Sony Camera",
          price: 899.99,
          category: "Electronics",
          description: "Compact Sony mirrorless camera for photography enthusiasts.",
          image: "Camera",
        },
        {
          name: "Wireless Headphones",
          price: 199.99,
          category: "Electronics",
          description: "Noise-canceling over-ear wireless headphones for immersive sound.",
          image: "Headphone",
        },
        // Shoes products
        {
          name: "SkyRunner 3000",
          price: 129.99,
          category: "Footwear",
          description: "Sleek, lightweight sneakers with air cushioning for all-day comfort.",
          image: "Air_Shoes",
        },
        {
          name: "TrailBlazer WP Boots",
          price: 149.99,
          category: "Footwear",
          description: "Waterproof, rugged boots perfect for outdoor adventures.",
          image: "WP_Boots",
        },
        {
          name: "FlexGrip Classics",
          price: 59.99,
          category: "Footwear",
          description: "Durable rubber shoes designed for everyday wear and comfort.",
          image: "Rubber_Shoes",
        },
        {
          name: "VibrantStep Sneakers",
          price: 69.99,
          category: "Footwear",
          description: "Eye-catching colorful shoes that combine style and comfort.",
          image: "Colored_Shoes",
        },
      ];

      // Loop through sample product list and upload to Firestore
      for (let p of sampleProducts) {
        // Validating product data before adding
        if (!p.name || !p.price || !p.category || !p.description) {
          console.error("Invalid product data:", p);
          continue;
        }
        
        try {
          const docRef = await addDoc(collection(firestore, "products"), {
            name: p.name || "",
            price: p.price || 0,
            category: p.category || "Uncategorized",
            description: p.description || "",
            image: p.image || "https://via.placeholder.com/100",
          });
          console.log("Added product with ID:", docRef.id);
        } catch (err) {
          console.error("Error adding product:", p.name, err);
        }
      }
      alert("Sample products added successfully!");
    } catch (e) {
      console.error("Error adding products: ", e);
    }
  };

  // Initialize products if none exist
  useEffect(() => {
    const checkAndAddProducts = async () => {
      try {
        console.log("Checking for existing products...");
        // Check if products exist
        const snapshot = await getDocs(collection(firestore, "products"));
        console.log("Initial check - Number of products:", snapshot.size);
        
        if (snapshot.empty) {
          console.log("No products found, adding sample products...");
          // Only add sample products if none exist
          await addSampleProducts();
          console.log("Sample products added successfully");
        } else {
          console.log("Products already exist, skipping sample data");
        }
      } catch (err) {
        console.error("Error in checkAndAddProducts:", err);
      }
    };
    checkAndAddProducts();
  }, []);

  // Fetch products from firestore
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        console.log("Starting to fetch products...");
        setLoading(true);
        
        // Check if Firestore is available
        if (!firestore) {
          console.error("Firestore is not initialized!");
          setError("Database connection error");
          return;
        }

        console.log("Firestore status:", !!firestore ? "initialized" : "not initialized");
        
        // Reference the "products" collection in Firestore
        const productsRef = collection(firestore, "products");
        console.log("Products collection reference created");
        
        // Fetch all documents inside the "products" collection
        const snapshot = await getDocs(productsRef);
        console.log("Snapshot received, number of products:", snapshot.size);
        
        // If no products exist in Firestore
        if (snapshot.empty) {
          console.log("No products found in Firestore, attempting to add sample products...");

          // Create sample products if database is empty
          await addSampleProducts();

          // Fetch products again after adding samples
          const newSnapshot = await getDocs(productsRef);

          // Convert each document into a readable JS object
          const data = newSnapshot.docs.map(doc => {
            const productData = { id: doc.id, ...doc.data() };
            console.log("Product found:", productData.name);
            return productData;
          });
          setProducts(data); // Update state with new products
        } else {
          // If products already exist in Firestore
          const data = snapshot.docs.map(doc => {
            const productData = { id: doc.id, ...doc.data() };
            console.log("Product found:", productData.name);
            return productData;
          });
          console.log("Total products processed:", data.length);
          setProducts(data); // Update state with existing products
        }
        setError(null); // Clear previous errors (if any)
        // Log for error debugging
      } catch (err) {
        console.error("Detailed error fetching products:", err);
        console.error("Error stack:", err.stack);
        setError("Failed to load products: " + err.message);
      } finally {
        setLoading(false);
        console.log("Fetch products complete, loading set to false");
      }
    };
    fetchProducts();
  }, []);

  // Filter products by Category and search input
  const filteredProducts = products.filter((p) => {
    try {
      // Check if product and its required properties exist
      if (!p || !p.name || !p.description) {
        console.log("Invalid product data:", p);
        return false;
      }

      const matchesCategory = category === "All" || p.category === category;
      const searchLower = search.toLowerCase();
      const matchesSearch = p.name.toLowerCase().includes(searchLower) ||
        p.description.toLowerCase().includes(searchLower);

      return matchesCategory && matchesSearch;
    } catch (err) {
      console.error("Error filtering product:", err, p);
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
    console.error("Error deleting product:", err);
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
                      imageSource: item.imageUri
                        ? { uri: item.imageUri }
                        : localImages[item.image] || require("../../assets/placeholder.jpg"),
                    },
                  })
                }
              >
                <Image
                  source={
                    item.imageUri
                      ? { uri: item.imageUri }
                      : localImages[item.image] || require("../../assets/placeholder.jpg")
                  }
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
