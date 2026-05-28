import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { PROVIDER_GOOGLE, type Region } from 'react-native-maps';
import type { Coordinates, NearbyEvent, NearbyUser } from '../../services/locationService';
import { Colors, BorderRadius } from '../../theme';
import { EventMapMarkers } from './EventMapMarkers';
import { UserLocationMarker } from './UserLocationMarker';

type Props = {
  userLocation: Coordinates | null;
  events?: NearbyEvent[];
  teammates?: NearbyUser[];
  radiusMeters?: number;
  onEventPress?: (event: NearbyEvent) => void;
  onTeammatePress?: (user: NearbyUser) => void;
};

function SportsMapComponent({
  userLocation,
  events = [],
  teammates = [],
  onEventPress,
  onTeammatePress,
}: Props) {
  const region: Region = {
    latitude: userLocation?.latitude ?? 37.78825,
    longitude: userLocation?.longitude ?? -122.4324,
    latitudeDelta: 0.08,
    longitudeDelta: 0.08,
  };

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={region}
        region={userLocation ? region : undefined}
        showsUserLocation
        showsMyLocationButton
        toolbarEnabled={false}
      >
        <UserLocationMarker coordinate={userLocation} />
        <EventMapMarkers events={events} onPress={onEventPress} />
        {teammates.map((teammate) => {
          if (!teammate.location?.latitude || !teammate.location.longitude) return null;
          return (
            <UserLocationMarker
              key={teammate.uid}
              coordinate={{
                latitude: teammate.location.latitude,
                longitude: teammate.location.longitude,
              }}
              title={teammate.displayName}
            />
          );
        })}
      </MapView>
    </View>
  );
}

export const SportsMap = memo(SportsMapComponent);

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  map: {
    width: '100%',
    height: 280,
  },
});
