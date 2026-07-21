import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
  const { login } = useAuth();
  
  // This is a mockup for the eGov SSO Login widget
  const handleLogin = async () => {
    // We mock the exchange by just passing a dummy code
    await login('mock_sso_code');
  };

  return (
    <View className="flex-1 justify-center items-center bg-surface p-8">
      <Text className="font-display text-3xl text-primary mb-4 text-center">eGovPH</Text>
      <Text className="font-sans text-lg text-body mb-10 text-center">eMSME Service Module</Text>
      
      <TouchableOpacity 
        className="w-full bg-primary rounded-md py-4 items-center"
        onPress={handleLogin}
      >
        <Text className="font-displaySemi text-white text-base">Log in using eGov creds</Text>
      </TouchableOpacity>
    </View>
  );
}
