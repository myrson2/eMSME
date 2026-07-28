import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MainTabs from './MainTabs';
import EGovAIScreen from '../screens/EGovAIScreen';
import ApplyLoanScreen from '../screens/ApplyLoanScreen';

const Stack = createNativeStackNavigator();

export default function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen 
        name="EGovAI" 
        component={EGovAIScreen} 
        options={{
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen 
        name="ApplyLoan" 
        component={ApplyLoanScreen} 
        options={{
          animation: 'slide_from_right',
        }}
      />
    </Stack.Navigator>
  );
}
