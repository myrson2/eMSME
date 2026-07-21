import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import AuthStack from './AuthStack';
import MainTabs from './MainTabs';
import { View, Text } from 'react-native';

export default function RootNavigator() {
  const { isAuthenticated, isLoading, onboardingStep } = useAuth();

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-surface">
        <Text className="font-sans text-body">Loading...</Text>
      </View>
    );
  }

  // Determine if user is fully onboarded
  const isFullyOnboarded = isAuthenticated && onboardingStep === 'completed';

  return (
    <NavigationContainer>
      {isFullyOnboarded ? <MainTabs /> : <AuthStack />}
    </NavigationContainer>
  );
}
