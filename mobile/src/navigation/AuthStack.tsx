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

  const getOnboardingScreen = () => {
    switch (onboardingStep) {
      case 'EFACIAL':
      case 'sso_complete':
        return { name: 'FaceLiveness', component: FaceLivenessScreen };
      case 'EVERIFY':
      case 'face_liveness_verified':
        return { name: 'EVerify', component: EVerifyScreen };
      case 'BUSINESS_PROFILE':
      case 'identity_verified':
        return { name: 'BusinessProfile', component: BusinessProfileScreen };
      case 'BUSINESS_VERIFY':
      case 'business_profile_created':
        return { name: 'BusinessVerification', component: BusinessVerificationScreen };
      case 'FINANCIALS':
      case 'business_verified':
        return { name: 'Financials', component: FinancialsScreen };
      default:
        return { name: 'FaceLiveness', component: FaceLivenessScreen };
    }
  };

  const currentScreen = getOnboardingScreen();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : (
        <Stack.Screen name={currentScreen.name} component={currentScreen.component} />
      )}
    </Stack.Navigator>
  );
}
