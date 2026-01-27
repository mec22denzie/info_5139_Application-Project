import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Alert } from 'react-native';
import { auth, firestore } from '../services/FirebaseConfig';
import { doc, setDoc, getDoc } from 'firebase/firestore';

// Payment Screen Component
const METHODS = ['Credit Card', 'PayPal', 'Cash on Delivery'];

export default function PaymentScreen({ navigation }) {
  const [selected, setSelected] = useState(null);
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');

  // Load saved payment method
  useEffect(() => {
    const load = async () => {
      if (!auth || !auth.currentUser) return;
      try {
        const uid = auth.currentUser.uid;
        const userRef = doc(firestore, 'users', uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          //setSelected(data.selectedPaymentMethod || null);
        }
      } catch (err) {
        console.error('Error loading payment method', err);
      }
    };
    load();
  }, []);

  // Validate card details (basic)
  const validateCard = () => {
    const digits = cardNumber.replace(/\s+/g, '');
    if (!/^[0-9]{12,19}$/.test(digits)) return false;
    if (!/^(0[1-9]|1[0-2])\/(?:\d{2})$/.test(expiry)) return false; // MM/YY
    return true;
  };

  // Save selected payment method
  const save = async () => {
    if (!selected) return Alert.alert('Validation', 'Please select a payment method');

    if (selected === 'Credit Card') {
      if (!validateCard()) {
        return Alert.alert('Validation', 'Please enter a valid card number and expiry (MM/YY)');
      }
      // Card details NOT stored – only method saved
    }

    try {
      if (!auth || !auth.currentUser) return Alert.alert('Error', 'Not signed in');
      const uid = auth.currentUser.uid;

      await setDoc(doc(firestore, 'users', uid), {
        selectedPaymentMethod: selected
      }, { merge: true });

      Alert.alert('Saved', 'Payment method saved (dummy, card not stored)');
      navigation.goBack();
    } catch (err) {
      console.error('Error saving payment method', err);
      Alert.alert('Error', 'Could not save payment method');
    }
  };

  // Rendered UI
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Payment Method</Text>
      
      {METHODS.map((m) => (
        <TouchableOpacity
          key={m}
          style={[styles.methodCard, selected === m && styles.methodActive]}
          onPress={() => setSelected(m)}
        >
          <Text style={styles.methodText}>{m}</Text>
        </TouchableOpacity>
      ))}

      {selected === 'Credit Card' && (
        <View style={styles.cardForm}>
          <Text style={styles.hint}>Enter card details (not stored):</Text>

          <TextInput
            style={styles.input}
            placeholder="4242 4242 4242 4242"
            keyboardType="number-pad"
            value={cardNumber}
            onChangeText={setCardNumber}
          />

          <TextInput
            style={styles.input}
            placeholder="MM/YY"
            keyboardType="number-pad"
            value={expiry}
            onChangeText={setExpiry}
          />
        </View>
      )}

      <TouchableOpacity style={styles.saveBtn} onPress={save}>
        <Text style={styles.saveText}>Save</Text>
      </TouchableOpacity>
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f4f4f6'
  },

  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'left',
    color: '#222'
  },

  methodCard: {
    padding: 14,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2
  },
  methodActive: {
    borderWidth: 2,
    borderColor: '#5FB8A1',
    backgroundColor: '#d6eaff'
  },
  methodText: {
    fontSize: 16,
    color: '#222'
  },

  cardForm: {
    marginTop: 16,
    marginBottom: 16
  },

  hint: {
    color: '#666',
    marginBottom: 8,
    fontSize: 14
  },

  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16
  },

  saveBtn: {
    backgroundColor: '#1E6F60',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20
  },

  saveText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16
  }
});
