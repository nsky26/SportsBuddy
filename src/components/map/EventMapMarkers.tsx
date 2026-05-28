import React from 'react';
import { Marker } from 'react-native-maps';
import type { NearbyEvent } from '../../services/locationService';

type Props = {
  events: NearbyEvent[];
  onPress?: (event: NearbyEvent) => void;
};

export function EventMapMarkers({ events, onPress }: Props) {
  return (
    <>
      {events.map((event) => {
        const latitude = event.location.latitude;
        const longitude = event.location.longitude;
        if (latitude === undefined || longitude === undefined) return null;

        return (
          <Marker
            key={event.id}
            coordinate={{ latitude, longitude }}
            title={event.title}
            description={`${event.sport} • ${event.distance.readable}`}
            pinColor="#beff00"
            onPress={() => onPress?.(event)}
          />
        );
      })}
    </>
  );
}
