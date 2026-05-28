import * as Location from 'expo-location';
import type { Coordinates, LocationTrackingOptions } from './locationTypes';

const LOCATION_CACHE_TTL_MS = 60 * 1000;

let cachedLocation: { value: Coordinates; expiresAt: number } | null = null;

export function getCachedLocation(): Coordinates | null {
  if (!cachedLocation) return null;
  if (Date.now() > cachedLocation.expiresAt) {
    cachedLocation = null;
    return null;
  }
  return cachedLocation.value;
}

export function setCachedLocation(location: Coordinates, ttlMs = LOCATION_CACHE_TTL_MS): void {
  cachedLocation = {
    value: location,
    expiresAt: Date.now() + ttlMs,
  };
}

export function clearCachedLocation(): void {
  cachedLocation = null;
}

export function toCoordinates(location: Location.LocationObject): Coordinates {
  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
  };
}

export function getExpoAccuracy(
  accuracy: LocationTrackingOptions['accuracy'] = 'balanced'
): Location.Accuracy {
  if (accuracy === 'high') return Location.Accuracy.High;
  if (accuracy === 'low') return Location.Accuracy.Low;
  return Location.Accuracy.Balanced;
}

export function normalizeSports(sports?: string[]): string[] {
  return (sports || []).map((sport) => sport.toLowerCase().trim()).filter(Boolean);
}

export function hasCoordinates(value: unknown): value is Coordinates {
  if (!value || typeof value !== 'object') return false;
  const coordinates = value as Coordinates;
  return typeof coordinates.latitude === 'number' && typeof coordinates.longitude === 'number';
}

export function getGoogleMapsApiKey(): string {
  return process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';
}
