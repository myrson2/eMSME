import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import client from '../api/client';

export default function BusinessDetailsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { businessId } = route.params || {};

  const [business, setBusiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!businessId) {
      setLoading(false);
      return;
    }

    client.get(`/business-profiles/${businessId}`)
      .then(res => {
        if (res.data.success) {
          setBusiness(res.data.business);
        }
      })
      .catch(err => console.error('Failed to load business details:', err))
      .finally(() => setLoading(false));
  }, [businessId]);

  const renderCheck = (title: string, agency: string, status: string) => {
    const isPass = status === 'PASS';
    return (
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6'
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: isPass ? '#DCFCE7' : '#FEE2E2',
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 12,
          }}>
            <Ionicons name={isPass ? 'checkmark' : 'close'} size={18} color={isPass ? '#16A34A' : '#DC2626'} />
          </View>
          <View>
            <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 14, color: '#1A1A1A' }}>{title}</Text>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: '#6B7280', marginTop: 2 }}>{agency}</Text>
          </View>
        </View>
        <View style={{ backgroundColor: isPass ? '#DCFCE7' : '#FEE2E2', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 }}>
          <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 11, color: isPass ? '#16A34A' : '#DC2626' }}>
            {status}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 56, paddingHorizontal: 24, paddingBottom: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E5F0' }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 16 }}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 20, color: '#1A1A1A' }}>
          Business Details
        </Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#1740DE" />
        </View>
      ) : !business ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontFamily: 'Inter_400Regular', color: '#6B7280' }}>Business not found.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
          <Animated.View entering={FadeInDown.duration(400)} style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: '#E2E5F0' }}>
            <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 18, color: '#1A1A1A', marginBottom: 4 }}>
              {business.business_name}
            </Text>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: '#4A4A4A' }}>
              {business.business_type} • Reg: {business.registration_number}
            </Text>
            <View style={{ marginTop: 12, alignSelf: 'flex-start', backgroundColor: '#EFF1FD', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 }}>
              <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: '#1740DE' }}>
                Status: {business.status}
              </Text>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(100).duration(400)}>
            <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 16, color: '#1A1A1A', marginBottom: 12 }}>
              Verification Checks
            </Text>
            <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#E2E5F0' }}>
              {business.verification_checks_json ? (
                business.verification_checks_json.map((check: any, idx: number) => (
                  <View key={idx}>
                    {renderCheck(
                      check.agency === 'DTI' ? 'Business Name Registry' :
                      check.agency === 'SEC' ? 'Company Register' :
                      check.agency === 'CDA' ? 'Cooperative Registry' :
                      check.agency === 'BIR' ? 'Tax Identification' :
                      check.agency === 'LGU' ? 'Mayor\'s Permit' : check.agency,
                      check.agency,
                      check.status
                    )}
                  </View>
                ))
              ) : (
                <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: '#6B7280', textAlign: 'center' }}>
                  No verification checks found.
                </Text>
              )}
            </View>
          </Animated.View>
        </ScrollView>
      )}
    </View>
  );
}
