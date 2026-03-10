// Centralized error logging service
// Writes error, warning, and info logs to the Firestore "systemLogs" collection
// so developers/admins can debug issues from a single place.

import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { Platform } from "react-native";
import { firestore, auth } from "./FirebaseConfig";

// App version from app.json (avoids needing expo-constants dependency)
const APP_VERSION = "1.0.0";

// Write a log document to Firestore
const writeLog = async (level, message, context = {}) => {
  try {
    const { screen = "Unknown", metadata = null, code = null, stackTrace = null } = context;

    await addDoc(collection(firestore, "systemLogs"), {
      level,
      message,
      code,
      screen,
      userId: auth.currentUser ? auth.currentUser.uid : null,
      stackTrace,
      metadata,
      platform: Platform.OS,
      appVersion: APP_VERSION,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    // If logging itself fails, fall back to console so the app never crashes
    console.error("[errorLogger] Failed to write log to Firestore:", err);
  }
};

// Log an error — use in catch blocks throughout the app
export const logError = (error, context = {}) => {
  // Always keep console output for local dev
  console.error(`[ERROR][${context.screen || "Unknown"}]`, error);

  writeLog("error", error.message || String(error), {
    ...context,
    code: error.code || null,
    stackTrace: __DEV__ ? error.stack : null,
  });
};

// Log a warning — use for non-critical issues
export const logWarn = (message, context = {}) => {
  console.warn(`[WARN][${context.screen || "Unknown"}]`, message);
  writeLog("warn", message, context);
};

// Log an info event — use for significant actions (e.g. admin actions, sign-outs)
export const logInfo = (message, context = {}) => {
  console.log(`[INFO][${context.screen || "Unknown"}]`, message);
  writeLog("info", message, context);
};
