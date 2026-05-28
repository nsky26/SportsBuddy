import { Platform } from 'react-native';
import { Timestamp } from 'firebase/firestore';
import type {
  NotificationData,
  NotificationPreferences,
  SportsBuddyNotification,
  SportsBuddyNotificationType,
} from './notificationTypes';
import { DEFAULT_NOTIFICATION_PREFERENCES } from './notificationConstants';

export function createNotificationId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function toNotificationData(data: Partial<NotificationData> & { type: SportsBuddyNotificationType }): NotificationData {
  return Object.entries(data).reduce<NotificationData>(
    (acc, [key, value]) => {
      if (value !== undefined) acc[key] = String(value);
      return acc;
    },
    { type: data.type }
  );
}

export function deserializeNotification(id: string, data: Record<string, unknown>): SportsBuddyNotification {
  return {
    id,
    userId: String(data.userId || ''),
    type: (data.type || 'system') as SportsBuddyNotificationType,
    title: String(data.title || ''),
    body: String(data.body || ''),
    data: (data.data || { type: data.type || 'system' }) as NotificationData,
    read: Boolean(data.read),
    createdAt: toDate(data.createdAt) || new Date(),
    relatedEventId: data.relatedEventId ? String(data.relatedEventId) : undefined,
    relatedUserId: data.relatedUserId ? String(data.relatedUserId) : undefined,
    relatedChatId: data.relatedChatId ? String(data.relatedChatId) : undefined,
  };
}

export function mergePreferences(preferences?: Partial<NotificationPreferences> | null): NotificationPreferences {
  const defaultQuietHours = DEFAULT_NOTIFICATION_PREFERENCES.quietHours || {
    enabled: false,
    startHour: 22,
    endHour: 7,
  };

  return {
    ...DEFAULT_NOTIFICATION_PREFERENCES,
    ...preferences,
    quietHours: {
      ...defaultQuietHours,
      ...preferences?.quietHours,
    },
    reminderMinutesBefore:
      preferences?.reminderMinutesBefore || DEFAULT_NOTIFICATION_PREFERENCES.reminderMinutesBefore,
  };
}

export function isInQuietHours(preferences: NotificationPreferences, date = new Date()): boolean {
  if (!preferences.quietHours?.enabled) return false;
  const hour = date.getHours();
  const { startHour, endHour } = preferences.quietHours;
  if (startHour === endHour) return false;
  if (startHour < endHour) return hour >= startHour && hour < endHour;
  return hour >= startHour || hour < endHour;
}

export function getPlatformName(): 'ios' | 'android' | 'web' | 'unknown' {
  if (Platform.OS === 'ios' || Platform.OS === 'android' || Platform.OS === 'web') {
    return Platform.OS;
  }
  return 'unknown';
}

export function toDate(value: unknown): Date | undefined {
  if (!value) return undefined;
  if (value instanceof Date) return value;
  if (value instanceof Timestamp) return value.toDate();
  return undefined;
}
