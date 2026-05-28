import React, { memo } from 'react';
import type { Coordinates, NearbyUser } from '../../services/locationService';
import { SportsMap } from './SportsMap';

type Props = {
  userLocation: Coordinates | null;
  players: NearbyUser[];
  onPlayerPress?: (player: NearbyUser) => void;
};

function NearbyPlayersMapComponent({ userLocation, players, onPlayerPress }: Props) {
  return (
    <SportsMap
      userLocation={userLocation}
      teammates={players}
      onTeammatePress={onPlayerPress}
    />
  );
}

export const NearbyPlayersMap = memo(NearbyPlayersMapComponent);
