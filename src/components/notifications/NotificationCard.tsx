import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { SportsBuddyNotification } from '../../services/notificationService';
import { Colors, BorderRadius, Spacing } from '../../theme';
import { timeAgo } from '../../utils/helpers';

type Props = {
  notification: SportsBuddyNotification;
  onPress?: (notification: SportsBuddyNotification) => void;
  onMarkRead?: (notification: SportsBuddyNotification) => void;
};

export function NotificationCard({ notification, onPress, onMarkRead }: Props) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => onPress?.(notification)}
      style={[styles.card, !notification.read && styles.cardUnread]}
    >
      <View style={styles.iconBox}>
        <Ionicons name={getIcon(notification.type)} size={18} color={Colors.primary} />
      </View>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>{notification.title}</Text>
          <Text style={styles.time}>{timeAgo(notification.createdAt)}</Text>
        </View>
        <Text style={styles.body} numberOfLines={2}>{notification.body}</Text>
        {!notification.read && (
          <TouchableOpacity onPress={() => onMarkRead?.(notification)} style={styles.readButton}>
            <Text style={styles.readText}>Mark read</Text>
          </TouchableOpacity>
        )}
      </View>
      {!notification.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );
}

function getIcon(type: SportsBuddyNotification['type']): React.ComponentProps<typeof Ionicons>['name'] {
  if (type === 'chat_message') return 'chatbubble-ellipses-outline';
  if (type === 'event_reminder') return 'alarm-outline';
  if (type.includes('join')) return 'people-outline';
  if (type.includes('cancelled')) return 'close-circle-outline';
  if (type.includes('changed') || type.includes('updated')) return 'calendar-outline';
  return 'notifications-outline';
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.base,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  cardUnread: {
    borderColor: Colors.primaryBorder,
    backgroundColor: Colors.glass,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryDim,
  },
  content: {
    flex: 1,
    gap: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  title: {
    flex: 1,
    color: Colors.foreground,
    fontSize: 14,
    fontWeight: '700',
  },
  time: {
    color: Colors.mutedForeground,
    fontSize: 11,
  },
  body: {
    color: Colors.mutedForeground,
    fontSize: 13,
    lineHeight: 18,
  },
  readButton: {
    alignSelf: 'flex-start',
    paddingTop: 2,
  },
  readText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginTop: 5,
  },
});
