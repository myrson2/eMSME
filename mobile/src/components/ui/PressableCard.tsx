/**
 * PressableCard — Premium card component with spring press feedback
 *
 * Features:
 * - Tinted shadow (blue-tinted, never generic black)
 * - Spring-based press animation (scale 0.97 on press, spring release)
 * - Optional double-bezel structure for hero/elevated cards
 * - Haptic feedback via expo-haptics
 */

import React, { memo } from 'react';
import {
  View,
  TouchableOpacity,
  ViewStyle,
  StyleSheet,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { usePressScale } from '../../lib/animations';
import { colors, shadows, radius } from '../../lib/theme';
import * as Haptics from 'expo-haptics';

interface PressableCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  innerStyle?: ViewStyle;
  elevated?: boolean;      // Use cardElevated shadow (for hero cards)
  doubleBezel?: boolean;   // Outer shell + inner core architecture
  disabled?: boolean;
  activeOpacity?: number;
  borderColor?: string;
  noPadding?: boolean;
}

export default memo(function PressableCard({
  children,
  onPress,
  style,
  innerStyle,
  elevated = false,
  doubleBezel = false,
  disabled = false,
  activeOpacity = 1, // We handle press visually via spring, not opacity
  borderColor,
  noPadding = false,
}: PressableCardProps) {
  const { animatedStyle, handlePressIn, handlePressOut } = usePressScale(0.97);

  const handlePress = () => {
    if (disabled || !onPress) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const shadow = elevated ? shadows.cardElevated : shadows.card;

  if (!onPress) {
    // Non-interactive card
    if (doubleBezel) {
      return (
        <View style={[styles.outerShell, shadow, style]}>
          <View style={[styles.innerCore, noPadding ? undefined : styles.innerPadding, innerStyle]}>
            {children}
          </View>
        </View>
      );
    }
    return (
      <View
        style={[
          styles.card,
          shadow,
          borderColor ? { borderColor } : undefined,
          noPadding ? undefined : styles.cardPadding,
          style,
        ]}
      >
        {children}
      </View>
    );
  }

  if (doubleBezel) {
    return (
      <Animated.View style={[styles.outerShell, shadow, animatedStyle, style]}>
        <TouchableOpacity
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={activeOpacity}
          disabled={disabled}
        >
          <View style={[styles.innerCore, noPadding ? undefined : styles.innerPadding, innerStyle]}>
            {children}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.card, shadow, animatedStyle, style]}>
      <TouchableOpacity
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={activeOpacity}
        disabled={disabled}
        style={[noPadding ? undefined : styles.cardPadding]}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  cardPadding: {
    padding: 20,
  },
  // Double-bezel outer shell
  outerShell: {
    backgroundColor: colors.primarySubtle,
    borderRadius: radius.lg + 4,
    padding: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  // Double-bezel inner core
  innerCore: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.lg,
    overflow: 'hidden',
    // Inset highlight to simulate physical edge refraction
    shadowColor: 'rgba(255,255,255,0.6)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  innerPadding: {
    padding: 20,
  },
});
