import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import Animated, { FadeInDown, FadeInRight, SlideInRight, SlideInLeft } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import client from '../api/client';

type Segment = 'Matches' | 'Applications';

interface MatchedProgram {
  id: string;
  name: string;
  agency: string;
  amount: string;
  type: 'Grant' | 'Loan';
  reason: string;
  isNew: boolean;
}

interface LoanApplication {
  id: string;
  status: string;
  requested_amount: number;
  approved_amount: number | null;
  purpose: string;
  created_at: string;
  tenor_months: number;
  interest_rate_annual: number | null;
  monthly_amortization: number | null;
}

const MOCK_MATCHES: MatchedProgram[] = [
  {
    id: '1',
    name: 'DOST-PCIEERD MSME Innovation Fund',
    agency: 'DOST',
    amount: '₱500,000',
    type: 'Grant',
    reason: 'Matched: DTI-registered, innovation-capable, revenue under ₱3M',
    isNew: true,
  },
  {
    id: '2',
    name: 'SB Corp Pondo sa Pagbabago',
    agency: 'SB Corp',
    amount: '₱100,000 – ₱300,000',
    type: 'Loan',
    reason: 'Matched: Sole Proprietorship, 3+ years, with barangay clearance',
    isNew: true,
  },
  {
    id: '3',
    name: 'DTI Shared Service Facility',
    agency: 'DTI',
    amount: 'Equipment access',
    type: 'Grant',
    reason: 'Matched: Retail industry, NCR region',
    isNew: false,
  },
];

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: string }> = {
  SUBMITTED: { color: '#1740DE', bg: '#EFF1FD', icon: 'paper-plane' },
  UNDER_VERIFICATION: { color: '#1740DE', bg: '#EFF1FD', icon: 'search' },
  UNDERWRITING: { color: '#D99C45', bg: '#FEF3E2', icon: 'hourglass' },
  APPROVED: { color: '#16A34A', bg: '#F0FDF4', icon: 'checkmark-circle' },
  REJECTED: { color: '#E63B27', bg: '#FEF2F2', icon: 'close-circle' },
  DISBURSEMENT_PENDING: { color: '#D99C45', bg: '#FEF3E2', icon: 'time' },
  REPAYMENT_ACTIVE: { color: '#1740DE', bg: '#EFF1FD', icon: 'wallet' },
  COMPLETED: { color: '#16A34A', bg: '#F0FDF4', icon: 'checkmark-done-circle' },
  DEFAULTED: { color: '#E63B27', bg: '#FEF2F2', icon: 'warning' },
};

export default function AidScreen() {
  const [segment, setSegment] = useState<Segment>('Matches');
  const [loans, setLoans] = useState<LoanApplication[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLoans = useCallback(async () => {
    try {
      const res = await client.get('/loans/my');
      if (res.data.success) {
        setLoans(res.data.loans);
      }
    } catch (err) {
      // Graceful fallback
    }
  }, []);

  useEffect(() => {
    fetchLoans();
  }, [fetchLoans]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchLoans();
    setRefreshing(false);
  }, [fetchLoans]);

  const formatCurrency = (amount: number) =>
    '₱' + amount.toLocaleString('en-PH', { minimumFractionDigits: 0 });

  const formatStatus = (status: string) =>
    status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      {/* Header */}
      <View style={{ paddingTop: 56, paddingHorizontal: 24, paddingBottom: 16, backgroundColor: '#FFFFFF' }}>
        <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 24, color: '#1A1A1A' }}>
          Aid & Loans
        </Text>
      </View>

      {/* Segmented Control */}
      <Animated.View entering={FadeInDown.duration(400)} style={{ paddingHorizontal: 24, marginBottom: 8 }}>
        <View style={{
          flexDirection: 'row',
          backgroundColor: '#EFF1FD',
          borderRadius: 12,
          padding: 4,
        }}>
          {(['Matches', 'Applications'] as Segment[]).map((seg) => (
            <TouchableOpacity
              key={seg}
              onPress={() => setSegment(seg)}
              activeOpacity={0.8}
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: 10,
                backgroundColor: segment === seg ? '#FFFFFF' : 'transparent',
                alignItems: 'center',
                ...(segment === seg ? {
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.08,
                  shadowRadius: 4,
                  elevation: 2,
                } : {}),
              }}
            >
              <Text style={{
                fontFamily: 'Poppins_600SemiBold',
                fontSize: 13,
                color: segment === seg ? '#1740DE' : '#4A4A4A',
              }}>
                {seg}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>

      {/* Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1740DE" />}
      >
        {segment === 'Matches' ? (
          // Matches View
          MOCK_MATCHES.map((match, index) => (
            <Animated.View key={match.id} entering={FadeInRight.delay(index * 100).duration(400)}>
              <View style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 18,
                padding: 20,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: '#E2E5F0',
              }}>
                {/* Top row */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
                    <View style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: '#EFF1FD',
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginRight: 10,
                    }}>
                      <Ionicons
                        name={match.type === 'Grant' ? 'gift' : 'cash'}
                        size={20}
                        color="#1740DE"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: '#1A1A1A' }} numberOfLines={2}>
                        {match.name}
                      </Text>
                      <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: '#4A4A4A', marginTop: 1 }}>
                        {match.agency} • {match.type}
                      </Text>
                    </View>
                  </View>
                  {match.isNew && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FEF2F2', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 }}>
                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#E63B27' }} />
                      <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 10, color: '#E63B27' }}>New</Text>
                    </View>
                  )}
                </View>

                {/* Amount */}
                <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 18, color: '#1740DE', marginBottom: 6 }}>
                  {match.amount}
                </Text>

                {/* Reason */}
                <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: '#4A4A4A', marginBottom: 14, lineHeight: 18 }}>
                  {match.reason}
                </Text>

                {/* Apply button */}
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={{
                    backgroundColor: '#1740DE',
                    borderRadius: 10,
                    paddingVertical: 12,
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: 'rgba(252, 209, 22, 0.4)',
                  }}
                >
                  <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: '#FFFFFF' }}>
                    Mag-apply
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          ))
        ) : (
          // Applications View
          loans.length === 0 ? (
            <Animated.View entering={FadeInDown.duration(400)} style={{ alignItems: 'center', paddingTop: 60 }}>
              <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#EFF1FD', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
                <Ionicons name="document-text" size={32} color="#1740DE" />
              </View>
              <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 16, color: '#1A1A1A', marginBottom: 6 }}>
                No applications yet
              </Text>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: '#4A4A4A', textAlign: 'center', lineHeight: 19 }}>
                Browse Matches to find programs {'\n'}you qualify for and apply.
              </Text>
            </Animated.View>
          ) : (
            loans.map((loan, index) => {
              const config = STATUS_CONFIG[loan.status] || STATUS_CONFIG.SUBMITTED;
              return (
                <Animated.View key={loan.id} entering={FadeInRight.delay(index * 100).duration(400)}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: 18,
                      padding: 20,
                      marginBottom: 12,
                      borderWidth: 1,
                      borderColor: '#E2E5F0',
                    }}
                  >
                    {/* Status + Amount */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View style={{
                          width: 36,
                          height: 36,
                          borderRadius: 18,
                          backgroundColor: config.bg,
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}>
                          <Ionicons name={config.icon as any} size={18} color={config.color} />
                        </View>
                        <View>
                          <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 11, color: '#4A4A4A', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            Loan Application
                          </Text>
                          <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: '#1A1A1A', marginTop: 1 }}>
                            {formatCurrency(loan.approved_amount || loan.requested_amount)}
                          </Text>
                        </View>
                      </View>
                      <View style={{ backgroundColor: config.bg, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
                        <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 10, color: config.color }}>
                          {formatStatus(loan.status)}
                        </Text>
                      </View>
                    </View>

                    {/* Details */}
                    <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: '#4A4A4A', marginBottom: 8 }}>
                      {loan.purpose}
                    </Text>

                    <View style={{ flexDirection: 'row', gap: 16 }}>
                      <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: '#6B7280' }}>
                        {loan.tenor_months} months
                      </Text>
                      {loan.interest_rate_annual && (
                        <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: '#6B7280' }}>
                          {loan.interest_rate_annual}% p.a.
                        </Text>
                      )}
                      {loan.monthly_amortization && (
                        <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: '#6B7280' }}>
                          {formatCurrency(loan.monthly_amortization)}/mo
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              );
            })
          )
        )}
      </ScrollView>
    </View>
  );
}
