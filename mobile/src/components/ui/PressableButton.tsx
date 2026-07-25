/**
 * PressableButton — Premium button with trailing icon architecture
 *
 * Features:
 * - Spring translateY press physics (feels physical, not just opacity)
 * - Trailing icon in its own circular wrapper (never naked next to text)
 * - Loading state with skeleton shimmer instead of ActivityIndicator
 * - Variants: primary, secondary, ghost, destructive
 * - Haptic feedback
 */

import React, { memo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radius, shadows } from '../../lib/theme';
import { springConfig } from '../../lib/animations';
import * as Haptics from 'expo-haptics';

// Shimmer for loading state
import { SkeletonText } from './Skeleton';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
type ButtonSize = 'sm' | 'md' | 'lg';

interface PressableButtonProps {
  onPress: () => void;
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  trailingIcon?: React.ComponentProps<typeof Ionicons>['name'];
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  labelStyle?: TextStyle;
}

const variantStyles = {
  primary: {
    background: colors.primary,
    labelColor: colors.white,
    iconColor: colors.gold,
    iconBg: 'rgba(255,255,255,0.15)',
    border: 'rgba(245,200,66,0.3)',
  },
  secondary: {
    background: colors.primaryMuted,
    labelColor: colors.primary,
    iconColor: colors.primary,
    iconBg: colors.white,
    border: colors.border,
  },
  ghost: {
    background: 'transparent',
    labelColor: colors.primary,
    iconColor: colors.primary,
    iconBg: colors.primaryMuted,
    border: colors.border,
  },
  destructive: {
    background: colors.signalMuted,
    labelColor: colors.signal,
    iconColor: colors.signal,
    iconBg: 'rgba(255,255,255,0.6)',
    border: 'transparent',
  },
};

const sizeStyles = {
  sm: { paddingVertical: 10, paddingHorizontal: 16, fontSize: 13, iconSize: 16, iconWrap: 28 },
  md: { paddingVertical: 14, paddingHorizontal: 20, fontSize: 15, iconSize: 18, iconWrap: 32 },
  lg: { paddingVertical: 17, paddingHorizontal: 24, fontSize: 16, iconSize: 20, iconWrap: 36 },
};

export default memo(function PressableButton({
  onPress,
  label,
  variant = 'primary',
  size = 'md',
  icon,
  trailingIcon,
  loading = false,
  disabled = false,
  fullWidth = true,
  style,
  labelStyle,
}: PressableButtonProps) {
  const pressed = useSharedValue(false);
  const vs = variantStyles[variant];
  const ss = sizeStyles[size];

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: withSpring(pressed.value ? 0.97 : 1, springConfig.snappy) },
      { translateY: withSpring(pressed.value ? 1 : 0, springConfig.snappy) },
    ],
  }));

  const handlePressIn = () => {
    pressed.value = true;
  };

  const handlePressOut = () => {
    pressed.value = false;
  };

  const handlePress = () => {
    if (disabled || loading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  const isPrimary = variant === 'primary';

  return (
    <Animated.View
      style={[
        animatedStyle,
        fullWidth ? { width: '100%' } : undefined,
        style,
      ]}
    >
      <TouchableOpacity
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={1}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: disabled || loading, busy: loading }}
        style={[
          styles.base,
          {
            backgroundColor: (disabled || loading) && isPrimary ? colors.primaryMuted : vs.background,
            borderColor: vs.border,
            paddingVertical: ss.paddingVertical,
            paddingHorizontal: ss.paddingHorizontal,
          },
          isPrimary && !disabled && !loading ? shadows.button : undefined,
        ]}
      >
        {/* Leading icon */}
        {icon && !loading && (
          <Ionicons name={icon} size={ss.iconSize} color={vs.iconColor} style={styles.leadingIcon} />
        )}

        {/* Label */}
        {loading ? (
          <SkeletonText width={80} height={ss.fontSize} />
        ) : (
          <Text
            style={[
              styles.label,
              {
                fontSize: ss.fontSize,
                color: (disabled || loading) && isPrimary ? colors.primary : vs.labelColor,
              },
              labelStyle,
            ]}
          >
            {label}
          </Text>
        )}

        {/* Trailing icon — in its own circular wrapper (Button-in-Button pattern) */}
        {trailingIcon && !loading && (
          <View
            style={[
              styles.trailingIconWrapper,
              {
                width: ss.iconWrap,
                height: ss.iconWrap,
                borderRadius: ss.iconWrap / 2,
                backgroundColor: vs.iconBg,
              },
            ]}
          >
            <Ionicons name={trailingIcon} size={ss.iconSize - 2} color={vs.iconColor} />
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.sm,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    overflow: 'hidden',
  },
  label: {
    fontFamily: fonts.heading,
    letterSpacing: -0.1,
  },
  leadingIcon: {
    marginRight: -4,
  },
  trailingIconWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
