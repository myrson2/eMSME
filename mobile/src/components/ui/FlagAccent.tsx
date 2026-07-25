/**
 * FlagAccent — Philippine flag tricolor accent bar
 *
 * A reusable stripe component. Single source of truth replacing
 * the copy-pasted flag bar that exists in 5+ screens.
 */

import React from 'react';
import { View, ViewStyle } from 'react-native';
import { flagStripes } from '../../lib/theme';

interface FlagAccentProps {
  height?: number;
  style?: ViewStyle;
}

export default function FlagAccent({ height = 4, style }: FlagAccentProps) {
  return (
    <View
      style={[
        {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height,
          flexDirection: 'row',
        },
        style,
      ]}
    >
      {flagStripes.map((color, i) => (
        <View key={i} style={{ flex: 1, backgroundColor: color }} />
      ))}
    </View>
  );
}
