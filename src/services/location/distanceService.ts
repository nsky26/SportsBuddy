import { getDistance } from 'geolib';
import type { Coordinates, DistanceResult } from './locationTypes';

const METERS_PER_MILE = 1609.344;

export const distanceService = {
  calculateDistance(from: Coordinates, to: Coordinates): DistanceResult {
    const meters = getDistance(from, to);
    return {
      meters,
      kilometers: meters / 1000,
      miles: meters / METERS_PER_MILE,
      readable: this.formatDistance(meters, true),
    };
  },

  formatDistance(meters: number, includeAway = false): string {
    const suffix = includeAway ? ' away' : '';
    if (meters < 1000) return `${Math.round(meters)} m${suffix}`;
    const kilometers = meters / 1000;
    if (kilometers < 10) return `${kilometers.toFixed(1)} km${suffix}`;
    return `${Math.round(kilometers)} km${suffix}`;
  },

  isNearby(from: Coordinates, to: Coordinates, radiusMeters = 10000): boolean {
    return this.calculateDistance(from, to).meters <= radiusMeters;
  },

  sortByDistance<T extends { distance: DistanceResult }>(items: T[]): T[] {
    return [...items].sort((a, b) => a.distance.meters - b.distance.meters);
  },
};
