const { initializeApp, cert } = require('firebase-admin/app');
const { getMessaging } = require('firebase-admin/messaging');
const path = require('path');
const fs = require('fs');

let initialized = false;

// Initialize Firebase Admin SDK
try {
  let serviceAccount;

  // 1. Try to load from Environment Variable (for production/deployment)
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      // Sometimes users wrap JSON in quotes, so we parse it safely
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } catch (_parseError) {
      console.error('[Firebase] Error parsing FIREBASE_SERVICE_ACCOUNT env var. Make sure it is valid JSON.');
    }
  }

  // 2. Fallback to local file (for local development)
  if (!serviceAccount) {
    const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');
    if (fs.existsSync(serviceAccountPath)) {
      serviceAccount = require(serviceAccountPath);
    }
  }

  // 3. Initialize if we found credentials
  if (serviceAccount) {
    initializeApp({
      credential: cert(serviceAccount)
    });
    initialized = true;
    console.log('[Firebase] Admin SDK initialized successfully.');
  } else {
    console.warn('[Firebase] Warning: Neither FIREBASE_SERVICE_ACCOUNT env var nor serviceAccountKey.json found.');
  }
} catch (error) {
  console.error('[Firebase] Failed to initialize Admin SDK:', error);
}

/**
 * Sends a push notification to a specific FCM token.
 * @param {string} token 
 * @param {string} title 
 * @param {string} body 
 * @param {object} data 
 */
const sendPushNotification = async (token, title, body, data = {}) => {
  if (!initialized || !token) return;

  const message = {
    notification: { title, body },
    data: data,
    token: token
  };

  try {
    const response = await getMessaging().send(message);
    console.log('[Firebase] Successfully sent message:', response);
  } catch (error) {
    console.error('[Firebase] Error sending message:', error);
  }
};

/**
 * Sends a push notification to a specific topic.
 * @param {string} topic 
 * @param {string} title 
 * @param {string} body 
 * @param {object} data 
 */
const sendTopicNotification = async (topic, title, body, data = {}) => {
  if (!initialized || !topic) return;

  const message = {
    notification: { title, body },
    data: data,
    topic: topic
  };

  try {
    const response = await getMessaging().send(message);
    console.log(`[Firebase] Successfully sent message to topic ${topic}:`, response);
  } catch (error) {
    console.error(`[Firebase] Error sending message to topic ${topic}:`, error);
  }
};

/**
 * Subscribes a given token to a topic.
 * @param {string} token 
 * @param {string} topic 
 */
const subscribeToTopic = async (token, topic) => {
  if (!initialized || !token || !topic) return;

  try {
    const response = await getMessaging().subscribeToTopic(token, topic);
    console.log(`[Firebase] Successfully subscribed to topic ${topic}:`, response);
  } catch (error) {
    console.error(`[Firebase] Error subscribing to topic ${topic}:`, error);
  }
};

module.exports = {
  sendPushNotification,
  sendTopicNotification,
  subscribeToTopic
};
