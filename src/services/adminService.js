// Admin service for managing user accounts
// Provides functions to list, disable/enable, and change roles of users.
// All actions are logged to the adminActions collection for audit trail.

import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";
import { firestore, auth } from "./FirebaseConfig";
import { logError, logInfo } from "./errorLogger";
import { sendNotification } from "./notificationService";

// Verify the current user is authenticated and has the Admin role
const verifyAdmin = async () => {
  if (!auth.currentUser) {
    throw new Error("Not authenticated");
  }
  const callerDoc = await getDoc(doc(firestore, "users", auth.currentUser.uid));
  if (!callerDoc.exists() || callerDoc.data().role !== "Admin") {
    throw new Error("Unauthorized: Admin role required");
  }
};

// Fetch all users from Firestore, sorted by creation date
export const getAllUsers = async () => {
  try {
    await verifyAdmin();
    const q = query(collection(firestore, "users"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    logError(error, { screen: "AdminService", metadata: { action: "getAllUsers" } });
    throw error;
  }
};

// Fetch a single user by their uid
export const getUserById = async (uid) => {
  try {
    await verifyAdmin();
    const userDoc = await getDoc(doc(firestore, "users", uid));
    if (!userDoc.exists()) return null;
    return { id: userDoc.id, ...userDoc.data() };
  } catch (error) {
    logError(error, { screen: "AdminService", metadata: { action: "getUserById", uid } });
    throw error;
  }
};

// Disable a user account — sets status to "disabled"
export const disableUser = async (targetUid, adminUid) => {
  try {
    await verifyAdmin();
    await updateDoc(doc(firestore, "users", targetUid), {
      status: "disabled",
      disabledAt: serverTimestamp(),
      disabledBy: adminUid,
    });

    // Log the action for audit trail
    await addDoc(collection(firestore, "adminActions"), {
      adminId: adminUid,
      action: "disable_user",
      targetUserId: targetUid,
      details: { newStatus: "disabled" },
      createdAt: serverTimestamp(),
    });

    // Notify the affected user
    await sendNotification(
      targetUid,
      "account_disabled",
      "Account Disabled",
      "Your account has been disabled by an administrator. Contact support if you believe this is an error.",
      null
    );

    logInfo("User account disabled", {
      screen: "AdminService",
      metadata: { targetUid, adminUid },
    });
  } catch (error) {
    logError(error, { screen: "AdminService", metadata: { action: "disableUser", targetUid } });
    throw error;
  }
};

// Enable a user account — sets status back to "active"
export const enableUser = async (targetUid, adminUid) => {
  try {
    await verifyAdmin();
    await updateDoc(doc(firestore, "users", targetUid), {
      status: "active",
      disabledAt: null,
      disabledBy: null,
    });

    await addDoc(collection(firestore, "adminActions"), {
      adminId: adminUid,
      action: "enable_user",
      targetUserId: targetUid,
      details: { newStatus: "active" },
      createdAt: serverTimestamp(),
    });

    // Notify the affected user
    await sendNotification(
      targetUid,
      "account_enabled",
      "Account Re-enabled",
      "Your account has been re-enabled. You can now log in and use the platform.",
      null
    );

    logInfo("User account enabled", {
      screen: "AdminService",
      metadata: { targetUid, adminUid },
    });
  } catch (error) {
    logError(error, { screen: "AdminService", metadata: { action: "enableUser", targetUid } });
    throw error;
  }
};

// Change a user's role (Student, Donor, Admin)
export const changeUserRole = async (targetUid, newRole, adminUid) => {
  try {
    await verifyAdmin();
    // Fetch current role for audit log
    const userDoc = await getDoc(doc(firestore, "users", targetUid));
    const previousRole = userDoc.exists() ? userDoc.data().role : "Unknown";

    await updateDoc(doc(firestore, "users", targetUid), { role: newRole });

    await addDoc(collection(firestore, "adminActions"), {
      adminId: adminUid,
      action: "change_role",
      targetUserId: targetUid,
      details: { previousRole, newRole },
      createdAt: serverTimestamp(),
    });

    // Notify the affected user
    await sendNotification(
      targetUid,
      "role_changed",
      "Role Updated",
      `Your account role has been changed from ${previousRole} to ${newRole}.`,
      null
    );

    logInfo("User role changed", {
      screen: "AdminService",
      metadata: { targetUid, previousRole, newRole, adminUid },
    });
  } catch (error) {
    logError(error, { screen: "AdminService", metadata: { action: "changeUserRole", targetUid, newRole } });
    throw error;
  }
};

// Get aggregate user stats for the admin dashboard
export const getUserStats = async () => {
  try {
    await verifyAdmin();
    const snapshot = await getDocs(collection(firestore, "users"));
    const users = snapshot.docs.map((d) => d.data());

    return {
      total: users.length,
      students: users.filter((u) => u.role === "Student").length,
      donors: users.filter((u) => u.role === "Donor").length,
      admins: users.filter((u) => u.role === "Admin").length,
      active: users.filter((u) => u.status !== "disabled").length,
      disabled: users.filter((u) => u.status === "disabled").length,
    };
  } catch (error) {
    logError(error, { screen: "AdminService", metadata: { action: "getUserStats" } });
    throw error;
  }
};
