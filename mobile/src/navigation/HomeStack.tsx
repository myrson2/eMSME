import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import ApplyLoanScreen from '../screens/ApplyLoanScreen';
import BusinessListScreen from '../screens/BusinessListScreen';
import BusinessDetailsScreen from '../screens/BusinessDetailsScreen';

const Stack = createNativeStackNavigator();

export default function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeScreen" component={HomeScreen} />
      <Stack.Screen name="ApplyLoan" component={ApplyLoanScreen} />
      <Stack.Screen name="BusinessList" component={BusinessListScreen} />
      <Stack.Screen name="BusinessDetails" component={BusinessDetailsScreen} />
    </Stack.Navigator>
  );
}
