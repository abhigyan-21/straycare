import { initializeApp } from "firebase/app";
import { getMessaging, isSupported } from "firebase/messaging";

// TODO: Replace this with the config you got from the Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyD_0Pfk0Lydo1wEiBV3ZQcW4MtCwNnGeHQ",
  authDomain: "furzo-b8792.firebaseapp.com",
  projectId: "furzo-b8792",
  storageBucket: "furzo-b8792.firebasestorage.app",
  messagingSenderId: "77664072103",
  appId: "1:77664072103:web:c5b435f5466432734f0682",
  measurementId: "G-M9Z94CJK4C"
};

const app = initializeApp(firebaseConfig);

let messaging = null;

export const getFirebaseMessaging = async () => {
  if (messaging) return messaging;
  try {
    const supported = await isSupported();
    if (supported) {
      messaging = getMessaging(app);
      return messaging;
    }
  } catch (err) {
    console.warn("Firebase Messaging not supported", err);
  }
  return null;
};

export { app };

