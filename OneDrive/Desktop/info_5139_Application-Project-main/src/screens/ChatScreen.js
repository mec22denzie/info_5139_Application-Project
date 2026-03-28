import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { auth, firestore } from "../services/FirebaseConfig";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc
} from "firebase/firestore";
import { showAlert } from "../utils/alert";

export default function ChatScreen({ route }) {
  const { chatId, productName } = route.params;
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  useEffect(() => {
    const q = query(
      collection(firestore, "chats", chatId, "messages"),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMessages(list);
    });

    return unsubscribe;
  }, [chatId]);

  const sendMessage = async () => {
    try {
      if (!text.trim()) return;

      const senderId = auth.currentUser.uid;
      const cleanText = text.trim();

      await addDoc(collection(firestore, "chats", chatId, "messages"), {
        senderId,
        text: cleanText,
        createdAt: new Date().toISOString(),
      });

      await updateDoc(doc(firestore, "chats", chatId), {
        lastMessage: cleanText,
        lastMessageAt: new Date().toISOString(),
      });

      setText("");
    } catch (error) {
      console.log("sendMessage error:", error);
      showAlert("Error", "Failed to send message.");
    }
  };

  const renderItem = ({ item }) => {
    const isMine = item.senderId === auth.currentUser.uid;

    return (
      <View style={[styles.messageBubble, isMine ? styles.myMessage : styles.otherMessage]}>
        <Text style={styles.messageText}>{item.text}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Chat about: {productName}</Text>

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
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
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    fontSize: 18,
    fontWeight: "bold",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  list: {
    padding: 12,
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
    justifyContent: "center",
    borderRadius: 8,
  },
  sendBtnText: {
    color: "#fff",
    fontWeight: "bold",
  },
});