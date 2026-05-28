import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { Platform } from 'react-native';
import { db } from '../../firebase/config';
import { FIRESTORE_COLLECTIONS } from '../../constants';
import { NOTIFICATION_CHANNELS } from './notificationConstants';
import type { NotificationPermissionResult, PushTokenRecord } from './notificationTypes';
import { getPlatformName } from './notificationHelpers';

export const pushNotificationService = {
  async configureAndroidChannels(): Promise<void> {
    if (Platform.OS !== 'android') return;

    await Promise.all([
      Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.DEFAULT, {
        name: 'SportsBuddy',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#beff00',
      }),
      Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.REMINDERS, {
        name: 'Match reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#beff00',
      }),
      Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.CHAT, {
        name: 'Chat messages',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 150],
        lightColor: '#beff00',
      }),
      Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.EVENTS, {
        name: 'Event updates',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#beff00',
      }),
    ]);
  },

  async requestPermissions(): Promise<NotificationPermissionResult> {
    const existing = await Notifications.getPermissionsAsync();
    let status = existing.status;
    let canAskAgain = existing.canAskAgain;

    if (status !== Notifications.PermissionStatus.GRANTED && canAskAgain) {
      const requested = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });
      status = requested.status;
      canAskAgain = requested.canAskAgain;
    }

    return {
      granted: status === Notifications.PermissionStatus.GRANTED,
      status,
      canAskAgain,
      error:
        status === Notifications.PermissionStatus.GRANTED
          ? undefined
          : 'Enable notifications to receive match reminders and teammate updates.',
    };
  },

  async registerForPushNotifications(userId?: string): Promise<string | null> {
    await this.configureAndroidChannels();

    if (!Device.isDevice) {
      return null;
    }

    const permission = await this.requestPermissions();
    if (!permission.granted) return null;

    const token = (await Notifications.getExpoPushTokenAsync()).data;
    if (userId) {
      await this.storePushToken(userId, token);
    }
    return token;
  },

  async storePushToken(userId: string, token: string): Promise<PushTokenRecord> {
    const record: PushTokenRecord = {
      userId,
      token,
      platform: getPlatformName(),
      deviceName: Device.deviceName || undefined,
      updatedAt: new Date(),
    };

    await setDoc(
      doc(db, FIRESTORE_COLLECTIONS.PUSH_TOKENS, token),
      {
        ...record,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    await setDoc(
      doc(db, FIRESTORE_COLLECTIONS.USERS, userId),
      {
        fcmToken: token,
        pushToken: token,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    return record;
  },
};
