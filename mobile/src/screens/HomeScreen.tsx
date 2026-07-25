import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import Animated from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import { useStaggeredEntry, useSpringEntrance, usePressScale } from '../lib/animations';
import { colors, text, spacing, radius, shadows, fonts } from '../lib/theme';
import FlagAccent from '../components/ui/FlagAccent';
import StatusDot from '../components/ui/StatusDot';
import { SkeletonMetricCard, SkeletonBusinessCard } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import * as Haptics from 'expo-haptics';

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

// ---------------------------------------------------------------------------
// Quick action tile — isolated press animation
// ---------------------------------------------------------------------------
interface ActionTileProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  color: string;
  bgColor: string;
  onPress: () => void;
  index: number;
}

function ActionTile({ icon, label, color, bgColor, onPress, index }: ActionTileProps) {
  const { animatedStyle, handlePressIn, handlePressOut } = usePressScale(0.94);
  const entranceStyle = useStaggeredEntry(index, { delay: 60 });

  return (
    <Animated.View style={[{ flex: 1 }, entranceStyle, animatedStyle]}>
      <TouchableOpacity
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(); }}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        style={{
          backgroundColor: bgColor,
          borderRadius: radius.md,
          paddingVertical: 16,
          alignItems: 'center',
          gap: 10,
          borderWidth: 1,
          borderColor: colors.borderSubtle,
        }}
      >
        <View
          style={{
            width: 42,
            height: 42,
            borderRadius: 13,   // squircle
            backgroundColor: colors.surfaceRaised,
            justifyContent: 'center',
            alignItems: 'center',
            ...shadows.card,
          }}
        >
          <Ionicons name={icon} size={20} color={color} />
        </View>
        <Text style={{ fontFamily: fonts.medium, fontSize: 12, color: colors.ink, textAlign: 'center' }}>
          {label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Business card — isolated press animation + staggered entry
// ---------------------------------------------------------------------------
interface BusinessCardProps {
  biz: BusinessInfo;
  index: number;
  onPress: () => void;
}

function BusinessCard({ biz, index, onPress }: BusinessCardProps) {
  const { animatedStyle, handlePressIn, handlePressOut } = usePressScale(0.97);
  const entranceStyle = useStaggeredEntry(index, { delay: 80, distance: 16 });

  const statusColor = {
    Verified: { bg: colors.primaryMuted, text: colors.primary },
    Partial: { bg: colors.amberMuted, text: colors.amber },
    Informal: { bg: colors.borderSubtle, text: colors.caption },
  }[biz.status];

  return (
    <Animated.View style={[{ marginBottom: 12 }, entranceStyle, animatedStyle]}>
      <TouchableOpacity
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(); }}
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
        {/* Top row */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 }}>
            {/* Squircle avatar */}
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                backgroundColor: colors.primaryMuted,
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 12,
              }}
            >
              <Ionicons name="storefront-outline" size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[text.h4, { color: colors.ink }]} numberOfLines={1}>
                {biz.name}
              </Text>
              <Text style={[text.caption, { color: colors.body, marginTop: 2 }]}>
                {biz.type}
              </Text>
            </View>
          </View>
          <View style={{ backgroundColor: statusColor.bg, borderRadius: radius.xs, paddingHorizontal: 10, paddingVertical: 4 }}>
            <Text style={{ fontFamily: fonts.medium, fontSize: 11, color: statusColor.text }}>
              {biz.status}
            </Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={{ marginBottom: 14 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
            <Text style={[text.caption, { color: colors.body }]}>Profile completeness</Text>
            <Text style={{ fontFamily: fonts.mono, fontSize: 12, color: colors.primary }}>
              {biz.completeness}%
            </Text>
          </View>
          <View style={{ height: 5, backgroundColor: colors.borderSubtle, borderRadius: 3 }}>
            <View
              style={{
                height: 5,
                backgroundColor: colors.primary,
                borderRadius: 3,
                width: `${biz.completeness}%`,
              }}
            />
          </View>
        </View>

        {/* Match count */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <StatusDot variant="active" size={6} animate />
          <Text style={{ fontFamily: fonts.medium, fontSize: 12, color: colors.primary }}>
            {biz.matchCount} new matches available
          </Text>
          <Ionicons name="chevron-forward" size={12} color={colors.primary} style={{ marginLeft: 'auto' }} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------
export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const [refreshing, setRefreshing] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [loanSummary, setLoanSummary] = useState<LoanSummary>({
    totalOutstanding: 0,
    activeCount: 0,
    totalDisbursed: 0,
  });
  const [businesses, setBusinesses] = useState<BusinessInfo[]>([]);

  const headerEntrance = useSpringEntrance({ delay: 0, distance: 0 });
  const summaryEntrance = useSpringEntrance({ delay: 160, distance: 20 });
  const actionsEntrance = useSpringEntrance({ delay: 280, distance: 16 });
  const alertEntrance = useSpringEntrance({ delay: 380, distance: 16 });
  const bizEntrance = useSpringEntrance({ delay: 460, distance: 16 });

  const formatCurrency = (amount: number) =>
    '₱' + amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const fetchDashboardData = useCallback(async () => {
    try {
      const loansRes = await client.get('/loans/my');
      if (loansRes.data.success && loansRes.data.loans?.length > 0) {
        const loans = loansRes.data.loans;
        const active = loans.filter((l: any) =>
          ['REPAYMENT_ACTIVE', 'APPROVED', 'DISBURSEMENT_PENDING'].includes(l.status)
        );
        const totalOutstanding = active.reduce(
          (sum: number, l: any) => sum + (l.approved_amount || l.requested_amount || 0),
          0
        );
        const totalDisbursed = loans
          .filter((l: any) => l.disbursed_at)
          .reduce((sum: number, l: any) => sum + (l.approved_amount || 0), 0);

        setLoanSummary({ totalOutstanding, activeCount: active.length, totalDisbursed });
      }
    } catch {
      // Best-effort — dashboard is informational
    }

    try {
      const bizRes = await client.get('/business-profiles/my');
      if (bizRes.data.success) {
        setBusinesses(
          bizRes.data.businesses.map((b: any) => ({
            id: b.id,
            name: b.business_name || b.name,
            type: b.business_type || b.type,
            status: b.status,
            completeness: b.completeness,
            matchCount: b.matchCount,
          }))
        );
      }
    } catch (err) {
      console.error('Failed to fetch businesses:', err);
    } finally {
      setLoadingData(false);
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

  const quickActions = [
    {
      icon: 'add-circle-outline' as const,
      label: 'Apply Loan',
      color: colors.primary,
      bgColor: colors.primaryMuted,
      action: () => navigation.navigate('ApplyLoan'),
    },
    {
      icon: 'document-attach-outline' as const,
      label: 'Upload Docs',
      color: colors.amber,
      bgColor: colors.amberMuted,
      action: () => navigation.navigate('Documents'),
    },
    {
      icon: 'chatbubble-ellipses-outline' as const,
      label: 'eGov AI',
      color: colors.primary,
      bgColor: colors.primaryMuted,
      action: () => navigation.navigate('EGovAI'),
    },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.surface }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    >
      {/* Header */}
      <Animated.View style={headerEntrance}>
        <View
          style={{
            backgroundColor: colors.primary,
            paddingTop: Math.max(insets.top + 16, 52),
            paddingBottom: 40,
            paddingHorizontal: spacing.screen,
            borderBottomLeftRadius: 28,
            borderBottomRightRadius: 28,
            overflow: 'hidden',
          }}
        >
          {/* Top row: wordmark + bell */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <Text style={{ fontFamily: fonts.display, fontSize: 20, color: colors.white, letterSpacing: -0.5 }}>
              eMSME
            </Text>
            <TouchableOpacity
              style={{
                width: 40,
                height: 40,
                borderRadius: 13,
                backgroundColor: 'rgba(255,255,255,0.12)',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.15)',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Ionicons name="notifications-outline" size={20} color={colors.white} />
              <View
                style={{
                  position: 'absolute',
                  top: 9,
                  right: 10,
                  width: 7,
                  height: 7,
                  borderRadius: 4,
                  backgroundColor: colors.signal,
                  borderWidth: 1.5,
                  borderColor: colors.primary,
                }}
              />
            </TouchableOpacity>
          </View>

          {/* Greeting — no emoji */}
          <Text style={{ fontFamily: fonts.display, fontSize: 26, color: colors.white, marginBottom: 4, letterSpacing: -0.5 }}>
            Hello, {user?.name?.split(' ')[0] || 'User'}
          </Text>
          <Text style={{ fontFamily: fonts.sans, fontSize: 14, color: 'rgba(255,255,255,0.65)' }}>
            Welcome back to your MSME dashboard
          </Text>
        </View>
      </Animated.View>

      {/* Summary Card — overlapping header, double-bezel style */}
      <Animated.View style={[{ paddingHorizontal: spacing.screen, marginTop: -20 }, summaryEntrance]}>
        {loadingData ? (
          <SkeletonMetricCard />
        ) : (
          <View
            style={{
              backgroundColor: colors.surfaceRaised,
              borderRadius: radius.lg,
              padding: 20,
              borderWidth: 1,
              borderColor: colors.border,
              ...shadows.cardElevated,
              overflow: 'hidden',
            }}
          >
            <FlagAccent height={3} />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 8 }}>
              {/* Outstanding */}
              <View style={{ flex: 1, marginRight: 16 }}>
                <Text style={{ fontFamily: fonts.medium, fontSize: 10, color: colors.caption, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>
                  Outstanding
                </Text>
                <Text style={{ fontFamily: fonts.mono, fontSize: 22, color: colors.ink, letterSpacing: -0.5 }}>
                  {formatCurrency(loanSummary.totalOutstanding)}
                </Text>
                <Text style={[text.caption, { color: colors.body, marginTop: 4 }]}>
                  {loanSummary.activeCount} active loan{loanSummary.activeCount !== 1 ? 's' : ''}
                </Text>
              </View>

              {/* Divider */}
              <View style={{ width: 1, backgroundColor: colors.borderSubtle, marginVertical: 4 }} />

              {/* Disbursed */}
              <View style={{ flex: 1, marginLeft: 16 }}>
                <Text style={{ fontFamily: fonts.medium, fontSize: 10, color: colors.caption, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>
                  Disbursed
                </Text>
                <Text style={{ fontFamily: fonts.mono, fontSize: 22, color: colors.ink, letterSpacing: -0.5 }}>
                  {formatCurrency(loanSummary.totalDisbursed)}
                </Text>
                <Text style={[text.caption, { color: colors.body, marginTop: 4 }]}>
                  Total received
                </Text>
              </View>
            </View>
          </View>
        )}
      </Animated.View>

      {/* Quick Actions */}
      <Animated.View style={[{ paddingHorizontal: spacing.screen, marginTop: 28 }, actionsEntrance]}>
        <Text style={[text.h4, { color: colors.ink, marginBottom: 14 }]}>
          Quick actions
        </Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {quickActions.map((action, index) => (
            <ActionTile
              key={action.label}
              icon={action.icon}
              label={action.label}
              color={action.color}
              bgColor={action.bgColor}
              onPress={action.action}
              index={index}
            />
          ))}
        </View>
      </Animated.View>

      {/* Smart Alert */}
      <Animated.View style={[{ paddingHorizontal: spacing.screen, marginTop: 28 }, alertEntrance]}>
        <Text style={[text.h4, { color: colors.ink, marginBottom: 14 }]}>
          Smart alerts
        </Text>
        <TouchableOpacity
          activeOpacity={0.85}
          style={{
            backgroundColor: colors.amberMuted,
            borderRadius: radius.lg,
            padding: 18,
            borderWidth: 1,
            borderColor: `${colors.amber}40`,
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: 14,
            ...shadows.amber,
          }}
        >
          <View
            style={{
              width: 42,
              height: 42,
              borderRadius: 13,
              backgroundColor: colors.surfaceRaised,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Ionicons name="flash-outline" size={20} color={colors.amber} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 5 }}>
              <Text style={[text.label, { color: colors.ink }]}>
                New grant available
              </Text>
              <View style={{ backgroundColor: colors.amber, borderRadius: radius.xs, paddingHorizontal: 6, paddingVertical: 2 }}>
                <Text style={{ fontFamily: fonts.medium, fontSize: 9, color: colors.white, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Match
                </Text>
              </View>
            </View>
            <Text style={[text.body, { color: colors.body, lineHeight: 20 }]}>
              Your <Text style={{ fontFamily: fonts.medium, color: colors.ink }}>Retail & Wholesale</Text> business qualifies for the DTI Livelihood Seeding Program.
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 4 }}>
              <Text style={{ fontFamily: fonts.medium, fontSize: 12, color: colors.amber }}>
                View details
              </Text>
              <Ionicons name="arrow-forward" size={13} color={colors.amber} />
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* Business List */}
      <Animated.View style={[{ paddingHorizontal: spacing.screen, marginTop: 28, paddingBottom: 32 }, bizEntrance]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <Text style={[text.h4, { color: colors.ink }]}>
            Your businesses
          </Text>
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}
            onPress={() => navigation.navigate('BusinessList')}
          >
            <Text style={{ fontFamily: fonts.medium, fontSize: 13, color: colors.primary }}>
              View all
            </Text>
            <Ionicons name="chevron-forward" size={14} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {loadingData ? (
          <>
            <SkeletonBusinessCard />
            <SkeletonBusinessCard />
          </>
        ) : businesses.length === 0 ? (
          <EmptyState
            icon="storefront-outline"
            title="No businesses yet"
            description="Register your first business to start accessing loans and grants."
            actionLabel="Register a business"
            onAction={() => navigation.navigate('BusinessList')}
          />
        ) : (
          businesses.map((biz, index) => (
            <BusinessCard
              key={biz.id}
              biz={biz}
              index={index}
              onPress={() => navigation.navigate('BusinessDetails', { businessId: biz.id })}
            />
          ))
        )}
      </Animated.View>
    </ScrollView>
  );
}
