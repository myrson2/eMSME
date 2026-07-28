import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Alert } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useSpringEntrance, useBreathingPulse } from '../lib/animations';
import { colors, text, spacing, radius, shadows, fonts } from '../lib/theme';
import FlagAccent from '../components/ui/FlagAccent';

export default function EVerifyScreen() {
  const { checkSession } = useAuth();
  const [loading, setLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const hasStarted = useRef(false);

  const headerEntrance = useSpringEntrance({ delay: 0, distance: 16 });
  const cardEntrance = useSpringEntrance({ delay: 150, distance: 20 });

  const pulseStyle = useBreathingPulse({ minOpacity: 0.2, maxOpacity: 1, duration: 1500 });

  useEffect(() => {
    if (!hasStarted.current) {
      hasStarted.current = true;
      // Start the automatic verification after a short delay for entrance animations
      setTimeout(() => {
        handleVerify();
      }, 1000);
    }
  }, []);

  const handleVerify = async () => {
    try {
      setLoading(true);
      setStep(1);
      setSyncStatus('Connecting to PhilSys eVerify gateway...');
      await new Promise((r) => setTimeout(r, 1000));

      setStep(2);
      setSyncStatus('Matching identity records & validation...');
      const res = await client.post('/verify/philsys', { philSysCardNumber: '1234-5678-9012', userConsent: true });

      if (res.data.success) {
        setStep(3);
        setSyncStatus(`Identity verified (Ref: ${res.data.everifyRefId || 'EVERIFY-OK'})`);
        await new Promise((r) => setTimeout(r, 800));
        await checkSession();
      } else {
        Alert.alert('Verification failed', res.data.message || 'eVerify check failed.');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Error connecting to eVerify service.';
      Alert.alert('eVerify error', msg);
    } finally {
      setLoading(false);
      setStep(0);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', backgroundColor: colors.surface, padding: spacing.xl }}>
      <Animated.View style={[{ alignItems: 'center', marginBottom: 40 }, headerEntrance]}>
        <Text style={[text.h1, { color: colors.ink, marginBottom: 8, textAlign: 'center' }]}>
          PhilSys eVerify
        </Text>
        <Text style={[text.body, { color: colors.body, textAlign: 'center', lineHeight: 22, maxWidth: 280 }]}>
          Syncing your verified government identity from eGovPH.
        </Text>
      </Animated.View>

      {/* PhilSys Card Graphic */}
      <Animated.View style={[{ marginBottom: 48 }, cardEntrance]}>
        <View
          style={{
            backgroundColor: colors.surfaceRaised,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: radius.xl,
            padding: 24,
            overflow: 'hidden',
            ...shadows.cardElevated,
          }}
        >
          <FlagAccent height={4} />
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
            <View>
              <Text style={{ fontFamily: fonts.heading, fontSize: 13, color: colors.primary, textTransform: 'uppercase', letterSpacing: 1 }}>
                Republika ng Pilipinas
              </Text>
              <Text style={{ fontFamily: fonts.medium, fontSize: 10, color: colors.caption, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 }}>
                National ID System
              </Text>
            </View>
            <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.primaryMuted, justifyContent: 'center', alignItems: 'center' }}>
              <Ionicons name="finger-print-outline" size={24} color={colors.primary} />
            </View>
          </View>

          <View style={{ gap: 16 }}>
            <View style={{ height: 12, backgroundColor: colors.borderSubtle, borderRadius: 6, width: '60%' }} />
            <View style={{ height: 12, backgroundColor: colors.borderSubtle, borderRadius: 6, width: '40%' }} />
            <View style={{ height: 12, backgroundColor: colors.borderSubtle, borderRadius: 6, width: '80%' }} />
          </View>

          {/* Verification Overlay */}
          {(step > 0 || loading) && (
            <Animated.View
              entering={ZoomIn.duration(400)}
              style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(255,255,255,0.85)',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              {step === 3 ? (
                <View style={{ alignItems: 'center' }}>
                  <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#DCFCE7', justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
                    <Ionicons name="checkmark" size={32} color="#16A34A" />
                  </View>
                  <Text style={{ fontFamily: fonts.medium, fontSize: 14, color: '#16A34A' }}>Verified</Text>
                </View>
              ) : (
                <View style={{ alignItems: 'center' }}>
                  <Animated.View style={pulseStyle}>
                    <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: colors.primaryMuted, justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
                      <Ionicons name="sync-outline" size={24} color={colors.primary} />
                    </View>
                  </Animated.View>
                  <Text style={{ fontFamily: fonts.medium, fontSize: 13, color: colors.primary }}>
                    Syncing...
                  </Text>
                </View>
              )}
            </Animated.View>
          )}
        </View>

        {syncStatus && (
          <Text style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.caption, textAlign: 'center', marginTop: 24 }}>
            {syncStatus}
          </Text>
        )}
      </Animated.View>
    </View>
  );
}
