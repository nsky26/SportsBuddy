import type { NotificationPreferences } from './notificationTypes';

export const NOTIFICATION_CHANNELS = {
  DEFAULT: 'sportsbuddy-default',
  REMINDERS: 'sportsbuddy-reminders',
  CHAT: 'sportsbuddy-chat',
  EVENTS: 'sportsbuddy-events',
} as const;

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  enabled: true,
  pushEnabled: true,
  localEnabled: true,
  chatEnabled: true,
  remindersEnabled: true,
  joinAlertsEnabled: true,
  eventUpdatesEnabled: true,
  sportsAlertsEnabled: true,
  reminderMinutesBefore: [60, 30],
  quietHours: {
    enabled: false,
    startHour: 22,
    endHour: 7,
  },
};

export const NOTIFICATION_COPY = {
  MATCH_REMINDER_TITLE: 'Game Reminder',
  CHAT_TITLE: 'New message',
  EVENT_UPDATED_TITLE: 'Event updated',
  EVENT_CANCELLED_TITLE: 'Event cancelled',
  JOIN_ALERT_TITLE: 'New teammate joined',
};
