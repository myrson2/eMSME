import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import Animated from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import { useSpringEntrance, useStaggeredEntry, usePressScale } from '../lib/animations';
import { colors, text, spacing, radius, shadows, fonts } from '../lib/theme';
import PressableButton from '../components/ui/PressableButton';
import OnboardingField from '../components/ui/OnboardingField';
import * as Haptics from 'expo-haptics';

export default function SMSOTPScreen() {
  const { checkSession } = useAuth();
  const [localNumber, setLocalNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');

  const fullNumber = `+63${localNumber}`;

  const headerEntrance = useSpringEntrance({ delay: 0, distance: 16 });
  const formEntrance = useSpringEntrance({ delay: 140, distance: 16 });
  const ctaEntrance = useSpringEntrance({ delay: 260, distance: 12 });

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 'OTP' && cooldown > 0) {
      timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, cooldown]);

  const handleSendOTP = async () => {
    if (localNumber.length !== 10 || !localNumber.startsWith('9')) {
      Alert.alert('Invalid number', 'Please enter a valid 10-digit mobile number starting with 9.');
      return;
    }
    setLoading(true);
    try {
      const res = await client.post('/auth/sms/send-otp', {
        mobileNumber: fullNumber,
        action: 'VERIFICATION',
      });
      if (res.data.success) {
        setStep('OTP');
        setCooldown(60);
      } else {
        Alert.alert('Error', res.data.message || 'Failed to send OTP.');
      }
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to connect to SMS gateway.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otpCode.length < 6) {
      Alert.alert('Invalid code', 'Please enter the 6-digit OTP code.');
      return;
    }
    setLoading(true);
    try {
      const res = await client.post('/auth/sms/verify-otp', {
        mobileNumber: fullNumber,
        otpCode,
      });
      if (res.data.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await checkSession();
      } else {
        Alert.alert('Error', res.data.message || 'OTP verification failed.');
      }
    } catch (err: any) {
      Alert.alert('Verification failed', err?.response?.data?.message || 'Invalid OTP code.');
    } finally {
      setLoading(false);
    }
  };

  const { animatedStyle: resendStyle, handlePressIn, handlePressOut } = usePressScale(0.97);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, justifyContent: 'center' }}>
        <View style={{ padding: spacing.xl, justifyContent: 'center' }}>
          <Animated.View style={[{ alignItems: 'center', marginBottom: 40 }, headerEntrance]}>
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 24,
                backgroundColor: colors.primaryMuted,
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 24,
              }}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={36} color={colors.primary} />
            </View>
            <Text style={[text.h1, { color: colors.ink, marginBottom: 8 }]}>
              Phone verification
            </Text>
            <Text style={[text.body, { color: colors.body, textAlign: 'center', lineHeight: 22, maxWidth: 300 }]}>
              {step === 'PHONE'
                ? 'We need to verify your phone number to secure your account and send important updates.'
                : `Enter the 6-digit code sent to ${fullNumber}`}
            </Text>
          </Animated.View>

          <Animated.View style={formEntrance}>
            {step === 'PHONE' ? (
              <OnboardingField
                label="Mobile number"
                value={localNumber}
                onChangeText={(text) => setLocalNumber(text.replace(/[^0-9]/g, '').slice(0, 10))}
                placeholder="917 123 4567"
                keyboardType="phone-pad"
                prefix="🇵🇭 +63"
                mono
              />
            ) : (
              <View style={{ marginBottom: 24 }}>
                <Text style={{ fontFamily: fonts.medium, fontSize: 12, color: colors.body, marginBottom: 8, letterSpacing: 0.1 }}>
                  6-digit OTP code
                </Text>
                <TextInput
                  style={{
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: radius.md,
                    padding: 18,
                    fontSize: 24,
                    letterSpacing: 12,
                    textAlign: 'center',
                    fontFamily: fonts.mono,
                    color: colors.ink,
                    backgroundColor: colors.surfaceRaised,
                  }}
                  value={otpCode}
                  onChangeText={setOtpCode}
                  placeholder="000000"
                  placeholderTextColor={colors.placeholder}
                  keyboardType="number-pad"
                  maxLength={6}
                  autoFocus
                />
              </View>
            )}
          </Animated.View>

          <Animated.View style={ctaEntrance}>
            {step === 'PHONE' ? (
              <PressableButton
                onPress={handleSendOTP}
                label="Send OTP via eMessage"
                icon="paper-plane-outline"
                loading={loading}
                variant="primary"
                size="lg"
              />
            ) : (
              <View>
                <PressableButton
                  onPress={handleVerifyOTP}
                  label="Verify code"
                  icon="shield-checkmark-outline"
                  loading={loading}
                  variant="primary"
                  size="lg"
                />
                <Animated.View style={[resendStyle, { marginTop: 24 }]}>
                  <TouchableOpacity
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); handleSendOTP(); }}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    disabled={cooldown > 0 || loading}
                    style={{ alignItems: 'center', padding: 8 }}
                  >
                    <Text style={{ fontFamily: fonts.medium, fontSize: 13, color: cooldown > 0 ? colors.caption : colors.primary }}>
                      {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend SMS code'}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              </View>
            )}
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
