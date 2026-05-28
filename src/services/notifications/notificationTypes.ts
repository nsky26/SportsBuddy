import type * as Notifications from 'expo-notifications';

export type SportsBuddyNotificationType =
  | 'event_reminder'
  | 'join_alert'
  | 'join_request_accepted'
  | 'join_request_rejected'
  | 'chat_message'
  | 'event_cancelled'
  | 'event_updated'
  | 'schedule_changed'
  | 'location_changed'
  | 'sports_alert'
  | 'system';

export interface NotificationData {
  type: SportsBuddyNotificationType;
  userId?: string;
  eventId?: string;
  chatId?: string;
  senderId?: string;
  actorId?: string;
  route?: string;
  [key: string]: string | undefined;
}

export interface SportsBuddyNotification {
  id: string;
  userId: string;
  type: SportsBuddyNotificationType;
  title: string;
  body: string;
  data: NotificationData;
  read: boolean;
  createdAt: Date;
  relatedEventId?: string;
  relatedUserId?: string;
  relatedChatId?: string;
}

export interface NotificationPreferences {
  enabled: boolean;
  pushEnabled: boolean;
  localEnabled: boolean;
  chatEnabled: boolean;
  remindersEnabled: boolean;
  joinAlertsEnabled: boolean;
  eventUpdatesEnabled: boolean;
  sportsAlertsEnabled: boolean;
  reminderMinutesBefore: number[];
  quietHours?: {
    enabled: boolean;
    startHour: number;
    endHour: number;
  };
  updatedAt?: Date;
}

export interface PushTokenRecord {
  userId: string;
  token: string;
  platform: 'ios' | 'android' | 'web' | 'unknown';
  deviceName?: string;
  updatedAt?: Date;
}

export interface ReminderScheduleRequest {
  userId: string;
  eventId: string;
  eventTitle: string;
  eventDate: Date;
  sport?: string;
  minutesBefore?: number[];
}

export interface ScheduledReminder {
  id: string;
  eventId: string;
  userId: string;
  minutesBefore: number;
  scheduledFor: Date;
}

export interface NotificationPermissionResult {
  granted: boolean;
  status: Notifications.PermissionStatus;
  canAskAgain: boolean;
  error?: string;
}

export interface NotificationSummary {
  unreadCount: number;
  latest?: SportsBuddyNotification;
}
