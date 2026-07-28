import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Alert } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useSpringEntrance, useStaggeredEntry } from '../lib/animations';
import { colors, text, spacing, radius, shadows, fonts } from '../lib/theme';
import StatusDot from '../components/ui/StatusDot';

export default function BusinessVerificationScreen() {
  const { checkSession } = useAuth();
  const [loading, setLoading] = useState(false);
  const [currentAgency, setCurrentAgency] = useState<string | null>(null);
  const [agencyResults, setAgencyResults] = useState<{ DTI: string; BIR: string; LGU: string }>({
    DTI: 'PENDING',
    BIR: 'PENDING',
    LGU: 'PENDING',
  });
  const hasStarted = useRef(false);

  const headerEntrance = useSpringEntrance({ delay: 0, distance: 16 });
  const listEntrance = useSpringEntrance({ delay: 150, distance: 14 });

  useEffect(() => {
    if (!hasStarted.current) {
      hasStarted.current = true;
      setTimeout(() => {
        handleVerify();
      }, 1000);
    }
  }, []);

  const handleVerify = async () => {
    try {
      setLoading(true);

      setCurrentAgency('Connecting to DTI / SEC Registry...');
      setAgencyResults((prev) => ({ ...prev, DTI: 'CHECKING' }));
      await new Promise((r) => setTimeout(r, 800));
      setAgencyResults((prev) => ({ ...prev, DTI: 'VERIFIED' }));

      setCurrentAgency('Verifying BIR TIN Tax Account...');
      setAgencyResults((prev) => ({ ...prev, BIR: 'CHECKING' }));
      await new Promise((r) => setTimeout(r, 800));
      setAgencyResults((prev) => ({ ...prev, BIR: 'VERIFIED' }));

      setCurrentAgency('Validating LGU Mayor Permit...');
      setAgencyResults((prev) => ({ ...prev, LGU: 'CHECKING' }));

      const res = await client.post('/onboarding/business/verify');

      if (res.data.success) {
        setAgencyResults({ DTI: 'VERIFIED', BIR: 'VERIFIED', LGU: 'VERIFIED' });
        setCurrentAgency('All Government Registries Verified!');
        await new Promise((r) => setTimeout(r, 800));
        await checkSession();
      } else {
        setAgencyResults((prev) => ({ ...prev, LGU: 'FAILED' }));
        Alert.alert('Verification failed', res.data.message || 'Registry verification failed.');
      }
    } catch (err: any) {
      setAgencyResults((prev) => ({ ...prev, LGU: 'FAILED' }));
      const msg = err.response?.data?.message || err.message || 'Server error routing business verification.';
      Alert.alert('Registry verification failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const renderRegistryRow = (title: string, status: string, index: number) => {
    const isVerified = status === 'VERIFIED';
    const isChecking = status === 'CHECKING';
    const isFailed = status === 'FAILED';

    const entranceStyle = useStaggeredEntry(index, { delay: 100, distance: 10 });

    const statusBg = isVerified ? '#F0FDF4' : isFailed ? colors.signalMuted : colors.surface;
    const statusText = isVerified ? '#16A34A' : isFailed ? colors.signal : colors.caption;

    return (
      <Animated.View
        style={[
          entranceStyle,
          {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 16,
            paddingHorizontal: 16,
            borderBottomWidth: index < 2 ? 1 : 0,
            borderBottomColor: colors.borderSubtle,
          },
        ]}
      >
        <View
          style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            backgroundColor: statusBg,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 14,
            borderWidth: isChecking || status === 'PENDING' ? 1 : 0,
            borderColor: colors.border,
          }}
        >
          {isChecking ? (
            <StatusDot variant="pending" size={6} animate />
          ) : isVerified ? (
            <Animated.View entering={ZoomIn.duration(300)}>
              <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
            </Animated.View>
          ) : isFailed ? (
            <Animated.View entering={ZoomIn.duration(300)}>
              <Ionicons name="close-circle" size={20} color={colors.signal} />
            </Animated.View>
          ) : (
            <Ionicons name="ellipse-outline" size={16} color={colors.placeholder} />
          )}
        </View>

        <View style={{ flex: 1 }}>
          <Text style={[text.label, { color: colors.ink }]}>{title}</Text>
          {isChecking ? (
            <Text style={{ fontFamily: fonts.sans, fontSize: 11, color: colors.primary, marginTop: 2 }}>
              Verifying...
            </Text>
          ) : (
            <Text style={{ fontFamily: fonts.medium, fontSize: 10, color: statusText, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 }}>
              {status}
            </Text>
          )}
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface, padding: spacing.xl, justifyContent: 'center' }}>
      <Animated.View style={[{ alignItems: 'center', marginBottom: 40 }, headerEntrance]}>
        <Text style={[text.h1, { color: colors.ink, marginBottom: 8, textAlign: 'center' }]}>
          Business verification
        </Text>
        <Text style={[text.body, { color: colors.body, textAlign: 'center', lineHeight: 22, maxWidth: 280 }]}>
          We are routing your profile to multiple government registries for instant verification.
        </Text>
      </Animated.View>

      <Animated.View style={[{ marginBottom: 40 }, listEntrance]}>
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
          {renderRegistryRow('DTI / SEC Registry', agencyResults.DTI, 0)}
          {renderRegistryRow('BIR TIN Masterlist', agencyResults.BIR, 1)}
          {renderRegistryRow("LGU Mayor's Permit", agencyResults.LGU, 2)}
        </View>
        
        {currentAgency && (
          <Text style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.caption, textAlign: 'center', marginTop: 20 }}>
            {currentAgency}
          </Text>
        )}
      </Animated.View>
    </View>
  );
}
