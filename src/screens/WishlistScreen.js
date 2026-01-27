import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function EmptyWishlistScreen({ navigation }) {
     return (
    <View style={styles.container}>

      {/* Heart icon */}
      <Ionicons 
        name="heart-outline" 
        size={80} 
        color="#FF3B30" 
        style={styles.icon} 
      />

      {/* Title */}
      <Text style={styles.title}>No Wishlist Items</Text>

      {/* Description */}
      <Text style={styles.text}>
        You haven't added any products to your wishlist yet.
      </Text>

      {/* Start Shopping Button */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("HomeTabs")}
      >
        <Text style={styles.buttonText}>Start Shopping</Text>
      </TouchableOpacity>
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
});

