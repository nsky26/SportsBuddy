import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useClerk } from '@clerk/clerk-expo';
import { useAuthStore } from '../store/authStore';
import { GlassCard, Avatar, PrimaryButton } from '../components/common';
import { Colors, BorderRadius, Spacing } from '../theme';

const MOCK_ACHIEVEMENTS: { id: string; name: string; iconSet: 'ion' | 'mci'; icon: string; earned: boolean }[] = [
  { id: '1', name: 'First Game',    iconSet: 'ion', icon: 'game-controller-outline', earned: true },
  { id: '2', name: 'Team Player',   iconSet: 'ion', icon: 'people-outline',          earned: true },
  { id: '3', name: 'MVP',           iconSet: 'ion', icon: 'star-outline',            earned: true },
  { id: '4', name: '10 Win Streak', iconSet: 'ion', icon: 'flame-outline',           earned: true },
  { id: '5', name: 'Century',       iconSet: 'ion', icon: 'ribbon-outline',          earned: true },
  { id: '6', name: 'Legend',        iconSet: 'mci', icon: 'crown-outline',           earned: false },
];

const MOCK_MATCHES = [
  { id: '1', sport: 'Basketball', result: 'Won', score: '52-48', date: '2 days ago' },
  { id: '2', sport: 'Tennis', result: 'Won', score: '6-4, 6-3', date: '5 days ago' },
  { id: '3', sport: 'Soccer', result: 'Lost', score: '2-3', date: '1 week ago' },
];
export function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const { signOut } = useClerk();

  const stats = [
    { label: 'Games Played', value: String(user?.stats?.gamesPlayed || 127), icon: 'game-controller-outline' },
    { label: 'Win Rate',     value: `${user?.stats?.winRate || 73}%`,         icon: 'trophy-outline' },
    { label: 'Teammates',    value: String(user?.stats?.teammates || 89),     icon: 'people-outline' },
  ];

  async function handleLogout() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();  // End the Clerk session
            logout();         // Clear local Zustand state
          } catch {
            Alert.alert('Error', 'Failed to sign out. Try again.');
          }
        },
      },
    ]);
  }

  return (
    <LinearGradient colors={['#0a0a0a', '#0f0f14', '#0a0a0a']} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity style={styles.settingsButton}>
            <Ionicons name="settings-outline" size={20} color={Colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Profile Card */}
          <GlassCard style={styles.profileCard}>
            <View style={styles.glowEffect} />
            <View style={styles.profileTop}>
              <View style={styles.avatarContainer}>
                <Avatar name={user?.displayName || 'User'} photoURL={user?.photoURL} size={80} />
                <TouchableOpacity style={styles.editAvatarButton}>
                  <Ionicons name="pencil" size={12} color={Colors.primaryForeground} />
                </TouchableOpacity>
              </View>
              <View style={styles.profileInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.displayName}>{user?.displayName || 'John Doe'}</Text>
                </View>
                <Text style={styles.username}>@{user?.username || user?.displayName?.toLowerCase().replace(' ', '') || 'user'}</Text>
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={14} color={Colors.primary} />
                  <Text style={styles.rating}>{user?.rating || 4.9}</Text>
                  <Text style={styles.reviewCount}>({user?.reviewCount || 127} reviews)</Text>
                </View>
              </View>
            </View>

            {/* Sports tags */}
            <View style={styles.sportsRow}>
              {(user?.sports?.length ? user.sports : ['Basketball', 'Tennis', 'Soccer', 'Running']).map((sport) => (
                <View key={sport} style={styles.sportTag}>
                  <Text style={styles.sportTagText}>{sport}</Text>
                </View>
              ))}
            </View>
          </GlassCard>

          {/* Stats */}
          <View style={styles.statsGrid}>
            {stats.map((stat) => (
              <GlassCard key={stat.label} style={styles.statCard}>
                <View style={styles.statIconBox}>
                  <Ionicons name={stat.icon} size={20} color={Colors.primary} />
                </View>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </GlassCard>
            ))}
          </View>

          {/* Achievements */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Achievements</Text>
              <TouchableOpacity>
                <Text style={styles.seeAll}>See all ›</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.achievementsRow}>
              {MOCK_ACHIEVEMENTS.map((a) => (
                <View
                  key={a.id}
                  style={[styles.achievementCard, !a.earned && styles.achievementCardLocked]}
                >
                  <View style={[styles.achievementIconBox, !a.earned && styles.achievementIconBoxLocked]}>
                    {a.iconSet === 'ion'
                      ? <Ionicons name={a.icon} size={22} color={a.earned ? Colors.primary : Colors.mutedForeground + '40'} />
                      : <MaterialCommunityIcons name={a.icon} size={22} color={a.earned ? Colors.primary : Colors.mutedForeground + '40'} />
                    }
                  </View>
                  <Text style={[styles.achievementName, !a.earned && styles.achievementNameLocked]}>
                    {a.name}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Match History */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Match History</Text>
              <TouchableOpacity>
                <Text style={styles.seeAll}>See all ›</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.matchList}>
              {MOCK_MATCHES.map((match) => (
                <GlassCard key={match.id} style={styles.matchCard}>
                  <View
                    style={[
                      styles.matchResultIcon,
                      { backgroundColor: match.result === 'Won' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)' },
                    ]}
                  >
                    <Ionicons
                      name={match.result === 'Won' ? 'checkmark-circle' : 'close-circle'}
                      size={22}
                      color={match.result === 'Won' ? Colors.success : Colors.error}
                    />
                  </View>
                  <View style={styles.matchInfo}>
                    <Text style={styles.matchSport}>{match.sport}</Text>
                    <Text style={styles.matchDate}>{match.date}</Text>
                  </View>
                  <View style={styles.matchResult}>
                    <Text
                      style={[
                        styles.matchResultText,
                        { color: match.result === 'Won' ? Colors.success : Colors.error },
                      ]}
                    >
                      {match.result}
                    </Text>
                    <Text style={styles.matchScore}>{match.score}</Text>
                  </View>
                </GlassCard>
              ))}
            </View>
          </View>

          {/* Edit Profile */}
          <PrimaryButton
            title="Edit Profile"
            onPress={() => Alert.alert('Coming Soon', 'Profile editing will be available soon.')}
            variant="outline"
            style={styles.editButton}
          />

          {/* Sign Out */}
          <TouchableOpacity onPress={handleLogout} style={styles.signOutButton}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.base,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.foreground,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 100,
    gap: 16,
  },
  profileCard: {
    padding: 24,
    overflow: 'hidden',
  },
  glowEffect: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: 'rgba(190,255,0,0.12)',
  },
  profileTop: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  avatarContainer: { position: 'relative' },
  editAvatarButton: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: { flex: 1 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  displayName: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.foreground,
  },
  username: {
    fontSize: 13,
    color: Colors.mutedForeground,
    marginBottom: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.foreground,
  },
  reviewCount: {
    fontSize: 12,
    color: Colors.mutedForeground,
  },
  sportsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sportTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.secondary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sportTagText: {
    fontSize: 12,
    color: Colors.foreground,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    gap: 4,
  },
  statIconBox: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primaryDim,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.foreground,
  },
  statLabel: {
    fontSize: 10,
    color: Colors.mutedForeground,
    textAlign: 'center',
  },
  section: {},
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.foreground,
  },
  seeAll: {
    fontSize: 13,
    color: Colors.primary,
  },
  achievementsRow: {
    gap: 12,
  },
  achievementCard: {
    width: 88,
    height: 88,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 8,
  },
  achievementCardLocked: {
    backgroundColor: 'rgba(24,24,30,0.3)',
    borderColor: Colors.border + '40',
  },
  achievementIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementIconBoxLocked: {
    backgroundColor: Colors.secondary,
  },
  achievementName: {
    fontSize: 10,
    color: Colors.foreground,
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  achievementNameLocked: {
    color: Colors.mutedForeground + '60',
  },
  matchList: { gap: 10 },
  matchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  matchResultIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  matchInfo: { flex: 1 },
  matchSport: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.foreground,
  },
  matchDate: {
    fontSize: 12,
    color: Colors.mutedForeground,
    marginTop: 2,
  },
  matchResult: { alignItems: 'flex-end' },
  matchResultText: {
    fontSize: 14,
    fontWeight: '600',
  },
  matchScore: {
    fontSize: 12,
    color: Colors.mutedForeground,
    marginTop: 2,
  },
  editButton: { marginTop: 4 },
  signOutButton: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  signOutText: {
    fontSize: 15,
    color: Colors.error,
    fontWeight: '500',
  },
});
