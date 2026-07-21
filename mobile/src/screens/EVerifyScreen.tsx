import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function EVerifyScreen() {
  const { checkSession } = useAuth();
  const [loading, setLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [step, setStep] = useState(0);

  const handleVerify = async () => {
    try {
      setLoading(true);
      setStep(1);
      setSyncStatus('Connecting to PhilSys eVerify gateway...');
      await new Promise(r => setTimeout(r, 1000));
      
      setStep(2);
      setSyncStatus('Matching identity records & validation...');
      const res = await client.post('/verify/philsys', { philSysCardNumber: '1234-5678-9012', userConsent: true });

      if (res.data.success) {
        setStep(3);
        setSyncStatus(`Identity Verified (Ref: ${res.data.everifyRefId || 'EVERIFY-OK'})`);
        await new Promise(r => setTimeout(r, 800));
        await checkSession();
      } else {
        Alert.alert('Verification Failed', res.data.message || 'eVerify check failed.');
      }
    } catch (err: any) {
      console.error('eVerify error:', err);
      const msg = err.response?.data?.message || err.message || 'Error connecting to eVerify service.';
      Alert.alert('eVerify Error', msg);
    } finally {
      setLoading(false);
      setStep(0);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', backgroundColor: '#FFFFFF', padding: 32 }}>
      <Animated.View entering={FadeInDown.duration(600)} style={{ alignItems: 'center', marginBottom: 40 }}>
        <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 26, color: '#1A1A1A', marginBottom: 8, textAlign: 'center' }}>
          PhilSys eVerify
        </Text>
        <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: '#4A4A4A', textAlign: 'center', lineHeight: 20 }}>
          Syncing your verified government identity from eGovPH...
        </Text>
      </Animated.View>
      
      {/* PhilSys Card Graphic */}
      <Animated.View entering={FadeInDown.delay(150).duration(600)} style={{ marginBottom: 48 }}>
        <View style={{
          backgroundColor: '#FFFFFF',
          borderWidth: 1,
          borderColor: '#E2E5F0',
          borderRadius: 18,
          padding: 24,
          alignItems: 'center',
          shadowColor: '#1740DE',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 4,
          overflow: 'hidden',
        }}>
          {/* Top flag accent */}
          <View style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            flexDirection: 'row',
          }}>
            <View style={{ flex: 1, backgroundColor: '#1740DE' }} />
            <View style={{ flex: 1, backgroundColor: '#E63B27' }} />
            <View style={{ flex: 1, backgroundColor: '#FCD116' }} />
          </View>

          <View style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: '#EFF1FD',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 16,
            marginTop: 8,
          }}>
            <Ionicons name="id-card" size={32} color="#1740DE" />
          </View>
          
          <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 18, color: '#1A1A1A', marginBottom: 4 }}>
            Philippine National ID
          </Text>
          <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 13, color: '#6B7280', marginBottom: 20, letterSpacing: 1.5 }}>
            •••• •••• 9012
          </Text>

          {syncStatus && (
            <Animated.View entering={ZoomIn.duration(400)} style={{
              backgroundColor: step === 3 ? '#F0FDF4' : '#EFF1FD',
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderRadius: 12,
              width: '100%',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}>
              {step === 3 ? (
                <Ionicons name="checkmark-circle" size={16} color="#16A34A" />
              ) : (
                <ActivityIndicator size="small" color="#1740DE" />
              )}
              <Text style={{
                fontFamily: 'Inter_500Medium',
                fontSize: 12,
                color: step === 3 ? '#16A34A' : '#1740DE',
                textAlign: 'center',
              }}>
                {syncStatus}
              </Text>
            </Animated.View>
          )}
        </View>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(300).duration(600)}>
        <TouchableOpacity 
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
          onPress={handleVerify}
          disabled={loading}
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
                Sync PhilSys Identity
              </Text>
            </>
          )}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}
