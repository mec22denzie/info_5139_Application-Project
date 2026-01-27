import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { collection, getDocs, addDoc, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { auth, firestore } from '../services/FirebaseConfig';

// Addresses Screen Component
export default function AddressesScreen({ navigation }) {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [line, setLine] = useState('');
  const [city, setCity] = useState('');
  const [zip, setZip] = useState('');

  // Get current user ID
  const uid = auth && auth.currentUser ? auth.currentUser.uid : null;

  // Fetch addresses on component mount
  useEffect(() => {
    const fetchAddresses = async () => {
      if (!uid) return setLoading(false);
      try {
        setLoading(true);
        const snap = await getDocs(collection(firestore, 'users', uid, 'addresses'));
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setAddresses(data);
      } catch (err) {
        console.error('Error fetching addresses', err);
        Alert.alert('Error', 'Could not load addresses');
      } finally { setLoading(false); }
    };
    fetchAddresses();
  }, [uid]);

  // Add a new address
  const addAddress = async () => {
    if (!uid) return Alert.alert('Error', 'Not signed in');
    if (!line || !city) return Alert.alert('Validation', 'Please enter address line and city');
    try {
      const ref = await addDoc(collection(firestore, 'users', uid, 'addresses'), { line, city, zip, createdAt: new Date().toISOString() });
      const created = { id: ref.id, line, city, zip };
      const hasDefault = addresses.some(a => a.isDefault);
      if (!hasDefault) {
        await setDoc(doc(firestore, 'users', uid, 'addresses', ref.id), { isDefault: true }, { merge: true });
        created.isDefault = true;
      }
      setAddresses(prev => [...prev, created]);
      setLine(''); setCity(''); setZip('');
    } catch (err) {
      console.error('Error adding address', err);
      Alert.alert('Error', 'Could not add address');
    }
  };

  // Remove an address
  const remove = async (id) => {
    try {
      await deleteDoc(doc(firestore, 'users', uid, 'addresses', id));
      setAddresses(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      console.error('Error removing address', err);
      Alert.alert('Error', 'Could not remove address');
    }
  };

  // Set an address as default
  const setDefault = async (id) => {
    if (!uid) return Alert.alert('Error', 'Not signed in');
    try {
      const snap = await getDocs(collection(firestore, 'users', uid, 'addresses'));
      const ops = snap.docs.map(async (d) => {
        const docRef = doc(firestore, 'users', uid, 'addresses', d.id);
        await setDoc(docRef, { isDefault: d.id === id }, { merge: true });
      });
      await Promise.all(ops);
      setAddresses(prev => prev.map(a => ({ ...a, isDefault: a.id === id })));
      Alert.alert('Default set', 'This address is now the default for checkout');
    } catch (err) {
      console.error('Error setting default address', err);
      Alert.alert('Error', 'Could not set default address');
    }
  };

  // Render component
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Add New Address</Text>
      </View>

      {/* Input fields for new address */}
      <View style={styles.inputContainer}>
        <TextInput placeholder="Address line" value={line} onChangeText={setLine} style={styles.input} />
        <TextInput placeholder="City" value={city} onChangeText={setCity} style={styles.input} />
        <TextInput placeholder="Zip" value={zip} onChangeText={setZip} style={styles.input} />
        <TouchableOpacity style={styles.addBtn} onPress={addAddress}>
          <Text style={styles.addBtnText}>Add Address</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Current Addresses</Text>
      </View>
      
      {/* List of current addresses */}
      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={addresses}
          keyExtractor={i => i.id}
          contentContainerStyle={{ paddingBottom: 20 }}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.line}>{item.line} {item.isDefault ? ' (Default)' : ''}</Text>
                <Text style={styles.sub}>{item.city} {item.zip}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {!item.isDefault && (
                  <TouchableOpacity onPress={() => setDefault(item.id)} style={styles.defaultBtn}>
                    <Text style={styles.defaultBtnText}>Set default</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => remove(item.id)} style={styles.del}>
                  <Text style={styles.delText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex:1,
    padding:16,
    backgroundColor:'#f4f4f6',
  },
  title: {
    fontSize:28,
    fontWeight:'bold',
    color:'#222',
    marginBottom:16,
    textAlign:'left',
  },
  inputContainer: {
    marginBottom:20,
  },
  input: {
    width:'100%',
    height:50,
    borderWidth:1,
    borderColor:'#ccc',
    borderRadius:12,
    marginBottom:12,
    paddingHorizontal:16,
    backgroundColor:'#fff',
    shadowColor:'#000',
    shadowOpacity:0.05,
    shadowOffset:{ width:0, height:3 },
    shadowRadius:6,
    elevation:2,
    fontSize:16,
    color:'#222',
  },
  addBtn: {
    backgroundColor:'#1E6F60',
    paddingVertical:14,
    borderRadius:12,
    alignItems:'center',
    shadowColor:'#00A34A',
    shadowOpacity:0.2,
    shadowOffset:{ width:0, height:3 },
    shadowRadius:4,
    elevation:3,
  },
  addBtnText: {
    color:'#fff',
    fontWeight:'600',
    fontSize:16,
  },
  row: {
    flexDirection:'row',
    padding:12,
    backgroundColor:'#fff',
    borderRadius:12,
    marginBottom:12,
    alignItems:'center',
    shadowColor:'#000',
    shadowOpacity:0.03,
    shadowOffset:{ width:0, height:2 },
    shadowRadius:4,
    elevation:1,
  },
  line: { fontWeight:'bold', fontSize:16, color:'#222' },
  sub: { color:'#666', fontSize:14, marginTop:2 },
  del: { padding:8 },
  delText: { color:'#d00', fontWeight:'600' },
  defaultBtn: { padding:8, marginRight:8, borderRadius:8, backgroundColor:'#e6f0ff' },
  defaultBtnText: { color:'#00A34A', fontWeight:'600' },
  paymentBtn: { backgroundColor:'#1E6F60', padding:14, borderRadius:12, alignItems:'center', marginBottom:16 },
  paymentBtnText: { color:'#fff', fontWeight:'600', fontSize:16 },
  header: {
  width: "100%",
  height: 90,
  justifyContent: "center",
  alignItems: "flex-start",
  paddingTop: 35,
  marginBottom: 20,
},

headerTitle: {
  fontSize: 22,
  fontWeight: "700",
  color: "#222",
  paddingTop: 25,
  textAlign: "left",
},
});
