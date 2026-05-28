import type { SportEvent, User } from '../../utils/types';
import { getEvents, subscribeToEvents } from '../../firebase/firestore';
import type { DynamicEventSuggestion, EventRecommendation } from './aiTypes';
import {
  getCached,
  getMostCommonNumber,
  mergeBehaviorWithUserSports,
  setCached,
} from './aiHelpers';
import { scoringEngine } from './scoringEngine';
import { userBehaviorService } from './userBehaviorService';

const CACHE_TTL_MS = 2 * 60 * 1000;
const eventCache = new Map<string, { data: EventRecommendation[]; expiresAt: number }>();

export const eventSuggestionService = {
  async getRecommendedEvents(
    user: Partial<User>,
    nearbyEvents?: Partial<SportEvent>[],
    limitCount = 10
  ): Promise<EventRecommendation[]> {
    if (!user.uid) return [];

    const cacheKey = `events:${user.uid}:${nearbyEvents?.length || 'firestore'}:${limitCount}`;
    const cached = getCached(eventCache, cacheKey);
    if (cached) return cached;

    const [behavior, events] = await Promise.all([
      userBehaviorService.getUserBehaviorProfile(user.uid),
      nearbyEvents
        ? Promise.resolve(nearbyEvents.filter(isSportEvent))
        : getEvents({ limitCount: 50 }),
    ]);

    const recommendations = events
      .filter((event) => event.status === 'upcoming')
      .map((event) => scoringEngine.scoreEvent(user, event, behavior))
      .sort((a, b) => b.score - a.score)
      .slice(0, limitCount);

    setCached(eventCache, cacheKey, recommendations, CACHE_TTL_MS);
    return recommendations;
  },

  async getEventSuggestion(
    user: Partial<User>,
    nearbyEvents?: Partial<SportEvent>[]
  ): Promise<DynamicEventSuggestion> {
    const behavior = user.uid
      ? await userBehaviorService.getUserBehaviorProfile(user.uid)
      : null;
    const sports = mergeBehaviorWithUserSports(user, behavior);
    const eventSports = nearbyEvents?.map((event) => event.sport).filter((sport): sport is string => Boolean(sport)) || [];
    const suggestedSport = sports[0] || eventSports[0] || 'Basketball';
    const suggestedHour = getMostCommonNumber(behavior?.preferredHours || [], 18);
    const suggestedDay = behavior?.preferredDays[0] || 'Saturday';

    return {
      sport: suggestedSport,
      suggestedTime: formatHourRange(suggestedHour),
      suggestedDay,
      reason:
        behavior?.mostPlayedSports.length || user.sports?.length
          ? `Recommended because you frequently play ${suggestedSport} and are active around this time.`
          : 'Recommended as a high-turnout time for pickup games.',
      confidence: behavior ? 'high' : user.sports?.length ? 'medium' : 'low',
      source: behavior ? 'behavior' : user.sports?.length ? 'profile' : 'fallback',
    };
  },

  subscribeToEventRecommendations(
    user: Partial<User>,
    callback: (recommendations: EventRecommendation[]) => void
  ) {
    return subscribeToEvents(async (events) => {
      if (!user.uid) {
        callback([]);
        return;
      }
      const behavior = await userBehaviorService.getUserBehaviorProfile(user.uid);
      callback(
        events
          .map((event) => scoringEngine.scoreEvent(user, event, behavior))
          .sort((a, b) => b.score - a.score)
          .slice(0, 10)
      );
    });
  },

  clearCache(userId?: string): void {
    for (const key of eventCache.keys()) {
      if (!userId || key.includes(`:${userId}:`)) eventCache.delete(key);
    }
  },
};

function isSportEvent(event: Partial<SportEvent>): event is SportEvent {
  return Boolean(event.id && event.title && event.sport && event.date && event.location);
}

function formatHourRange(hour: number): string {
  const endHour = (hour + 2) % 24;
  return `${formatHour(hour)} - ${formatHour(endHour)}`;
}

function formatHour(hour: number): string {
  const normalized = ((hour % 24) + 24) % 24;
  const suffix = normalized >= 12 ? 'PM' : 'AM';
  const display = normalized % 12 || 12;
  return `${display}:00 ${suffix}`;
}
