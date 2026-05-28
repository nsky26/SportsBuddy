import type { SportEvent, User, UserLocation } from '../../utils/types';
import type { RecommendationCacheEntry, RecommendationConfidence, UserBehaviorProfile } from './aiTypes';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

export function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

export function normalizeSport(sport?: string): string {
  return (sport || '').trim().toLowerCase();
}

export function sharedSports(userA: Partial<User>, userB: Partial<User>): string[] {
  const bSports = new Set((userB.sports || []).map(normalizeSport));
  return (userA.sports || []).filter((sport) => bSports.has(normalizeSport(sport)));
}

export function getConfidence(score: number, factorCount: number): RecommendationConfidence {
  if (score >= 78 && factorCount >= 4) return 'high';
  if (score >= 55 && factorCount >= 2) return 'medium';
  return 'low';
}

export function distanceMiles(a?: UserLocation, b?: UserLocation): number | undefined {
  if (!a || !b) return undefined;
  const { latitude: lat1, longitude: lon1 } = a;
  const { latitude: lat2, longitude: lon2 } = b;
  if ([lat1, lon1, lat2, lon2].some((value) => typeof value !== 'number')) return undefined;

  const radiusMiles = 3959;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;

  return radiusMiles * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

export function eventDistanceMiles(user: Partial<User>, event: Partial<SportEvent>): number | undefined {
  const location = event.location;
  if (!user.location || !location?.latitude || !location.longitude) return undefined;
  return distanceMiles(user.location, {
    latitude: location.latitude,
    longitude: location.longitude,
  });
}

export function parseHour(time?: string): number | undefined {
  if (!time) return undefined;
  const match = time.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (!match) return undefined;

  let hour = Number(match[1]);
  const meridiem = match[3]?.toLowerCase();
  if (Number.isNaN(hour) || hour > 24) return undefined;
  if (meridiem === 'pm' && hour < 12) hour += 12;
  if (meridiem === 'am' && hour === 12) hour = 0;
  return hour;
}

export function getDayName(date?: Date): string | undefined {
  if (!date || Number.isNaN(date.getTime())) return undefined;
  return DAY_NAMES[date.getDay()];
}

export function compactTopKeys(counts: Record<string, number>, limit = 5): string[] {
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([key]) => key);
}

export function getMostCommonNumber(values: number[], fallback: number): number {
  if (values.length === 0) return fallback;
  const counts = values.reduce<Record<number, number>>((acc, value) => {
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
  return Number(Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]);
}

export function mergeBehaviorWithUserSports(user: Partial<User>, behavior?: UserBehaviorProfile | null): string[] {
  return unique([...(user.sports || []), ...(behavior?.mostPlayedSports || [])]).filter(Boolean);
}

export function isEventJoinedByUser(event: Partial<SportEvent>, userId?: string): boolean {
  if (!userId) return false;
  return Boolean(event.participants?.some((participant) => participant.uid === userId));
}

export function getCached<T>(cache: Map<string, RecommendationCacheEntry<T>>, key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

export function setCached<T>(
  cache: Map<string, RecommendationCacheEntry<T>>,
  key: string,
  data: T,
  ttlMs: number
): void {
  cache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}
