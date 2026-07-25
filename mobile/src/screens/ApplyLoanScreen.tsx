import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import Animated from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import client from '../api/client';
import { useSpringEntrance } from '../lib/animations';
import { colors, text, spacing, radius, shadows, fonts } from '../lib/theme';
import PressableButton from '../components/ui/PressableButton';

// ---------------------------------------------------------------------------
// Field component — consistent label/input/error structure
// ---------------------------------------------------------------------------
interface FieldProps {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
  multiline?: boolean;
  prefix?: string;  // e.g. "₱" for currency fields
}

function Field({ label, value, onChangeText, placeholder, keyboardType = 'default', multiline, prefix }: FieldProps) {
  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={{ fontFamily: fonts.medium, fontSize: 12, color: colors.body, marginBottom: 8, letterSpacing: 0.1 }}>
        {label}
      </Text>
      <View
        style={{
          flexDirection: 'row',
          alignItems: multiline ? 'flex-start' : 'center',
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radius.sm,
          backgroundColor: colors.surfaceRaised,
          overflow: 'hidden',
        }}
      >
        {prefix && (
          <View
            style={{
              paddingHorizontal: 14,
              paddingVertical: 14,
              borderRightWidth: 1,
              borderRightColor: colors.borderSubtle,
              backgroundColor: colors.surface,
            }}
          >
            <Text style={{ fontFamily: fonts.mono, fontSize: 15, color: colors.body }}>
              {prefix}
            </Text>
          </View>
        )}
        <TextInput
          style={{
            flex: 1,
            paddingHorizontal: 16,
            paddingVertical: 14,
            fontFamily: prefix ? fonts.mono : fonts.sans,
            fontSize: 14,
            color: colors.ink,
            minHeight: multiline ? 88 : undefined,
            textAlignVertical: multiline ? 'top' : 'center',
          }}
          placeholder={placeholder}
          placeholderTextColor={colors.placeholder}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          multiline={multiline}
        />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------
export default function ApplyLoanScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [requestedAmount, setRequestedAmount] = useState('');
  const [tenorMonths, setTenorMonths] = useState('');
  const [purpose, setPurpose] = useState('');
  const [loading, setLoading] = useState(false);

  const headerEntrance = useSpringEntrance({ delay: 0, distance: 12 });
  const formEntrance = useSpringEntrance({ delay: 120, distance: 16 });
  const ctaEntrance = useSpringEntrance({ delay: 240, distance: 12 });

  const handleSubmit = async () => {
    if (!requestedAmount || !tenorMonths || !purpose) {
      Alert.alert('Missing fields', 'Please complete all loan application fields.');
      return;
    }

    try {
      setLoading(true);
      const res = await client.post('/loans/apply', {
        requestedAmount: parseFloat(requestedAmount),
        tenorMonths: parseInt(tenorMonths, 10),
        purpose,
      });

      if (res.data.success) {
        Alert.alert(
          'Application submitted',
          'Your loan application has been submitted. Credit assessment is underway.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert('Submission failed', res.data.message);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Server error submitting loan application.';
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
      {/* Header */}
      <Animated.View
        style={[
          {
            flexDirection: 'row',
            alignItems: 'center',
            paddingTop: Math.max(insets.top + 12, 48),
            paddingHorizontal: spacing.screen,
            paddingBottom: 18,
            backgroundColor: colors.surfaceRaised,
            borderBottomWidth: 1,
            borderBottomColor: colors.borderSubtle,
          },
          headerEntrance,
        ]}
      >
        <Ionicons
          name="arrow-back"
          size={22}
          color={colors.ink}
          onPress={() => navigation.goBack()}
          style={{ marginRight: 14, padding: 4 }}
        />
        <Text style={[text.h3, { color: colors.ink }]}>Apply for a loan</Text>
      </Animated.View>

      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: spacing.screen }}>
        {/* Context */}
        <Animated.View style={[{ marginBottom: 28 }, formEntrance]}>
          <Text style={[text.body, { color: colors.body, lineHeight: 22 }]}>
            Enter your desired loan amount and terms. Your application will be assessed by our credit engine and matched with partner lenders.
          </Text>
        </Animated.View>

        {/* Form */}
        <Animated.View style={formEntrance}>
          <Field
            label="Requested amount"
            value={requestedAmount}
            onChangeText={setRequestedAmount}
            placeholder="50,000"
            keyboardType="numeric"
            prefix="₱"
          />
          <Field
            label="Tenor (months)"
            value={tenorMonths}
            onChangeText={setTenorMonths}
            placeholder="12"
            keyboardType="numeric"
          />
          <Field
            label="Loan purpose"
            value={purpose}
            onChangeText={setPurpose}
            placeholder="Describe what you will use the funds for"
            multiline
          />
        </Animated.View>

        {/* CTA */}
        <Animated.View style={[{ marginTop: 16 }, ctaEntrance]}>
          <PressableButton
            onPress={handleSubmit}
            label="Submit application"
            icon="paper-plane-outline"
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
