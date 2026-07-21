import React from 'react';
import { View, Text } from 'react-native';

export default function DocumentsScreen() {
  return (
    <View className="flex-1 justify-center items-center bg-surface p-8">
      <Text className="font-display text-2xl text-ink mb-4">Documents Vault</Text>
      <Text className="font-sans text-body text-center">Shared documents across businesses.</Text>
    </View>
  );
}
