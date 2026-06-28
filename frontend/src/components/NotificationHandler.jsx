import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { messaging } from '../services/firebase';
import { getToken, onMessage } from 'firebase/messaging';
import api from '../services/api';

const NotificationHandler = () => {
  const { isLoggedIn, user } = useAuthStore();

  useEffect(() => {
    if (isLoggedIn && user && user.isEmailVerified) {
      requestPermissionAndToken();
    }
  }, [isLoggedIn, user]);

  useEffect(() => {
    if (!messaging) return;
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Message received in foreground: ', payload);
      // You can use a toast library here instead of alert if you prefer
      alert(`${payload.notification.title}\n${payload.notification.body}`);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const requestPermissionAndToken = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const currentToken = await getToken(messaging, { 
          // vapidKey: 'YOUR_PUBLIC_VAPID_KEY_HERE' 
        });
        
        if (currentToken) {
          // Send the token to your server
          await api.post('/users/fcm-token', { fcmToken: currentToken });
          console.log('FCM Token registered successfully');
        } else {
          console.log('No registration token available. Request permission to generate one.');
        }
      }
    } catch (error) {
      console.error('An error occurred while retrieving token. ', error);
    }
  };

  return null;
};

export default NotificationHandler;
