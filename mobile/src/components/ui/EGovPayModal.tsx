import React, { useEffect, useState } from 'react';
import { View, Text, Modal, TouchableOpacity, ActivityIndicator } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radius, shadows, spacing, text } from '../../lib/theme';
import PressableButton from './PressableButton';
import * as Haptics from 'expo-haptics';

interface EGovPayModalProps {
  visible: boolean;
  mode: 'PAYMENT' | 'CASHOUT';
  amount: number;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export default function EGovPayModal({ visible, mode, amount, onClose, onConfirm }: EGovPayModalProps) {
  const [step, setStep] = useState<'CONFIRM' | 'PROCESSING' | 'SUCCESS'>('CONFIRM');
  
  useEffect(() => {
    if (visible) setStep('CONFIRM');
  }, [visible]);

  const handleConfirm = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setStep('PROCESSING');
    try {
      await onConfirm();
      setStep('SUCCESS');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      setStep('CONFIRM'); // Reset on failure
      // (Error handling should ideally show a toast, but keeping it simple for demo)
    }
  };

  const handleDone = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  const formatCurrency = (val: number) =>
    '₱' + val.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(200)}
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
      >
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={step === 'CONFIRM' ? onClose : undefined} />
        
        <Animated.View
          entering={SlideInDown.duration(250)}
          exiting={SlideOutDown.duration(200)}
          style={{
            backgroundColor: colors.surface,
            borderTopLeftRadius: radius.xl,
            borderTopRightRadius: radius.xl,
            padding: spacing.xl,
            paddingBottom: spacing.xl + 32,
            ...shadows.cardElevated,
          }}
        >
          {/* Header */}
          <View style={{ alignItems: 'center', marginBottom: 24 }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, marginBottom: 20 }} />
            
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#002B7F', justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name="shield-checkmark" size={18} color={colors.white} />
              </View>
              <Text style={{ fontFamily: fonts.display, fontSize: 18, color: '#002B7F', letterSpacing: -0.3 }}>eGovPay</Text>
            </View>
            
            <Text style={[text.caption, { color: colors.body }]}>
              {mode === 'PAYMENT' ? 'Secure Government Payment Gateway' : 'Official Disbursement Channel'}
            </Text>
          </View>

          {/* Dynamic Content */}
          {step === 'CONFIRM' && (
            <Animated.View entering={FadeIn.duration(300)}>
              <View style={{ alignItems: 'center', marginBottom: 32 }}>
                <Text style={[text.caption, { color: colors.caption, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.8 }]}>
                  {mode === 'PAYMENT' ? 'Amount to pay' : 'Amount to disburse'}
                </Text>
                <Text style={{ fontFamily: fonts.mono, fontSize: 36, color: colors.ink, letterSpacing: -1 }}>
                  {formatCurrency(amount)}
                </Text>
              </View>

              <View style={{ backgroundColor: colors.surfaceRaised, borderRadius: radius.md, padding: 16, borderWidth: 1, borderColor: colors.borderSubtle, marginBottom: 32 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                  <Text style={[text.body, { color: colors.body }]}>Source Wallet</Text>
                  <Text style={[text.body, { fontFamily: fonts.medium, color: colors.ink }]}>eMSME Wallet</Text>
                </View>
                <View style={{ height: 1, backgroundColor: colors.borderSubtle, marginBottom: 12 }} />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={[text.body, { color: colors.body }]}>Transaction Fee</Text>
                  <Text style={[text.body, { fontFamily: fonts.medium, color: colors.ink }]}>₱0.00</Text>
                </View>
              </View>

              <PressableButton
                label={mode === 'PAYMENT' ? 'Confirm Payment' : 'Confirm Cash Out'}
                onPress={handleConfirm}
                variant="primary"
                style={{ backgroundColor: '#002B7F' }}
              />
              <TouchableOpacity onPress={onClose} style={{ marginTop: 16, alignItems: 'center', padding: 8 }}>
                <Text style={{ fontFamily: fonts.medium, fontSize: 14, color: colors.caption }}>Cancel</Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          {step === 'PROCESSING' && (
            <Animated.View entering={FadeIn.duration(300)} style={{ alignItems: 'center', paddingVertical: 40 }}>
              <ActivityIndicator size="large" color="#002B7F" />
              <Text style={[text.h4, { color: colors.ink, marginTop: 24, marginBottom: 8 }]}>
                {mode === 'PAYMENT' ? 'Processing payment...' : 'Disbursing funds...'}
              </Text>
              <Text style={[text.body, { color: colors.body, textAlign: 'center' }]}>
                Please do not close this screen.
              </Text>
            </Animated.View>
          )}

          {step === 'SUCCESS' && (
            <Animated.View entering={FadeIn.duration(300)} style={{ alignItems: 'center', paddingVertical: 20 }}>
              <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center', marginBottom: 20 }}>
                <Ionicons name="checkmark" size={32} color="#16A34A" />
              </View>
              <Text style={[text.h4, { color: colors.ink, marginBottom: 8 }]}>
                {mode === 'PAYMENT' ? 'Payment Successful' : 'Cash Out Successful'}
              </Text>
              <Text style={[text.body, { color: colors.body, textAlign: 'center', marginBottom: 32, paddingHorizontal: 20 }]}>
                {mode === 'PAYMENT' 
                  ? 'Your loan installment has been paid. An eMessage receipt has been sent.'
                  : 'Funds have been credited to your eGovPay wallet. An eMessage receipt has been sent.'}
              </Text>
              
              <PressableButton
                label="Done"
                onPress={handleDone}
                variant="primary"
                style={{ backgroundColor: '#16A34A', width: '100%' }}
              />
            </Animated.View>
          )}

        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
