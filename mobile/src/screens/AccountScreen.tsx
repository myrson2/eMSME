import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function AccountScreen() {
  const { logout } = useAuth();

  return (
    <View className="flex-1 justify-center items-center bg-surface p-8">
      <Text className="font-display text-2xl text-ink mb-8">Account Settings</Text>
      
      <TouchableOpacity 
        className="w-full bg-border rounded-md py-4 items-center"
        onPress={logout}
      >
        <Text className="font-displaySemi text-ink text-base">Logout</Text>
      </TouchableOpacity>
    </View>
  );
}
