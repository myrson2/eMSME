import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import client from '../api/client';

export default function BusinessListScreen() {
  const navigation = useNavigation<any>();
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBusinesses = useCallback(async () => {
    try {
      const res = await client.get('/business-profiles/my');
      if (res.data.success) {
        setBusinesses(res.data.businesses);
      }
    } catch (err) {
      console.error('Failed to fetch businesses:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBusinesses();
  }, [fetchBusinesses]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchBusinesses();
    setRefreshing(false);
  }, [fetchBusinesses]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Verified': return { bg: '#EFF1FD', text: '#1740DE' };
      case 'Partial': return { bg: '#FEF3E2', text: '#D99C45' };
      default: return { bg: '#F3F4F6', text: '#6B7280' };
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 56, paddingHorizontal: 24, paddingBottom: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E5F0' }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 16 }}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 20, color: '#1A1A1A' }}>
          Your Businesses
        </Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#1740DE" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1740DE" />}
        >
          {businesses.length === 0 ? (
            <Text style={{ fontFamily: 'Inter_400Regular', color: '#6B7280', textAlign: 'center', marginTop: 40 }}>
              No businesses found.
            </Text>
          ) : (
            businesses.map((biz, index) => {
              const statusColors = getStatusColor(biz.status);
              return (
                <Animated.View key={biz.id || index} entering={FadeInRight.delay(index * 100).duration(400)}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => navigation.navigate('BusinessDetails', { businessId: biz.id })}
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: 18,
                      padding: 20,
                      borderWidth: 1,
                      borderColor: '#E2E5F0',
                      marginBottom: 12,
                      shadowColor: '#1740DE',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.05,
                      shadowRadius: 8,
                      elevation: 2,
                    }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 }}>
                        <View style={{
                          width: 44,
                          height: 44,
                          borderRadius: 22,
                          backgroundColor: '#EFF1FD',
                          justifyContent: 'center',
                          alignItems: 'center',
                          marginRight: 12,
                        }}>
                          <Ionicons name="storefront" size={22} color="#1740DE" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 15, color: '#1A1A1A' }} numberOfLines={1}>
                            {biz.business_name || biz.name}
                          </Text>
                          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: '#4A4A4A', marginTop: 1 }}>
                            {biz.business_type || biz.type}
                          </Text>
                        </View>
                      </View>
                      <View style={{ backgroundColor: statusColors.bg, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4 }}>
                        <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 11, color: statusColors.text }}>
                          {biz.status}
                        </Text>
                      </View>
                    </View>

                    <View style={{ marginBottom: 12 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                        <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: '#4A4A4A' }}>
                          Profile completeness
                        </Text>
                        <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: '#1740DE' }}>
                          {biz.completeness}%
                        </Text>
                      </View>
                      <View style={{ height: 6, backgroundColor: '#EFF1FD', borderRadius: 3 }}>
                        <View style={{ height: 6, backgroundColor: '#1740DE', borderRadius: 3, width: `${biz.completeness}%` }} />
                      </View>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#E63B27' }} />
                      <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: '#1740DE' }}>
                        {biz.matchCount || 0} new matches available
                      </Text>
                      <Ionicons name="arrow-forward" size={12} color="#1740DE" style={{ marginLeft: 'auto' }} />
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
}
