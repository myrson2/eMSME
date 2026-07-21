import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import FaceLivenessScreen from '../screens/FaceLivenessScreen';
import EVerifyScreen from '../screens/EVerifyScreen';
import BusinessProfileScreen from '../screens/BusinessProfileScreen';
import BusinessVerificationScreen from '../screens/BusinessVerificationScreen';
import FinancialsScreen from '../screens/FinancialsScreen';
import { useAuth } from '../context/AuthContext';

const Stack = createNativeStackNavigator();

export default function AuthStack() {
  const { onboardingStep, isAuthenticated } = useAuth();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : (
        <>
          {onboardingStep === 'sso_complete' && (
            <Stack.Screen name="FaceLiveness" component={FaceLivenessScreen} />
          )}
          {onboardingStep === 'face_liveness_verified' && (
            <Stack.Screen name="EVerify" component={EVerifyScreen} />
          )}
          {onboardingStep === 'identity_verified' && (
            <Stack.Screen name="BusinessProfile" component={BusinessProfileScreen} />
          )}
          {onboardingStep === 'business_profile_created' && (
            <Stack.Screen name="BusinessVerification" component={BusinessVerificationScreen} />
          )}
          {onboardingStep === 'business_verified' && (
            <Stack.Screen name="Financials" component={FinancialsScreen} />
          )}
        </>
      )}
    </Stack.Navigator>
  );
}
