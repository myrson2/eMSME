import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

WebBrowser.maybeCompleteAuthSession();

type ScanState = 'consent' | 'loading' | 'scanning' | 'processing' | 'success' | 'failed';

export default function FaceLivenessScreen() {
  const { checkSession } = useAuth();
  const [scanState, setScanState] = useState<ScanState>('consent');
  const [statusMsg, setStatusMsg] = useState('');
  const [livenessScore, setLivenessScore] = useState<number | null>(null);

  // In Expo Go: exp://... In standalone APK: emsme://facial/callback
  const callbackUri = makeRedirectUri({ scheme: 'emsme', path: 'facial/callback' });

  const startLivenessFlow = useCallback(async () => {
    try {
      setScanState('loading');
      setStatusMsg('Initializing liveness session...');

      // Step 1: Create session on backend (backend calls eFacial API)
      const sessionRes = await client.post('/verify/face-liveness/session', {
        callbackUrl: callbackUri,
        userConsent: true,
      });

      const { sessionToken, livenessUrl, isStaging } = sessionRes.data;

      if (isStaging || !livenessUrl) {
        // Demo mode: skip browser entirely, simulate an in-app scan
        console.warn('[eFacial] Staging/bypass — simulating in-app face scan for demo.');
        setScanState('scanning');
        setStatusMsg('Analyzing facial features...');

        // Simulate scan phases for a realistic demo feel
        await new Promise(r => setTimeout(r, 1500));
        setStatusMsg('Checking liveness...');
        await new Promise(r => setTimeout(r, 1200));
        setStatusMsg('Matching biometric profile...');
        await new Promise(r => setTimeout(r, 1000));

        setScanState('processing');
        setStatusMsg('Verifying liveness result...');
        await fetchResult(sessionToken);
        return;
      }

      // Step 2: Open the eFacial web liveness UI
      setScanState('scanning');
      setStatusMsg('Complete the face scan in the browser window...');
      console.log('[eFacial] Opening liveness URL:', livenessUrl);

      const result = await WebBrowser.openAuthSessionAsync(livenessUrl, callbackUri, {
        showInRecents: true,
      });

      console.log('[eFacial] Browser result type:', result.type);

      // Step 3: Parse session token from redirect callback
      let tokenFromRedirect: string | null = null;

      if (result.type === 'success' && result.url) {
        const url = new URL(result.url);
        tokenFromRedirect = url.searchParams.get('token') || url.searchParams.get('session_token');
        console.log('[eFacial] Token from redirect:', tokenFromRedirect);
      }

      // Use redirect token if captured, otherwise use session token from step 1
      const finalToken = tokenFromRedirect || sessionToken;

      setScanState('processing');
      setStatusMsg('Verifying liveness result...');
      await fetchResult(finalToken);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Session initialization failed.';
      setScanState('failed');
      setStatusMsg(msg);
    }
  }, [callbackUri]);

  const fetchResult = async (sessionToken: string) => {
    try {
      const res = await client.post('/verify/face-liveness/result', { sessionToken });

      if (res.data.success) {
        setLivenessScore(res.data.livenessScore);
        setScanState('success');
        setStatusMsg(`Verified! Confidence: ${res.data.livenessScore?.toFixed(1)}%`);
        // Wait a moment so user sees the success state, then advance
        await new Promise(r => setTimeout(r, 1200));
        await checkSession();
      } else {
        setScanState('failed');
        setStatusMsg(res.data.message || 'Liveness check did not pass. Please retry.');
      }
    } catch (err: any) {
      const reason = err?.response?.data?.reason;
      const msg = err?.response?.data?.message || 'Verification error. Please retry.';
      setScanState('failed');
      setStatusMsg(
        reason === 'SPOOF_DETECTED'
          ? 'Confidence score too low. Please retry in good lighting.'
          : msg
      );
    }
  };

  const handleRetry = () => {
    setScanState('consent');
    setStatusMsg('');
    setLivenessScore(null);
  };

  // ─── Consent Screen ───────────────────────────────────────────────
  if (scanState === 'consent') {
    return (
      <View style={styles.container}>
        <Animated.View entering={FadeInDown.duration(600)} style={styles.iconWrap}>
          <View style={styles.iconCircle}>
            <Ionicons name="shield-checkmark" size={36} color="#1740DE" />
          </View>
          <Text style={styles.title}>Facial Liveness Check</Text>
          <Text style={styles.subtitle}>
            Under <Text style={styles.bold}>RA 10173 (Data Privacy Act)</Text>, we need your consent to run a live facial verification through the eGovPH biometrics portal.
          </Text>
          <Text style={styles.note}>
            Your face data is processed on the eGovPH secure server only and is never stored by eMSME.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(300).duration(600)} style={styles.btnWrap}>
          <TouchableOpacity onPress={startLivenessFlow} activeOpacity={0.85} style={styles.btn}>
            <Ionicons name="shield-checkmark" size={20} color="#FCD116" />
            <Text style={styles.btnText}>I Consent — Start Scan</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  // ─── Loading / Processing Screen ─────────────────────────────────
  if (scanState === 'loading' || scanState === 'scanning' || scanState === 'processing') {
    return (
      <View style={styles.container}>
        <Animated.View entering={FadeInDown.duration(400)} style={{ alignItems: 'center', gap: 24 }}>
          <View style={[styles.iconCircle, scanState === 'scanning' && { width: 100, height: 100, borderRadius: 50, backgroundColor: '#EFF1FD' }]}>
            {scanState === 'scanning' ? (
              <Ionicons name="person-circle" size={60} color="#1740DE" />
            ) : (
              <ActivityIndicator size="large" color="#1740DE" />
            )}
          </View>
          <Text style={styles.title}>
            {scanState === 'loading' ? 'Preparing Session...' :
             scanState === 'scanning' ? 'Scanning Face...' :
             'Verifying Result...'}
          </Text>
          <Text style={styles.subtitle}>{statusMsg}</Text>
          {scanState === 'scanning' && (
            <>
              <ActivityIndicator color="#1740DE" />
              <Text style={styles.note}>
                Please hold still. This will only take a moment.
              </Text>
            </>
          )}
        </Animated.View>
      </View>
    );
  }

  // ─── Success Screen ───────────────────────────────────────────────
  if (scanState === 'success') {
    return (
      <View style={styles.container}>
        <Animated.View entering={FadeInDown.duration(500)} style={{ alignItems: 'center', gap: 20 }}>
          <View style={[styles.iconCircle, { backgroundColor: '#DCFCE7' }]}>
            <Ionicons name="checkmark-circle" size={48} color="#16A34A" />
          </View>
          <Text style={[styles.title, { color: '#16A34A' }]}>Liveness Verified!</Text>
          {livenessScore !== null && (
            <View style={styles.scoreBadge}>
              <Ionicons name="shield-checkmark" size={16} color="#1740DE" />
              <Text style={styles.scoreText}>Confidence Score: {livenessScore.toFixed(1)}%</Text>
            </View>
          )}
          <Text style={styles.subtitle}>Proceeding to next step...</Text>
          <ActivityIndicator color="#1740DE" />
        </Animated.View>
      </View>
    );
  }

  // ─── Failed Screen ────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInDown.duration(500)} style={{ alignItems: 'center', gap: 20 }}>
        <View style={[styles.iconCircle, { backgroundColor: '#FEE2E2' }]}>
          <Ionicons name="close-circle" size={48} color="#E63B27" />
        </View>
        <Text style={[styles.title, { color: '#E63B27' }]}>Verification Failed</Text>
        <Text style={styles.subtitle}>{statusMsg}</Text>

        <TouchableOpacity onPress={handleRetry} activeOpacity={0.85} style={styles.btn}>
          <Ionicons name="refresh" size={20} color="#FCD116" />
          <Text style={styles.btnText}>Try Again</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  iconWrap: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EFF1FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 24,
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#4A4A4A',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
  bold: {
    fontFamily: 'Inter_500Medium',
  },
  note: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  btnWrap: {
    width: '100%',
  },
  btn: {
    backgroundColor: '#1740DE',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(252, 209, 22, 0.4)',
  },
  btnText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    color: '#FFFFFF',
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF1FD',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  scoreText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#1740DE',
  },
});
