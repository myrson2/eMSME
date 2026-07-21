import React from 'react';
import { View, Text, TouchableOpacity, StatusBar } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
  const { login } = useAuth();

  const handleLogin = async () => {
    await login('mock_sso_code');
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#1740DE' }}>
      <StatusBar barStyle="light-content" />

      {/* Top — Branding area */}
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 }}>
        <Animated.View entering={FadeInDown.delay(100).duration(600)} style={{ alignItems: 'center' }}>
          {/* Philippine sun motif */}
          <View style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: 'rgba(255,255,255,0.15)',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 24,
          }}>
            <Ionicons name="sunny" size={42} color="#FCD116" />
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

        <TouchableOpacity
          onPress={handleLogin}
          activeOpacity={0.85}
          style={{
            backgroundColor: '#1740DE',
            borderRadius: 12,
            paddingVertical: 16,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 10,
            borderWidth: 1,
            borderColor: 'rgba(252, 209, 22, 0.4)',
          }}
        >
          <Ionicons name="shield-checkmark" size={20} color="#FCD116" />
          <Text style={{
            fontFamily: 'Poppins_600SemiBold',
            fontSize: 15,
            color: '#FFFFFF',
          }}>
            Log in using eGovPH
          </Text>
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
    </View>
  );
}
