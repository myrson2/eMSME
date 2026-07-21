import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function FinancialsScreen() {
  const { checkSession } = useAuth();
  const [monthlyRevenue, setMonthlyRevenue] = useState('150000');
  const [totalAssets, setTotalAssets] = useState('500000');
  const [totalLiabilities, setTotalLiabilities] = useState('50000');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const rev = parseFloat(monthlyRevenue);
    if (!rev || rev <= 0) {
      Alert.alert('Invalid Input', 'Please enter a valid monthly revenue.');
      return;
    }

    try {
      setLoading(true);
      const res = await client.post('/onboarding/financials', {
        monthlyRevenue: rev,
        annualIncome: rev * 12,
        totalAssets: parseFloat(totalAssets) || 0,
        totalLiabilities: parseFloat(totalLiabilities) || 0,
        existingLoans: [],
      });

      if (res.data.success) {
        await checkSession();
      } else {
        Alert.alert('Save Failed', res.data.message || 'Failed to submit financials.');
      }
    } catch (err: any) {
      console.error('Financials error:', err);
      const msg = err.response?.data?.message || err.message || 'Server error submitting financial snapshot.';
      Alert.alert('Submission Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (label: string, value: string, setValue: (val: string) => void, placeholder: string) => (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 11, color: '#6B7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {label}
      </Text>
      <View style={{ position: 'relative' }}>
        <Text style={{ position: 'absolute', left: 16, top: 14, fontFamily: 'Inter_500Medium', fontSize: 14, color: '#4A4A4A', zIndex: 10 }}>
          ₱
        </Text>
        <TextInput 
          style={{
            borderWidth: 1,
            borderColor: '#E2E5F0',
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingLeft: 34,
            paddingVertical: 14,
            fontFamily: 'Inter_400Regular',
            fontSize: 14,
            color: '#1A1A1A',
            backgroundColor: '#F9FAFB',
          }}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          value={value}
          keyboardType="numeric"
          onChangeText={setValue}
        />
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 32, paddingTop: 60, paddingBottom: 60 }}>
        
        <Animated.View entering={FadeInDown.duration(600)} style={{ marginBottom: 32 }}>
          <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 26, color: '#1A1A1A', marginBottom: 8 }}>
            Financial Snapshot
          </Text>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: '#4A4A4A', lineHeight: 20 }}>
            Provide your monthly financials for automated credit scoring.
          </Text>
        </Animated.View>
        
        <Animated.View entering={FadeInDown.delay(150).duration(600)}>
          {renderInput('Average Monthly Revenue', monthlyRevenue, setMonthlyRevenue, '150,000')}
          {renderInput('Total Assets', totalAssets, setTotalAssets, '500,000')}
          {renderInput('Total Liabilities / Debt', totalLiabilities, setTotalLiabilities, '50,000')}
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
                  Complete Onboarding
                </Text>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
