import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StatusBar, Alert, ActivityIndicator } from 'react-native';
import Animated, { FadeInDown, FadeInUp, useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { useEGovAuth } from '../hooks/useEGovAuth';

const PulsingRing = ({ delay, size, filled }: { delay: number; size: number; filled?: boolean }) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(filled ? 0.08 : 0.25);

  useEffect(() => {
    const timeout = setTimeout(() => {
      scale.value = withRepeat(
        withTiming(1.35, { duration: 3500, easing: Easing.inOut(Easing.sin) }),
        -1,
        true
      );
      opacity.value = withRepeat(
        withTiming(filled ? 0.02 : 0.08, { duration: 3500, easing: Easing.inOut(Easing.sin) }),
        -1,
        true
      );
    }, delay);
    return () => clearTimeout(timeout);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: filled ? 0 : 1.5,
          borderColor: '#FCD116',
          backgroundColor: filled ? 'rgba(252, 209, 22, 0.35)' : 'transparent',
        },
        animatedStyle,
      ]}
    />
  );
};

export default function LoginScreen() {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCodeReceived = async (code: string) => {
    try {
      setLoading(true);
      setErrorMsg(null);
      await login(code);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Login failed. Please try again.';
      setErrorMsg(msg);
      Alert.alert('Login Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const { startAuthFlow, isReady } = useEGovAuth(handleCodeReceived);

  const handleLogin = () => {
    setErrorMsg(null);
    if (isReady) {
      startAuthFlow();
    } else {
      // Fallback for when eGovPH client ID is not yet configured — useful for demo
      Alert.alert(
        'eGovPH Not Configured',
        'Set EXPO_PUBLIC_EGOV_CLIENT_ID and EXPO_PUBLIC_EGOV_AUTH_URL in mobile/.env to enable live SSO.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <LinearGradient colors={['#1740DE', '#0A227A']} style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" />

      {/* Top — Branding area */}
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 }}>
        <Animated.View entering={FadeInDown.delay(100).duration(600)} style={{ alignItems: 'center' }}>
          {/* Philippine sun motif with pulsing glow */}
          <View style={{ alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
            <PulsingRing delay={0} size={110} filled />
            <PulsingRing delay={0} size={130} />
            <PulsingRing delay={1500} size={170} />
            <PulsingRing delay={3000} size={210} />
            <View style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: 'rgba(255,255,255,0.15)',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <Ionicons name="sunny" size={42} color="#FCD116" />
            </View>
          </View>

          <Text style={{
            fontFamily: 'Poppins_700Bold',
            fontSize: 42,
            color: '#FFFFFF',
            letterSpacing: 1,
          }}>
            eMSME
          </Text>
          <Text style={{
            fontFamily: 'Inter_400Regular',
            fontSize: 15,
            color: 'rgba(255,255,255,0.75)',
            marginTop: 4,
          }}>
            eGovPH Service Module
          </Text>
        </Animated.View>
      </View>

      {/* Bottom — Login card */}
      <Animated.View
        entering={FadeInUp.delay(300).duration(600)}
        style={{
          backgroundColor: '#FFFFFF',
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          paddingHorizontal: 32,
          paddingTop: 40,
          paddingBottom: 48,
          overflow: 'hidden',
        }}
      >
        {/* eGovPH flag accent bar */}
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 6,
          flexDirection: 'row',
        }}>
          <View style={{ flex: 1, backgroundColor: '#1740DE' }} />
          <View style={{ flex: 1, backgroundColor: '#E63B27' }} />
          <View style={{ flex: 1, backgroundColor: '#FCD116' }} />
        </View>

        <Text style={{
          fontFamily: 'Poppins_700Bold',
          fontSize: 22,
          color: '#1A1A1A',
          marginBottom: 8,
        }}>
          Mag-login
        </Text>
        <Text style={{
          fontFamily: 'Inter_400Regular',
          fontSize: 14,
          color: '#4A4A4A',
          marginBottom: 28,
          lineHeight: 20,
        }}>
          Gamitin ang iyong eGovPH account para i-access ang MSME financial services.
        </Text>

        {errorMsg && (
          <View style={{
            backgroundColor: '#FEF2F2',
            borderRadius: 10,
            padding: 12,
            marginBottom: 16,
            flexDirection: 'row',
            gap: 8,
            alignItems: 'center',
          }}>
            <Ionicons name="warning" size={16} color="#E63B27" />
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: '#E63B27', flex: 1 }}>
              {errorMsg}
            </Text>
          </View>
        )}

        <TouchableOpacity
          onPress={handleLogin}
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
              <Text style={{
                fontFamily: 'Poppins_600SemiBold',
                fontSize: 15,
                color: '#FFFFFF',
              }}>
                Log in using eGovPH
              </Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={{
          fontFamily: 'Inter_400Regular',
          fontSize: 12,
          color: '#9CA3AF',
          textAlign: 'center',
          marginTop: 20,
        }}>
          Powered by eGovPH  •  Secured with eVerify
        </Text>
      </Animated.View>
    </LinearGradient>
  );
}
