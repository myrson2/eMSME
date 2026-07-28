import React, { useState } from 'react';
import { View, Text, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import { colors, text, spacing, radius } from '../lib/theme';
import OnboardingField from '../components/ui/OnboardingField';
import OnboardingPicker from '../components/ui/OnboardingPicker';
import PressableButton from '../components/ui/PressableButton';
import client from '../api/client';

export default function ApplyLoanScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  
  const [requestedAmount, setRequestedAmount] = useState('');
  const [purpose, setPurpose] = useState('');
  const [tenorMonths, setTenorMonths] = useState('12');
  const [loading, setLoading] = useState(false);

  const PURPOSES = ['Working Capital', 'Equipment Purchase', 'Inventory Expansion', 'Facility Renovation', 'Debt Refinancing'];
  const TENORS = ['6', '12', '24', '36', '48', '60'];

  const formatNumber = (val: string) => {
    const numericOnly = val.replace(/\D/g, '');
    if (!numericOnly) return '';
    return numericOnly.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const handleApply = async () => {
    const amountStr = requestedAmount.replace(/,/g, '');
    const amount = parseFloat(amountStr);

    if (!amount || amount <= 0 || !purpose || !tenorMonths) {
      Alert.alert('Incomplete Form', 'Please fill out all fields.');
      return;
    }

    try {
      setLoading(true);
      const res = await client.post('/loans/apply', {
        requestedAmount: amount,
        purpose,
        tenorMonths: parseInt(tenorMonths, 10),
      });

      if (res.data.success) {
        navigation.goBack();
      } else {
        Alert.alert('Application Failed', res.data.message);
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || 'Failed to submit loan application';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, backgroundColor: colors.surface }}>
      <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingTop: Math.max(insets.top + 16, 64), paddingBottom: 64 }}>
        
        {/* Back Button */}
        <Animated.View entering={FadeInUp.duration(300)} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
          <Ionicons
            name="arrow-back"
            size={24}
            color={colors.ink}
            onPress={() => navigation.goBack()}
            disabled={loading}
            style={{ padding: 4, marginLeft: -4, opacity: loading ? 0.5 : 1 }}
          />
        </Animated.View>

        {/* Header */}
        <Animated.View entering={FadeInUp.duration(400)} style={{ marginBottom: 32 }}>
          <Text style={[text.h1, { color: colors.ink, marginBottom: 8 }]}>Apply for Loan</Text>
          <Text style={[text.body, { color: colors.body, lineHeight: 22 }]}>
            Submit your application to be matched with Government partner banks like LANDBANK and DBP.
          </Text>
        </Animated.View>

        {/* Form */}
        <Animated.View entering={FadeInUp.duration(500).delay(100)}>
          <OnboardingField
            label="Requested loan amount"
            value={requestedAmount}
            onChangeText={(val) => setRequestedAmount(formatNumber(val))}
            placeholder="1,500,000"
            keyboardType="numeric"
            prefix="₱"
          />
          <OnboardingPicker
            label="Loan purpose"
            value={purpose}
            onValueChange={setPurpose}
            placeholder="Select purpose"
            options={PURPOSES}
          />
          <OnboardingPicker
            label="Repayment Tenor (Months)"
            value={tenorMonths}
            onValueChange={setTenorMonths}
            placeholder="12"
            options={TENORS}
          />
        </Animated.View>

        {/* Info Card */}
        <Animated.View entering={FadeInUp.duration(500).delay(200)} style={{
          backgroundColor: colors.surfaceRaised,
          padding: 16,
          borderRadius: radius.md,
          marginTop: 8,
          marginBottom: 32,
          borderWidth: 1,
          borderColor: colors.borderSubtle
        }}>
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <Ionicons name="information-circle" size={24} color={colors.primary} />
            <Text style={[text.caption, { color: colors.body, flex: 1, lineHeight: 18 }]}>
              Amounts under ₱5,000,000 are eligible for automatic matching with Government banks. Processing takes a few seconds.
            </Text>
          </View>
        </Animated.View>

        {/* CTA */}
        <Animated.View entering={FadeInDown.duration(400).delay(300)}>
          <PressableButton
            label="Submit Application"
            onPress={handleApply}
            loading={loading}
            variant="primary"
          />
        </Animated.View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}
