import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { auth, firestore } from "../services/FirebaseConfig";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { showAlert } from "../utils/alert";

export default function ChatScreen({ route }) {
  const { chatId, productName } = route?.params || {};
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const flatListRef = useRef(null);

  useEffect(() => {
    if (!chatId) return;

    const q = query(
      collection(firestore, "chats", chatId, "messages"),
      orderBy("createdAt", "asc"),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((docItem) => ({
        id: docItem.id,
        ...docItem.data(),
      }));

      const sortedList = list.sort((a, b) => {
        const getTime = (value) => {
          if (!value) return 0;

          // Firestore Timestamp
          if (typeof value?.toMillis === "function") {
            return value.toMillis();
          }

          // ISO string
          if (typeof value === "string") {
            const parsed = new Date(value).getTime();
            return Number.isNaN(parsed) ? 0 : parsed;
          }

          return 0;
        };

        return getTime(a.createdAt) - getTime(b.createdAt);
      });

      setMessages(sortedList);
    });

    return unsubscribe;
  }, [chatId]);

  useEffect(() => {
    if (!messages.length) return;

    const timer = setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    return () => clearTimeout(timer);
  }, [messages]);

  const sendMessage = async () => {
    try {
      if (!chatId) {
        showAlert("Error", "Chat information is missing.");
        return;
      }

      if (!text.trim()) return;

      const senderId = auth.currentUser?.uid;
      const cleanText = text.trim();

      if (!senderId) {
        showAlert("Error", "Please log in again.");
        return;
      }

      await addDoc(collection(firestore, "chats", chatId, "messages"), {
        senderId,
        text: cleanText,
        createdAt: serverTimestamp(),
      });

      await updateDoc(doc(firestore, "chats", chatId), {
        lastMessage: cleanText,
        lastMessageAt: serverTimestamp(),
      });

      setText("");
    } catch (error) {
      console.log("sendMessage error:", error);
      showAlert("Error", "Failed to send message.");
    }
  };

  const renderItem = ({ item }) => {
    const isMine = item.senderId === auth.currentUser?.uid;

    return (
      <View
        style={[
          styles.messageBubble,
          isMine ? styles.myMessage : styles.otherMessage,
        ]}
      >
        <Text style={styles.messageText}>{item.text}</Text>
      </View>
    );
  };

  if (!chatId) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorTitle}>Chat information is missing.</Text>
        <Text style={styles.errorText}>
          Please open the chat from the product page.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Chat about: {productName || "Product"}</Text>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              No messages yet. Start the conversation.
            </Text>
          </View>
        }
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: true })
        }
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Type a message..."
          multiline
          numberOfLines={3}
        />
        <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
          <Text style={styles.sendBtnText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#fff",
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#1E6F60",
  },
  errorText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  header: {
    fontSize: 18,
    fontWeight: "bold",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    color: "#1E6F60",
  },
  list: {
    padding: 12,
    flexGrow: 1,
  },
  emptyState: {
    alignItems: "center",
    marginTop: 40,
  },
  emptyText: {
    color: "#999",
    fontSize: 15,
  },
  messageBubble: {
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
    maxWidth: "75%",
  },
  myMessage: {
    backgroundColor: "#DCF8C6",
    alignSelf: "flex-end",
  },
  otherMessage: {
    backgroundColor: "#F1F1F1",
    alignSelf: "flex-start",
  },
  messageText: {
    fontSize: 15,
  },
  inputContainer: {
    flexDirection: "row",
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    alignItems: "flex-end",
    backgroundColor: "#fff",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingTop: 10,
    minHeight: 60,
    maxHeight: 100,
    marginRight: 8,
    textAlignVertical: "top",
  },
  sendBtn: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 16,
    paddingVertical: 14,
    justifyContent: "center",
    borderRadius: 8,
  },
  sendBtnText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
