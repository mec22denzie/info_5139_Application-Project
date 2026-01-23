//React and React Native imports
import React, { useState } from "react";
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
// Firebase authentication and database imports
import { createUserWithEmailAndPassword } from "firebase/auth";
import { set, ref } from "firebase/database";
import { doc, setDoc } from "firebase/firestore";
import { auth, db, firestore } from "../services/FirebaseConfig";

// Main SignUpScreen component
export default function SignUpScreen({ navigation }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

   // Function to register a new user in Firebase
  const registerWithFirebase = async () => {
    if (!firstName || !lastName) {
      Alert.alert("Please enter first and last name.");
      return;
    }
    if (email.length < 8 || password.length < 8) {
      Alert.alert("Please enter valid email and password.");
      return;
    }

    try {
      setLoading(true);
      // Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;

      // Save user data to Firebase Realtime Database
      await set(ref(db, "users/" + newUser.uid), {
        uid: newUser.uid,
        email: newUser.email,
        firstName,
        lastName,
        createdAt: Date.now(),
      });

      // Save user data to Firestore
      await setDoc(doc(firestore, "users", newUser.uid), {
        email: newUser.email,
        firstName,
        lastName,
        createdAt: Date.now(),
      });

      // Sign out user after registration
      await auth.signOut();

      // Show success alert and navigate to Login screen
      Alert.alert("Registration Successful!", "Please log in.", [
        { text: "OK", onPress: () => navigation.replace("Login") },
      ]);
    } catch (error) {
      // Handle registration errors
      console.log("Registration Error:", error);
      Alert.alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Render the signup form
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="First Name"
          value={firstName}
          onChangeText={setFirstName}
        />
        <TextInput
          style={styles.input}
          placeholder="Last Name"
          value={lastName}
          onChangeText={setLastName}
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
      </View>

      {/* Register button */}
      <TouchableOpacity style={styles.button} onPress={registerWithFirebase} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Register</Text>}
      </TouchableOpacity>

      {/* Link to navigate to Login screen */}
      <Text style={styles.text}>
        Already have an account?{" "}
        <Text style={styles.link} onPress={() => navigation.replace("Login")}>
          Sign In
        </Text>
      </Text>
    </View>
  );
}

//Style
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f4f6",
    padding: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#222",
    marginBottom: 24,
  },
  inputContainer: {
    width: "100%",
    maxWidth: 350,
    marginBottom: 20,
  },
  input: {
    width: "100%",
    height: 50,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 12,
    marginBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 2,
    fontSize: 16,
    color: "#222",
  },
  button: {
    width: "100%",
    maxWidth: 350,
    backgroundColor: "#1E6F60",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#1E6F60",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 18,
  },
  text: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
  },
  link: {
    color: "#00A34A",
    fontWeight: "bold",
  },
});
