import React from 'react';
import { View, Text } from 'react-native';

export default function AidScreen() {
  return (
    <View className="flex-1 justify-center items-center bg-surface p-8">
      <Text className="font-display text-2xl text-ink mb-4">Aid & Loans</Text>
      <Text className="font-sans text-body text-center">Matches and Applications will appear here.</Text>
    </View>
  );
}
