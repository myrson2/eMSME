import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function BusinessProfileScreen() {
  const { checkSession } = useAuth();
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [industry, setIndustry] = useState('');

  const handleSubmit = async () => {
    await client.post('/onboarding/business-profile', {
      businessName: businessName || 'Sari-Sari Store',
      businessType: businessType || 'Sole Proprietorship',
      industry: industry || 'Retail',
      address: '123 Main St'
    });
    await checkSession();
  };

  return (
    <View className="flex-1 bg-surface p-8 justify-center">
      <Text className="font-display text-2xl text-ink mb-6">Business Profile</Text>
      
      <TextInput 
        className="border border-border rounded-md px-4 py-3 mb-4 font-sans text-ink"
        placeholder="Business Name"
        value={businessName}
        onChangeText={setBusinessName}
      />
      <TextInput 
        className="border border-border rounded-md px-4 py-3 mb-4 font-sans text-ink"
        placeholder="Business Type"
        value={businessType}
        onChangeText={setBusinessType}
      />
      <TextInput 
        className="border border-border rounded-md px-4 py-3 mb-8 font-sans text-ink"
        placeholder="Industry"
        value={industry}
        onChangeText={setIndustry}
      />
      
      <TouchableOpacity 
        className="w-full bg-primary rounded-md py-4 items-center"
        onPress={handleSubmit}
      >
        <Text className="font-displaySemi text-white text-base">Save Profile</Text>
      </TouchableOpacity>
    </View>
  );
}
