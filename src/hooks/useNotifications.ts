import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { notificationService } from '../services/notificationService';
import { useAuthStore } from '../store/authStore';

export function useNotifications() {
  const { user } = useAuthStore();
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    notificationService.registerForPushNotifications(user?.uid).catch(() => undefined);

    // Listen for notifications received while app is open
    notificationListener.current = notificationService.addNotificationListener(
      (notification) => {
        console.log('Notification received:', notification.request.content.title);
      }
    );

    // Listen for user tapping a notification
    responseListener.current = notificationService.addResponseListener((response) => {
      const data = response.notification.request.content.data;
      console.log('Notification tapped:', data);
      // TODO: Navigate to relevant screen based on data.type
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [user?.uid]);

  return {
    scheduleReminder: notificationService.scheduleEventReminder.bind(notificationService),
    scheduleMatchReminders: notificationService.scheduleMatchReminders.bind(notificationService),
    sendLocal: notificationService.sendLocalNotification.bind(notificationService),
    markAsRead: notificationService.markAsRead.bind(notificationService),
    markAllAsRead: notificationService.markAllAsRead.bind(notificationService),
  };
}
