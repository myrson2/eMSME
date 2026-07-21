import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown, FadeInRight, ZoomIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

interface DocCheck {
  id: string;
  name: string;
  icon: string;
  status: 'checking' | 'on_file' | 'needed';
}

const INITIAL_DOCS: DocCheck[] = [
  { id: '1', name: 'Philippine National ID', icon: 'card', status: 'checking' },
  { id: '2', name: 'DTI Registration', icon: 'business', status: 'checking' },
  { id: '3', name: 'BIR TIN Certificate', icon: 'receipt', status: 'checking' },
  { id: '4', name: 'Mayor\'s Business Permit', icon: 'ribbon', status: 'checking' },
  { id: '5', name: 'Barangay Clearance', icon: 'shield-checkmark', status: 'checking' },
  { id: '6', name: 'Financial Statements', icon: 'bar-chart', status: 'checking' },
];

export default function ScanScreen() {
  const [docs, setDocs] = useState<DocCheck[]>(INITIAL_DOCS);
  const [isChecking, setIsChecking] = useState(false);
  const [checkComplete, setCheckComplete] = useState(false);

  const startCheck = () => {
    setIsChecking(true);
    setCheckComplete(false);
    setDocs(INITIAL_DOCS);

    // Simulate progressive eGovPH/eVerify check
    const results: ('on_file' | 'needed')[] = ['on_file', 'on_file', 'on_file', 'on_file', 'needed', 'needed'];

    results.forEach((result, index) => {
      setTimeout(() => {
        setDocs(prev => prev.map((d, i) => i === index ? { ...d, status: result } : d));
        if (index === results.length - 1) {
          setIsChecking(false);
          setCheckComplete(true);
        }
      }, 500 + index * 400);
    });
  };

  const onFileCount = docs.filter(d => d.status === 'on_file').length;
  const neededCount = docs.filter(d => d.status === 'needed').length;

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      {/* Header */}
      <View style={{ paddingTop: 56, paddingHorizontal: 24, paddingBottom: 16 }}>
        <Animated.View entering={FadeInDown.duration(400)}>
          <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 24, color: '#1A1A1A' }}>
            Document Check
          </Text>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: '#4A4A4A', marginTop: 4 }}>
            We'll check which documents eGovPH already has on file — no resubmitting.
          </Text>
        </Animated.View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24, paddingTop: 8, paddingBottom: 40 }}>
        {/* Check-then-fill checklist */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 18,
            borderWidth: 1,
            borderColor: '#E2E5F0',
            overflow: 'hidden',
          }}>
            {docs.map((doc, index) => (
              <Animated.View
                key={doc.id}
                entering={FadeInRight.delay(200 + index * 80).duration(300)}
              >
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 16,
                  paddingHorizontal: 18,
                  borderBottomWidth: index < docs.length - 1 ? 1 : 0,
                  borderBottomColor: '#F3F4F6',
                }}>
                  {/* Status indicator */}
                  <View style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor:
                      doc.status === 'on_file' ? '#F0FDF4' :
                      doc.status === 'needed' ? '#FEF3E2' : '#EFF1FD',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 14,
                  }}>
                    {doc.status === 'checking' ? (
                      <Ionicons name="ellipsis-horizontal" size={16} color="#1740DE" />
                    ) : doc.status === 'on_file' ? (
                      <Animated.View entering={ZoomIn.duration(300)}>
                        <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
                      </Animated.View>
                    ) : (
                      <Animated.View entering={ZoomIn.duration(300)}>
                        <Ionicons name="cloud-upload" size={18} color="#D99C45" />
                      </Animated.View>
                    )}
                  </View>

                  {/* Doc info */}
                  <View style={{ flex: 1 }}>
                    <Text style={{
                      fontFamily: 'Inter_500Medium',
                      fontSize: 14,
                      color: doc.status === 'on_file' ? '#1A1A1A' : '#1A1A1A',
                    }}>
                      {doc.name}
                    </Text>
                    {doc.status === 'on_file' && (
                      <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: '#16A34A', marginTop: 2 }}>
                        ✓ Already verified via eGovPH
                      </Text>
                    )}
                    {doc.status === 'needed' && (
                      <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: '#D99C45', marginTop: 2 }}>
                        Upload required
                      </Text>
                    )}
                    {doc.status === 'checking' && isChecking && (
                      <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: '#1740DE', marginTop: 2 }}>
                        Checking eGovPH records...
                      </Text>
                    )}
                  </View>

                  {/* Upload button for needed docs */}
                  {doc.status === 'needed' && (
                    <TouchableOpacity
                      activeOpacity={0.7}
                      style={{
                        backgroundColor: '#1740DE',
                        borderRadius: 8,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderWidth: 1,
                        borderColor: 'rgba(252, 209, 22, 0.4)',
                      }}
                    >
                      <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 11, color: '#FFFFFF' }}>
                        Upload
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        {/* Summary after check */}
        {checkComplete && (
          <Animated.View entering={FadeInDown.duration(400)} style={{ marginTop: 20 }}>
            <View style={{
              backgroundColor: '#EFF1FD',
              borderRadius: 14,
              padding: 18,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
            }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name="analytics" size={22} color="#1740DE" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: '#1A1A1A' }}>
                  {onFileCount} on file, {neededCount} needed
                </Text>
                <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: '#4A4A4A', marginTop: 2 }}>
                  Upload remaining docs to unlock more programs
                </Text>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Action button */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)} style={{ marginTop: 24 }}>
          <TouchableOpacity
            onPress={startCheck}
            activeOpacity={0.85}
            disabled={isChecking}
            style={{
              backgroundColor: isChecking ? '#9CA3AF' : '#1740DE',
              borderRadius: 12,
              paddingVertical: 16,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 8,
              borderWidth: 1,
              borderColor: isChecking ? 'transparent' : 'rgba(252, 209, 22, 0.4)',
            }}
          >
            <Ionicons
              name={isChecking ? 'hourglass' : 'scan'}
              size={20}
              color={isChecking ? '#FFFFFF' : '#FCD116'}
            />
            <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 15, color: '#FFFFFF' }}>
              {isChecking ? 'Checking eGovPH records...' : checkComplete ? 'Re-check Documents' : 'Check My Documents'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
