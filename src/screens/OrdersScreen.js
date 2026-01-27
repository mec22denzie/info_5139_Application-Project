//React and React Native imports
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';

// Firebase imports
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, firestore } from '../services/FirebaseConfig';

export default function OrdersScreen({ navigation }) {
  // State for orders and loading indicator
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch orders from Firestore for the current user
  useEffect(() => {
    const fetchOrders = async () => {
      if (!auth || !auth.currentUser) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const uid = auth.currentUser.uid;
        const q = query(collection(firestore, 'orders'), where('userId', '==', uid));
        const snap = await getDocs(q);
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

        // Sort by createdAt descending
        setOrders(data.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')));
      } catch (err) {
        console.error('Error fetching orders', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // Handle Track Order button press
  const handleTrackOrder = (order) => {
    Alert.alert(`Order #${order.id}`, `Status: ${order.status || 'Unknown'}`, [{ text: 'OK' }]);
  };

  // Show loading indicator while fetching orders
  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );

  // Main UI rendering
  return (
    <View style={styles.container}>
      {/* Title */}
      <Text style={styles.title}>Order History</Text>

      {/* Orders list */}
      <FlatList
        data={orders}
        keyExtractor={(o) => o.id}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.id}>Order ID: {item.id}</Text>
            <Text style={styles.date}>
              {item.createdAt ? new Date(item.createdAt).toLocaleString() : '—'}
            </Text>
            <Text style={styles.item}>Items: {item.items ? item.items.length : 0}</Text>
            <Text style={styles.name}>
              Name: {item.items && item.items.length > 0 ? item.items[0].name : 'Unknown'}
            </Text>

            {/* Total including 13% tax */}
            <Text style={styles.total}>${((Number(item.total || 0)) * 1.13).toFixed(2)}</Text>

            {/* Order status */}
            <Text
              style={[
                styles.status,
                item.status === 'Delivered' ? { color: '#00A34A' } : { color: '#FFA500' },
              ]}
            >
              {item.status || 'Unknown'}
            </Text>

            {/* Track order button */}
            <TouchableOpacity style={styles.trackBtn} onPress={() => handleTrackOrder(item)}>
              <Text style={styles.trackBtnText}>Track Order</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      {/* Continue shopping button */}
      <TouchableOpacity
        style={styles.continueBtnGlobal}
        onPress={() => navigation.navigate('HomeTabs', { screen: 'Products' })}
      >
        <Text style={styles.continueText}>Continue Shopping</Text>
      </TouchableOpacity>
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  container: { flex: 1, padding: 12, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  row: { padding: 12, backgroundColor: '#f9f9f9', borderRadius: 8, marginBottom: 8 },
  date: { fontSize: 14, color: '#333' },
  total: { fontSize: 16, fontWeight: 'bold', marginTop: 6 },
  status: { marginTop: 6, fontWeight: '600' },
  trackBtn: {
    marginTop: 8,
    backgroundColor: '#5FB8A1',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  trackBtnText: { color: '#fff', fontWeight: 'bold' },
  continueBtnGlobal: {
    marginTop: 12,
    backgroundColor: '#1E6F60',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  continueText: { color: '#fff', fontWeight: '600' },
});
