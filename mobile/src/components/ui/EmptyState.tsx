/**
 * EmptyState — Composed empty state component
 *
 * Shown when lists/sections have no data.
 * Generous padding, clear message, optional action.
 * No emoji — uses a clean SVG-like icon area.
 */

import React from 'react';
import { View, Text, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated from 'react-native-reanimated';
import { useSpringEntrance } from '../../lib/animations';
import { colors, text, radius, spacing } from '../../lib/theme';
import PressableButton from './PressableButton';

interface EmptyStateProps {
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export default function EmptyState({
  icon = 'file-tray',
  title,
  description,
  actionLabel,
  onAction,
  style,
}: EmptyStateProps) {
  const entranceStyle = useSpringEntrance({ delay: 100, distance: 12 });

  return (
    <Animated.View
      style={[
        {
          alignItems: 'center',
          paddingVertical: spacing.xxxl,
          paddingHorizontal: spacing.xl,
        },
        entranceStyle,
        style,
      ]}
    >
      {/* Icon container */}
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: radius.lg,
          backgroundColor: colors.primaryMuted,
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: spacing.lg,
        }}
      >
        <Ionicons name={icon} size={32} color={colors.primary} />
      </View>

      <Text
        style={[
          text.h4,
          { color: colors.ink, textAlign: 'center', marginBottom: spacing.sm },
        ]}
      >
        {title}
      </Text>

      {description && (
        <Text
          style={[
            text.body,
            {
              color: colors.body,
              textAlign: 'center',
              maxWidth: 260,
              lineHeight: 22,
              marginBottom: actionLabel ? spacing.xl : 0,
            },
          ]}
        >
          {description}
        </Text>
      )}

      {actionLabel && onAction && (
        <PressableButton
          label={actionLabel}
          onPress={onAction}
          variant="secondary"
          size="md"
          fullWidth={false}
          style={{ minWidth: 160 }}
        />
      )}
    </Animated.View>
  );
}
