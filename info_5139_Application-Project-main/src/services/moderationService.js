// Moderation service for handling reported listings
// Provides functions to report products, fetch pending reports, and take moderation actions.
// All moderation actions are logged to the adminActions collection.

import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  increment,
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

// Report a listing — creates a report doc and increments the product's reportCount
export const reportListing = async (productId, productName, userId, reporterEmail, reason, description) => {
  try {
    // Check if this user already reported this product
    const q = query(
      collection(firestore, "reports"),
      where("productId", "==", productId),
      where("reportedBy", "==", userId)
    );
    const existing = await getDocs(q);
    if (!existing.empty) {
      return { success: false, message: "You have already reported this listing." };
    }

    // Create the report document
    await addDoc(collection(firestore, "reports"), {
      productId,
      productName,
      reportedBy: userId,
      reporterEmail: reporterEmail || null,
      reason,
      description: description || "",
      status: "pending",
      reviewedBy: null,
      reviewedAt: null,
      createdAt: serverTimestamp(),
    });

    // Increment the report count on the product
    await updateDoc(doc(firestore, "products", productId), {
      reportCount: increment(1),
    });

    logInfo("Listing reported", {
      screen: "ModerationService",
      metadata: { productId, userId, reason },
    });

    return { success: true };
  } catch (error) {
    logError(error, { screen: "ModerationService", metadata: { action: "reportListing", productId } });
    throw error;
  }
};

// Fetch all pending reports, sorted by creation date (newest first)
export const getPendingReports = async () => {
  try {
    await verifyAdmin();
    const q = query(
      collection(firestore, "reports"),
      where("status", "==", "pending"),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    logError(error, { screen: "ModerationService", metadata: { action: "getPendingReports" } });
    throw error;
  }
};

// Fetch all reports (for admin overview)
export const getAllReports = async () => {
  try {
    await verifyAdmin();
    const q = query(collection(firestore, "reports"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    logError(error, { screen: "ModerationService", metadata: { action: "getAllReports" } });
    throw error;
  }
};

// Dismiss a report — marks it as reviewed without removing the listing
export const dismissReport = async (reportId, adminId) => {
  try {
    await verifyAdmin();
    await updateDoc(doc(firestore, "reports", reportId), {
      status: "dismissed",
      reviewedBy: adminId,
      reviewedAt: serverTimestamp(),
    });

    // Log to admin audit trail
    await addDoc(collection(firestore, "adminActions"), {
      adminId,
      action: "dismiss_report",
      targetUserId: null,
      details: { reportId },
      createdAt: serverTimestamp(),
    });

    // Notify the reporter that their report was reviewed
    const reportDoc = await getDoc(doc(firestore, "reports", reportId));
    if (reportDoc.exists() && reportDoc.data().reportedBy) {
      await sendNotification(
        reportDoc.data().reportedBy,
        "report_dismissed",
        "Report Reviewed",
        "Your report has been reviewed and dismissed by our moderation team.",
        null
      );
    }

    logInfo("Report dismissed", {
      screen: "ModerationService",
      metadata: { reportId, adminId },
    });
  } catch (error) {
    logError(error, { screen: "ModerationService", metadata: { action: "dismissReport", reportId } });
    throw error;
  }
};

// Remove a listing — marks report as resolved and sets product status to "removed"
export const removeListing = async (reportId, productId, adminId) => {
  try {
    await verifyAdmin();
    // Update the report status
    await updateDoc(doc(firestore, "reports", reportId), {
      status: "removed",
      reviewedBy: adminId,
      reviewedAt: serverTimestamp(),
    });

    // Mark the product as removed
    await updateDoc(doc(firestore, "products", productId), {
      status: "removed",
      removedBy: adminId,
      removedAt: serverTimestamp(),
    });

    // Log to admin audit trail
    await addDoc(collection(firestore, "adminActions"), {
      adminId,
      action: "remove_listing",
      targetUserId: null,
      details: { reportId, productId },
      createdAt: serverTimestamp(),
    });

    // Notify the donor that their listing was removed
    const productDoc = await getDoc(doc(firestore, "products", productId));
    if (productDoc.exists() && productDoc.data().donorId) {
      await sendNotification(
        productDoc.data().donorId,
        "listing_removed",
        "Listing Removed",
        `Your listing "${productDoc.data().name}" has been removed for violating our guidelines.`,
        null
      );
    }

    logInfo("Listing removed by admin", {
      screen: "ModerationService",
      metadata: { reportId, productId, adminId },
    });
  } catch (error) {
    logError(error, { screen: "ModerationService", metadata: { action: "removeListing", reportId, productId } });
    throw error;
  }
};

// Fetch a single product by ID (for moderation detail view)
export const getProductById = async (productId) => {
  try {
    const productDoc = await getDoc(doc(firestore, "products", productId));
    if (!productDoc.exists()) return null;
    return { id: productDoc.id, ...productDoc.data() };
  } catch (error) {
    logError(error, { screen: "ModerationService", metadata: { action: "getProductById", productId } });
    throw error;
  }
};
