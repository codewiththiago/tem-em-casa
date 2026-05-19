import { FirebaseMessaging } from '@capacitor-firebase/messaging';
import { Capacitor } from '@capacitor/core';
import { updateFcmToken } from './api';

let listeners = [];

export async function initNotifications() {
  if (!Capacitor.isNativePlatform()) return;

  // Remove previous listeners to prevent duplicates on HMR/re-init
  for (const l of listeners) await l.remove?.();
  listeners = [];

  try {
    await FirebaseMessaging.requestPermissions();
    const { token } = await FirebaseMessaging.getToken({
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
    });
    if (token) await updateFcmToken(token);

    listeners.push(await FirebaseMessaging.addListener('notificationReceived', (event) => {
      console.log('FCM foreground:', event.notification);
    }));

    listeners.push(await FirebaseMessaging.addListener('tokenReceived', async ({ token: newToken }) => {
      await updateFcmToken(newToken);
    }));
  } catch (err) {
    console.warn('Notifications setup failed:', err);
  }
}
