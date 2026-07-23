import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import client from '../api/client';

export default function ApplyLoanScreen() {
  const navigation = useNavigation();
  const [requestedAmount, setRequestedAmount] = useState('50000');
  const [tenorMonths, setTenorMonths] = useState('12');
  const [purpose, setPurpose] = useState('Inventory expansion for holiday season');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!requestedAmount || !tenorMonths || !purpose) {
      Alert.alert('Missing Fields', 'Please complete all loan application fields.');
      return;
    }

    try {
      setLoading(true);
      const res = await client.post('/loans/apply', {
        requestedAmount: parseFloat(requestedAmount),
        tenorMonths: parseInt(tenorMonths, 10),
        purpose
      });

      if (res.data.success) {
        Alert.alert('Success', 'Loan application submitted successfully! Credit assessment is in progress.', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('Submission Failed', res.data.message);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Server error submitting loan application.';
      Alert.alert('Submission Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (label: string, value: string, setValue: (val: string) => void, placeholder: string, keyboardType: any = 'default', multiline: boolean = false) => (
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
          minHeight: multiline ? 80 : undefined,
          textAlignVertical: multiline ? 'top' : 'center',
        }}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        value={value}
        onChangeText={setValue}
        keyboardType={keyboardType}
        multiline={multiline}
      />
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 56, paddingHorizontal: 24, paddingBottom: 16 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 16 }}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 20, color: '#1A1A1A' }}>
          Apply for Loan
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24 }}>
        <Animated.View entering={FadeInDown.duration(500)} style={{ marginBottom: 24 }}>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: '#4A4A4A', lineHeight: 20 }}>
            Enter your desired loan amount and terms. Your application will be assessed by our credit engine.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).duration(500)}>
          {renderInput('Requested Amount (₱)', requestedAmount, setRequestedAmount, 'e.g. 50000', 'numeric')}
          {renderInput('Tenor (Months)', tenorMonths, setTenorMonths, 'e.g. 12', 'numeric')}
          {renderInput('Loan Purpose', purpose, setPurpose, 'What will you use the funds for?', 'default', true)}
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200).duration(500)} style={{ marginTop: 32 }}>
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
                <Ionicons name="paper-plane" size={20} color="#FCD116" />
                <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 15, color: '#FFFFFF' }}>
                  Submit Application
                </Text>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
