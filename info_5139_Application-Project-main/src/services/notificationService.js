// Notification service for sending and managing in-app notifications
// Creates notification documents in Firestore and provides real-time listeners
// for live badge counts and notification feeds.

import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { firestore } from "./FirebaseConfig";
import { logError } from "./errorLogger";

// Send a notification to a specific user
export const sendNotification = async (userId, type, title, message, data = null) => {
  try {
    await addDoc(collection(firestore, "notifications"), {
      userId,
      type,
      title,
      message,
      data,
      read: false,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    logError(error, {
      screen: "NotificationService",
      metadata: { action: "sendNotification", userId, type },
    });
  }
};

// Send a notification to all users with a specific role (e.g. notify all Admins)
export const sendToRole = async (role, type, title, message, data = null) => {
  try {
    const q = query(collection(firestore, "users"), where("role", "==", role));
    const snapshot = await getDocs(q);
    const promises = snapshot.docs.map((userDoc) =>
      sendNotification(userDoc.id, type, title, message, data)
    );
    await Promise.all(promises);
  } catch (error) {
    logError(error, {
      screen: "NotificationService",
      metadata: { action: "sendToRole", role, type },
    });
  }
};

// Fetch all notifications for a user (one-time read, sorted newest first)
export const getUserNotifications = async (userId) => {
  try {
    const q = query(
      collection(firestore, "notifications"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    logError(error, {
      screen: "NotificationService",
      metadata: { action: "getUserNotifications", userId },
    });
    return [];
  }
};

// Subscribe to real-time notification updates for a user
// Returns an unsubscribe function — call it on cleanup
export const subscribeToNotifications = (userId, callback) => {
  try {
    const q = query(
      collection(firestore, "notifications"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );
    return onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      callback(notifications);
    });
  } catch (error) {
    logError(error, {
      screen: "NotificationService",
      metadata: { action: "subscribeToNotifications", userId },
    });
    return () => {};
  }
};

// Subscribe to unread count for the notification bell badge
// Returns an unsubscribe function
export const subscribeToUnreadCount = (userId, callback) => {
  try {
    const q = query(
      collection(firestore, "notifications"),
      where("userId", "==", userId),
      where("read", "==", false)
    );
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.size);
    });
  } catch (error) {
    logError(error, {
      screen: "NotificationService",
      metadata: { action: "subscribeToUnreadCount", userId },
    });
    return () => {};
  }
};

// Mark a single notification as read
export const markAsRead = async (notificationId) => {
  try {
    await updateDoc(doc(firestore, "notifications", notificationId), {
      read: true,
    });
  } catch (error) {
    logError(error, {
      screen: "NotificationService",
      metadata: { action: "markAsRead", notificationId },
    });
  }
};

// Mark all unread notifications as read for a user
export const markAllAsRead = async (userId) => {
  try {
    const q = query(
      collection(firestore, "notifications"),
      where("userId", "==", userId),
      where("read", "==", false)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return;

    const batch = writeBatch(firestore);
    snapshot.docs.forEach((d) => {
      batch.update(d.ref, { read: true });
    });
    await batch.commit();
  } catch (error) {
    logError(error, {
      screen: "NotificationService",
      metadata: { action: "markAllAsRead", userId },
    });
  }
};
