import React from 'react';
import { Marker } from 'react-native-maps';
import type { Coordinates } from '../../services/locationService';

type Props = {
  coordinate: Coordinates | null;
  title?: string;
};

export function UserLocationMarker({ coordinate, title = 'You are here' }: Props) {
  if (!coordinate) return null;

  return (
    <Marker
      coordinate={coordinate}
      title={title}
      pinColor="#3b82f6"
    />
  );
}
