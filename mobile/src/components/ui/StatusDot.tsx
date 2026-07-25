/**
 * StatusDot — Breathing status indicator
 *
 * A perpetually animated pulse dot for live/active states.
 * Isolated component to prevent parent re-renders during animation.
 */

import React, { memo } from 'react';
import { View, ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { useBreathingPulse } from '../../lib/animations';
import { colors } from '../../lib/theme';

type StatusVariant = 'active' | 'pending' | 'error' | 'neutral';

interface StatusDotProps {
  variant?: StatusVariant;
  size?: number;
  style?: ViewStyle;
  animate?: boolean;
}

const variantColors: Record<StatusVariant, string> = {
  active: '#22C55E',    // green — live/verified
  pending: colors.amber,
  error: colors.signal,
  neutral: colors.caption,
};

// Inner pulsing core — isolated to prevent parent re-renders
const PulsingCore = memo(({ color, size }: { color: string; size: number }) => {
  const animatedStyle = useBreathingPulse({ minOpacity: 0.35, maxOpacity: 1, duration: 2200 });

  return (
    <Animated.View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        animatedStyle,
      ]}
    />
  );
});

PulsingCore.displayName = 'PulsingCore';

export default function StatusDot({
  variant = 'active',
  size = 8,
  style,
  animate = true,
}: StatusDotProps) {
  const color = variantColors[variant];
  const ringSize = size + 6;

  return (
    <View
      style={[
        {
          width: ringSize,
          height: ringSize,
          borderRadius: ringSize / 2,
          backgroundColor: `${color}22`,
          justifyContent: 'center',
          alignItems: 'center',
        },
        style,
      ]}
    >
      {animate ? (
        <PulsingCore color={color} size={size} />
      ) : (
        <View
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
          }}
        />
      )}
    </View>
  );
}
