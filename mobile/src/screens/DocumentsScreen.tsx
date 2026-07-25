import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import Animated from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import client from '../api/client';
import { useSpringEntrance, useStaggeredEntry, usePressScale } from '../lib/animations';
import { colors, text, spacing, radius, shadows, fonts } from '../lib/theme';
import FlagAccent from '../components/ui/FlagAccent';
import StatusDot from '../components/ui/StatusDot';
import * as Haptics from 'expo-haptics';

interface DocumentItem {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  verified: boolean;
  verifiedSource?: string;
  uploading?: boolean;
}

const INITIAL_DOCUMENTS: DocumentItem[] = [
  { id: '1', name: 'Philippine National ID', description: 'PhilSys-issued identification card', icon: 'card-outline', verified: true, verifiedSource: 'eVerify / PhilSys' },
  { id: '2', name: 'DTI Business Registration', description: 'Certificate of Business Name Registration', icon: 'business-outline', verified: true, verifiedSource: 'DTI Registry' },
  { id: '3', name: 'BIR Tax Registration (TIN)', description: 'Certificate of Registration (Form 2303)', icon: 'receipt-outline', verified: true, verifiedSource: 'BIR TIN Masterlist' },
  { id: '4', name: "LGU Mayor's Business Permit", description: 'Local government business permit', icon: 'ribbon-outline', verified: true, verifiedSource: 'LGU Registry' },
  { id: '5', name: 'Barangay Clearance', description: 'Community-level business clearance', icon: 'shield-checkmark-outline', verified: false },
  { id: '6', name: 'Financial Statements', description: 'Annual Income Tax Return or informal records', icon: 'bar-chart-outline', verified: false },
  { id: '7', name: 'Proof of Business Address', description: 'Utility bill or lease contract', icon: 'location-outline', verified: false },
];

// ---------------------------------------------------------------------------
// Document row
// ---------------------------------------------------------------------------
function DocRow({ doc, index, onUpload }: { doc: DocumentItem; index: number; onUpload: (id: string, name: string) => void }) {
  const { animatedStyle, handlePressIn, handlePressOut } = usePressScale(0.98);
  const entranceStyle = useStaggeredEntry(index, { delay: 60, distance: 10 });

  return (
    <Animated.View style={[entranceStyle, animatedStyle]}>
      <TouchableOpacity
        onPress={() => { if (!doc.verified && !doc.uploading) { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onUpload(doc.id, doc.name); } }}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
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
        {/* Icon */}
        <View
          style={{
            width: 42,
            height: 42,
            borderRadius: 13,
            backgroundColor: doc.verified ? colors.primaryMuted : colors.amberMuted,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 14,
          }}
        >
          <Ionicons name={doc.icon} size={20} color={doc.verified ? colors.primary : colors.amber} />
        </View>

        {/* Text */}
        <View style={{ flex: 1 }}>
          <Text style={[text.label, { color: colors.ink, marginBottom: 2 }]}>{doc.name}</Text>
          <Text style={[text.caption, { color: colors.body }]}>{doc.description}</Text>
          {doc.verified && doc.verifiedSource && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 }}>
              <Ionicons name="checkmark-circle" size={12} color="#16A34A" />
              <Text style={{ fontFamily: fonts.sans, fontSize: 11, color: '#16A34A' }}>
                Verified via {doc.verifiedSource}
              </Text>
            </View>
          )}
        </View>

        {/* Action */}
        {doc.verified ? (
          <Text style={{ fontFamily: fonts.medium, fontSize: 12, color: colors.primary }}>View</Text>
        ) : doc.uploading ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.amberMuted, borderRadius: radius.xs, paddingHorizontal: 10, paddingVertical: 6 }}>
            <StatusDot variant="pending" size={6} />
            <Text style={{ fontFamily: fonts.medium, fontSize: 11, color: colors.amber }}>Uploading</Text>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.amberMuted, borderRadius: radius.xs, paddingHorizontal: 10, paddingVertical: 6 }}>
            <Ionicons name="cloud-upload-outline" size={13} color={colors.amber} />
            <Text style={{ fontFamily: fonts.medium, fontSize: 11, color: colors.amber }}>Upload</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------
export default function DocumentsScreen() {
  const [documents, setDocuments] = useState<DocumentItem[]>(INITIAL_DOCUMENTS);
  const verifiedCount = documents.filter((d) => d.verified).length;

  const headerEntrance = useSpringEntrance({ delay: 0, distance: 12 });
  const summaryEntrance = useSpringEntrance({ delay: 120, distance: 14 });

  const handleUpload = async (docId: string, docName: string) => {
    setDocuments((prev) => prev.map((d) => (d.id === docId ? { ...d, uploading: true } : d)));
    try {
      const res = await client.post('/documents/upload', { documentType: docName });
      if (res.data.success) {
        setDocuments((prev) =>
          prev.map((d) =>
            d.id === docId ? { ...d, verified: true, verifiedSource: res.data.document.verifiedSource, uploading: false } : d
          )
        );
      } else {
        setDocuments((prev) => prev.map((d) => (d.id === docId ? { ...d, uploading: false } : d)));
        Alert.alert('Upload failed', res.data.message);
      }
    } catch {
      setDocuments((prev) => prev.map((d) => (d.id === docId ? { ...d, uploading: false } : d)));
      Alert.alert('Error', 'Failed to upload document. Please try again.');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      {/* Header */}
      <Animated.View style={[{ paddingTop: 56, paddingHorizontal: spacing.screen, paddingBottom: 16 }, headerEntrance]}>
        <Text style={[text.h1, { color: colors.ink }]}>Documents</Text>
        <Text style={[text.body, { color: colors.body, marginTop: 4 }]}>
          Shared document vault across all businesses
        </Text>
      </Animated.View>

      {/* Summary bar */}
      <Animated.View style={[{ paddingHorizontal: spacing.screen, marginBottom: 8 }, summaryEntrance]}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.primaryMuted,
            borderRadius: radius.md,
            padding: 14,
            gap: 12,
            overflow: 'hidden',
            ...shadows.card,
          }}
        >
          <FlagAccent height={3} />
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 11,
              backgroundColor: colors.surfaceRaised,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Ionicons name="checkmark-done-outline" size={18} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[text.label, { color: colors.ink }]}>
              {verifiedCount} of {documents.length} documents verified
            </Text>
            <Text style={[text.caption, { color: colors.body, marginTop: 2 }]}>
              Upload missing documents to unlock more programs
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* Document list */}
      <ScrollView style={{ flex: 1 }}>
        <View
          style={{
            marginHorizontal: spacing.screen,
            marginTop: 12,
            marginBottom: 32,
            backgroundColor: colors.surfaceRaised,
            borderRadius: radius.lg,
            borderWidth: 1,
            borderColor: colors.border,
            overflow: 'hidden',
            ...shadows.card,
          }}
        >
          {documents.map((doc, index) => (
            <DocRow key={doc.id} doc={doc} index={index} onUpload={handleUpload} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
