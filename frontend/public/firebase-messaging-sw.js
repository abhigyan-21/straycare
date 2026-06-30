/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

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

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/favicon.webp'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
