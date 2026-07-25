import React, { useState, useCallback } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import Animated from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useSpringEntrance, useBreathingPulse } from '../lib/animations';
import { colors, text, spacing, radius, fonts } from '../lib/theme';
import PressableButton from '../components/ui/PressableButton';
import * as Haptics from 'expo-haptics';

WebBrowser.maybeCompleteAuthSession();

type ScanState = 'consent' | 'loading' | 'scanning' | 'processing' | 'success' | 'failed';

export default function FaceLivenessScreen() {
  const { checkSession } = useAuth();
  const [scanState, setScanState] = useState<ScanState>('consent');
  const [statusMsg, setStatusMsg] = useState('');
  const [livenessScore, setLivenessScore] = useState<number | null>(null);

  const entranceStyle = useSpringEntrance({ delay: 0, distance: 16 });
  const pulseStyle = useBreathingPulse({ minOpacity: 0.3, maxOpacity: 1, duration: 1200 });

  const callbackUri = makeRedirectUri({ scheme: 'emsme', path: 'facial/callback' });

  const startLivenessFlow = useCallback(async () => {
    try {
      setScanState('loading');
      setStatusMsg('Initializing liveness session...');

      const sessionRes = await client.post('/verify/face-liveness/session', {
        callbackUrl: callbackUri,
        userConsent: true,
      });

      const { sessionToken, livenessUrl, isStaging } = sessionRes.data;

      if (isStaging || !livenessUrl) {
        setScanState('scanning');
        setStatusMsg('Analyzing facial features...');
        await new Promise((r) => setTimeout(r, 1500));
        setStatusMsg('Checking liveness...');
        await new Promise((r) => setTimeout(r, 1200));
        setStatusMsg('Matching biometric profile...');
        await new Promise((r) => setTimeout(r, 1000));

        setScanState('processing');
        setStatusMsg('Verifying liveness result...');
        await fetchResult(sessionToken);
        return;
      }

      setScanState('scanning');
      setStatusMsg('Complete the face scan in the browser window...');

      const result = await WebBrowser.openAuthSessionAsync(livenessUrl, callbackUri, {
        showInRecents: true,
      });

      let tokenFromRedirect: string | null = null;
      if (result.type === 'success' && result.url) {
        const url = new URL(result.url);
        tokenFromRedirect = url.searchParams.get('token') || url.searchParams.get('session_token');
      }

      const finalToken = tokenFromRedirect || sessionToken;
      setScanState('processing');
      setStatusMsg('Verifying liveness result...');
      await fetchResult(finalToken);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Session initialization failed.';
      setScanState('failed');
      setStatusMsg(msg);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [callbackUri]);

  const fetchResult = async (sessionToken: string) => {
    try {
      const res = await client.post('/verify/face-liveness/result', { sessionToken });
      if (res.data.success) {
        setLivenessScore(res.data.livenessScore);
        setScanState('success');
        setStatusMsg(`Verified! Confidence: ${res.data.livenessScore?.toFixed(1)}%`);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await new Promise((r) => setTimeout(r, 1200));
        await checkSession();
      } else {
        setScanState('failed');
        setStatusMsg(res.data.message || 'Liveness check did not pass. Please retry.');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (err: any) {
      const reason = err?.response?.data?.reason;
      const msg = err?.response?.data?.message || 'Verification error. Please retry.';
      setScanState('failed');
      setStatusMsg(reason === 'SPOOF_DETECTED' ? 'Confidence score too low. Please retry in good lighting.' : msg);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleRetry = () => {
    setScanState('consent');
    setStatusMsg('');
    setLivenessScore(null);
  };

  const renderIcon = () => {
    if (scanState === 'consent') return <Ionicons name="shield-checkmark-outline" size={32} color={colors.primary} />;
    if (scanState === 'scanning') return <Ionicons name="scan-outline" size={36} color={colors.primary} />;
    if (scanState === 'success') return <Ionicons name="checkmark" size={36} color="#16A34A" />;
    if (scanState === 'failed') return <Ionicons name="close" size={36} color={colors.signal} />;
    return <Ionicons name="sync-outline" size={32} color={colors.primary} />;
  };

  const bgColors: Record<ScanState, string> = {
    consent: colors.primaryMuted,
    loading: colors.primaryMuted,
    scanning: colors.primaryMuted,
    processing: colors.primaryMuted,
    success: '#DCFCE7',
    failed: colors.signalMuted,
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface, justifyContent: 'center', padding: spacing.xl }}>
      <Animated.View style={[{ alignItems: 'center' }, entranceStyle]}>
        {scanState === 'scanning' || scanState === 'loading' || scanState === 'processing' ? (
          <Animated.View style={pulseStyle}>
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 24,
                backgroundColor: bgColors[scanState],
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 24,
              }}
            >
              {renderIcon()}
            </View>
          </Animated.View>
        ) : (
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 24,
              backgroundColor: bgColors[scanState],
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 24,
            }}
          >
            {renderIcon()}
          </View>
        )}

        <Text style={[text.h2, { color: colors.ink, marginBottom: 12, textAlign: 'center' }]}>
          {scanState === 'consent' ? 'Facial liveness check' :
           scanState === 'loading' ? 'Preparing session...' :
           scanState === 'scanning' ? 'Scanning face...' :
           scanState === 'processing' ? 'Verifying result...' :
           scanState === 'success' ? 'Liveness verified!' :
           'Verification failed'}
        </Text>

        {scanState === 'consent' ? (
          <>
            <Text style={[text.body, { color: colors.body, textAlign: 'center', marginBottom: 16 }]}>
              Under <Text style={{ fontFamily: fonts.medium, color: colors.ink }}>RA 10173 (Data Privacy Act)</Text>, we need your consent to run a live facial verification through the eGovPH biometrics portal.
            </Text>
            <Text style={[text.caption, { color: colors.caption, textAlign: 'center', marginBottom: 40 }]}>
              Your face data is processed on the eGovPH secure server only and is never stored by eMSME.
            </Text>
            <PressableButton
              onPress={startLivenessFlow}
              label="I consent — start scan"
              icon="shield-checkmark-outline"
              variant="primary"
              size="lg"
            />
          </>
        ) : scanState === 'failed' ? (
          <>
            <Text style={[text.body, { color: colors.body, textAlign: 'center', marginBottom: 40 }]}>
              {statusMsg}
            </Text>
            <PressableButton
              onPress={handleRetry}
              label="Try again"
              icon="refresh-outline"
              variant="secondary"
              size="lg"
            />
          </>
        ) : (
          <>
            <Text style={[text.body, { color: colors.body, textAlign: 'center', marginBottom: 24 }]}>
              {statusMsg}
            </Text>
            {livenessScore !== null && scanState === 'success' && (
              <View style={{ backgroundColor: colors.primaryMuted, paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.sm, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="shield-checkmark-outline" size={14} color={colors.primary} />
                <Text style={{ fontFamily: fonts.medium, fontSize: 13, color: colors.primary }}>
                  Confidence: {livenessScore.toFixed(1)}%
                </Text>
              </View>
            )}
            {(scanState === 'loading' || scanState === 'scanning' || scanState === 'processing') && (
              <ActivityIndicator color={colors.primary} />
            )}
          </>
        )}
      </Animated.View>
    </View>
  );
}
