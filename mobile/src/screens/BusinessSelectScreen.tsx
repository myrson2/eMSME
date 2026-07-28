import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import Animated from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useSpringEntrance, useStaggeredEntry, usePressScale } from '../lib/animations';
import { colors, text, spacing, radius, shadows, fonts } from '../lib/theme';
import * as Haptics from 'expo-haptics';

function StepDot({ active, done }: { active: boolean; done: boolean }) {
  return (
    <View
      style={{
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: done ? colors.primary : active ? colors.primary : colors.borderSubtle,
        opacity: done || active ? 1 : 0.4,
      }}
    />
  );
}

const MOCK_BUSINESSES = [
  {
    businessName: 'Dela Cruz Sari-Sari Store',
    businessType: 'Sole Proprietorship',
    registrationNumber: 'DTI-REG-100234',
    birTin: '123-456-789-000',
    industryCategory: 'Retail',
  },
  {
    businessName: 'Dela Cruz General Trading',
    businessType: 'Corporation',
    registrationNumber: 'SEC-REG-990881',
    birTin: '987-654-321-000',
    industryCategory: 'Wholesale Trade',
  },
];

function MockBizCard({ biz, index, onPress, disabled }: { biz: any; index: number; onPress: () => void, disabled: boolean }) {
  const { animatedStyle, handlePressIn, handlePressOut } = usePressScale(0.97);
  const entranceStyle = useStaggeredEntry(index, { delay: 140, distance: 14 });

  return (
    <Animated.View style={[{ marginBottom: 12 }, entranceStyle, animatedStyle]}>
      <TouchableOpacity
        onPress={() => {
          if (disabled) return;
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        disabled={disabled}
        style={{
          backgroundColor: colors.surfaceRaised,
          borderRadius: radius.lg,
          padding: 20,
          borderWidth: 1,
          borderColor: colors.border,
          opacity: disabled ? 0.6 : 1,
          ...shadows.card,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 }}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                backgroundColor: colors.primaryMuted,
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 12,
              }}
            >
              <Ionicons name="storefront-outline" size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[text.h4, { color: colors.ink }]} numberOfLines={1}>
                {biz.businessName}
              </Text>
              <Text style={[text.caption, { color: colors.body, marginTop: 2 }]}>
                {biz.businessType}
              </Text>
            </View>
          </View>
          <View style={{ backgroundColor: '#DCFCE7', borderRadius: radius.xs, paddingHorizontal: 10, paddingVertical: 4 }}>
            <Text style={{ fontFamily: fonts.medium, fontSize: 11, color: '#16A34A' }}>
              Verified
            </Text>
          </View>
        </View>
        <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.borderSubtle, flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={[text.caption, { color: colors.caption, fontFamily: fonts.mono }]}>{biz.registrationNumber}</Text>
            <Ionicons name="arrow-forward" size={16} color={colors.primary} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function BusinessSelectScreen() {
  const { checkSession } = useAuth();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);

  const headerEntrance = useSpringEntrance({ delay: 0, distance: 14 });
  const ctaEntrance = useSpringEntrance({ delay: 300, distance: 12 });

  const handleSelectMock = async (biz: typeof MOCK_BUSINESSES[0]) => {
    try {
      setLoading(true);
      const res = await client.post('/onboarding/business/select-mock', biz);
      if (res.data.success) {
        await checkSession();
      } else {
        Alert.alert('Selection failed', res.data.message || 'Failed to select business.');
        setLoading(false);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Server error selecting business.';
      Alert.alert('Selection error', msg);
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    navigation.navigate('BusinessProfile');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: spacing.xl, paddingTop: Math.max(insets.top + 16, 64), paddingBottom: 64 }}>
        {/* Step indicator */}
        <View style={{ flexDirection: 'row', gap: 6, marginBottom: 28 }}>
          <StepDot active={false} done />
          <StepDot active={false} done />
          <StepDot active={true} done={false} />
          <StepDot active={false} done={false} />
        </View>

        {/* Header */}
        <Animated.View style={[{ marginBottom: 32 }, headerEntrance]}>
          <Text style={[text.h1, { color: colors.ink, marginBottom: 8 }]}>
            Select business
          </Text>
          <Text style={[text.body, { color: colors.body, lineHeight: 22 }]}>
            We found businesses registered under your eGovPH profile. Select one to proceed or register a new one.
          </Text>
        </Animated.View>

        {/* Mock Businesses */}
        {MOCK_BUSINESSES.map((biz, index) => (
          <MockBizCard
            key={biz.registrationNumber}
            biz={biz}
            index={index}
            onPress={() => handleSelectMock(biz)}
            disabled={loading}
          />
        ))}

        {/* Add New Business Button */}
        <Animated.View style={[{ marginTop: 16 }, ctaEntrance]}>
          <TouchableOpacity
            onPress={handleAddNew}
            disabled={loading}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 16,
              borderRadius: radius.md,
              borderWidth: 2,
              borderColor: colors.borderSubtle,
              borderStyle: 'dashed',
              backgroundColor: 'transparent',
              opacity: loading ? 0.6 : 1,
            }}
          >
            <Ionicons name="add-circle-outline" size={20} color={colors.ink} style={{ marginRight: 8 }} />
            <Text style={{ fontFamily: fonts.medium, fontSize: 15, color: colors.ink }}>
              Register a new business
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
