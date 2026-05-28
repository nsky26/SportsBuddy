import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, BorderRadius } from '../../theme';

type Props = {
  label: string;
  active?: boolean;
};

export function LocationChip({ label, active = false }: Props) {
  return (
    <View style={[styles.chip, active && styles.chipActive]}>
      <View style={[styles.dot, active && styles.dotActive]} />
      <Text style={[styles.text, active && styles.textActive]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: '100%',
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.secondary,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipActive: {
    borderColor: Colors.primaryBorder,
    backgroundColor: Colors.primaryDim,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.mutedForeground,
  },
  dotActive: {
    backgroundColor: Colors.primary,
  },
  text: {
    color: Colors.mutedForeground,
    fontSize: 12,
    fontWeight: '500',
  },
  textActive: {
    color: Colors.primary,
  },
});
