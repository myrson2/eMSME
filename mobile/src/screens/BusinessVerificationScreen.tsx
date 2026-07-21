import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function BusinessVerificationScreen() {
  const { checkSession } = useAuth();

  const handleVerify = async () => {
    // Mock connecting to DTI/SEC/BIR etc.
    await client.post('/onboarding/business-verification', {
      dtiRegistrationNumber: 'DTI-12345'
    });
    await checkSession();
  };

  return (
    <View className="flex-1 justify-center items-center bg-surface p-8">
      <Text className="font-display text-2xl text-ink mb-4 text-center">Government Verification</Text>
      <Text className="font-sans text-body mb-8 text-center">We will now verify your business records with DTI and BIR.</Text>
      
      <TouchableOpacity 
        className="w-full bg-primary rounded-md py-4 items-center"
        onPress={handleVerify}
      >
        <Text className="font-displaySemi text-white text-base">Verify Business</Text>
      </TouchableOpacity>
    </View>
  );
}
