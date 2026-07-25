import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import FaceLivenessScreen from '../screens/FaceLivenessScreen';
import SMSOTPScreen from '../screens/SMSOTPScreen';
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
      case 'SMS_OTP':
      case 'face_liveness_verified':
        return { name: 'SMSOTP', component: SMSOTPScreen };
      case 'EVERIFY':
      case 'sms_otp_verified':
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
        <>
          {currentScreen.name === 'FaceLiveness' && <Stack.Screen name="FaceLiveness" component={FaceLivenessScreen} />}
          {currentScreen.name === 'SMSOTP' && <Stack.Screen name="SMSOTP" component={SMSOTPScreen} />}
          {currentScreen.name === 'EVerify' && <Stack.Screen name="EVerify" component={EVerifyScreen} />}
          {currentScreen.name === 'BusinessProfile' && <Stack.Screen name="BusinessProfile" component={BusinessProfileScreen} />}
          {currentScreen.name === 'BusinessVerification' && <Stack.Screen name="BusinessVerification" component={BusinessVerificationScreen} />}
          {currentScreen.name === 'Financials' && <Stack.Screen name="Financials" component={FinancialsScreen} />}
        </>
      )}
    </Stack.Navigator>
  );
}
