import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSpringEntrance, useStaggeredEntry, usePressScale } from '../lib/animations';
import { colors, text, spacing, radius, shadows, fonts } from '../lib/theme';
import PressableButton from '../components/ui/PressableButton';
import StatusDot from '../components/ui/StatusDot';
import * as Haptics from 'expo-haptics';

interface DocCheck {
  id: string;
  name: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  status: 'checking' | 'on_file' | 'needed';
}

const INITIAL_DOCS: DocCheck[] = [
  { id: '1', name: 'Philippine National ID', icon: 'card-outline', status: 'checking' },
  { id: '2', name: 'DTI Registration', icon: 'business-outline', status: 'checking' },
  { id: '3', name: 'BIR TIN Certificate', icon: 'receipt-outline', status: 'checking' },
  { id: "4", name: "Mayor's Business Permit", icon: 'ribbon-outline', status: 'checking' },
  { id: '5', name: 'Barangay Clearance', icon: 'shield-checkmark-outline', status: 'checking' },
  { id: '6', name: 'Financial Statements', icon: 'bar-chart-outline', status: 'checking' },
];

function DocCheckRow({ doc, index, isChecking }: { doc: DocCheck; index: number; isChecking: boolean }) {
  const { animatedStyle, handlePressIn, handlePressOut } = usePressScale(0.98);
  const entranceStyle = useStaggeredEntry(index, { delay: 100, distance: 10 });

  const statusBg =
    doc.status === 'on_file'
      ? '#F0FDF4'
      : doc.status === 'needed'
      ? colors.amberMuted
      : colors.surface;

  return (
    <Animated.View style={[entranceStyle, animatedStyle]}>
      <TouchableOpacity
        onPressIn={doc.status === 'needed' ? handlePressIn : undefined}
        onPressOut={doc.status === 'needed' ? handlePressOut : undefined}
        activeOpacity={1}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 16,
          paddingHorizontal: 16,
          borderBottomWidth: 1,
          borderBottomColor: colors.borderSubtle,
        }}
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
            borderWidth: doc.status === 'checking' ? 1 : 0,
            borderColor: colors.border,
          }}
        >
          {doc.status === 'checking' ? (
            <StatusDot variant="pending" size={6} animate />
          ) : doc.status === 'on_file' ? (
            <Animated.View entering={ZoomIn.duration(300)}>
              <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
            </Animated.View>
          ) : (
            <Animated.View entering={ZoomIn.duration(300)}>
              <Ionicons name="cloud-upload-outline" size={18} color={colors.amber} />
            </Animated.View>
          )}
        </View>

        <View style={{ flex: 1 }}>
          <Text style={[text.label, { color: colors.ink, marginBottom: 2 }]}>{doc.name}</Text>
          {doc.status === 'on_file' && (
            <Text style={{ fontFamily: fonts.sans, fontSize: 11, color: '#16A34A' }}>✓ Verified via eGovPH</Text>
          )}
          {doc.status === 'needed' && (
            <Text style={{ fontFamily: fonts.sans, fontSize: 11, color: colors.amber }}>Upload required</Text>
          )}
          {doc.status === 'checking' && isChecking && (
            <Text style={{ fontFamily: fonts.sans, fontSize: 11, color: colors.primary }}>Checking eGovPH records...</Text>
          )}
        </View>

        {doc.status === 'needed' && (
          <View
            style={{
              backgroundColor: colors.amber,
              borderRadius: radius.xs,
              paddingHorizontal: 10,
              paddingVertical: 6,
            }}
          >
            <Text style={{ fontFamily: fonts.medium, fontSize: 11, color: colors.white }}>Upload</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function ScanScreen() {
  const [docs, setDocs] = useState<DocCheck[]>(INITIAL_DOCS);
  const [isChecking, setIsChecking] = useState(false);
  const [checkComplete, setCheckComplete] = useState(false);

  const headerEntrance = useSpringEntrance({ delay: 0, distance: 12 });
  const listEntrance = useSpringEntrance({ delay: 120, distance: 14 });
  const summaryEntrance = useSpringEntrance({ delay: 0, distance: 10 });

  const startCheck = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsChecking(true);
    setCheckComplete(false);
    setDocs(INITIAL_DOCS);

    const results: ('on_file' | 'needed')[] = ['on_file', 'on_file', 'on_file', 'on_file', 'needed', 'needed'];

    results.forEach((result, index) => {
      setTimeout(() => {
        setDocs((prev) => prev.map((d, i) => (i === index ? { ...d, status: result } : d)));
        if (index === results.length - 1) {
          setIsChecking(false);
          setCheckComplete(true);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }, 500 + index * 400);
    });
  };

  const onFileCount = docs.filter((d) => d.status === 'on_file').length;
  const neededCount = docs.filter((d) => d.status === 'needed').length;

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <Animated.View style={[{ paddingTop: 56, paddingHorizontal: spacing.screen, paddingBottom: 16 }, headerEntrance]}>
        <Text style={[text.h1, { color: colors.ink }]}>Document check</Text>
        <Text style={[text.body, { color: colors.body, marginTop: 4, lineHeight: 22 }]}>
          We'll check which documents eGovPH already has on file — no resubmitting.
        </Text>
      </Animated.View>

      <ScrollView contentContainerStyle={{ padding: spacing.screen, paddingBottom: 40 }}>
        <Animated.View style={listEntrance}>
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
            {docs.map((doc, index) => (
              <DocCheckRow key={doc.id} doc={doc} index={index} isChecking={isChecking} />
            ))}
          </View>
        </Animated.View>

        {checkComplete && (
          <Animated.View style={[{ marginTop: 24 }, summaryEntrance]}>
            <View
              style={{
                backgroundColor: colors.primaryMuted,
                borderRadius: radius.md,
                padding: 16,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: colors.surfaceRaised,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Ionicons name="analytics-outline" size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[text.label, { color: colors.ink }]}>
                  {onFileCount} on file, {neededCount} needed
                </Text>
                <Text style={[text.caption, { color: colors.body, marginTop: 2 }]}>
                  Upload remaining docs to unlock more programs
                </Text>
              </View>
            </View>
          </Animated.View>
        )}

        <Animated.View style={{ marginTop: 24 }}>
          <PressableButton
            onPress={startCheck}
            label={isChecking ? 'Checking eGovPH records...' : checkComplete ? 'Re-check documents' : 'Check my documents'}
            icon={isChecking ? 'hourglass-outline' : 'scan-outline'}
            variant={isChecking ? 'secondary' : 'primary'}
            size="lg"
            disabled={isChecking}
          />
        </Animated.View>
      </ScrollView>
    </View>
  );
}
