import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Alert, ActivityIndicator, ScrollView, TextInput } from 'react-native';
import { auth, firestore } from '../services/FirebaseConfig';
import { collection, query, where, getDocs, doc, addDoc, deleteDoc, setDoc } from 'firebase/firestore';

// Checkout Screen Component
export default function CheckoutScreen({ navigation }) {
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Shipping info fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Load addresses, cart items, and user info
  useEffect(() => {
    const load = async () => {
      if (!auth || !auth.currentUser) { setLoading(false); return; }
      try {
        setLoading(true);
        const uid = auth.currentUser.uid;
        // Fetch addresses
        const addrSnap = await getDocs(collection(firestore, 'users', uid, 'addresses'));
        const addr = addrSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setAddresses(addr);
        if (addr.length && !selectedAddressId) setSelectedAddressId(addr[0].id);

        // Fetch cart items
        const cartQ = query(collection(firestore, 'carts'), where('userId', '==', uid));
        const cartSnap = await getDocs(cartQ);
        if (!cartSnap.empty) {
          const cart = cartSnap.docs[0].data();
          setCartItems(Array.isArray(cart.items) ? cart.items : []);
        } else {
          setCartItems([]);
        }
        // Fetch user info for payment method
        const userDocRef = doc(firestore, 'users', uid);
        const { getDoc } = await import('firebase/firestore');
        const userSnap = await getDoc(userDocRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          setPaymentMethod(data.selectedPaymentMethod || null);
        }

        // prefill shipping info with user doc if available
        if (userSnap.exists()) {
          const data = userSnap.data();
          setFirstName(data.firstName || '');
          setLastName(data.lastName || '');
          setEmail(data.email || '');
          setPhone(data.phone || '');
        }
      } catch (err) {
        console.error('Checkout load error', err);
        Alert.alert('Error', 'Failed to load checkout data');
      } finally { setLoading(false); }
    };

    load();
    const unsub = navigation.addListener('focus', load);
    return unsub;
  }, [navigation, selectedAddressId]);

  // Calculate subtotal of cart items
  const subtotal = cartItems.reduce((s, it) => s + (Number(it.price || 0) * Number(it.quantity || 1)), 0);
  // Calculate 13% tax
  const tax = subtotal * 0.13;
  // Calculate total including tax
  const total = subtotal + tax;

  // Handle Place Order button press
  const placeOrder = async () => {
    if (!auth || !auth.currentUser) return Alert.alert('Error', 'Please login');
    if (!firstName.trim()) return Alert.alert('Validation', 'Please enter your first name.');
    if (!lastName.trim()) return Alert.alert('Validation', 'Please enter your last name.');
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) return Alert.alert('Validation', 'Please enter a valid email address.');
    if (!phone.trim() || !/^[\d\s\-+()]+$/.test(phone.trim())) return Alert.alert('Validation', 'Please enter a valid phone number.');
    if (!selectedAddressId) return Alert.alert('Validation', 'Please select a shipping address.');
    if (!paymentMethod) return Alert.alert('Validation', 'Please select a payment method.');
    if (cartItems.length === 0) return Alert.alert('Validation', 'Your cart is empty.');

    try {
      setLoading(true);
      const uid = auth.currentUser.uid;
      
      const { getDoc } = await import('firebase/firestore');
      const addrRef = doc(firestore, 'users', uid, 'addresses', selectedAddressId);
      const addrSnap = await getDoc(addrRef);
      const address = addrSnap.exists() ? addrSnap.data() : null;

      const shippingInfo = {
        firstName,
        lastName,
        email,
        phone
      };

      await addDoc(collection(firestore, 'orders'), {
        userId: uid,
        items: cartItems,
        total: subtotal,
        status: 'Placed',
        address: address,
        shippingInfo: shippingInfo,
        paymentMethod: paymentMethod,
        createdAt: new Date().toISOString()
      });

      const cartQ = query(collection(firestore, 'carts'), where('userId', '==', uid));
      const cartSnap = await getDocs(cartQ);
      for (const c of cartSnap.docs) await deleteDoc(doc(firestore, 'carts', c.id));

      Alert.alert('Order placed', 'Your order has been placed.', [
        { text: 'OK', onPress: () => navigation.navigate('Orders') }
      ]);
    } catch (err) {
      console.error('Place order error', err);
      Alert.alert('Error', 'Failed to place order');
    } finally { setLoading(false); }
  };

  if (loading) return (<View style={styles.center}><ActivityIndicator size="large" color="#007AFF"/></View>);

  const selectedAddress = addresses.find(a => a.id === selectedAddressId);

  // Rendered UI
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Order Summary</Text>

      {/* Shipping Information */}
      <Text style={styles.sectionTitle}>Shipping Information</Text>
      <View style={styles.shippingCard}>
        <TextInput
          placeholder="First Name"
          style={styles.input}
          value={firstName}
          onChangeText={setFirstName}
        />
        <TextInput
          placeholder="Last Name"
          style={styles.input}
          value={lastName}
          onChangeText={setLastName}
        />
        <TextInput
          placeholder="Email"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />
        <TextInput
          placeholder="Phone Number"
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />

        {selectedAddress ? (
          <>
            <Text style={styles.addrLine}>{selectedAddress.line}</Text>
            <Text style={styles.addrSub}>{selectedAddress.city}, {selectedAddress.zip}</Text>
            <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('Addresses')}>
              <Text style={styles.editText}>Change / Edit Address</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity style={styles.addAddressBtn} onPress={() => navigation.navigate('Addresses')}>
            <Text style={styles.addAddressText}>+ Add Shipping Address</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Payment Method */}
      <Text style={styles.sectionTitle}>Payment Method</Text>
      <TouchableOpacity style={styles.paymentBtn} onPress={() => navigation.navigate('Payment')}>
        <Text style={styles.paymentBtnText}>Select Payment Method</Text>
      </TouchableOpacity>
      <Text style={{marginBottom:12, color:'#555'}}>{paymentMethod || 'None selected'}</Text>

      {/* Order Summary */}
      <Text style={styles.sectionTitle}>Order Summary</Text>
      {cartItems.map((item, idx) => (
        <View key={idx} style={styles.cartItem}>
          <Text style={styles.cartItemText}>{item.name} x {item.quantity}</Text>
          <Text style={styles.cartItemText}>${(item.price * item.quantity).toFixed(2)}</Text>
        </View>
      ))}
      <Text style={styles.cartItemText1}>Tax: ${tax.toFixed(2)}</Text>
      <Text style={styles.summary}>Total: ${total.toFixed(2)}</Text>

      {/* Place Order */}
      <TouchableOpacity style={styles.placeBtn} onPress={placeOrder}>
        <Text style={styles.placeText}>Place Order</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, padding:16, backgroundColor:'#f4f4f6' },
  center: { flex:1, justifyContent:'center', alignItems:'center' },
  backBtn: { flexDirection:'row', alignItems:'center', marginBottom:12 },
  backText: { fontSize:16, color:'#007AFF', marginLeft:6, fontWeight:'600' },
  title: { fontSize:28, fontWeight:'bold', color:'#222', marginBottom:16, textAlign:'left' },
  sectionTitle: { fontSize:18, fontWeight:'bold', marginTop:16, marginBottom:8, color:'#222' },
  shippingCard: { padding:16, backgroundColor:'#fff', borderRadius:12, marginBottom:12, shadowColor:'#000', shadowOpacity:0.05, shadowOffset:{width:0,height:2}, shadowRadius:4, elevation:2 },
  input: { borderWidth:1, borderColor:'#ccc', padding:10, borderRadius:8, marginBottom:10 },
  editBtn: { marginTop:8, alignSelf:'flex-start', paddingVertical:6, paddingHorizontal:12, backgroundColor:'#5FB8A1', borderRadius:8 },
  editText: { color:'#fff', fontWeight:'600' },
  addAddressBtn: { backgroundColor:'#5FB8A1', padding:14, borderRadius:12, alignItems:'center', marginBottom:12, shadowColor:'#007AFF', shadowOpacity:0.2, shadowOffset:{width:0,height:3}, shadowRadius:4, elevation:2 },
  addAddressText: { color:'#fff', fontWeight:'600', fontSize:16 },
  addrLine: { fontWeight:'600', fontSize:16, color:'#222', marginTop:6 },
  addrSub: { color:'#666', marginTop:2 },
  paymentBtn: { backgroundColor:'#5FB8A1', padding:14, borderRadius:12, alignItems:'center', marginBottom:12, shadowColor:'#007AFF', shadowOpacity:0.2, shadowOffset:{width:0,height:3}, shadowRadius:4, elevation:2 },
  paymentBtnText: { color:'#fff', fontWeight:'600', fontSize:16 },
  cartItem: { flexDirection:'row', justifyContent:'space-between', backgroundColor:'#fff', padding:12, borderRadius:12, marginBottom:8, shadowColor:'#000', shadowOpacity:0.03, shadowOffset:{width:0,height:2}, shadowRadius:4, elevation:1 },
  cartItemText: { fontSize:16, color:'#222' },
  cartItemText1: { fontSize:14, color:'#222', marginTop:4, textAlign:'right' },
  summary: { fontSize:18, fontWeight:'bold', marginTop:8, marginBottom:16, color:'#222', textAlign:'right' },
  placeBtn: { backgroundColor:'#1E6F60', padding:14, borderRadius:12, alignItems:'center', shadowColor:'#5FB8A1', shadowOpacity:0.2, shadowOffset:{width:0,height:3}, shadowRadius:4, elevation:2 },
  placeText: { color:'#fff', fontWeight:'600', fontSize:18 },
});
