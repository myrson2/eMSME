import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';

interface LoanSummary {
  totalOutstanding: number;
  activeCount: number;
  totalDisbursed: number;
}

interface BusinessInfo {
  id: string;
  name: string;
  type: string;
  status: 'Verified' | 'Partial' | 'Informal';
  completeness: number;
  matchCount: number;
}

export default function HomeScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const [refreshing, setRefreshing] = useState(false);
  const [loanSummary, setLoanSummary] = useState<LoanSummary>({
    totalOutstanding: 12345,
    activeCount: 5,
    totalDisbursed: 6789,
  });
  const [businesses, setBusinesses] = useState<BusinessInfo[]>([]);

  const fetchDashboardData = useCallback(async () => {
    try {
      const loansRes = await client.get('/loans/my');
      if (loansRes.data.success && loansRes.data.loans && loansRes.data.loans.length > 0) {
        const loans = loansRes.data.loans;
        const active = loans.filter((l: any) => l.status === 'REPAYMENT_ACTIVE' || l.status === 'APPROVED' || l.status === 'DISBURSEMENT_PENDING');
        const totalOutstanding = active.reduce((sum: number, l: any) => sum + (l.approved_amount || l.requested_amount || 0), 0);
        const totalDisbursed = loans
          .filter((l: any) => l.disbursed_at)
          .reduce((sum: number, l: any) => sum + (l.approved_amount || 0), 0);

        setLoanSummary({
          totalOutstanding,
          activeCount: active.length,
          totalDisbursed,
        });
      }
    } catch (err) {
      // Dashboard data is best-effort
    }

    try {
      const bizRes = await client.get('/business-profiles/my');
      if (bizRes.data.success) {
        // map backend keys to frontend keys if needed, or just use as is
        setBusinesses(bizRes.data.businesses.map((b: any) => ({
          id: b.id,
          name: b.business_name || b.name,
          type: b.business_type || b.type,
          status: b.status,
          completeness: b.completeness,
          matchCount: b.matchCount
        })));
      }
    } catch (err) {
      console.error('Failed to fetch businesses for dashboard:', err);
    }
  }, [user]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  }, [fetchDashboardData]);

  const formatCurrency = (amount: number) => {
    return '₱' + amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Verified': return { bg: '#EFF1FD', text: '#1740DE' };
      case 'Partial': return { bg: '#FEF3E2', text: '#D99C45' };
      default: return { bg: '#F3F4F6', text: '#6B7280' };
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#FFFFFF' }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1740DE" />}
    >
      {/* Header */}
      <View style={{ backgroundColor: '#1740DE', paddingTop: 56, paddingBottom: 32, paddingHorizontal: 24, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}>
        <Animated.View entering={FadeInDown.duration(500)}>
          {/* Top row: logo + bell */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 20, color: '#FFFFFF', letterSpacing: 0.5 }}>
              eMSME
            </Text>
            <TouchableOpacity
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: 'rgba(255,255,255,0.15)',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Ionicons name="notifications" size={20} color="#FFFFFF" />
              {/* Red dot badge */}
              <View style={{
                position: 'absolute',
                top: 8,
                right: 9,
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: '#E63B27',
                borderWidth: 1.5,
                borderColor: '#1740DE',
              }} />
            </TouchableOpacity>
          </View>

          {/* Greeting */}
          <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 26, color: '#FFFFFF', marginBottom: 4 }}>
            Hi, {user?.name || 'User'} 👋
          </Text>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>
            Welcome back to your MSME dashboard
          </Text>
        </Animated.View>
      </View>

      {/* Summary Cards */}
      <Animated.View entering={FadeInDown.delay(200).duration(500)} style={{ paddingHorizontal: 20, marginTop: -16 }}>
        <View style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 18,
          padding: 20,
          paddingTop: 24, // extra padding for the absolute bar
          borderWidth: 1,
          borderColor: '#E2E5F0',
          shadowColor: '#1740DE',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 4,
          overflow: 'hidden',
        }}>
          {/* eGovPH flag accent bar */}
          <View style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            flexDirection: 'row',
          }}>
            <View style={{ flex: 1, backgroundColor: '#1740DE' }} />
            <View style={{ flex: 1, backgroundColor: '#E63B27' }} />
            <View style={{ flex: 1, backgroundColor: '#FCD116' }} />
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            {/* Outstanding */}
            <View style={{ flex: 1, marginRight: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#EFF1FD', justifyContent: 'center', alignItems: 'center', marginRight: 8 }}>
                  <Ionicons name="trending-up" size={16} color="#1740DE" />
                </View>
                <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 11, color: '#4A4A4A', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Outstanding
                </Text>
              </View>
              <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 22, color: '#1A1A1A' }}>
                {formatCurrency(loanSummary.totalOutstanding)}
              </Text>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: '#4A4A4A', marginTop: 2 }}>
                {loanSummary.activeCount} active loan{loanSummary.activeCount !== 1 ? 's' : ''}
              </Text>
            </View>

            {/* Divider */}
            <View style={{ width: 1, backgroundColor: '#E2E5F0', marginVertical: 4 }} />

            {/* Disbursed */}
            <View style={{ flex: 1, marginLeft: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#EFF1FD', justifyContent: 'center', alignItems: 'center', marginRight: 8 }}>
                  <Ionicons name="checkmark-circle" size={16} color="#1740DE" />
                </View>
                <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 11, color: '#4A4A4A', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Disbursed
                </Text>
              </View>
              <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 22, color: '#1A1A1A' }}>
                {formatCurrency(loanSummary.totalDisbursed)}
              </Text>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: '#4A4A4A', marginTop: 2 }}>
                Total received
              </Text>
            </View>
          </View>
        </View>
      </Animated.View>

      {/* Quick Actions */}
      <Animated.View entering={FadeInDown.delay(350).duration(500)} style={{ paddingHorizontal: 20, marginTop: 24 }}>
        <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 16, color: '#1A1A1A', marginBottom: 14 }}>
          Quick Actions
        </Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          {[
            { icon: 'add-circle' as const, label: 'Apply Loan', color: '#1740DE', action: () => navigation.navigate('ApplyLoan') },
            { icon: 'document-attach' as const, label: 'Upload Docs', color: '#D99C45', action: () => navigation.navigate('Documents') },
            { icon: 'chatbubble-ellipses' as const, label: 'eGov AI', color: '#1740DE', action: () => {} },
          ].map((action, index) => (
            <TouchableOpacity
              key={action.label}
              activeOpacity={0.7}
              onPress={action.action}
              style={{
                flex: 1,
                backgroundColor: '#EFF1FD',
                borderRadius: 14,
                paddingVertical: 16,
                alignItems: 'center',
                gap: 8,
              }}
            >
              <View style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: '#FFFFFF',
                justifyContent: 'center',
                alignItems: 'center',
              }}>
                <Ionicons name={action.icon} size={22} color={action.color} />
              </View>
              <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 11, color: '#1A1A1A', textAlign: 'center' }}>
                {action.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>

      {/* Smart Alerts / Notifications */}
      <Animated.View entering={FadeInDown.delay(450).duration(500)} style={{ paddingHorizontal: 20, marginTop: 28 }}>
        <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 16, color: '#1A1A1A', marginBottom: 14 }}>
          Smart Alerts
        </Text>
        <TouchableOpacity
          activeOpacity={0.8}
          style={{
            backgroundColor: '#FEF3E2',
            borderRadius: 16,
            padding: 18,
            borderWidth: 1,
            borderColor: '#FCD116',
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: 14,
          }}
        >
          <View style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: '#FFFFFF',
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: '#D99C45',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
          }}>
            <Ionicons name="sparkles" size={20} color="#D99C45" />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: '#1A1A1A' }}>
                New Grant Available!
              </Text>
              <View style={{ backgroundColor: '#D99C45', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 }}>
                <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 9, color: '#FFFFFF', textTransform: 'uppercase' }}>Match</Text>
              </View>
            </View>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: '#4A4A4A', lineHeight: 18 }}>
              Based on your profile, your <Text style={{ fontFamily: 'Inter_500Medium', color: '#1A1A1A' }}>Retail & Wholesale</Text> business is eligible for the DTI Livelihood Seeding Program.
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
              <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: '#D99C45' }}>
                View details
              </Text>
              <Ionicons name="arrow-forward" size={14} color="#D99C45" style={{ marginLeft: 4 }} />
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* Business List */}
      <Animated.View entering={FadeInDown.delay(550).duration(500)} style={{ paddingHorizontal: 20, marginTop: 28, paddingBottom: 24 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 16, color: '#1A1A1A' }}>
            Your Businesses
          </Text>
          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }} onPress={() => navigation.navigate('BusinessList')}>
            <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 13, color: '#1740DE' }}>
              View All
            </Text>
            <Ionicons name="chevron-forward" size={14} color="#1740DE" />
          </TouchableOpacity>
        </View>

        {businesses.map((biz, index) => {
          const statusColors = getStatusColor(biz.status);
          return (
            <Animated.View key={biz.id} entering={FadeInRight.delay(650 + index * 100).duration(400)}>
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
                }}
              >
                {/* Top row */}
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
                        {biz.name}
                      </Text>
                      <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: '#4A4A4A', marginTop: 1 }}>
                        {biz.type}
                      </Text>
                    </View>
                  </View>
                  <View style={{ backgroundColor: statusColors.bg, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4 }}>
                    <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 11, color: statusColors.text }}>
                      {biz.status}
                    </Text>
                  </View>
                </View>

                {/* Progress bar */}
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

                {/* Bottom action hint */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#E63B27' }} />
                  <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: '#1740DE' }}>
                    {biz.matchCount} new matches available
                  </Text>
                  <Ionicons name="arrow-forward" size={12} color="#1740DE" style={{ marginLeft: 'auto' }} />
                </View>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </Animated.View>
    </ScrollView>
  );
}
