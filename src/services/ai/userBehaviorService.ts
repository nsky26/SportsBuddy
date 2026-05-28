import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { FIRESTORE_COLLECTIONS } from '../../constants';
import type { SportEvent } from '../../utils/types';
import type { BehaviorSignal, UserBehaviorProfile } from './aiTypes';
import { compactTopKeys, getDayName, parseHour, unique } from './aiHelpers';

const DEFAULT_RELIABILITY = 70;

export const userBehaviorService = {
  async getUserBehaviorProfile(userId: string): Promise<UserBehaviorProfile | null> {
    const ref = doc(db, FIRESTORE_COLLECTIONS.USER_BEHAVIOR, userId);
    const snapshot = await getDoc(ref);
    if (!snapshot.exists()) return null;
    return deserializeBehavior(userId, snapshot.data());
  },

  async trackBehaviorEvent(signal: BehaviorSignal): Promise<void> {
    const existing = await this.getUserBehaviorProfile(signal.userId);
    const next = applySignal(existing || createEmptyBehavior(signal.userId), signal);

    await setDoc(
      doc(db, FIRESTORE_COLLECTIONS.USER_BEHAVIOR, signal.userId),
      {
        ...next,
        lastSignal: {
          type: signal.type,
          sport: signal.sport || null,
          eventId: signal.eventId || null,
          targetUserId: signal.targetUserId || null,
          metadata: signal.metadata || {},
          timestamp: signal.timestamp || new Date(),
        },
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  },

  async storeBehaviorProfile(profile: UserBehaviorProfile): Promise<void> {
    await setDoc(
      doc(db, FIRESTORE_COLLECTIONS.USER_BEHAVIOR, profile.userId),
      {
        ...profile,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  },

  analyzeUserBehaviorFromEvents(userId: string, events: SportEvent[]): UserBehaviorProfile {
    const joinedEvents = events.filter((event) =>
      event.participants.some((participant) => participant.uid === userId)
    );

    const sportCounts = joinedEvents.reduce<Record<string, number>>((acc, event) => {
      acc[event.sport] = (acc[event.sport] || 0) + 1;
      return acc;
    }, {});

    const preferredHours = unique(
      joinedEvents.map((event) => parseHour(event.time)).filter((hour): hour is number => hour !== undefined)
    ).slice(0, 5);

    const dayCounts = joinedEvents.reduce<Record<string, number>>((acc, event) => {
      const day = getDayName(event.date);
      if (day) acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {});

    return {
      userId,
      mostPlayedSports: compactTopKeys(sportCounts),
      sportCounts,
      preferredHours,
      preferredDays: compactTopKeys(dayCounts),
      joinedEventIds: joinedEvents.map((event) => event.id),
      frequentlyJoinedEventIds: joinedEvents.slice(0, 10).map((event) => event.id),
      interactionFrequency: joinedEvents.length,
      reliabilityScore: DEFAULT_RELIABILITY,
      lastActiveAt: new Date(),
      updatedAt: new Date(),
    };
  },

  subscribeToUserBehavior(userId: string, callback: (behavior: UserBehaviorProfile | null) => void) {
    return onSnapshot(doc(db, FIRESTORE_COLLECTIONS.USER_BEHAVIOR, userId), (snapshot) => {
      callback(snapshot.exists() ? deserializeBehavior(userId, snapshot.data()) : null);
    });
  },
};

function createEmptyBehavior(userId: string): UserBehaviorProfile {
  return {
    userId,
    mostPlayedSports: [],
    sportCounts: {},
    preferredHours: [],
    preferredDays: [],
    joinedEventIds: [],
    frequentlyJoinedEventIds: [],
    interactionFrequency: 0,
    reliabilityScore: DEFAULT_RELIABILITY,
    lastActiveAt: new Date(),
    updatedAt: new Date(),
  };
}

function applySignal(profile: UserBehaviorProfile, signal: BehaviorSignal): UserBehaviorProfile {
  const sportCounts = { ...profile.sportCounts };
  if (signal.sport) {
    sportCounts[signal.sport] = (sportCounts[signal.sport] || 0) + 1;
  }

  const timestamp = signal.timestamp || new Date();
  const hour = timestamp.getHours();
  const day = getDayName(timestamp);
  const joinedEventIds =
    signal.type === 'event_join' && signal.eventId
      ? unique([signal.eventId, ...profile.joinedEventIds]).slice(0, 100)
      : profile.joinedEventIds;

  const interactionFrequency = profile.interactionFrequency + 1;

  return {
    ...profile,
    mostPlayedSports: compactTopKeys(sportCounts),
    sportCounts,
    preferredHours: unique([hour, ...profile.preferredHours]).slice(0, 8),
    preferredDays: unique([...(day ? [day] : []), ...profile.preferredDays]).slice(0, 7),
    joinedEventIds,
    frequentlyJoinedEventIds: joinedEventIds.slice(0, 20),
    interactionFrequency,
    reliabilityScore: Math.min(100, profile.reliabilityScore + (signal.type === 'event_join' ? 1 : 0)),
    lastActiveAt: timestamp,
    updatedAt: new Date(),
  };
}

function deserializeBehavior(userId: string, data: Record<string, any>): UserBehaviorProfile {
  return {
    userId,
    mostPlayedSports: data.mostPlayedSports || [],
    sportCounts: data.sportCounts || {},
    preferredHours: data.preferredHours || [],
    preferredDays: data.preferredDays || [],
    joinedEventIds: data.joinedEventIds || [],
    frequentlyJoinedEventIds: data.frequentlyJoinedEventIds || [],
    interactionFrequency: data.interactionFrequency || 0,
    reliabilityScore: data.reliabilityScore ?? DEFAULT_RELIABILITY,
    lastActiveAt: toDate(data.lastActiveAt),
    updatedAt: toDate(data.updatedAt),
  };
}

function toDate(value: unknown): Date | undefined {
  if (!value) return undefined;
  if (value instanceof Date) return value;
  if (value instanceof Timestamp) return value.toDate();
  return undefined;
}
