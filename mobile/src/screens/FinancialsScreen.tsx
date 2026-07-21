import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function FinancialsScreen() {
  const { checkSession } = useAuth();
  const [revenue, setRevenue] = useState('');
  const [employees, setEmployees] = useState('');

  const handleSubmit = async () => {
    await client.post('/onboarding/financials', {
      annualRevenue: parseFloat(revenue) || 50000,
      employeeCount: parseInt(employees) || 2
    });
    await checkSession();
  };

  return (
    <View className="flex-1 justify-center bg-surface p-8">
      <Text className="font-display text-2xl text-ink mb-6">Financial Snapshot</Text>
      
      <TextInput 
        className="border border-border rounded-md px-4 py-3 mb-4 font-sans text-ink"
        placeholder="Annual Revenue (PHP)"
        value={revenue}
        keyboardType="numeric"
        onChangeText={setRevenue}
      />
      <TextInput 
        className="border border-border rounded-md px-4 py-3 mb-8 font-sans text-ink"
        placeholder="Number of Employees"
        value={employees}
        keyboardType="numeric"
        onChangeText={setEmployees}
      />
      
      <TouchableOpacity 
        className="w-full bg-primary rounded-md py-4 items-center"
        onPress={handleSubmit}
      >
        <Text className="font-displaySemi text-white text-base">Complete Onboarding</Text>
      </TouchableOpacity>
    </View>
  );
}
