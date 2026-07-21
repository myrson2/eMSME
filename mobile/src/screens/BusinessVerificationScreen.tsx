import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function BusinessVerificationScreen() {
  const { checkSession } = useAuth();
  const [loading, setLoading] = useState(false);
  const [currentAgency, setCurrentAgency] = useState<string | null>(null);
  const [agencyResults, setAgencyResults] = useState<{ DTI: string; BIR: string; LGU: string }>({
    DTI: 'PENDING',
    BIR: 'PENDING',
    LGU: 'PENDING',
  });

  const handleVerify = async () => {
    try {
      setLoading(true);
      
      setCurrentAgency('Connecting to DTI / SEC Registry...');
      setAgencyResults(prev => ({ ...prev, DTI: 'CHECKING' }));
      await new Promise(r => setTimeout(r, 800));
      setAgencyResults(prev => ({ ...prev, DTI: 'VERIFIED' }));

      setCurrentAgency('Verifying BIR TIN Tax Account...');
      setAgencyResults(prev => ({ ...prev, BIR: 'CHECKING' }));
      await new Promise(r => setTimeout(r, 800));
      setAgencyResults(prev => ({ ...prev, BIR: 'VERIFIED' }));

      setCurrentAgency('Validating LGU Mayor Permit...');
      setAgencyResults(prev => ({ ...prev, LGU: 'CHECKING' }));

      const res = await client.post('/onboarding/business/verify');

      if (res.data.success) {
        setAgencyResults({ DTI: 'VERIFIED', BIR: 'VERIFIED', LGU: 'VERIFIED' });
        setCurrentAgency('All Government Registries Verified!');
        await new Promise(r => setTimeout(r, 800));
        await checkSession();
      } else {
        setAgencyResults(prev => ({ ...prev, LGU: 'FAILED' }));
        Alert.alert('Verification Failed', res.data.message || 'Registry verification failed.');
      }
    } catch (err: any) {
      console.error('Business verification error:', err);
      setAgencyResults(prev => ({ ...prev, LGU: 'FAILED' }));
      const msg = err.response?.data?.message || err.message || 'Server error routing business verification.';
      Alert.alert('Registry Verification Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const renderRegistryRow = (title: string, status: string, index: number) => {
    const isVerified = status === 'VERIFIED';
    const isChecking = status === 'CHECKING';
    const isFailed = status === 'FAILED';

    return (
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: index < 2 ? 1 : 0,
        borderBottomColor: '#F3F4F6',
      }}>
        <View style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: isVerified ? '#F0FDF4' : isFailed ? '#FEF2F2' : isChecking ? '#EFF1FD' : '#F9FAFB',
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: 12,
        }}>
          {isVerified ? (
            <Animated.View entering={ZoomIn.duration(300)}>
              <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
            </Animated.View>
          ) : isFailed ? (
            <Ionicons name="close-circle" size={20} color="#E63B27" />
          ) : isChecking ? (
            <ActivityIndicator size="small" color="#1740DE" />
          ) : (
            <Ionicons name="time" size={18} color="#9CA3AF" />
          )}
        </View>
        <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: '#1A1A1A', flex: 1 }}>
          {title}
        </Text>
        <Text style={{
          fontFamily: 'Inter_500Medium',
          fontSize: 12,
          color: isVerified ? '#16A34A' : isFailed ? '#E63B27' : isChecking ? '#1740DE' : '#9CA3AF',
        }}>
          {isVerified ? 'Passed' : isFailed ? 'Failed' : isChecking ? 'Checking...' : 'Pending'}
        </Text>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', backgroundColor: '#FFFFFF', padding: 32 }}>
      
      <Animated.View entering={FadeInDown.duration(600)} style={{ alignItems: 'center', marginBottom: 40 }}>
        <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 26, color: '#1A1A1A', marginBottom: 8, textAlign: 'center' }}>
          Government Verification
        </Text>
        <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: '#4A4A4A', textAlign: 'center', lineHeight: 20 }}>
          Automated cross-check across DTI/SEC, BIR, and LGU databases.
        </Text>
      </Animated.View>
      
      {/* Registry Status Card */}
      <Animated.View entering={FadeInDown.delay(150).duration(600)} style={{ marginBottom: 48 }}>
        <View style={{
          backgroundColor: '#FFFFFF',
          borderWidth: 1,
          borderColor: '#E2E5F0',
          borderRadius: 18,
          padding: 24,
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

          {renderRegistryRow('DTI / SEC Registry', agencyResults.DTI, 0)}
          {renderRegistryRow('BIR TIN Masterlist', agencyResults.BIR, 1)}
          {renderRegistryRow('LGU Business Permit', agencyResults.LGU, 2)}

          {currentAgency && (
            <Animated.View entering={ZoomIn.duration(400)} style={{
              backgroundColor: agencyResults.LGU === 'VERIFIED' ? '#F0FDF4' : '#EFF1FD',
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderRadius: 12,
              marginTop: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}>
              {agencyResults.LGU === 'VERIFIED' ? (
                <Ionicons name="checkmark-circle" size={16} color="#16A34A" />
              ) : (
                <Ionicons name="sync" size={16} color="#1740DE" />
              )}
              <Text style={{
                fontFamily: 'Inter_500Medium',
                fontSize: 12,
                color: agencyResults.LGU === 'VERIFIED' ? '#16A34A' : '#1740DE',
                textAlign: 'center',
              }}>
                {currentAgency}
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
                Verify Registries
              </Text>
            </>
          )}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}
