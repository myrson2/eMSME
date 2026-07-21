import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function HomeScreen() {
  const { user } = useAuth();

  return (
    <ScrollView className="flex-1 bg-surface">
      {/* Top section — Assets/Liabilities summary */}
      <View className="p-6 bg-lavender">
        <Text className="font-display text-2xl text-ink">Hi, {user?.name || 'User'}</Text>
        
        <View className="bg-white rounded-lg p-5 mt-4">
          <Text className="font-medium text-body text-sm mb-1">Total Outstanding Loan Balance</Text>
          <Text className="font-display text-primary text-3xl">₱10,000.00</Text>
        </View>
      </View>

      {/* Bottom section — Business list */}
      <View className="p-6">
        <Text className="font-display text-xl text-ink mb-4">Your Businesses</Text>
        
        {/* Mock Business Card */}
        <TouchableOpacity className="bg-white border border-border rounded-lg p-5 mb-4">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="font-display text-lg text-ink">Sari-Sari Store</Text>
            <View className="bg-primary rounded-full px-3 py-1">
              <Text className="text-white text-xs font-displaySemi">Verified</Text>
            </View>
          </View>
          <Text className="font-sans text-body">3 new matches</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
