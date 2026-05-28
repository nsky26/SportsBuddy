import type { SportEvent, User } from '../../utils/types';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface LocationAddress {
  city?: string;
  region?: string;
  country?: string;
  street?: string;
  postalCode?: string;
  formattedAddress: string;
}

export interface UserLocationRecord extends Coordinates {
  city?: string;
  region?: string;
  country?: string;
  updatedAt?: Date;
}

export interface LocationPermissionResult {
  granted: boolean;
  canAskAgain: boolean;
  status: 'granted' | 'denied' | 'undetermined';
  error?: string;
}

export interface LocationState {
  isLoading: boolean;
  error: string | null;
  location: Coordinates | null;
  address?: LocationAddress | null;
}

export interface LocationTrackingOptions {
  distanceIntervalMeters?: number;
  timeIntervalMs?: number;
  accuracy?: 'balanced' | 'high' | 'low';
}

export interface DistanceResult {
  meters: number;
  kilometers: number;
  miles: number;
  readable: string;
}

export interface NearbyQueryOptions {
  center: Coordinates;
  radiusMeters?: number;
  sports?: string[];
  skillLevel?: string;
  limitCount?: number;
}

export interface NearbyUser extends User {
  distance: DistanceResult;
}

export interface NearbyEvent extends Omit<SportEvent, 'distance'> {
  distance: DistanceResult;
}

export interface LocationSuggestion {
  title: string;
  description: string;
  confidence: 'low' | 'medium' | 'high';
  coordinates?: Coordinates;
}

export interface MapMarkerBase {
  id: string;
  title: string;
  description?: string;
  coordinate: Coordinates;
}

export interface SportsMapEventMarker extends MapMarkerBase {
  type: 'event';
  sport?: string;
  event?: NearbyEvent;
}

export interface SportsMapUserMarker extends MapMarkerBase {
  type: 'user';
  user?: Partial<User>;
}

export type SportsMapMarker = SportsMapEventMarker | SportsMapUserMarker;
