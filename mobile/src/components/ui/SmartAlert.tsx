import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withDelay, runOnJS } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, fonts, radius, shadows, text } from '../../lib/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SmartAlertProps {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
  autoHideMs?: number;
}

const { width } = Dimensions.get('window');

export default function SmartAlert({ visible, title, message, onClose, autoHideMs = 5000 }: SmartAlertProps) {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(-150);

  useEffect(() => {
    if (visible) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      translateY.value = withSpring(insets.top + 10, {
        damping: 15,
        stiffness: 120,
        mass: 0.8,
      });

      if (autoHideMs > 0) {
        translateY.value = withDelay(
          autoHideMs,
          withSpring(-150, { damping: 20 }, (finished) => {
            if (finished) {
              runOnJS(onClose)();
            }
          })
        );
      }
    } else {
      translateY.value = withSpring(-150, { damping: 20 });
    }
  }, [visible, insets.top, autoHideMs]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  // Keep it mounted but off-screen to allow exit animations
  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="sparkles" size={20} color={colors.primary} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={20} color={colors.caption} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  content: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.primary + '30', // subtle primary border
    alignItems: 'center',
    ...shadows.card,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.ink,
    marginBottom: 2,
  },
  message: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.body,
    lineHeight: 18,
  },
  closeButton: {
    padding: 8,
    marginLeft: 8,
  },
});
