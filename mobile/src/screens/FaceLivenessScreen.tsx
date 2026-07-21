import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function FaceLivenessScreen() {
  const { checkSession } = useAuth();

  const handleVerify = async () => {
    // Mock biometric submission
    await client.post('/verify/face-liveness', { photoBase64: 'dummy_data' });
    await checkSession();
  };

  return (
    <View className="flex-1 justify-center items-center bg-surface p-8">
      <Text className="font-display text-2xl text-ink mb-4 text-center">Face Verification</Text>
      <Text className="font-sans text-body mb-8 text-center">We need to confirm your identity before proceeding.</Text>
      
      <TouchableOpacity 
        className="w-full bg-primary rounded-md py-4 items-center"
        onPress={handleVerify}
      >
        <Text className="font-displaySemi text-white text-base">Start Scan</Text>
      </TouchableOpacity>
    </View>
  );
}
