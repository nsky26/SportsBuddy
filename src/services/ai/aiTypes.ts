import type { AIEventSuggestion, AIRecommendation, SportEvent, User } from '../../utils/types';

export type RecommendationConfidence = 'low' | 'medium' | 'high';

export type BehaviorEventType =
  | 'event_view'
  | 'event_join'
  | 'event_leave'
  | 'event_create'
  | 'chat_message'
  | 'teammate_view'
  | 'sport_filter'
  | 'search';

export interface BehaviorSignal {
  type: BehaviorEventType;
  userId: string;
  sport?: string;
  eventId?: string;
  targetUserId?: string;
  timestamp?: Date;
  metadata?: Record<string, string | number | boolean | null>;
}

export interface UserBehaviorProfile {
  userId: string;
  mostPlayedSports: string[];
  sportCounts: Record<string, number>;
  preferredHours: number[];
  preferredDays: string[];
  joinedEventIds: string[];
  frequentlyJoinedEventIds: string[];
  interactionFrequency: number;
  reliabilityScore: number;
  lastActiveAt?: Date;
  updatedAt?: Date;
}

export interface ScoreFactor {
  key: string;
  label: string;
  score: number;
  weight: number;
}

export interface CompatibilityResult {
  percentage: number;
  confidence: RecommendationConfidence;
  reason: string;
  factors: ScoreFactor[];
  sharedSports: string[];
  distanceMiles?: number;
}

export interface TeammateRecommendation extends AIRecommendation {
  confidence: RecommendationConfidence;
  factors: ScoreFactor[];
  sharedSports: string[];
  distanceMiles?: number;
  lastActiveAt?: Date;
}

export interface EventRecommendation {
  event: SportEvent;
  score: number;
  confidence: RecommendationConfidence;
  reason: string;
  factors: ScoreFactor[];
}

export interface PersonalizedHomeFeed {
  recommendedTeammates: TeammateRecommendation[];
  trendingMatches: EventRecommendation[];
  nearbyGames: EventRecommendation[];
  suggestedSports: string[];
  curatedEvents: EventRecommendation[];
  generatedAt: Date;
}

export interface RecommendationCacheEntry<T> {
  data: T;
  expiresAt: number;
}

export interface EventSuggestionContext {
  user: Partial<User>;
  behavior?: UserBehaviorProfile | null;
  nearbyEvents?: Partial<SportEvent>[];
}

export interface DynamicEventSuggestion extends AIEventSuggestion {
  confidence: RecommendationConfidence;
  source: 'behavior' | 'profile' | 'events' | 'fallback';
}
