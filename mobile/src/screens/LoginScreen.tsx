import React, { useState, useCallback } from 'react';
import { View, Text, StatusBar, Alert } from 'react-native';
import Animated from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { useEGovAuth } from '../hooks/useEGovAuth';
import { useSpringEntrance, useBreathingPulse, useScalePulse } from '../lib/animations';
import { colors, text, spacing, radius, shadows, fonts } from '../lib/theme';
import PressableButton from '../components/ui/PressableButton';
import FlagAccent from '../components/ui/FlagAccent';
import { memo, useEffect } from 'react';
import { cancelAnimation } from 'react-native-reanimated';

// ---------------------------------------------------------------------------
// Isolated pulsing ring — perpetual animation in leaf component
// ---------------------------------------------------------------------------
interface PulsingRingProps {
  delay: number;
  size: number;
  color?: string;
  fillOpacity?: number;
}

const PulsingRing = memo(({ delay, size, color = colors.gold, fillOpacity }: PulsingRingProps) => {
  const animStyle = useBreathingPulse({
    minOpacity: fillOpacity ? fillOpacity * 0.25 : 0.04,
    maxOpacity: fillOpacity ?? 0.18,
    duration: 3200,
  });

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: fillOpacity ? 0 : 1,
          borderColor: color,
          backgroundColor: fillOpacity ? `${color}50` : 'transparent',
        },
        animStyle,
      ]}
    />
  );
});

PulsingRing.displayName = 'PulsingRing';

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------
export default function LoginScreen() {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [authStep, setAuthStep] = useState<string | null>(null);

  const brandEntrance = useSpringEntrance({ delay: 80, distance: 20 });
  const cardEntrance = useSpringEntrance({ delay: 280, distance: 32 });
  const pulseStyle = useBreathingPulse({ minOpacity: 0.4, maxOpacity: 1, duration: 1200 });

  const handleCodeReceived = useCallback(async (code: string) => {
    try {
      setLoading(true);
      setErrorMsg(null);
      setAuthStep('Connecting to eGovPH gateway...');
      await new Promise((r) => setTimeout(r, 600));
      setAuthStep('Authenticating with partner credentials...');
      await login(code);
      setAuthStep('Authentication successful!');
      await new Promise((r) => setTimeout(r, 400));
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Login failed. Please try again.';
      setErrorMsg(msg);
      Alert.alert('Login Failed', msg);
    } finally {
      setLoading(false);
      setAuthStep(null);
    }
  }, [login]);

  const { startAuthFlow, isReady } = useEGovAuth(handleCodeReceived);

  const handleLogin = () => {
    setErrorMsg(null);
    if (isReady) {
      startAuthFlow();
    } else {
      Alert.alert(
        'eGovPH Not Configured',
        'Set EXPO_PUBLIC_EGOV_PARTNER_CODE and EXPO_PUBLIC_EGOV_SSO_URL in mobile/.env to enable live SSO.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <LinearGradient
      colors={['#1B4FDB', '#0D2E8F', '#091E64']}
      locations={[0, 0.55, 1]}
      style={{ flex: 1 }}
    >
      <StatusBar barStyle="light-content" />

      {/* Branding area */}
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 }}>
        <Animated.View style={[{ alignItems: 'center' }, brandEntrance]}>
          {/* Concentric pulsing rings — Philippine sun motif */}
          <View style={{ alignItems: 'center', justifyContent: 'center', marginBottom: 28 }}>
            <PulsingRing delay={0} size={100} fillOpacity={0.12} />
            <PulsingRing delay={0} size={128} />
            <PulsingRing delay={1600} size={160} />
            <PulsingRing delay={3200} size={196} />

            {/* Icon core — double-bezel */}
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 24,   // squircle, not circle
                backgroundColor: 'rgba(255,255,255,0.12)',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.2)',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Ionicons name="sunny" size={30} color={colors.gold} />
              </View>
            </View>
          </View>

          <Text style={{ fontFamily: fonts.display, fontSize: 44, color: colors.white, letterSpacing: -1 }}>
            eMSME
          </Text>
          <Text style={{ fontFamily: fonts.sans, fontSize: 14, color: 'rgba(255,255,255,0.65)', marginTop: 6, letterSpacing: 0.2 }}>
            eGovPH Service Module
          </Text>
        </Animated.View>
      </View>

      {/* Login card — slides up from bottom */}
      <Animated.View
        style={[
          {
            backgroundColor: colors.surfaceRaised,
            borderTopLeftRadius: radius.xl,
            borderTopRightRadius: radius.xl,
            paddingHorizontal: 32,
            paddingTop: 44,
            paddingBottom: 52,
            overflow: 'hidden',
          },
          cardEntrance,
        ]}
      >
        <FlagAccent height={4} />

        {authStep ? (
          /* Auth-in-progress overlay */
          <View style={{ alignItems: 'center', paddingVertical: 24 }}>
            <Animated.View style={pulseStyle}>
              <View style={{
                width: 64,
                height: 64,
                borderRadius: 20,
                backgroundColor: colors.primaryMuted,
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 20,
              }}>
                <Ionicons name="shield-checkmark" size={32} color={colors.primary} />
              </View>
            </Animated.View>
            <Text style={[text.h2, { color: colors.ink, marginBottom: 8, textAlign: 'center' }]}>
              Authenticating
            </Text>
            <Text style={{ fontFamily: fonts.mono, fontSize: 12, color: colors.caption, textAlign: 'center' }}>
              {authStep}
            </Text>
          </View>
        ) : (
          /* Normal login card content */
          <>
            <Text style={[text.h2, { color: colors.ink, marginBottom: 8 }]}>
              Mag-login
            </Text>
            <Text style={[text.body, { color: colors.body, marginBottom: 32, lineHeight: 22 }]}>
              Gamitin ang iyong eGovPH account para i-access ang MSME financial services.
            </Text>

            {errorMsg && (
              <View
                style={{
                  backgroundColor: colors.signalMuted,
                  borderRadius: radius.sm,
                  padding: 14,
                  marginBottom: 20,
                  flexDirection: 'row',
                  gap: 10,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: `${colors.signal}30`,
                }}
              >
                <Ionicons name="warning-outline" size={16} color={colors.signal} />
                <Text style={{ fontFamily: fonts.sans, fontSize: 13, color: colors.signal, flex: 1, lineHeight: 20 }}>
                  {errorMsg}
                </Text>
              </View>
            )}

            <PressableButton
              onPress={handleLogin}
              label="Log in using eGovPH"
              icon="shield-checkmark"
              trailingIcon="arrow-forward"
              loading={loading}
              variant="primary"
              size="lg"
            />

            <Text style={{ fontFamily: fonts.sans, fontSize: 12, color: colors.caption, textAlign: 'center', marginTop: 24 }}>
              Powered by eGovPH  •  Secured with eVerify
            </Text>
          </>
        )}
      </Animated.View>
    </LinearGradient>
  );
}
