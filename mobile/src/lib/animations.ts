/**
 * eMSME Animation Presets
 *
 * Reusable Reanimated animation helpers.
 * All motion uses spring physics — no linear easing anywhere.
 *
 * Performance rules:
 * - Animate ONLY transform + opacity (never top/left/width/height)
 * - Perpetual animations MUST live in isolated leaf components
 * - Cleanup all useEffect-based animations with clearTimeout/cancelAnimation
 */

import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
  interpolate,
  Extrapolation,
  cancelAnimation,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { stagger, spring } from './theme';

// ---------------------------------------------------------------------------
// SPRING CONFIGS — Standard presets (mirror theme.ts for Reanimated API)
// ---------------------------------------------------------------------------
export const springConfig = {
  standard: { stiffness: 120, damping: 18 },
  snappy: { stiffness: 180, damping: 20 },
  gentle: { stiffness: 80, damping: 16 },
  overshoot: { stiffness: 200, damping: 15 },
} as const;

// ---------------------------------------------------------------------------
// STAGGERED LIST ENTRY
// Returns an animated style for an item at `index` in a list.
// Apply to each list item's Animated.View.
// ---------------------------------------------------------------------------
export function useStaggeredEntry(
  index: number,
  config: { delay?: number; distance?: number } = {}
) {
  const { delay = stagger.base, distance = 20 } = config;
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(distance);

  useEffect(() => {
    const timer = setTimeout(() => {
      opacity.value = withSpring(1, springConfig.gentle);
      translateY.value = withSpring(0, springConfig.gentle);
    }, index * delay);
    return () => clearTimeout(timer);
  }, [index]);

  return useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));
}

// ---------------------------------------------------------------------------
// PRESS SCALE — Tactile press feedback
// Returns handlers + animated style. Use with Animated.View wrapping a
// Pressable or TouchableOpacity (pass the handlers to onPressIn/Out).
// ---------------------------------------------------------------------------
export function usePressScale(scale = 0.97) {
  const pressed = useSharedValue(false);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: withSpring(pressed.value ? scale : 1, springConfig.snappy),
      },
    ],
  }));

  const handlePressIn = () => {
    pressed.value = true;
  };
  const handlePressOut = () => {
    pressed.value = false;
  };

  return { animatedStyle, handlePressIn, handlePressOut };
}

// ---------------------------------------------------------------------------
// BREATHING PULSE — For status dots, live indicators, active badges
// Isolated to prevent parent re-renders. Use in a leaf component.
// ---------------------------------------------------------------------------
export function useBreathingPulse(options: { minOpacity?: number; maxOpacity?: number; duration?: number } = {}) {
  const { minOpacity = 0.4, maxOpacity = 1, duration = 2000 } = options;
  const opacity = useSharedValue(maxOpacity);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(minOpacity, { duration, easing: Easing.inOut(Easing.sin) }),
        withTiming(maxOpacity, { duration, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );
    return () => {
      cancelAnimation(opacity);
    };
  }, []);

  return useAnimatedStyle(() => ({ opacity: opacity.value }));
}

// ---------------------------------------------------------------------------
// SCALE PULSE — For notification badges, match chips
// ---------------------------------------------------------------------------
export function useScalePulse(options: { minScale?: number; maxScale?: number; duration?: number } = {}) {
  const { minScale = 0.92, maxScale = 1.0, duration = 1800 } = options;
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(minScale, { duration: duration * 0.45, easing: Easing.inOut(Easing.sin) }),
        withTiming(maxScale, { duration: duration * 0.55, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );
    return () => {
      cancelAnimation(scale);
    };
  }, []);

  return useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
}

// ---------------------------------------------------------------------------
// SHIMMER — Skeleton loader animation
// Returns a translateX animated value from -1 to +1 (use as interpolated offset).
// ---------------------------------------------------------------------------
export function useShimmer() {
  const position = useSharedValue(-1);

  useEffect(() => {
    position.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.linear }),
      -1,
      false
    );
    return () => {
      cancelAnimation(position);
    };
  }, []);

  return (width: number) =>
    useAnimatedStyle(() => ({
      transform: [
        {
          translateX: interpolate(
            position.value,
            [-1, 1],
            [-width, width],
            Extrapolation.CLAMP
          ),
        },
      ],
    }));
}

// ---------------------------------------------------------------------------
// ENTRANCE — Single element spring entrance (replaces FadeInDown)
// ---------------------------------------------------------------------------
export function useSpringEntrance(options: { delay?: number; distance?: number } = {}) {
  const { delay = 0, distance = 16 } = options;
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(distance);

  useEffect(() => {
    const timer = setTimeout(() => {
      opacity.value = withSpring(1, springConfig.gentle);
      translateY.value = withSpring(0, springConfig.gentle);
    }, delay);
    return () => clearTimeout(timer);
  }, []);

  return useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));
}

// ---------------------------------------------------------------------------
// TAB PRESS — Scale animation for tab bar icons
// ---------------------------------------------------------------------------
export function useTabScale(focused: boolean) {
  const scale = useSharedValue(focused ? 1.1 : 1);

  useEffect(() => {
    scale.value = withSpring(focused ? 1.1 : 1, springConfig.snappy);
  }, [focused]);

  return useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
}
