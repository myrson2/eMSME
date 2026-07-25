import React, { useState } from 'react';
import { View, Text, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import Animated from 'react-native-reanimated';
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

  const handleSubmit = async () => {
    const rev = parseFloat(monthlyRevenue);
    if (!rev || rev <= 0) {
      Alert.alert('Invalid input', 'Please enter a valid monthly revenue.');
      return;
    }
    try {
      setLoading(true);
      const res = await client.post('/onboarding/financials', {
        monthlyRevenue: rev,
        annualIncome: rev * 12,
        totalAssets: parseFloat(totalAssets) || 0,
        totalLiabilities: parseFloat(totalLiabilities) || 0,
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
            onChangeText={setMonthlyRevenue}
            placeholder="150,000"
            keyboardType="numeric"
            prefix="₱"
          />
          <OnboardingField
            label="Total assets"
            value={totalAssets}
            onChangeText={setTotalAssets}
            placeholder="500,000"
            keyboardType="numeric"
            prefix="₱"
          />
          <OnboardingField
            label="Total liabilities / debt"
            value={totalLiabilities}
            onChangeText={setTotalLiabilities}
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
