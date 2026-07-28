import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import Animated from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import client from '../api/client';
import { useSpringEntrance, useStaggeredEntry, usePressScale } from '../lib/animations';
import { colors, text, spacing, radius, shadows, fonts } from '../lib/theme';
import { SkeletonBusinessCard } from '../components/ui/Skeleton';
import StatusDot from '../components/ui/StatusDot';
import EmptyState from '../components/ui/EmptyState';
import * as Haptics from 'expo-haptics';

// ---------------------------------------------------------------------------
// Business card
// ---------------------------------------------------------------------------
function BizCard({ biz, index, onPress }: { biz: any; index: number; onPress: () => void }) {
  const { animatedStyle, handlePressIn, handlePressOut } = usePressScale(0.97);
  const entranceStyle = useStaggeredEntry(index, { delay: 70, distance: 14 });

  const statusColor = {
    Verified: { bg: colors.primaryMuted, text: colors.primary },
    Partial: { bg: colors.amberMuted, text: colors.amber },
  }[biz.status as string] ?? { bg: colors.borderSubtle, text: colors.caption };

  const completeness = biz.completeness ?? 0;

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
                {biz.business_name || biz.name}
              </Text>
              <Text style={[text.caption, { color: colors.body, marginTop: 2 }]}>
                {biz.business_type || biz.type}
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
            <Text style={{ fontFamily: fonts.mono, fontSize: 12, color: colors.primary }}>{completeness}%</Text>
          </View>
          <View style={{ height: 5, backgroundColor: colors.borderSubtle, borderRadius: 3 }}>
            <View style={{ height: 5, backgroundColor: colors.primary, borderRadius: 3, width: `${completeness}%` }} />
          </View>
        </View>

        {/* Match count — only shown when matches exist */}
        {(biz.matchCount || 0) > 0 && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <StatusDot variant="active" size={6} animate />
            <Text style={{ fontFamily: fonts.medium, fontSize: 12, color: colors.primary }}>
              {biz.matchCount} new {biz.matchCount === 1 ? 'match' : 'matches'} available
            </Text>
            <Ionicons name="chevron-forward" size={13} color={colors.primary} style={{ marginLeft: 'auto' }} />
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

import SmartAlert from '../components/ui/SmartAlert';

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------
export default function BusinessListScreen() {
  const navigation = useNavigation<any>();
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const matchCountRef = React.useRef(0);
  const isInitialLoad = React.useRef(true);
  const [alertVisible, setAlertVisible] = useState(false);

  const headerEntrance = useSpringEntrance({ delay: 0, distance: 12 });

  const fetchBusinesses = useCallback(async () => {
    try {
      const res = await client.get('/business-profiles/my');
      if (res.data.success) {
        const newData = res.data.businesses;
        setBusinesses(newData);
        
        const totalMatches = newData.reduce((acc: number, b: any) => acc + (b.matchCount || 0), 0);
        
        // If it's not the initial load and matches increased, trigger the alert
        if (!isInitialLoad.current && totalMatches > matchCountRef.current) {
          setAlertVisible(true);
        }
        
        matchCountRef.current = totalMatches;
        isInitialLoad.current = false;
      }
    } catch (err) {
      console.error('Failed to fetch businesses:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { 
    fetchBusinesses();
    
    // Poll every 3 seconds to check for new loan matches
    const intervalId = setInterval(() => {
      fetchBusinesses();
    }, 3000);

    return () => clearInterval(intervalId);
  }, [fetchBusinesses]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchBusinesses();
    setRefreshing(false);
  }, [fetchBusinesses]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <SmartAlert 
        visible={alertVisible} 
        title="Match Found!" 
        message="You have new government loan offers from LANDBANK/DBP." 
        onClose={() => setAlertVisible(false)} 
        autoHideMs={6000}
      />
      {/* Header */}
      <Animated.View
        style={[
          {
            flexDirection: 'row',
            alignItems: 'center',
            paddingTop: 56,
            paddingHorizontal: spacing.screen,
            paddingBottom: 18,
            backgroundColor: colors.surfaceRaised,
            borderBottomWidth: 1,
            borderBottomColor: colors.borderSubtle,
          },
          headerEntrance,
        ]}
      >
        <Ionicons
          name="arrow-back"
          size={22}
          color={colors.ink}
          onPress={() => navigation.goBack()}
          style={{ marginRight: 14, padding: 4 }}
        />
        <Text style={[text.h3, { color: colors.ink }]}>Your businesses</Text>
      </Animated.View>

      <ScrollView
        contentContainerStyle={{ padding: spacing.screen, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {loading ? (
          <>
            <SkeletonBusinessCard />
            <SkeletonBusinessCard />
            <SkeletonBusinessCard />
          </>
        ) : businesses.length === 0 ? (
          <EmptyState
            icon="storefront-outline"
            title="No businesses registered"
            description="Register your first business to start accessing loans, grants, and other programs."
          />
        ) : (
          businesses.map((biz, index) => (
            <BizCard
              key={biz.id || index}
              biz={biz}
              index={index}
              onPress={() => navigation.navigate('BusinessDetails', { businessId: biz.id })}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}
