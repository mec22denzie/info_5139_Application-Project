import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

// Help Screen Component
export default function HelpScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <View style={styles.centered}>
        <View style={styles.card}>
          <Text style={styles.title}>Help & Support</Text>

          <Text style={styles.text}>📧 Email: support@example.com</Text>
          <Text style={styles.text}>📞 Phone: +1 (555) 555-5555</Text>
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
    justifyContent: "center",
    alignItems: "center",
  },

  card: {
    width: "90%",
    backgroundColor: "#fff",
    padding: 25,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#d6e8ff",

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
    marginBottom: 10,
    textAlign: "center",
  },
});
