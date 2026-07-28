import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import AuthStack from './AuthStack';
import AppStack from './AppStack';
import { View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

export default function RootNavigator() {
  const { isAuthenticated, isLoading, onboardingStep, restartToPhilSys } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1740DE' }}>
        <Animated.View entering={FadeIn.duration(600)} style={{ alignItems: 'center' }}>
          <Text style={{
            fontFamily: 'Poppins_700Bold',
            fontSize: 36,
            color: '#FFFFFF',
            marginBottom: 4,
          }}>
            eMSME
          </Text>
          <Text style={{
            fontFamily: 'Inter_400Regular',
            fontSize: 14,
            color: 'rgba(255,255,255,0.7)',
            marginBottom: 32,
          }}>
            eGovPH Service Module
          </Text>
          <ActivityIndicator size="large" color="#FFFFFF" />
        </Animated.View>
      </View>
    );
  }

  const isFullyOnboarded = isAuthenticated && (onboardingStep === 'COMPLETE' || onboardingStep === 'completed');

  return (
    <View style={{ flex: 1 }}>
      <NavigationContainer>
        {isFullyOnboarded ? <AppStack /> : <AuthStack />}
      </NavigationContainer>


    </View>
  );
}
