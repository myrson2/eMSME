import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import Animated from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import client from '../api/client';
import { useSpringEntrance, useStaggeredEntry, usePressScale } from '../lib/animations';
import { colors, text, spacing, radius, shadows, fonts } from '../lib/theme';
import EmptyState from '../components/ui/EmptyState';
import PressableButton from '../components/ui/PressableButton';
import * as Haptics from 'expo-haptics';

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

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: React.ComponentProps<typeof Ionicons>['name'] }> = {
  SUBMITTED: { color: colors.primary, bg: colors.primaryMuted, icon: 'paper-plane-outline' },
  UNDER_VERIFICATION: { color: colors.primary, bg: colors.primaryMuted, icon: 'search-outline' },
  UNDERWRITING: { color: colors.amber, bg: colors.amberMuted, icon: 'hourglass-outline' },
  APPROVED: { color: '#16A34A', bg: '#F0FDF4', icon: 'checkmark-circle-outline' },
  REJECTED: { color: colors.signal, bg: colors.signalMuted, icon: 'close-circle-outline' },
  DISBURSEMENT_PENDING: { color: colors.amber, bg: colors.amberMuted, icon: 'time-outline' },
  REPAYMENT_ACTIVE: { color: colors.primary, bg: colors.primaryMuted, icon: 'wallet-outline' },
  COMPLETED: { color: '#16A34A', bg: '#F0FDF4', icon: 'checkmark-done-circle-outline' },
  DEFAULTED: { color: colors.signal, bg: colors.signalMuted, icon: 'warning-outline' },
};

// ---------------------------------------------------------------------------
// Match card
// ---------------------------------------------------------------------------
function MatchCard({ match, index }: { match: MatchedProgram; index: number }) {
  const { animatedStyle, handlePressIn, handlePressOut } = usePressScale(0.97);
  const entranceStyle = useStaggeredEntry(index, { delay: 70, distance: 14 });

  return (
    <Animated.View style={[{ marginBottom: 12 }, entranceStyle, animatedStyle]}>
      <TouchableOpacity
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        style={{
          backgroundColor: colors.surfaceRaised,
          borderRadius: radius.lg,
          padding: 20,
          borderWidth: 1,
          borderColor: colors.border,
          ...shadows.card,
        }}
      >
        {/* Header row */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', flex: 1, marginRight: 10 }}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 13,
                backgroundColor: colors.primaryMuted,
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 12,
              }}
            >
              <Ionicons
                name={match.type === 'Grant' ? 'gift-outline' : 'cash-outline'}
                size={19}
                color={colors.primary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[text.label, { color: colors.ink, marginBottom: 2 }]} numberOfLines={2}>
                {match.name}
              </Text>
              <Text style={[text.caption, { color: colors.body }]}>
                {match.agency} · {match.type}
              </Text>
            </View>
          </View>

          {match.isNew && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                backgroundColor: colors.signalMuted,
                borderRadius: radius.xs,
                paddingHorizontal: 8,
                paddingVertical: 3,
              }}
            >
              <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: colors.signal }} />
              <Text style={{ fontFamily: fonts.medium, fontSize: 10, color: colors.signal }}>New</Text>
            </View>
          )}
        </View>

        {/* Amount */}
        <Text style={{ fontFamily: fonts.mono, fontSize: 20, color: colors.primary, marginBottom: 8, letterSpacing: -0.3 }}>
          {match.amount}
        </Text>

        {/* Reason */}
        <Text style={[text.caption, { color: colors.body, lineHeight: 18, marginBottom: 16 }]}>
          {match.reason}
        </Text>

        <PressableButton
          label="Apply"
          onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
          variant="primary"
          size="sm"
          trailingIcon="arrow-forward"
        />
      </TouchableOpacity>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Loan application card
// ---------------------------------------------------------------------------
function LoanCard({ loan, index }: { loan: LoanApplication; index: number }) {
  const { animatedStyle, handlePressIn, handlePressOut } = usePressScale(0.97);
  const entranceStyle = useStaggeredEntry(index, { delay: 70, distance: 14 });
  const config = STATUS_CONFIG[loan.status] || STATUS_CONFIG.SUBMITTED;
  const formatCurrency = (amount: number) =>
    '₱' + amount.toLocaleString('en-PH', { minimumFractionDigits: 0 });
  const formatStatus = (status: string) =>
    status.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase());

  return (
    <Animated.View style={[{ marginBottom: 12 }, entranceStyle, animatedStyle]}>
      <TouchableOpacity
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        style={{
          backgroundColor: colors.surfaceRaised,
          borderRadius: radius.lg,
          padding: 20,
          borderWidth: 1,
          borderColor: colors.border,
          ...shadows.card,
        }}
      >
        {/* Status + Amount row */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 11,
                backgroundColor: config.bg,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Ionicons name={config.icon} size={17} color={config.color} />
            </View>
            <View>
              <Text style={{ fontFamily: fonts.medium, fontSize: 10, color: colors.caption, textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 2 }}>
                Loan application
              </Text>
              <Text style={{ fontFamily: fonts.mono, fontSize: 15, color: colors.ink, letterSpacing: -0.2 }}>
                {formatCurrency(loan.approved_amount || loan.requested_amount)}
              </Text>
            </View>
          </View>
          <View style={{ backgroundColor: config.bg, borderRadius: radius.xs, paddingHorizontal: 10, paddingVertical: 4 }}>
            <Text style={{ fontFamily: fonts.medium, fontSize: 10, color: config.color }}>
              {formatStatus(loan.status)}
            </Text>
          </View>
        </View>

        <Text style={[text.caption, { color: colors.body, marginBottom: 10 }]} numberOfLines={2}>
          {loan.purpose}
        </Text>

        <View style={{ flexDirection: 'row', gap: 16 }}>
          <Text style={{ fontFamily: fonts.mono, fontSize: 12, color: colors.caption }}>
            {loan.tenor_months} mo.
          </Text>
          {loan.interest_rate_annual && (
            <Text style={{ fontFamily: fonts.mono, fontSize: 12, color: colors.caption }}>
              {loan.interest_rate_annual}% p.a.
            </Text>
          )}
          {loan.monthly_amortization && (
            <Text style={{ fontFamily: fonts.mono, fontSize: 12, color: colors.caption }}>
              {formatCurrency(loan.monthly_amortization)}/mo
            </Text>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------
export default function AidScreen() {
  const [segment, setSegment] = useState<Segment>('Matches');
  const [loans, setLoans] = useState<LoanApplication[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const headerEntrance = useSpringEntrance({ delay: 0, distance: 12 });
  const segmentEntrance = useSpringEntrance({ delay: 100, distance: 8 });

  const fetchLoans = useCallback(async () => {
    try {
      const res = await client.get('/loans/my');
      if (res.data.success) {
        setLoans(res.data.loans);
      }
    } catch {
      // Graceful fallback
    }
  }, []);

  useEffect(() => { fetchLoans(); }, [fetchLoans]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchLoans();
    setRefreshing(false);
  }, [fetchLoans]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      {/* Header */}
      <Animated.View style={[{ paddingTop: 56, paddingHorizontal: spacing.screen, paddingBottom: 16 }, headerEntrance]}>
        <Text style={[text.h1, { color: colors.ink }]}>Aid & loans</Text>
      </Animated.View>

      {/* Segmented control */}
      <Animated.View style={[{ paddingHorizontal: spacing.screen, marginBottom: 8 }, segmentEntrance]}>
        <View
          style={{
            flexDirection: 'row',
            backgroundColor: colors.primaryMuted,
            borderRadius: radius.md,
            padding: 4,
          }}
        >
          {(['Matches', 'Applications'] as Segment[]).map((seg) => (
            <TouchableOpacity
              key={seg}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSegment(seg); }}
              activeOpacity={0.85}
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: radius.sm,
                backgroundColor: segment === seg ? colors.surfaceRaised : 'transparent',
                alignItems: 'center',
                ...(segment === seg ? shadows.card : {}),
              }}
            >
              <Text
                style={{
                  fontFamily: fonts.heading,
                  fontSize: 13,
                  color: segment === seg ? colors.primary : colors.body,
                }}
              >
                {seg}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>

      {/* Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.screen, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {segment === 'Matches' ? (
          MOCK_MATCHES.map((match, index) => (
            <MatchCard key={match.id} match={match} index={index} />
          ))
        ) : loans.length === 0 ? (
          <EmptyState
            icon="document-text-outline"
            title="No applications yet"
            description="Browse matches to find programs you qualify for, then apply."
          />
        ) : (
          loans.map((loan, index) => (
            <LoanCard key={loan.id} loan={loan} index={index} />
          ))
        )}
      </ScrollView>
    </View>
  );
}
