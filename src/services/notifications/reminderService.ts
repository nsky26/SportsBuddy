import * as Notifications from 'expo-notifications';
import { NOTIFICATION_CHANNELS, NOTIFICATION_COPY } from './notificationConstants';
import type { ReminderScheduleRequest, ScheduledReminder } from './notificationTypes';
import { toNotificationData } from './notificationHelpers';

export const reminderService = {
  async scheduleEventReminder(
    eventTitle: string,
    eventDate: Date,
    minutesBefore = 30,
    eventId?: string,
    userId?: string,
    sport?: string
  ): Promise<string> {
    const triggerDate = new Date(eventDate.getTime() - minutesBefore * 60 * 1000);
    if (triggerDate.getTime() <= Date.now()) {
      throw new Error('Cannot schedule a reminder in the past');
    }

    return Notifications.scheduleNotificationAsync({
      content: {
        title: NOTIFICATION_COPY.MATCH_REMINDER_TITLE,
        body: `${eventTitle} starts in ${minutesBefore} minutes`,
        data: toNotificationData({
          type: 'event_reminder',
          eventId,
          userId,
          sport,
        }),
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
        channelId: NOTIFICATION_CHANNELS.REMINDERS,
      },
    });
  },

  async scheduleMatchReminders(request: ReminderScheduleRequest): Promise<ScheduledReminder[]> {
    const minutes = request.minutesBefore || [60, 30];
    const reminders: ScheduledReminder[] = [];

    for (const minutesBefore of minutes) {
      const scheduledFor = new Date(request.eventDate.getTime() - minutesBefore * 60 * 1000);
      if (scheduledFor.getTime() <= Date.now()) continue;

      const id = await this.scheduleEventReminder(
        request.eventTitle,
        request.eventDate,
        minutesBefore,
        request.eventId,
        request.userId,
        request.sport
      );
      reminders.push({
        id,
        eventId: request.eventId,
        userId: request.userId,
        minutesBefore,
        scheduledFor,
      });
    }

    return reminders;
  },

  async cancelNotification(notificationId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  },

  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  },

  async cancelEventReminders(eventId: string): Promise<void> {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(
      scheduled
        .filter((item) => item.content.data?.eventId === eventId)
        .map((item) => Notifications.cancelScheduledNotificationAsync(item.identifier))
    );
  },
};
