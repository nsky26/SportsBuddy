import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  notificationService,
  type NotificationPreferences,
} from '../services/notificationService';
import { useAuthStore } from '../store/authStore';
import { Colors, BorderRadius, Spacing } from '../theme';

export function NotificationSettingsScreen() {
  const { user } = useAuthStore();
  const [preferences, setPreferences] = useState<NotificationPreferences>(
    DEFAULT_NOTIFICATION_PREFERENCES
  );

  useEffect(() => {
    if (!user?.uid) return;
    notificationService.getPreferences(user.uid).then(setPreferences).catch(() => undefined);
  }, [user?.uid]);

  async function update(next: Partial<NotificationPreferences>) {
    const merged = { ...preferences, ...next };
    setPreferences(merged);
    if (user?.uid) {
      const saved = await notificationService.updatePreferences(user.uid, next);
      setPreferences(saved);
    }
  }

  return (
    <LinearGradient colors={Colors.gradientDark} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Notification Settings</Text>
            <Text style={styles.subtitle}>Control reminders, chat alerts, and game updates.</Text>
          </View>

          <PreferenceRow label="Notifications" value={preferences.enabled} onValueChange={(enabled) => update({ enabled })} />
          <PreferenceRow label="Push notifications" value={preferences.pushEnabled} onValueChange={(pushEnabled) => update({ pushEnabled })} />
          <PreferenceRow label="Local reminders" value={preferences.localEnabled} onValueChange={(localEnabled) => update({ localEnabled })} />
          <PreferenceRow label="Chat alerts" value={preferences.chatEnabled} onValueChange={(chatEnabled) => update({ chatEnabled })} />
          <PreferenceRow label="Match reminders" value={preferences.remindersEnabled} onValueChange={(remindersEnabled) => update({ remindersEnabled })} />
          <PreferenceRow label="Join alerts" value={preferences.joinAlertsEnabled} onValueChange={(joinAlertsEnabled) => update({ joinAlertsEnabled })} />
          <PreferenceRow label="Event updates" value={preferences.eventUpdatesEnabled} onValueChange={(eventUpdatesEnabled) => update({ eventUpdatesEnabled })} />
          <PreferenceRow label="Sports alerts" value={preferences.sportsAlertsEnabled} onValueChange={(sportsAlertsEnabled) => update({ sportsAlertsEnabled })} />
          <PreferenceRow
            label="Quiet hours"
            value={preferences.quietHours?.enabled || false}
            onValueChange={(enabled) =>
              update({ quietHours: { ...(preferences.quietHours || { startHour: 22, endHour: 7 }), enabled } })
            }
          />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function PreferenceRow({
  label,
  value,
  onValueChange,
}: {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        thumbColor={value ? Colors.primary : Colors.mutedForeground}
        trackColor={{ false: Colors.border, true: Colors.primaryBorder }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 100,
    gap: Spacing.md,
  },
  header: {
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
    marginTop: 4,
  },
  row: {
    minHeight: 56,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    paddingHorizontal: Spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowLabel: {
    color: Colors.foreground,
    fontSize: 14,
    fontWeight: '600',
  },
});
