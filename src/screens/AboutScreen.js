import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

// About Screen Component
export default function AboutScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <View style={styles.centered}>
        <View style={styles.card}>
          <Text style={styles.title}>About This App</Text>
          <Text style={styles.text}>
            This is a sample e-commerce project built with React Native, Firebase,
            and Expo for INFO-3173.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E7F2FF",
    padding: 20,
  },

  centered: {
    flex: 1,
    justifyContent: "top",
    alignItems: "center",
  },

  card: {
    width: "90%",
    backgroundColor: "#fff",
    padding: 25,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#d6e8ff",

    // Shadow
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,

    alignItems: "center",
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1E6F60",
    marginBottom: 15,
    textAlign: "center",
  },

  text: {
    fontSize: 17,
    color: "#1E6F60",
    textAlign: "center",
  },
});
