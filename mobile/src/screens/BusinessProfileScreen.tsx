import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function BusinessProfileScreen() {
  const { checkSession } = useAuth();
  const [businessName, setBusinessName] = useState('Dela Cruz General Trading');
  const [businessType, setBusinessType] = useState('Sole Proprietorship');
  const [registrationNumber, setRegistrationNumber] = useState('DTI-REG-99120');
  const [birTin, setBirTin] = useState('123-456-789-000');
  const [lguPermitNumber, setLguPermitNumber] = useState('MAYOR-PERMIT-2026-99');
  const [industry, setIndustry] = useState('Retail & Wholesale');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!businessName || !registrationNumber || !birTin) {
      Alert.alert('Missing Fields', 'Please complete Business Name, DTI/SEC Reg No., and BIR TIN.');
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
        Alert.alert('Save Failed', res.data.message || 'Failed to save business profile.');
      }
    } catch (err: any) {
      console.error('Business profile error:', err);
      const msg = err.response?.data?.message || err.message || 'Server error saving business profile.';
      Alert.alert('Profile Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (label: string, value: string, setValue: (val: string) => void, placeholder: string) => (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 11, color: '#6B7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {label}
      </Text>
      <TextInput 
        style={{
          borderWidth: 1,
          borderColor: '#E2E5F0',
          borderRadius: 12,
          paddingHorizontal: 16,
          paddingVertical: 14,
          fontFamily: 'Inter_400Regular',
          fontSize: 14,
          color: '#1A1A1A',
          backgroundColor: '#F9FAFB',
        }}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        value={value}
        onChangeText={setValue}
      />
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 32, paddingTop: 60, paddingBottom: 60 }}>
        
        <Animated.View entering={FadeInDown.duration(600)} style={{ marginBottom: 32 }}>
          <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 26, color: '#1A1A1A', marginBottom: 8 }}>
            Business Profile
          </Text>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: '#4A4A4A', lineHeight: 20 }}>
            Register your MSME credentials to unlock funding eligibility.
          </Text>
        </Animated.View>
        
        <Animated.View entering={FadeInDown.delay(150).duration(600)}>
          {renderInput('Business Name', businessName, setBusinessName, 'Business Name')}
          {renderInput('Business Type', businessType, setBusinessType, 'Sole Proprietorship / Corporation')}
          {renderInput('DTI / SEC Registration No.', registrationNumber, setRegistrationNumber, 'DTI-REG-XXXXXX')}
          {renderInput('BIR TIN Number', birTin, setBirTin, 'XXX-XXX-XXX-000')}
          {renderInput('LGU Mayor Permit No.', lguPermitNumber, setLguPermitNumber, 'MAYOR-PERMIT-2026-XX')}
          {renderInput('Industry Category', industry, setIndustry, 'e.g. Retail, Food')}
        </Animated.View>
        
        <Animated.View entering={FadeInUp.delay(300).duration(600)} style={{ marginTop: 24 }}>
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
            onPress={handleSubmit}
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
                  Save & Continue
                </Text>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
