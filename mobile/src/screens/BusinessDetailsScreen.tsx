import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import Animated from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import client from '../api/client';
import { useSpringEntrance, useStaggeredEntry } from '../lib/animations';
import { colors, text, spacing, radius, shadows, fonts } from '../lib/theme';
import { SkeletonCard, SkeletonText } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';

// ---------------------------------------------------------------------------
// Verification check row
// ---------------------------------------------------------------------------
function CheckRow({ check, isLast }: { check: any; isLast: boolean }) {
  const isPass = check.status === 'PASS';
  const agencyLabel: Record<string, string> = {
    DTI: 'Business Name Registry',
    SEC: 'Company Register',
    CDA: 'Cooperative Registry',
    BIR: 'Tax Identification',
    LGU: "Mayor's Permit",
  };

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: colors.borderSubtle,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 }}>
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            backgroundColor: isPass ? '#DCFCE7' : colors.signalMuted,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 12,
          }}
        >
          <Ionicons
            name={isPass ? 'checkmark' : 'close'}
            size={16}
            color={isPass ? '#16A34A' : colors.signal}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[text.label, { color: colors.ink }]}>
            {agencyLabel[check.agency] ?? check.agency}
          </Text>
          <Text style={[text.caption, { color: colors.caption, marginTop: 1 }]}>
            {check.agency}
          </Text>
        </View>
      </View>
      <View
        style={{
          backgroundColor: isPass ? '#DCFCE7' : colors.signalMuted,
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: radius.xs,
        }}
      >
        <Text style={{ fontFamily: fonts.medium, fontSize: 11, color: isPass ? '#16A34A' : colors.signal }}>
          {check.status}
        </Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------
export default function BusinessDetailsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { businessId } = route.params || {};

  const [business, setBusiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const headerEntrance = useSpringEntrance({ delay: 0, distance: 12 });
  const cardEntrance = useSpringEntrance({ delay: 120, distance: 16 });
  const checksEntrance = useSpringEntrance({ delay: 220, distance: 14 });

  useEffect(() => {
    if (!businessId) { setLoading(false); return; }
    client
      .get(`/business-profiles/${businessId}`)
      .then((res) => { if (res.data.success) setBusiness(res.data.business); })
      .catch((err) => console.error('Failed to load business details:', err))
      .finally(() => setLoading(false));
  }, [businessId]);

  const statusColor = {
    Verified: { bg: colors.primaryMuted, text: colors.primary },
    Partial: { bg: colors.amberMuted, text: colors.amber },
  }[business?.status as string] ?? { bg: colors.borderSubtle, text: colors.caption };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
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
        <Text style={[text.h3, { color: colors.ink }]}>Business details</Text>
      </Animated.View>

      {loading ? (
        <ScrollView contentContainerStyle={{ padding: spacing.screen }}>
          <SkeletonCard height={120} style={{ marginBottom: 20 }} />
          <SkeletonText width="50%" height={18} style={{ marginBottom: 16 }} />
          <SkeletonCard height={200} />
        </ScrollView>
      ) : !business ? (
        <EmptyState icon="storefront-outline" title="Business not found" description="The requested business profile could not be loaded." />
      ) : (
        <ScrollView contentContainerStyle={{ padding: spacing.screen, paddingBottom: 40 }}>
          {/* Business card */}
          <Animated.View
            style={[
              {
                backgroundColor: colors.surfaceRaised,
                borderRadius: radius.lg,
                padding: 20,
                marginBottom: 20,
                borderWidth: 1,
                borderColor: colors.border,
                ...shadows.card,
              },
              cardEntrance,
            ]}
          >
            <Text style={[text.h3, { color: colors.ink, marginBottom: 5 }]}>
              {business.business_name}
            </Text>
            <Text style={[text.body, { color: colors.body }]}>
              {business.business_type} · Reg: {business.registration_number}
            </Text>
            <View
              style={{
                marginTop: 14,
                alignSelf: 'flex-start',
                backgroundColor: statusColor.bg,
                borderRadius: radius.xs,
                paddingHorizontal: 12,
                paddingVertical: 6,
              }}
            >
              <Text style={{ fontFamily: fonts.medium, fontSize: 12, color: statusColor.text }}>
                {business.status}
              </Text>
            </View>
          </Animated.View>

          {/* Verification checks */}
          <Animated.View style={checksEntrance}>
            <Text style={[text.h4, { color: colors.ink, marginBottom: 12 }]}>
              Verification checks
            </Text>
            <View
              style={{
                backgroundColor: colors.surfaceRaised,
                borderRadius: radius.lg,
                borderWidth: 1,
                borderColor: colors.border,
                overflow: 'hidden',
                ...shadows.card,
              }}
            >
              {business.verification_checks_json?.length > 0 ? (
                business.verification_checks_json.map((check: any, idx: number) => (
                  <CheckRow
                    key={idx}
                    check={check}
                    isLast={idx === business.verification_checks_json.length - 1}
                  />
                ))
              ) : (
                <View style={{ padding: 24, alignItems: 'center' }}>
                  <Text style={[text.body, { color: colors.caption, textAlign: 'center' }]}>
                    No verification checks available.
                  </Text>
                </View>
              )}
            </View>
          </Animated.View>
        </ScrollView>
      )}
    </View>
  );
}
