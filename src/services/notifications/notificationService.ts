import * as Notifications from 'expo-notifications';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { FIRESTORE_COLLECTIONS } from '../../constants';
import { NOTIFICATION_CHANNELS } from './notificationConstants';
import {
  createNotificationId,
  deserializeNotification,
  isInQuietHours,
  mergePreferences,
  toNotificationData,
} from './notificationHelpers';
import type {
  NotificationData,
  NotificationPreferences,
  SportsBuddyNotification,
  SportsBuddyNotificationType,
} from './notificationTypes';
import { pushNotificationService } from './pushNotificationService';
import { reminderService } from './reminderService';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const notificationService = {
  registerForPushNotifications(userId?: string) {
    return pushNotificationService.registerForPushNotifications(userId);
  },

  scheduleEventReminder: reminderService.scheduleEventReminder.bind(reminderService),
  scheduleMatchReminders: reminderService.scheduleMatchReminders.bind(reminderService),
  cancelNotification: reminderService.cancelNotification.bind(reminderService),
  cancelAllNotifications: reminderService.cancelAllNotifications.bind(reminderService),
  cancelEventReminders: reminderService.cancelEventReminders.bind(reminderService),

  async sendLocalNotification(
    title: string,
    body: string,
    data?: Partial<NotificationData>
  ): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: toNotificationData({ type: data?.type || 'system', ...data }),
        sound: true,
      },
      trigger: {
        channelId: NOTIFICATION_CHANNELS.DEFAULT,
      },
    });
  },

  async createNotification(input: {
    userId: string;
    type: SportsBuddyNotificationType;
    title: string;
    body: string;
    data?: Partial<NotificationData>;
    relatedEventId?: string;
    relatedUserId?: string;
    relatedChatId?: string;
    sendLocal?: boolean;
  }): Promise<string> {
    const preferences = await this.getPreferences(input.userId);
    if (!shouldDeliver(input.type, preferences)) return '';

    const ref = await addDoc(collection(db, FIRESTORE_COLLECTIONS.NOTIFICATIONS), {
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      data: toNotificationData({ type: input.type, userId: input.userId, ...input.data }),
      read: false,
      relatedEventId: input.relatedEventId || null,
      relatedUserId: input.relatedUserId || null,
      relatedChatId: input.relatedChatId || null,
      createdAt: serverTimestamp(),
    });

    await setDoc(
      doc(db, FIRESTORE_COLLECTIONS.USER_NOTIFICATIONS, input.userId),
      {
        latestNotificationId: ref.id,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    if (input.sendLocal && preferences.localEnabled && !isInQuietHours(preferences)) {
      await this.sendLocalNotification(input.title, input.body, input.data);
    }

    return ref.id;
  },

  async notifyJoinAlert(params: {
    ownerId: string;
    actorName: string;
    actorId?: string;
    eventId: string;
    sport: string;
  }): Promise<string> {
    return this.createNotification({
      userId: params.ownerId,
      type: 'join_alert',
      title: 'New teammate joined',
      body: `${params.actorName} joined your ${params.sport} event`,
      data: { actorId: params.actorId, eventId: params.eventId, route: 'MatchDetails' },
      relatedEventId: params.eventId,
      relatedUserId: params.actorId,
      sendLocal: true,
    });
  },

  async notifyJoinRequestStatus(params: {
    userId: string;
    eventId: string;
    eventTitle: string;
    accepted: boolean;
  }): Promise<string> {
    return this.createNotification({
      userId: params.userId,
      type: params.accepted ? 'join_request_accepted' : 'join_request_rejected',
      title: params.accepted ? 'Join request accepted' : 'Join request rejected',
      body: params.accepted
        ? `You are in for ${params.eventTitle}`
        : `Your request for ${params.eventTitle} was not accepted`,
      data: { eventId: params.eventId, route: 'MatchDetails' },
      relatedEventId: params.eventId,
      sendLocal: true,
    });
  },

  async notifyChatMessage(params: {
    userId: string;
    chatId: string;
    senderId: string;
    senderName: string;
    eventTitle: string;
    messagePreview: string;
  }): Promise<string> {
    return this.createNotification({
      userId: params.userId,
      type: 'chat_message',
      title: `New message in ${params.eventTitle}`,
      body: `${params.senderName}: ${params.messagePreview}`,
      data: { chatId: params.chatId, senderId: params.senderId, route: 'ChatScreen' },
      relatedChatId: params.chatId,
      relatedUserId: params.senderId,
      sendLocal: true,
    });
  },

  async notifyEventUpdate(params: {
    userIds: string[];
    eventId: string;
    eventTitle: string;
    updateType: 'event_cancelled' | 'event_updated' | 'schedule_changed' | 'location_changed';
    body: string;
  }): Promise<void> {
    await Promise.all(
      params.userIds.map((userId) =>
        this.createNotification({
          userId,
          type: params.updateType,
          title: params.updateType === 'event_cancelled' ? 'Event cancelled' : 'Event updated',
          body: params.body || `${params.eventTitle} has been updated`,
          data: { eventId: params.eventId, route: 'MatchDetails' },
          relatedEventId: params.eventId,
          sendLocal: true,
        })
      )
    );
  },

  async getNotifications(userId: string, limitCount = 30): Promise<SportsBuddyNotification[]> {
    const q = query(
      collection(db, FIRESTORE_COLLECTIONS.NOTIFICATIONS),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((item) => deserializeNotification(item.id, item.data()));
  },

  subscribeToNotifications(
    userId: string,
    callback: (notifications: SportsBuddyNotification[]) => void,
    limitCount = 30
  ) {
    const q = query(
      collection(db, FIRESTORE_COLLECTIONS.NOTIFICATIONS),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.map((item) => deserializeNotification(item.id, item.data())));
    });
  },

  async getUnreadCount(userId: string): Promise<number> {
    const q = query(
      collection(db, FIRESTORE_COLLECTIONS.NOTIFICATIONS),
      where('userId', '==', userId),
      where('read', '==', false),
      limit(100)
    );
    const snapshot = await getDocs(q);
    return snapshot.size;
  },

  subscribeToUnreadCount(userId: string, callback: (count: number) => void) {
    const q = query(
      collection(db, FIRESTORE_COLLECTIONS.NOTIFICATIONS),
      where('userId', '==', userId),
      where('read', '==', false),
      limit(100)
    );
    return onSnapshot(q, (snapshot) => callback(snapshot.size));
  },

  async markAsRead(notificationId: string): Promise<void> {
    await updateDoc(doc(db, FIRESTORE_COLLECTIONS.NOTIFICATIONS, notificationId), {
      read: true,
      readAt: serverTimestamp(),
    });
  },

  async markAllAsRead(userId: string): Promise<void> {
    const notifications = await this.getNotifications(userId, 100);
    const batch = writeBatch(db);
    notifications
      .filter((notification) => !notification.read)
      .forEach((notification) => {
        batch.update(doc(db, FIRESTORE_COLLECTIONS.NOTIFICATIONS, notification.id), {
          read: true,
          readAt: serverTimestamp(),
        });
      });
    await batch.commit();
  },

  async getPreferences(userId: string): Promise<NotificationPreferences> {
    const snapshot = await getDoc(doc(db, FIRESTORE_COLLECTIONS.USER_NOTIFICATIONS, userId));
    return mergePreferences(snapshot.data()?.preferences as Partial<NotificationPreferences> | undefined);
  },

  async updatePreferences(
    userId: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> {
    const merged = mergePreferences({ ...(await this.getPreferences(userId)), ...preferences });
    await setDoc(
      doc(db, FIRESTORE_COLLECTIONS.USER_NOTIFICATIONS, userId),
      { preferences: merged, updatedAt: serverTimestamp() },
      { merge: true }
    );
    return merged;
  },

  addNotificationListener(callback: (notification: Notifications.Notification) => void) {
    return Notifications.addNotificationReceivedListener(callback);
  },

  addResponseListener(callback: (response: Notifications.NotificationResponse) => void) {
    return Notifications.addNotificationResponseReceivedListener(callback);
  },

  createNotificationId,
};

function shouldDeliver(type: SportsBuddyNotificationType, preferences: NotificationPreferences): boolean {
  if (!preferences.enabled) return false;
  if (type === 'chat_message') return preferences.chatEnabled;
  if (type === 'event_reminder') return preferences.remindersEnabled;
  if (type === 'join_alert' || type.startsWith('join_request')) return preferences.joinAlertsEnabled;
  if (
    type === 'event_cancelled' ||
    type === 'event_updated' ||
    type === 'schedule_changed' ||
    type === 'location_changed'
  ) {
    return preferences.eventUpdatesEnabled;
  }
  if (type === 'sports_alert') return preferences.sportsAlertsEnabled;
  return true;
}

export * from './notificationTypes';
export { pushNotificationService } from './pushNotificationService';
export { reminderService } from './reminderService';
export { NOTIFICATION_CHANNELS, DEFAULT_NOTIFICATION_PREFERENCES } from './notificationConstants';
