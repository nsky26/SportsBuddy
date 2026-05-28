import { collection, doc, getDocs, limit, orderBy, query, serverTimestamp, setDoc, where } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { FIRESTORE_COLLECTIONS } from '../../constants';
import type { SportEvent, User } from '../../utils/types';
import type {
  Coordinates,
  NearbyEvent,
  NearbyQueryOptions,
  NearbySportsGround,
  NearbyUser,
  UserLocationRecord,
} from './locationTypes';
import { distanceService } from './distanceService';
import { geocodingService } from './geocodingService';
import { hasCoordinates, normalizeSports } from './locationHelpers';

export const nearbyService = {
  async updateUserLocation(userId: string, coordinates: Coordinates): Promise<UserLocationRecord> {
    const address = await geocodingService.reverseGeocode(coordinates.latitude, coordinates.longitude);
    const locationRecord: UserLocationRecord = {
      ...coordinates,
      city: address.city,
      region: address.region,
      country: address.country,
      updatedAt: new Date(),
    };

    await setDoc(
      doc(db, FIRESTORE_COLLECTIONS.USERS, userId),
      {
        location: locationRecord,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    return locationRecord;
  },

  async getNearbyUsers(options: NearbyQueryOptions): Promise<NearbyUser[]> {
    const usersQuery = query(
      collection(db, FIRESTORE_COLLECTIONS.USERS),
      orderBy('rating', 'desc'),
      limit(options.limitCount || 50)
    );
    const snapshot = await getDocs(usersQuery);
    const sports = normalizeSports(options.sports);

    return snapshot.docs
      .map((document) => ({ uid: document.id, ...document.data() }) as User)
      .filter((user) => hasCoordinates(user.location))
      .filter((user) =>
        sports.length === 0 || user.sports?.some((sport) => sports.includes(sport.toLowerCase()))
      )
      .filter((user) => !options.skillLevel || user.skillLevel === options.skillLevel)
      .map((user) => ({
        ...user,
        distance: distanceService.calculateDistance(options.center, user.location as Coordinates),
      }))
      .filter((user) => user.distance.meters <= (options.radiusMeters || 25000))
      .sort((a, b) => a.distance.meters - b.distance.meters);
  },

  async getNearbyEvents(options: NearbyQueryOptions): Promise<NearbyEvent[]> {
    const constraints = [where('status', '==', 'upcoming'), orderBy('date', 'asc'), limit(options.limitCount || 50)];
    const eventsQuery = query(collection(db, FIRESTORE_COLLECTIONS.EVENTS), ...constraints);
    const snapshot = await getDocs(eventsQuery);
    const sports = normalizeSports(options.sports);

    return snapshot.docs
      .map((document) => ({ id: document.id, ...document.data() }) as SportEvent)
      .filter((event) => hasCoordinates(event.location))
      .filter((event) => sports.length === 0 || sports.includes(event.sport.toLowerCase()))
      .filter((event) => !options.skillLevel || event.skillLevel === options.skillLevel)
      .map((event) => ({
        ...event,
        distance: distanceService.calculateDistance(options.center, event.location as Coordinates),
      }))
      .filter((event) => event.distance.meters <= (options.radiusMeters || 25000))
      .sort((a, b) => a.distance.meters - b.distance.meters);
  },

  async getNearbySportsGrounds(options: NearbyQueryOptions): Promise<NearbySportsGround[]> {
    const events = await this.getNearbyEvents({ ...options, limitCount: options.limitCount || 100 });
    const grounds = new Map<string, NearbySportsGround>();

    for (const event of events) {
      const latitude = event.location.latitude;
      const longitude = event.location.longitude;
      if (latitude === undefined || longitude === undefined) continue;

      const key = `${event.location.name}:${latitude.toFixed(4)},${longitude.toFixed(4)}`;
      const existing = grounds.get(key);
      if (existing) {
        existing.eventCount += 1;
        if (!existing.sports.includes(event.sport)) existing.sports.push(event.sport);
        continue;
      }

      grounds.set(key, {
        id: key,
        name: event.location.name,
        sports: [event.sport],
        location: {
          latitude,
          longitude,
          address: event.location.address,
        },
        eventCount: 1,
        distance: distanceService.calculateDistance(options.center, { latitude, longitude }),
      });
    }

    return [...grounds.values()].sort((a, b) => a.distance.meters - b.distance.meters);
  },

  suggestLocalActivities(events: NearbyEvent[], users: NearbyUser[]): string[] {
    const sportCounts = [...events.map((event) => event.sport), ...users.flatMap((user) => user.sports || [])]
      .reduce<Record<string, number>>((acc, sport) => {
        acc[sport] = (acc[sport] || 0) + 1;
        return acc;
      }, {});

    return Object.entries(sportCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([sport]) => sport);
  },
};
