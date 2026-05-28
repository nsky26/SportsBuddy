import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { notificationService, type SportsBuddyNotification } from '../services/notificationService';
import { useAuthStore } from '../store/authStore';
import { NotificationCard } from '../components/notifications';
import { Colors, Spacing } from '../theme';

export function NotificationScreen() {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<SportsBuddyNotification[]>([]);

  useEffect(() => {
    if (!user?.uid) return;
    return notificationService.subscribeToNotifications(user.uid, setNotifications);
  }, [user?.uid]);

  async function handleMarkRead(notification: SportsBuddyNotification) {
    await notificationService.markAsRead(notification.id);
  }

  async function handleMarkAllRead() {
    if (!user?.uid) return;
    await notificationService.markAllAsRead(user.uid);
  }

  const unreadCount = notifications.filter((item) => !item.read).length;

  return (
    <LinearGradient colors={Colors.gradientDark} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Notifications</Text>
            <Text style={styles.subtitle}>{unreadCount} unread alerts</Text>
          </View>
          {unreadCount > 0 && (
            <TouchableOpacity onPress={handleMarkAllRead}>
              <Text style={styles.markAll}>Mark all read</Text>
            </TouchableOpacity>
          )}
        </View>

        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <NotificationCard
              notification={item}
              onPress={handleMarkRead}
              onMarkRead={handleMarkRead}
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No alerts yet</Text>
              <Text style={styles.emptyText}>Match reminders and team updates will appear here.</Text>
            </View>
          }
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.base,
  },
  title: {
    color: Colors.foreground,
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    color: Colors.mutedForeground,
    fontSize: 13,
    marginTop: 2,
  },
  markAll: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  list: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 100,
    gap: Spacing.md,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 96,
    gap: Spacing.sm,
  },
  emptyTitle: {
    color: Colors.foreground,
    fontSize: 18,
    fontWeight: '700',
  },
  emptyText: {
    color: Colors.mutedForeground,
    fontSize: 14,
    textAlign: 'center',
  },
});
