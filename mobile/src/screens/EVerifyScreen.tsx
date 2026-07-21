import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function EVerifyScreen() {
  const { checkSession } = useAuth();

  const handleVerify = async () => {
    // Mock eVerify identity retrieval
    await client.post('/onboarding/everify');
    await checkSession();
  };

  return (
    <View className="flex-1 justify-center items-center bg-surface p-8">
      <Text className="font-display text-2xl text-ink mb-4 text-center">eVerify Check</Text>
      <Text className="font-sans text-body mb-8 text-center">Syncing your personal information from eGovPH...</Text>
      
      <TouchableOpacity 
        className="w-full bg-primary rounded-md py-4 items-center"
        onPress={handleVerify}
      >
        <Text className="font-displaySemi text-white text-base">Sync Now</Text>
      </TouchableOpacity>
    </View>
  );
}
