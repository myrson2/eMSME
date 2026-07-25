import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import Animated from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useSpringEntrance, useStaggeredEntry, usePressScale } from '../lib/animations';
import { colors, text, spacing, radius, shadows, fonts } from '../lib/theme';
import FlagAccent from '../components/ui/FlagAccent';
import StatusDot from '../components/ui/StatusDot';
import * as Haptics from 'expo-haptics';

interface MenuItem {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  subtitle?: string;
  destructive?: boolean;
  onPress?: () => void;
}

// ---------------------------------------------------------------------------
// Menu item with isolated press animation
// ---------------------------------------------------------------------------
function MenuItem({ item, isLast }: { item: MenuItem; isLast: boolean }) {
  const { animatedStyle, handlePressIn, handlePressOut } = usePressScale(0.98);

  return (
    <Animated.View style={[animatedStyle]}>
      <TouchableOpacity
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          item.onPress?.();
        }}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={item.label}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 14,
          paddingHorizontal: 16,
          borderBottomWidth: isLast ? 0 : 1,
          borderBottomColor: colors.borderSubtle,
        }}
      >
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 11,
            backgroundColor: item.destructive ? colors.signalMuted : colors.primaryMuted,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 14,
          }}
        >
          <Ionicons
            name={item.icon}
            size={17}
            color={item.destructive ? colors.signal : colors.primary}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontFamily: fonts.medium,
              fontSize: 14,
              color: item.destructive ? colors.signal : colors.ink,
            }}
          >
            {item.label}
          </Text>
          {item.subtitle && (
            <Text style={[text.caption, { color: colors.body, marginTop: 1 }]}>
              {item.subtitle}
            </Text>
          )}
        </View>
        {!item.destructive && (
          <Ionicons name="chevron-forward" size={15} color={colors.caption} />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Menu section — staggered entry
// ---------------------------------------------------------------------------
function MenuSection({
  title,
  items,
  sectionIndex,
}: {
  title: string;
  items: MenuItem[];
  sectionIndex: number;
}) {
  const entranceStyle = useStaggeredEntry(sectionIndex, { delay: 100, distance: 14 });

  return (
    <Animated.View style={[{ paddingHorizontal: spacing.screen, marginBottom: 24 }, entranceStyle]}>
      <Text
        style={{
          fontFamily: fonts.medium,
          fontSize: 11,
          color: colors.caption,
          textTransform: 'uppercase',
          letterSpacing: 0.8,
          marginBottom: 10,
        }}
      >
        {title}
      </Text>
      <View
        style={{
          backgroundColor: colors.surfaceRaised,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: colors.border,
          overflow: 'hidden',
          ...shadows.card,
        }}
      >
        {items.map((item, i) => (
          <MenuItem key={item.label} item={item} isLast={i === items.length - 1} />
        ))}
      </View>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------
export default function AccountScreen({ navigation }: any) {
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();

  const userName = user?.name || 'MSME User';
  const initials = userName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const headerEntrance = useSpringEntrance({ delay: 0, distance: 12 });
  const profileEntrance = useSpringEntrance({ delay: 120, distance: 16 });
  const { animatedStyle: logoutAnim, handlePressIn, handlePressOut } = usePressScale(0.97);

  const handleLogout = () => {
    Alert.alert(
      'Log out',
      'Are you sure you want to log out of eMSME?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log out', style: 'destructive', onPress: logout },
      ]
    );
  };

  const menuSections: { title: string; items: MenuItem[] }[] = [
    {
      title: 'Account',
      items: [
        { icon: 'storefront-outline', label: 'Business profile', subtitle: 'Manage your registered businesses' },
        { icon: 'person-outline', label: 'Personal info', subtitle: 'Name, contact details, address' },
        { icon: 'shield-checkmark-outline', label: 'Identity verification', subtitle: 'PhilSys & biometric status' },
      ],
    },
    {
      title: 'Preferences',
      items: [
        { icon: 'notifications-outline', label: 'Notifications', subtitle: 'Push notifications & alerts' },
        { icon: 'language-outline', label: 'Language', subtitle: 'Filipino / English' },
      ],
    },
    {
      title: 'Support',
      items: [
        { 
          icon: 'chatbubble-ellipses-outline', 
          label: 'Help & support', 
          subtitle: 'Chat with eGovAI assistant',
          onPress: () => navigation.navigate('EGovAI')
        },
        { icon: 'information-circle-outline', label: 'About eMSME', subtitle: 'Version 1.0.0' },
        { icon: 'document-text-outline', label: 'Terms & privacy policy' },
      ],
    },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.surface }}
      contentContainerStyle={{ paddingBottom: 120 }}
    >
      {/* Header */}
      <Animated.View style={[{ paddingTop: Math.max(insets.top + 16, 56), paddingHorizontal: spacing.screen, paddingBottom: 24 }, headerEntrance]}>
        <Text style={[text.h1, { color: colors.ink }]}>Account</Text>
      </Animated.View>

      {/* Profile card — double-bezel */}
      <Animated.View style={[{ paddingHorizontal: spacing.screen, marginBottom: 28 }, profileEntrance]}>
        <View
          style={{
            backgroundColor: colors.primaryMuted,
            borderRadius: radius.lg,
            padding: 3,
            borderWidth: 1,
            borderColor: colors.border,
            ...shadows.card,
          }}
        >
          <View
            style={{
              backgroundColor: colors.surfaceRaised,
              borderRadius: radius.md,
              padding: 18,
              overflow: 'hidden',
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <FlagAccent height={3} />

            {/* Squircle avatar — not circle */}
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 16,
                backgroundColor: colors.primary,
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 16,
              }}
            >
              <Text style={{ fontFamily: fonts.display, fontSize: 18, color: colors.white }}>
                {initials}
              </Text>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={[text.h4, { color: colors.ink }]}>{userName}</Text>
              <Text style={[text.caption, { color: colors.body, marginTop: 2 }]}>
                eGovPH Verified Account
              </Text>
            </View>

            {/* Status badge — no emoji */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <StatusDot variant="active" size={6} animate />
              <Text style={{ fontFamily: fonts.medium, fontSize: 11, color: '#22C55E' }}>
                Active
              </Text>
            </View>
          </View>
        </View>
      </Animated.View>

      {/* Menu sections */}
      {menuSections.map((section, sIndex) => (
        <MenuSection
          key={section.title}
          title={section.title}
          items={section.items}
          sectionIndex={sIndex}
        />
      ))}

      {/* Log out */}
      <Animated.View style={[{ paddingHorizontal: spacing.screen }, logoutAnim]}>
        <TouchableOpacity
          onPress={handleLogout}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={1}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Log out"
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.signalMuted,
            borderRadius: radius.sm,
            paddingVertical: 14,
            gap: 8,
            borderWidth: 1,
            borderColor: `${colors.signal}20`,
          }}
        >
          <Ionicons name="log-out-outline" size={18} color={colors.signal} />
          <Text style={{ fontFamily: fonts.heading, fontSize: 14, color: colors.signal }}>
            Log out
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </ScrollView>
  );
}
