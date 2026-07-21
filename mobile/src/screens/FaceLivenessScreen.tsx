import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import Animated, { FadeInDown, FadeInUp, useAnimatedStyle, withRepeat, withTiming, useSharedValue } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function FaceLivenessScreen() {
  const { checkSession } = useAuth();
  const [isScanning, setIsScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scanStatus, setScanStatus] = useState<string | null>(null);

  // Simple pulsing animation for the scanning frame
  const pulse = useSharedValue(1);
  useEffect(() => {
    if (isScanning) {
      pulse.value = withRepeat(withTiming(1.05, { duration: 1000 }), -1, true);
    } else {
      pulse.value = withTiming(1);
    }
  }, [isScanning]);

  const animatedFrameStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }]
  }));

  const handleVerify = async () => {
    try {
      setIsScanning(true);
      setScanStatus('Aligning face within frame...');
      
      await new Promise(r => setTimeout(r, 1000));
      setScanStatus('Blink slowly to confirm liveness...');
      
      await new Promise(r => setTimeout(r, 1200));
      setScanStatus('Processing biometric liveness score...');
      setLoading(true);

      const res = await client.post('/verify/face-liveness', { faceBase64: 'dummy_biometric_frame' });
      if (res.data.success) {
        setScanStatus('Liveness Verified (95% match)');
        await new Promise(r => setTimeout(r, 800));
        await checkSession();
      } else {
        Alert.alert('Verification Failed', res.data.message || 'Liveness check failed.');
      }
    } catch (err: any) {
      console.error('Face liveness error:', err);
      const msg = err.response?.data?.message || err.message || 'Network error during facial scan.';
      Alert.alert('Scan Failed', msg);
    } finally {
      setIsScanning(false);
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 32 }}>
      
      <Animated.View entering={FadeInDown.duration(600)} style={{ alignItems: 'center', marginBottom: 40 }}>
        <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 26, color: '#1A1A1A', marginBottom: 8, textAlign: 'center' }}>
          Facial Liveness Check
        </Text>
        <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: '#4A4A4A', textAlign: 'center', lineHeight: 20 }}>
          Confirm your identity for PhilSys biometric matching.
        </Text>
      </Animated.View>
      
      {/* Biometric Camera Frame Simulation */}
      <Animated.View entering={FadeInDown.delay(150).duration(600)} style={[{ marginBottom: 48 }, animatedFrameStyle]}>
        <View style={{
          width: 220,
          height: 280,
          borderWidth: 3,
          borderStyle: 'dashed',
          borderColor: isScanning ? '#1740DE' : '#E2E5F0',
          borderRadius: 110,
          backgroundColor: isScanning ? '#EFF1FD' : '#F9FAFB',
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'hidden',
        }}>
          {isScanning ? (
            <View style={{ alignItems: 'center', padding: 16 }}>
              {loading ? (
                <Ionicons name="checkmark-circle" size={48} color="#16A34A" style={{ marginBottom: 16 }} />
              ) : (
                <ActivityIndicator size="large" color="#1740DE" style={{ marginBottom: 16 }} />
              )}
              <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: '#1740DE', textAlign: 'center' }}>
                {scanStatus}
              </Text>
            </View>
          ) : (
            <View style={{ alignItems: 'center', padding: 16 }}>
              <Ionicons name="person" size={64} color="#C8CBD2" style={{ marginBottom: 16 }} />
              <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 13, color: '#6B7280', textAlign: 'center' }}>
                Position your face inside the frame
              </Text>
            </View>
          )}
        </View>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(300).duration(600)} style={{ width: '100%' }}>
        <TouchableOpacity 
          style={{
            backgroundColor: (isScanning || loading) ? '#EFF1FD' : '#1740DE',
            borderRadius: 12,
            paddingVertical: 16,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 10,
            borderWidth: 1,
            borderColor: (isScanning || loading) ? 'transparent' : 'rgba(252, 209, 22, 0.4)',
          }}
          onPress={handleVerify}
          disabled={isScanning || loading}
        >
          {loading ? (
            <ActivityIndicator color="#1740DE" />
          ) : (
            <>
              <Ionicons 
                name={isScanning ? "scan" : "shield-checkmark"} 
                size={20} 
                color={isScanning ? "#1740DE" : "#FCD116"} 
              />
              <Text style={{
                fontFamily: 'Poppins_600SemiBold',
                fontSize: 15,
                color: (isScanning || loading) ? '#1740DE' : '#FFFFFF',
              }}>
                {isScanning ? 'Scanning in progress...' : 'Start Facial Scan'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}
