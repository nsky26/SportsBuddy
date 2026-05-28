import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, BorderRadius } from '../../theme';
import type { DistanceResult } from '../../services/locationService';

type Props = {
  distance: DistanceResult;
};

export function DistanceBadge({ distance }: Props) {
  return (
    <View style={styles.badge}>
      <Text style={styles.text}>{distance.readable}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    backgroundColor: Colors.primaryDim,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  text: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '600',
  },
});
