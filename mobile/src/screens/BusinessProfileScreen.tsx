import React, { useState } from 'react';
import { View, Text, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import Animated from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useSpringEntrance } from '../lib/animations';
import { colors, text, spacing, fonts } from '../lib/theme';
import PressableButton from '../components/ui/PressableButton';
import OnboardingField from '../components/ui/OnboardingField';

// Step indicator
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

export default function BusinessProfileScreen() {
  const { checkSession } = useAuth();
  const insets = useSafeAreaInsets();
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [birTin, setBirTin] = useState('');
  const [lguPermitNumber, setLguPermitNumber] = useState('');
  const [industry, setIndustry] = useState('');
  const [loading, setLoading] = useState(false);

  const headerEntrance = useSpringEntrance({ delay: 0, distance: 14 });
  const formEntrance = useSpringEntrance({ delay: 140, distance: 16 });
  const ctaEntrance = useSpringEntrance({ delay: 260, distance: 12 });

  const handleSubmit = async () => {
    if (!businessName || !registrationNumber || !birTin) {
      Alert.alert('Missing fields', 'Please complete Business Name, DTI/SEC Reg No., and BIR TIN.');
      return;
    }
    try {
      setLoading(true);
      const res = await client.post('/onboarding/business/profile', {
        businessName,
        businessType: businessType || 'Sole Proprietorship',
        industryCategory: industry || 'Retail',
        registrationNumber,
        birTin,
        lguPermitNumber,
        yearsInOperation: 3,
      });
      if (res.data.success) {
        await checkSession();
      } else {
        Alert.alert('Save failed', res.data.message || 'Failed to save business profile.');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Server error saving business profile.';
      Alert.alert('Profile error', msg);
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
            Business profile
          </Text>
          <Text style={[text.body, { color: colors.body, lineHeight: 22 }]}>
            Register your MSME credentials to unlock funding eligibility.
          </Text>
        </Animated.View>

        {/* Form */}
        <Animated.View style={formEntrance}>
          <OnboardingField label="Business name" value={businessName} onChangeText={setBusinessName} placeholder="Dela Cruz General Trading" />
          <OnboardingField label="Business type" value={businessType} onChangeText={setBusinessType} placeholder="Sole Proprietorship / Corporation" />
          <OnboardingField label="DTI / SEC registration no." value={registrationNumber} onChangeText={setRegistrationNumber} placeholder="DTI-REG-XXXXXX" mono />
          <OnboardingField label="BIR TIN number" value={birTin} onChangeText={setBirTin} placeholder="XXX-XXX-XXX-000" mono />
          <OnboardingField label="LGU mayor permit no." value={lguPermitNumber} onChangeText={setLguPermitNumber} placeholder="MAYOR-PERMIT-2026-XX" mono />
          <OnboardingField label="Industry category" value={industry} onChangeText={setIndustry} placeholder="e.g. Retail, Food, Services" />
        </Animated.View>

        {/* CTA */}
        <Animated.View style={[{ marginTop: 8 }, ctaEntrance]}>
          <PressableButton
            onPress={handleSubmit}
            label="Save & continue"
            icon="shield-checkmark-outline"
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
