import { Alert, Platform } from "react-native";

// Cross-platform alert that works on both web and native
export function showAlert(title, message, buttons) {
  if (Platform.OS !== "web") {
    Alert.alert(title, message, buttons);
    return;
  }

  // Web: if there are destructive/confirm buttons, use window.confirm
  if (buttons && buttons.length > 1) {
    const confirmBtn = buttons.find((b) => b.style === "destructive" || (b.text !== "Cancel" && b.style !== "cancel"));
    const confirmed = window.confirm(message ? `${title}\n\n${message}` : title);
    if (confirmed && confirmBtn && confirmBtn.onPress) {
      confirmBtn.onPress();
    }
  } else {
    window.alert(message ? `${title}\n\n${message}` : title);
    // Fire the single button's onPress if provided
    if (buttons && buttons[0] && buttons[0].onPress) {
      buttons[0].onPress();
    }
  }
}
