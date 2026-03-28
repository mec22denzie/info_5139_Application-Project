// components/SearchBar.js
import React from "react";
import { View, TextInput, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/Ionicons"; // install with: npm i react-native-vector-icons

export default function SearchBar({ searchQuery, onChange }) {
  return (
    <View style={styles.container}>
      <Icon name="search" size={20} color="#555" style={styles.icon} />
      <TextInput
        style={styles.input}
        placeholder="Search products..."
        value={searchQuery}
        onChangeText={onChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1E6F60",
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 8,
  },
});
