import React, { useState } from 'react';
import { View, Text, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import Animated from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useSpringEntrance } from '../lib/animations';
import { colors, text, spacing } from '../lib/theme';
import PressableButton from '../components/ui/PressableButton';
import OnboardingField from '../components/ui/OnboardingField';

export default function FinancialsScreen() {
  const { checkSession } = useAuth();
  const insets = useSafeAreaInsets();
  const [monthlyRevenue, setMonthlyRevenue] = useState('');
  const [totalAssets, setTotalAssets] = useState('');
  const [totalLiabilities, setTotalLiabilities] = useState('');
  const [loading, setLoading] = useState(false);

  const headerEntrance = useSpringEntrance({ delay: 0, distance: 14 });
  const formEntrance = useSpringEntrance({ delay: 140, distance: 16 });
  const ctaEntrance = useSpringEntrance({ delay: 260, distance: 12 });

  const formatNumber = (val: string) => {
    // Remove non-numeric characters
    const numericOnly = val.replace(/\D/g, '');
    if (!numericOnly) return '';
    // Add commas as thousands separators
    return numericOnly.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const handleUndoBusiness = async () => {
    try {
      setLoading(true);
      const res = await client.post('/onboarding/business/undo');
      if (res.data.success) {
        await checkSession();
      } else {
        Alert.alert('Undo failed', res.data.message || 'Failed to revert business selection.');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Server error undoing selection.';
      Alert.alert('Undo error', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    // Strip commas before parsing
    const revStr = monthlyRevenue.replace(/,/g, '');
    const assetsStr = totalAssets.replace(/,/g, '');
    const liabilitiesStr = totalLiabilities.replace(/,/g, '');

    const rev = parseFloat(revStr);
    if (!rev || rev <= 0) {
      Alert.alert('Invalid input', 'Please enter a valid monthly revenue.');
      return;
    }
    try {
      setLoading(true);
      const res = await client.post('/onboarding/financials', {
        monthlyRevenue: rev,
        annualIncome: rev * 12,
        totalAssets: parseFloat(assetsStr) || 0,
        totalLiabilities: parseFloat(liabilitiesStr) || 0,
        existingLoans: [],
      });
      if (res.data.success) {
        await checkSession();
      } else {
        Alert.alert('Save failed', res.data.message || 'Failed to submit financials.');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Server error submitting financial snapshot.';
      Alert.alert('Submission error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={{ flex: 1, backgroundColor: colors.surface }}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: spacing.xl, paddingTop: Math.max(insets.top + 16, 64), paddingBottom: 64 }}>
        
        {/* Back Button (Undo Business Selection) */}
        <Animated.View style={[{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }, headerEntrance]}>
          <Ionicons
            name="arrow-back"
            size={24}
            color={colors.ink}
            onPress={handleUndoBusiness}
            disabled={loading}
            style={{ padding: 4, marginLeft: -4, opacity: loading ? 0.5 : 1 }}
          />
        </Animated.View>

        {/* Header */}
        <Animated.View style={[{ marginBottom: 32 }, headerEntrance]}>
          <Text style={[text.h1, { color: colors.ink, marginBottom: 8 }]}>
            Financial snapshot
          </Text>
          <Text style={[text.body, { color: colors.body, lineHeight: 22 }]}>
            Provide your monthly financials for automated credit scoring.
          </Text>
        </Animated.View>

        {/* Form */}
        <Animated.View style={formEntrance}>
          <OnboardingField
            label="Average monthly revenue"
            value={monthlyRevenue}
            onChangeText={(val) => setMonthlyRevenue(formatNumber(val))}
            placeholder="150,000"
            keyboardType="numeric"
            prefix="₱"
          />
          <OnboardingField
            label="Total assets"
            value={totalAssets}
            onChangeText={(val) => setTotalAssets(formatNumber(val))}
            placeholder="500,000"
            keyboardType="numeric"
            prefix="₱"
          />
          <OnboardingField
            label="Total liabilities / debt"
            value={totalLiabilities}
            onChangeText={(val) => setTotalLiabilities(formatNumber(val))}
            placeholder="50,000"
            keyboardType="numeric"
            prefix="₱"
          />
        </Animated.View>

        {/* CTA */}
        <Animated.View style={[{ marginTop: 8 }, ctaEntrance]}>
          <PressableButton
            onPress={handleSubmit}
            label="Complete onboarding"
            icon="checkmark-circle-outline"
            trailingIcon="arrow-forward"
            loading={loading}
            variant="primary"
            size="lg"
          />
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
