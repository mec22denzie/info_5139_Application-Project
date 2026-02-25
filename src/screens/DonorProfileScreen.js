//React and React Native imports
import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
// Firebase imports
import { auth, firestore } from "../services/FirebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { collection, query, where, getDocs } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { sanitizeText, isValidName, isValidPhone } from "../utils/validation";

// Donor Profile Screen Component - Allows donors to manage their contributor profile
export default function DonorProfileScreen({ navigation }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [totalListings, setTotalListings] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  const user = auth.currentUser;

  // Load donor profile data from Firestore
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return setLoading(false);
      try {
        setLoading(true);
        // Fetch user profile
        const userDoc = await getDoc(doc(firestore, "users", user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setFirstName(data.firstName || "");
          setLastName(data.lastName || "");
          setBio(data.bio || "");
          setPhone(data.phone || "");
        }
        // Count donor's listings
        const q = query(collection(firestore, "products"), where("donorId", "==", user.uid));
        const snap = await getDocs(q);
        setTotalListings(snap.size);
      } catch (err) {
        console.error("Error loading profile:", err);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
    const unsub = navigation.addListener("focus", loadProfile);
    return unsub;
  }, [navigation, user]);

  // Save updated profile to Firestore
  const handleSave = async () => {
    const cleanFirstName = sanitizeText(firstName);
    const cleanLastName = sanitizeText(lastName);
    const cleanBio = bio.trim();
    const cleanPhone = phone.trim();

    if (!cleanFirstName || !cleanLastName) {
      return Alert.alert("Validation", "First and last name are required.");
    }
    if (!isValidName(cleanFirstName) || !isValidName(cleanLastName)) {
      return Alert.alert("Validation", "Please enter valid names.");
    }
    if (cleanBio.length > 300) {
      return Alert.alert("Validation", "Bio must be 300 characters or less.");
    }
    if (cleanPhone && !isValidPhone(cleanPhone)) {
      return Alert.alert("Validation", "Please enter a valid phone number.");
    }

    try {
      setSaving(true);
      await setDoc(doc(firestore, "users", user.uid), {
        firstName: cleanFirstName,
        lastName: cleanLastName,
        bio: cleanBio,
        phone: cleanPhone,
      }, { merge: true });

      Alert.alert("Saved", "Profile updated successfully.");
      setEditing(false);
    } catch (err) {
      console.error("Error saving profile:", err);
      Alert.alert("Error", "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  // Logout function
  const handleLogout = () => {
    signOut(auth).catch((error) => console.error(error));
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1E6F60" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Profile header */}
      <View style={styles.header}>
        <Ionicons name="person-circle" size={80} color="#1E6F60" />
        <Text style={styles.displayName}>{firstName} {lastName}</Text>
        <Text style={styles.role}>Donor / Contributor</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{totalListings}</Text>
          <Text style={styles.statLabel}>Items Listed</Text>
        </View>
      </View>

      {/* Profile fields */}
      <Text style={styles.sectionTitle}>{editing ? "Edit Profile" : "Profile Details"}</Text>

      <Text style={styles.label}>First Name</Text>
      <TextInput
        style={[styles.input, !editing && styles.inputDisabled]}
        value={firstName}
        onChangeText={setFirstName}
        editable={editing}
      />

      <Text style={styles.label}>Last Name</Text>
      <TextInput
        style={[styles.input, !editing && styles.inputDisabled]}
        value={lastName}
        onChangeText={setLastName}
        editable={editing}
      />

      <Text style={styles.label}>Bio</Text>
      <TextInput
        style={[styles.input, styles.textArea, !editing && styles.inputDisabled]}
        value={bio}
        onChangeText={setBio}
        editable={editing}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
        placeholder="Tell students about yourself..."
      />

      <Text style={styles.label}>Phone</Text>
      <TextInput
        style={[styles.input, !editing && styles.inputDisabled]}
        value={phone}
        onChangeText={setPhone}
        editable={editing}
        keyboardType="phone-pad"
        placeholder="Optional contact number"
      />

      {/* Action buttons */}
      {editing ? (
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditing(false)}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save</Text>}
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.editBtn} onPress={() => setEditing(true)}>
          <Text style={styles.editBtnText}>Edit Profile</Text>
        </TouchableOpacity>
      )}

      {/* Menu items */}
      <View style={styles.menuSection}>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate("HelpSupport")}>
          <Ionicons name="help-circle-outline" size={22} color="#00A34A" style={styles.menuIcon} />
          <Text style={styles.menuText}>Help & Support</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate("About")}>
          <Ionicons name="information-circle-outline" size={22} color="#00A34A" style={styles.menuIcon} />
          <Text style={styles.menuText}>About</Text>
        </TouchableOpacity>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

//Style
const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { alignItems: "center", marginBottom: 20, backgroundColor: "#5FB8A1", padding: 24, borderRadius: 16 },
  displayName: { fontSize: 24, fontWeight: "700", color: "#fff", marginTop: 10 },
  role: { fontSize: 14, color: "#E8F5E9", marginTop: 2, fontWeight: "600" },
  email: { fontSize: 14, color: "#E8F5E9", marginTop: 4 },
  statsRow: { flexDirection: "row", justifyContent: "center", marginBottom: 20 },
  statBox: { alignItems: "center", paddingHorizontal: 30, paddingVertical: 12, backgroundColor: "#f4f4f6", borderRadius: 12 },
  statNumber: { fontSize: 24, fontWeight: "700", color: "#1E6F60" },
  statLabel: { fontSize: 13, color: "#666", marginTop: 2 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#222", marginBottom: 12, marginTop: 8 },
  label: { fontSize: 14, fontWeight: "600", color: "#333", marginBottom: 4, marginTop: 10 },
  input: { width: "100%", height: 50, borderWidth: 1, borderColor: "#ccc", borderRadius: 12, paddingHorizontal: 16, backgroundColor: "#fff", fontSize: 16, color: "#222" },
  inputDisabled: { backgroundColor: "#f4f4f6", color: "#666" },
  textArea: { height: 80, paddingTop: 12 },
  buttonRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 16 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: "#ccc", alignItems: "center", marginRight: 8 },
  cancelBtnText: { color: "#333", fontWeight: "600", fontSize: 16 },
  saveBtn: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: "#1E6F60", alignItems: "center", marginLeft: 8 },
  saveBtnText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  editBtn: { backgroundColor: "#5FB8A1", padding: 14, borderRadius: 12, alignItems: "center", marginTop: 16 },
  editBtnText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  menuSection: { marginTop: 24 },
  menuItem: { flexDirection: "row", alignItems: "center", paddingVertical: 16, paddingHorizontal: 15, borderBottomWidth: 1, borderBottomColor: "#eee", borderRadius: 8, marginBottom: 8, backgroundColor: "#fafafa" },
  menuIcon: { marginRight: 15 },
  menuText: { fontSize: 17, color: "#333", fontWeight: "500" },
  logoutBtn: { marginTop: 24, backgroundColor: "#1E6F60", paddingVertical: 15, borderRadius: 10, alignItems: "center" },
  logoutText: { color: "#fff", fontWeight: "600", fontSize: 17 },
});
