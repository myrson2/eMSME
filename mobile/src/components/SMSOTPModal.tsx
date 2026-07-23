import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, Modal, TouchableOpacity, TextInput,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import client from '../api/client';

interface SMSOTPModalProps {
  visible: boolean;
  mobileNumber: string;
  action?: string;
  onVerified: () => void;
  onDismiss: () => void;
}

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60;

export function SMSOTPModal({ visible, mobileNumber, action = 'VERIFICATION', onVerified, onDismiss }: SMSOTPModalProps) {
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const maskedNumber = mobileNumber.replace(/(\+63)(\d{3})(\d{4})(\d{3})/, '$1 $2 $3** $4');

  const startCooldown = () => {
    setCooldown(RESEND_COOLDOWN);
    cooldownRef.current = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const sendOTP = async () => {
    try {
      setSending(true);
      setErrorMsg(null);
      await client.post('/auth/sms/send-otp', { mobileNumber, action });
      startCooldown();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to send OTP. Please try again.';
      setErrorMsg(msg);
    } finally {
      setSending(false);
    }
  };

  // Auto-send OTP when modal opens
  useEffect(() => {
    if (visible) {
      setDigits(Array(OTP_LENGTH).fill(''));
      setErrorMsg(null);
      sendOTP();
    }
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, [visible]);

  const handleDigitChange = (text: string, index: number) => {
    const digit = text.replace(/[^0-9]/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);
    setErrorMsg(null);

    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits filled
    if (newDigits.every(d => d !== '')) {
      submitOTP(newDigits.join(''));
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const submitOTP = async (code: string) => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await client.post('/auth/sms/verify-otp', { mobileNumber, otpCode: code });
      if (res.data.success) {
        onVerified();
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Incorrect code. Please try again.';
      setErrorMsg(msg);
      setDigits(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPress = () => {
    const code = digits.join('');
    if (code.length < OTP_LENGTH) {
      setErrorMsg('Please enter all 6 digits.');
      return;
    }
    submitOTP(code);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}
      >
        <Animated.View
          entering={FadeInDown.duration(400)}
          style={{
            backgroundColor: '#FFFFFF',
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            padding: 32,
            paddingBottom: 48,
            overflow: 'hidden',
          }}
        >
          {/* Flag accent bar */}
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 5, flexDirection: 'row' }}>
            <View style={{ flex: 1, backgroundColor: '#1740DE' }} />
            <View style={{ flex: 1, backgroundColor: '#E63B27' }} />
            <View style={{ flex: 1, backgroundColor: '#FCD116' }} />
          </View>

          {/* Dismiss handle */}
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#E2E5F0', alignSelf: 'center', marginBottom: 24 }} />

          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#EFF1FD', justifyContent: 'center', alignItems: 'center' }}>
              <Ionicons name="chatbubble-ellipses" size={22} color="#1740DE" />
            </View>
            <View>
              <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 18, color: '#1A1A1A' }}>SMS Verification</Text>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: '#6B7280' }}>via eMessage Gateway</Text>
            </View>
          </View>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: '#4A4A4A', marginBottom: 28, lineHeight: 20 }}>
            Enter the 6-digit code sent to <Text style={{ fontFamily: 'Inter_500Medium', color: '#1A1A1A' }}>{maskedNumber}</Text>
          </Text>

          {/* OTP Digit Inputs */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 }}>
            {digits.map((digit, index) => (
              <TextInput
                key={index}
                ref={ref => { inputRefs.current[index] = ref; }}
                value={digit}
                onChangeText={text => handleDigitChange(text, index)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                keyboardType="number-pad"
                maxLength={1}
                style={{
                  width: 46,
                  height: 56,
                  borderWidth: 2,
                  borderColor: digit ? '#1740DE' : errorMsg ? '#E63B27' : '#E2E5F0',
                  borderRadius: 12,
                  textAlign: 'center',
                  fontFamily: 'Poppins_700Bold',
                  fontSize: 22,
                  color: '#1A1A1A',
                  backgroundColor: digit ? '#EFF1FD' : '#F9FAFB',
                }}
              />
            ))}
          </View>

          {/* Error */}
          {errorMsg && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 }}>
              <Ionicons name="warning" size={14} color="#E63B27" />
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: '#E63B27' }}>{errorMsg}</Text>
            </View>
          )}

          {/* Resend */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
            {cooldown > 0 ? (
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: '#9CA3AF' }}>
                Resend in <Text style={{ fontFamily: 'Inter_500Medium', color: '#1740DE' }}>{cooldown}s</Text>
              </Text>
            ) : (
              <TouchableOpacity onPress={sendOTP} disabled={sending}>
                {sending ? (
                  <ActivityIndicator size="small" color="#1740DE" />
                ) : (
                  <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 13, color: '#1740DE' }}>
                    Didn't receive a code? <Text style={{ textDecorationLine: 'underline' }}>Resend</Text>
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* Verify button */}
          <TouchableOpacity
            onPress={handleVerifyPress}
            activeOpacity={0.85}
            disabled={loading}
            style={{
              backgroundColor: loading ? '#EFF1FD' : '#1740DE',
              borderRadius: 12,
              paddingVertical: 16,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 10,
              borderWidth: 1,
              borderColor: loading ? 'transparent' : 'rgba(252, 209, 22, 0.4)',
            }}
          >
            {loading ? (
              <ActivityIndicator color="#1740DE" />
            ) : (
              <>
                <Ionicons name="shield-checkmark" size={20} color="#FCD116" />
                <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 15, color: '#FFFFFF' }}>
                  Verify Code
                </Text>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
