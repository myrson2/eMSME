import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import AidScreen from '../screens/AidScreen';
import ScanScreen from '../screens/ScanScreen';
import DocumentsScreen from '../screens/DocumentsScreen';
import AccountScreen from '../screens/AccountScreen';
import { View, Text } from 'react-native';

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#1740DE', // primary
        tabBarInactiveTintColor: '#4A4A4A', // body
        tabBarStyle: { height: 60, paddingBottom: 5 },
        tabBarLabelStyle: { fontFamily: 'Poppins_700Bold', fontSize: 12 },
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ tabBarIcon: ({ color }) => <View className="w-6 h-6 rounded border" style={{ borderColor: color }} /> }}
      />
      <Tab.Screen 
        name="Aid" 
        component={AidScreen} 
        options={{ tabBarIcon: ({ color }) => <View className="w-6 h-6 rounded border" style={{ borderColor: color }} /> }}
      />
      <Tab.Screen 
        name="Scan" 
        component={ScanScreen} 
        options={{
          tabBarIcon: ({ color }) => (
            <View className="bg-primary rounded-full w-12 h-12 justify-center items-center -mt-5 shadow-sm">
              <Text className="text-white text-2xl mb-1">+</Text>
            </View>
          ),
          tabBarLabel: 'Scan/Upload',
        }}
      />
      <Tab.Screen 
        name="Documents" 
        component={DocumentsScreen} 
        options={{ tabBarIcon: ({ color }) => <View className="w-6 h-6 rounded border" style={{ borderColor: color }} /> }}
      />
      <Tab.Screen 
        name="Account" 
        component={AccountScreen} 
        options={{ tabBarIcon: ({ color }) => <View className="w-6 h-6 rounded border" style={{ borderColor: color }} /> }}
      />
    </Tab.Navigator>
  );
}
