//React and React Native imports
import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
// Firebase imports
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  deleteDoc,
} from "firebase/firestore";
import { auth, firestore } from "../services/FirebaseConfig";
import { logError } from "../services/errorLogger";
import { showAlert } from "../utils/alert";

// My Listings Screen Component - Shows items posted by the current donor
export default function MyListingsScreen({ navigation }) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);

  // Fetch donor's listings from Firestore
  const fetchListings = useCallback(async () => {
    if (!auth || !auth.currentUser) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const uid = auth.currentUser.uid;

      // Fetch donor listings
      const listingsQuery = query(
        collection(firestore, "products"),
        where("donorId", "==", uid)
      );
      const listingsSnapshot = await getDocs(listingsQuery);
      const listingsData = listingsSnapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setListings(listingsData);

      // Fetch donor orders/requests
      const ordersQuery = query(
        collection(firestore, "orders"),
        where("donorId", "==", uid)
      );
      const ordersSnapshot = await getDocs(ordersQuery);
      const ordersData = ordersSnapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setOrders(ordersData);
    } catch (err) {
      logError(err, {
        screen: "MyListingsScreen",
        metadata: { action: "fetchListings" },
      });
      showAlert("Error", "Failed to load your listings.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch listings on mount and when screen comes into focus
  useEffect(() => {
    fetchListings();
    const unsub = navigation.addListener("focus", fetchListings);
    return unsub;
  }, [navigation, fetchListings]);

    // Open chat request
    const openChat = async (request) => {
      try {
        const donorId = auth.currentUser?.uid;
        const buyerId = request?.buyerId;
        const productId = request?.productId;

        console.log("openChat request:", request);

        if (!donorId) {
          showAlert("Error", "You must be logged in.");
          return;
        }

        if (!buyerId || !productId) {
          showAlert("Error", "Buyer or product information is missing.");
          return;
        }

        const chatQuery = query(
          collection(firestore, "chats"),
          where("buyerId", "==", buyerId),
          where("donorId", "==", donorId),
          where("productId", "==", productId)
        );

        const chatSnap = await getDocs(chatQuery);

        let chatId;

        if (chatSnap.empty) {
          const newChatRef = await addDoc(collection(firestore, "chats"), {
            buyerId,
            donorId,
            buyerName: request?.buyerName || "Buyer",
            donorName: auth.currentUser?.displayName || "Donor",
            productId,
            productName: request?.productName || "",
            orderId: request?.id || "",
            lastMessage: "",
            lastMessageAt: null,
            createdAt: new Date().toISOString(),
          });

          chatId = newChatRef.id;
        } else {
          chatId = chatSnap.docs[0].id;
        }

        navigation.navigate("ChatScreen", {
          chatId,
          buyerId,
          donorId,
          productName: request?.productName || "",
        });
      } catch (error) {
        console.log("openChat error:", error);
        showAlert("Error", "Failed to open chat.");
      }
    };

  // Delete a listing from Firestore
  const deleteListing = (id) => {
    showAlert("Delete Listing", "Are you sure you want to delete this item?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            // Verify ownership before deleting
            const productDoc = await getDoc(doc(firestore, "products", id));
            if (!productDoc.exists() || productDoc.data().donorId !== auth.currentUser.uid) {
              showAlert("Error", "You can only delete your own listings.");
              return;
            }
            await deleteDoc(doc(firestore, "products", id));
            setListings((prev) => prev.filter((item) => item.id !== id));
            showAlert("Deleted", "Item removed successfully.");
          } catch (err) {
            logError(err, { screen: "MyListingsScreen", metadata: { action: "deleteListing" } });
            showAlert("Error", "Failed to delete item.");
          }
        },
      },
    ]);
  };

  const acceptRequest = async (orderId) => {
  try {
    await updateDoc(doc(firestore, "orders", orderId), {
      status: "accepted",
      updatedAt: new Date().toISOString(),
    });

    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId ? { ...order, status: "accepted" } : order
      )
    );

    showAlert("Success", "Request accepted.");
  } catch (err) {
    logError(err, {
      screen: "MyListingsScreen",
      metadata: { action: "acceptRequest", orderId },
    });
    showAlert("Error", "Failed to accept request.");
  }
};

const rejectRequest = async (orderId) => {
  try {
    await updateDoc(doc(firestore, "orders", orderId), {
      status: "rejected",
      updatedAt: new Date().toISOString(),
    });

    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId ? { ...order, status: "rejected" } : order
      )
    );

    showAlert("Success", "Request rejected.");
  } catch (err) {
    logError(err, {
      screen: "MyListingsScreen",
      metadata: { action: "rejectRequest", orderId },
    });
    showAlert("Error", "Failed to reject request.");
  }
};

  
  const markAsCompleted = async (orderId, productId) => {
    try {
      await updateDoc(doc(firestore, "orders", orderId), {
        status: "completed",
        updatedAt: new Date().toISOString(),
      });

      await updateDoc(doc(firestore, "products", productId), {
        available: false,
        updatedAt: new Date().toISOString(),
      });

      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, status: "completed" } : order
        )
      );

      setListings((prev) =>
        prev.map((listing) =>
          listing.id === productId ? { ...listing, available: false } : listing
        )
      );

      showAlert("Success", "Item marked as completed.");
    } catch (err) {
      logError(err, {
        screen: "MyListingsScreen",
        metadata: { action: "markAsCompleted", orderId, productId },
      });
      showAlert("Error", "Failed to mark item as completed.");
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1E6F60" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Listings</Text>

      {listings.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>You haven't posted any items yet.</Text>
          <TouchableOpacity style={styles.postBtn} onPress={() => navigation.navigate("PostItem")}>
            <Text style={styles.postBtnText}>Post Your First Item</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 20 }}
          renderItem={({ item }) => {
            const relatedOrders = orders.filter(
              (order) => order.productId === item.id
            );

            return (
              <View style={styles.card}>
                {/* Item image */}
                {item.imageUri && item.imageUri.startsWith("https://") ? (
                  <Image
                    source={{ uri: item.imageUri }}
                    style={styles.image}
                    resizeMode="contain"
                  />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Text style={styles.placeholderText}>No Image</Text>
                  </View>
                )}

                {/* Item info */}
                <View style={styles.info}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.category}>{item.category}</Text>

                  {item.isDonation ? (
                    <Text style={styles.donation}>Free (Donation)</Text>
                  ) : (
                    <Text style={styles.price}>${Number(item.price).toFixed(2)}</Text>
                  )}

                  <Text style={styles.description} numberOfLines={2}>
                    {item.description}
                  </Text>

                  <Text style={styles.statusText}>
                    Status: {item.available === false ? "Completed" : "Available"}
                  </Text>
                </View>

                {/* Request section */}
                <View style={styles.requestsSection}>
                  {relatedOrders.length === 0 ? (
                    <Text style={styles.noRequestsText}>No requests yet.</Text>
                  ) : (
                    relatedOrders.map((order) => (
                      <View key={order.id} style={styles.requestCard}>
                        <Text style={styles.requestTitle}>Request</Text>
                        <Text style={styles.requestStatus}>
                          Status: {order.status || "pending"}
                        </Text>

                        {(order.status === "accepted" || order.status === "completed") && (
                          <TouchableOpacity
                            style={styles.messageBtn}
                            onPress={() => openChat(order)}
                          >
                            <Text style={styles.messageBtnText}>Message Buyer</Text>
                          </TouchableOpacity>
                        )}

                        {order.status === "accepted" && (
                          <TouchableOpacity
                            style={styles.completeBtn}
                            onPress={() => markAsCompleted(order.id, item.id)}
                          >
                            <Text style={styles.actionBtnText}>Mark as Completed</Text>
                          </TouchableOpacity>
                        )}

                        {(order.status === "pending" || !order.status) && (
                          <View style={styles.requestActions}>
                            <TouchableOpacity
                              style={styles.acceptBtn}
                              onPress={() => acceptRequest(order.id)}
                            >
                              <Text style={styles.actionBtnText}>Accept</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={styles.rejectBtn}
                              onPress={() => rejectRequest(order.id)}
                            >
                              <Text style={styles.actionBtnText}>Reject</Text>
                            </TouchableOpacity>
                          </View>
                        )}

                        {order.status === "accepted" && (
                          <Text style={styles.waitingText}>
                            Waiting for buyer checkout
                          </Text>
                        )}

                        {order.status === "completed" && (
                          <Text style={styles.completedText}>
                            Item completed
                          </Text>
                        )}
                      </View>
                    ))
                  )}
                </View>


                {/* Existing listing action buttons */}
                <View style={styles.actions}>
{/*                   <TouchableOpacity
                    style={styles.messageBtn}
                    onPress={() => {
                      console.log("Message button item:", item);
                      openChat(item);
                    }}
                  >
                    <Text style={styles.messageBtnText}>Message Buyer</Text>
                  </TouchableOpacity> */}

                  <TouchableOpacity
                    style={styles.editBtn}
                    onPress={() => navigation.navigate("EditItem", { item })}
                  >
                    <Text style={styles.editBtnText}>Edit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => deleteListing(item.id)}
                  >
                    <Text style={styles.deleteBtnText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

//Style
const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f4f4f6" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 16, color: "#222" },
  emptyText: { fontSize: 16, color: "#666", marginBottom: 20, textAlign: "center" },
  postBtn: { backgroundColor: "#1E6F60", paddingVertical: 14, paddingHorizontal: 30, borderRadius: 12 },
  postBtnText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  image: {
    width: "100%",
    height: 300,
    borderRadius: 12,
    backgroundColor: "#f5f5f5",
  },
  imagePlaceholder: {
    width: "100%",
    height: 300,
    borderRadius: 12,
    backgroundColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  placeholderText: { color: "#999", fontSize: 14 },
  info: { marginBottom: 10 },
  name: { fontSize: 18, fontWeight: "600", color: "#222" },
  category: { fontSize: 13, color: "#888", marginTop: 2 },
  price: { fontSize: 16, fontWeight: "500", color: "#00A34A", marginTop: 4 },
  donation: { fontSize: 16, fontWeight: "500", color: "#1E6F60", marginTop: 4 },
  description: { fontSize: 14, color: "#666", marginTop: 4 },
  actions: { flexDirection: "row", justifyContent: "flex-end" },
  messageBtn: { backgroundColor: "#4A90A4", paddingVertical: 8, paddingHorizontal: 20, borderRadius: 8, marginRight: 10, alignSelf: "flex-start" },
  messageBtnText: { color: "#fff", fontWeight: "600" },
  editBtn: { backgroundColor: "#5FB8A1", paddingVertical: 8, paddingHorizontal: 20, borderRadius: 8, marginRight: 10 },
  editBtnText: { color: "#fff", fontWeight: "600" },
  deleteBtn: { backgroundColor: "#d00", paddingVertical: 8, paddingHorizontal: 20, borderRadius: 8 },
  deleteBtnText: { color: "#fff", fontWeight: "600" },
  statusText: {
  fontSize: 14,
  color: "#1E6F60",
  marginTop: 6,
  fontWeight: "600",
},
requestsSection: {
  marginTop: 8,
  marginBottom: 10,
},
noRequestsText: {
  color: "#777",
  fontSize: 14,
},
requestCard: {
  backgroundColor: "#f8f8f8",
  borderRadius: 10,
  padding: 10,
  marginTop: 8,
  borderWidth: 1,
  borderColor: "#e6e6e6",
},
requestTitle: {
  fontSize: 15,
  fontWeight: "600",
  color: "#222",
},
requestStatus: {
  fontSize: 14,
  color: "#555",
  marginTop: 4,
},
requestActions: {
  flexDirection: "row",
  marginTop: 10,
},
acceptBtn: {
  flex: 1,
  backgroundColor: "#1E6F60",
  paddingVertical: 10,
  borderRadius: 8,
  marginRight: 6,
  alignItems: "center",
},
rejectBtn: {
  flex: 1,
  backgroundColor: "#d9534f",
  paddingVertical: 10,
  borderRadius: 8,
  marginLeft: 6,
  alignItems: "center",
},
completeBtn: {
  marginTop: 10,
  backgroundColor: "#00A34A",
  paddingVertical: 10,
  borderRadius: 8,
  alignItems: "center",
},
actionBtnText: {
  color: "#fff",
  fontWeight: "600",
},
waitingText: {
  marginTop: 10,
  color: "#b26a00",
  fontWeight: "600",
},
rejectedText: {
  marginTop: 10,
  color: "#d9534f",
  fontWeight: "600",
},
completedText: {
  marginTop: 10,
  color: "#00A34A",
  fontWeight: "600",
},
});
