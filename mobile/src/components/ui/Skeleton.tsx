/**
 * Skeleton — Shimmer loader components
 *
 * Layout-matching skeleton loaders to replace generic ActivityIndicator spinners.
 * The shimmer uses a GPU-safe translateX-only animation.
 */

import React, { memo, useEffect } from 'react';
import { View, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
  Extrapolation,
  cancelAnimation,
} from 'react-native-reanimated';
import { colors, radius } from '../../lib/theme';

// ---------------------------------------------------------------------------
// Shimmer mask — the moving highlight
// Isolated to prevent re-renders in parent
// ---------------------------------------------------------------------------
const ShimmerBar = memo(({ width }: { width: number }) => {
  const position = useSharedValue(-1);

  useEffect(() => {
    position.value = withRepeat(
      withTiming(1, { duration: 1400, easing: Easing.linear }),
      -1,
      false
    );
    return () => {
      cancelAnimation(position);
    };
  }, []);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          position.value,
          [-1, 1],
          [-width * 1.2, width * 1.2],
          Extrapolation.CLAMP
        ),
      },
    ],
  }));

  return (
    <View style={{ flex: 1, overflow: 'hidden' }}>
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: width * 0.4,
            background: 'transparent',
            backgroundColor: 'rgba(255,255,255,0.6)',
            // Diagonal shimmer using a slight tilt
            transform: [{ skewX: '-20deg' }],
          },
          shimmerStyle,
        ]}
      />
    </View>
  );
});

ShimmerBar.displayName = 'ShimmerBar';

// ---------------------------------------------------------------------------
// Base skeleton block
// ---------------------------------------------------------------------------
interface SkeletonBlockProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

const SKELETON_BASE = '#EDF0F7';
const SKELETON_HIGHLIGHT = '#F5F7FC';

function SkeletonBlock({ width = '100%', height = 16, borderRadius = radius.xs, style }: SkeletonBlockProps) {
  const position = useSharedValue(0);

  useEffect(() => {
    position.value = withRepeat(
      withTiming(1, { duration: 1400, easing: Easing.linear }),
      -1,
      false
    );
    return () => {
      cancelAnimation(position);
    };
  }, []);

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(position.value, [0, 0.5, 1], [0.6, 1, 0.6]),
  }));

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: SKELETON_BASE,
          overflow: 'hidden',
        },
        shimmerStyle,
        style,
      ]}
    />
  );
}

// ---------------------------------------------------------------------------
// PUBLIC API
// ---------------------------------------------------------------------------

/** Single line of text skeleton */
export function SkeletonText({
  width = '80%',
  height = 14,
  style,
}: {
  width?: number | string;
  height?: number;
  style?: ViewStyle;
}) {
  return <SkeletonBlock width={width} height={height} style={style} />;
}

/** Avatar/icon circle skeleton */
export function SkeletonAvatar({
  size = 44,
  borderRadius,
  style,
}: {
  size?: number;
  borderRadius?: number;
  style?: ViewStyle;
}) {
  return (
    <SkeletonBlock
      width={size}
      height={size}
      borderRadius={borderRadius ?? size * 0.28}  // squircle default
      style={style}
    />
  );
}

/** Card-sized skeleton block */
export function SkeletonCard({
  height = 100,
  style,
}: {
  height?: number;
  style?: ViewStyle;
}) {
  return (
    <SkeletonBlock
      width="100%"
      height={height}
      borderRadius={radius.lg}
      style={style}
    />
  );
}

/** Dashboard metric skeleton — matching the summary card layout */
export function SkeletonMetricCard() {
  return (
    <View
      style={{
        backgroundColor: colors.surfaceRaised,
        borderRadius: radius.lg,
        padding: 20,
        borderWidth: 1,
        borderColor: colors.border,
        flexDirection: 'row',
      }}
    >
      {[0, 1].map((i) => (
        <View key={i} style={{ flex: 1, marginHorizontal: i === 0 ? 0 : 16 }}>
          <SkeletonAvatar size={32} style={{ marginBottom: 10 }} />
          <SkeletonText width="60%" height={12} style={{ marginBottom: 8 }} />
          <SkeletonText width="85%" height={24} style={{ marginBottom: 6 }} />
          <SkeletonText width="50%" height={11} />
        </View>
      ))}
    </View>
  );
}

/** Business card skeleton */
export function SkeletonBusinessCard() {
  return (
    <View
      style={{
        backgroundColor: colors.surfaceRaised,
        borderRadius: radius.lg,
        padding: 20,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: 12,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
        <SkeletonAvatar size={44} style={{ marginRight: 12 }} />
        <View style={{ flex: 1 }}>
          <SkeletonText width="70%" height={15} style={{ marginBottom: 6 }} />
          <SkeletonText width="45%" height={12} />
        </View>
        <SkeletonText width={60} height={24} borderRadius={12} />
      </View>
      <SkeletonText width="100%" height={8} borderRadius={4} style={{ marginBottom: 12 }} />
      <SkeletonText width="55%" height={12} />
    </View>
  );
}
