import type { NearbyEvent, NearbyUser, SportsMapMarker } from './locationTypes';

export const mapService = {
  createEventMarkers(events: NearbyEvent[]): SportsMapMarker[] {
    return events.map((event) => ({
      id: event.id,
      type: 'event',
      title: event.title,
      description: `${event.sport} • ${event.distance.readable}`,
      coordinate: {
        latitude: event.location.latitude || 0,
        longitude: event.location.longitude || 0,
      },
      sport: event.sport,
      event,
    }));
  },

  createUserMarkers(users: NearbyUser[]): SportsMapMarker[] {
    return users.map((user) => ({
      id: user.uid,
      type: 'user',
      title: user.displayName,
      description: `${user.sports?.[0] || 'Player'} • ${user.distance.readable}`,
      coordinate: {
        latitude: user.location?.latitude || 0,
        longitude: user.location?.longitude || 0,
      },
      user,
    }));
  },

  mergeMarkers(...groups: SportsMapMarker[][]): SportsMapMarker[] {
    return groups.flat();
  },
};
