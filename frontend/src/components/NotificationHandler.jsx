import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { messaging } from '../services/firebase';
import { getToken, onMessage } from 'firebase/messaging';
import api from '../services/api';
import { Bell, X } from 'lucide-react';
import '../styles/NotificationPrompt.css';

const NotificationHandler = () => {
  const { isLoggedIn, user } = useAuthStore();
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Only handle notifications for logged in, verified users
    if (isLoggedIn && user && user.isEmailVerified) {
      if (Notification.permission === 'default' && !sessionStorage.getItem('notificationPromptDismissed')) {
        // Show our custom UI prompt instead of immediately asking the browser
        setShowPrompt(true);
      } else if (Notification.permission === 'granted') {
        // Already granted, just ensure we have the token
        requestPermissionAndToken();
      }
    }
  }, [isLoggedIn, user]);

  useEffect(() => {
    if (!messaging) return;
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Message received in foreground: ', payload);
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
        setShowPrompt(false);
        const currentToken = await getToken(messaging, { 
          // vapidKey: 'YOUR_PUBLIC_VAPID_KEY_HERE' 
        });
        
        if (currentToken) {
          // Send the token to your server
          await api.post('/users/fcm-token', { fcmToken: currentToken });
          console.log('FCM Token registered successfully');
        } else {
          console.log('No registration token available.');
        }
      } else {
        // User denied or dismissed the native prompt
        setShowPrompt(false);
        sessionStorage.setItem('notificationPromptDismissed', 'true');
      }
    } catch (error) {
      console.error('An error occurred while retrieving token. ', error);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    sessionStorage.setItem('notificationPromptDismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <div className="notification-prompt-overlay">
      <div className="notification-prompt-card">
        <button className="notification-prompt-close" onClick={handleDismiss}>
          <X size={20} />
        </button>
        
        <div className="notification-prompt-icon-container">
          <Bell size={28} />
        </div>
        
        <div className="notification-prompt-content">
          <h3 className="notification-prompt-title">Stay updated on rescues</h3>
          <p className="notification-prompt-text">
            Get instant alerts for new rescue requests and updates in your area.
          </p>
          
          <div className="notification-prompt-actions">
            <button className="notification-prompt-btn-primary" onClick={requestPermissionAndToken}>
              Enable Notifications
            </button>
            <button className="notification-prompt-btn-secondary" onClick={handleDismiss}>
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationHandler;
