// Error Boundary Component
// Catches JavaScript errors in the React component tree and logs them
// to Firestore via the error logger. Shows a fallback UI instead of crashing.
//
// NOTE: React Navigation sets aria-hidden on inactive screens which can block
// focus for screen readers. This is a known library issue (not in our code).
// Monitor for future fix: https://github.com/react-navigation/react-navigation/issues

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { logError } from "../services/errorLogger";

export default class ErrorBoundary extends React.Component {
  state = { hasError: false };

  // Update state so next render shows the fallback UI
  static getDerivedStateFromError() {
    return { hasError: true };
  }

  // Log the error to Firestore
  componentDidCatch(error, errorInfo) {
    logError(error, {
      screen: "ErrorBoundary",
      metadata: { componentStack: errorInfo?.componentStack || null },
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>
            An unexpected error occurred. Please try again.
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => this.setState({ hasError: false })}
          >
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f4f4f6",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#222",
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  button: {
    backgroundColor: "#1E6F60",
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});
