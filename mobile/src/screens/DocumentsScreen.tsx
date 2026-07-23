import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import client from '../api/client';

interface DocumentItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  verified: boolean;
  verifiedSource?: string;
  uploading?: boolean;
}

const INITIAL_DOCUMENTS: DocumentItem[] = [
  {
    id: '1',
    name: 'Philippine National ID',
    description: 'PhilSys-issued identification card',
    icon: 'card',
    verified: true,
    verifiedSource: 'eVerify / PhilSys',
  },
  {
    id: '2',
    name: 'DTI Business Registration',
    description: 'Certificate of Business Name Registration',
    icon: 'business',
    verified: true,
    verifiedSource: 'DTI Registry',
  },
  {
    id: '3',
    name: 'BIR Tax Registration (TIN)',
    description: 'Certificate of Registration (Form 2303)',
    icon: 'receipt',
    verified: true,
    verifiedSource: 'BIR TIN Masterlist',
  },
  {
    id: '4',
    name: 'LGU Mayor\'s Business Permit',
    description: 'Local government business permit',
    icon: 'ribbon',
    verified: true,
    verifiedSource: 'LGU Registry',
  },
  {
    id: '5',
    name: 'Barangay Clearance',
    description: 'Community-level business clearance',
    icon: 'shield-checkmark',
    verified: false,
  },
  {
    id: '6',
    name: 'Financial Statements',
    description: 'Annual Income Tax Return or informal records',
    icon: 'bar-chart',
    verified: false,
  },
  {
    id: '7',
    name: 'Proof of Business Address',
    description: 'Utility bill or lease contract',
    icon: 'location',
    verified: false,
  },
];

export default function DocumentsScreen() {
  const [documents, setDocuments] = useState<DocumentItem[]>(INITIAL_DOCUMENTS);
  const verifiedCount = documents.filter(d => d.verified).length;

  const handleUpload = async (docId: string, docName: string) => {
    // Set uploading state
    setDocuments(prev => prev.map(d => d.id === docId ? { ...d, uploading: true } : d));
    
    try {
      const res = await client.post('/documents/upload', { documentType: docName });
      
      if (res.data.success) {
        setDocuments(prev => prev.map(d => 
          d.id === docId 
            ? { ...d, verified: true, verifiedSource: res.data.document.verifiedSource, uploading: false } 
            : d
        ));
      } else {
        setDocuments(prev => prev.map(d => d.id === docId ? { ...d, uploading: false } : d));
        Alert.alert('Upload Failed', res.data.message);
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      setDocuments(prev => prev.map(d => d.id === docId ? { ...d, uploading: false } : d));
      Alert.alert('Error', 'Failed to upload document.');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      {/* Header */}
      <View style={{ paddingTop: 56, paddingHorizontal: 24, paddingBottom: 16 }}>
        <Animated.View entering={FadeInDown.duration(400)}>
          <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 24, color: '#1A1A1A' }}>
            Documents
          </Text>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: '#4A4A4A', marginTop: 4 }}>
            Shared document vault across all businesses
          </Text>
        </Animated.View>
      </View>

      {/* Summary bar */}
      <Animated.View entering={FadeInDown.delay(100).duration(400)} style={{ paddingHorizontal: 24, marginBottom: 8 }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#EFF1FD',
          borderRadius: 12,
          padding: 14,
          gap: 10,
          overflow: 'hidden',
        }}>
          {/* eGovPH flag accent bar */}
          <View style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            flexDirection: 'row',
          }}>
            <View style={{ flex: 1, backgroundColor: '#1740DE' }} />
            <View style={{ flex: 1, backgroundColor: '#E63B27' }} />
            <View style={{ flex: 1, backgroundColor: '#FCD116' }} />
          </View>
          
          <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' }}>
            <Ionicons name="checkmark-done" size={18} color="#1740DE" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 13, color: '#1A1A1A' }}>
              {verifiedCount} of {documents.length} documents verified
            </Text>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: '#4A4A4A', marginTop: 1 }}>
              Upload missing documents to unlock more programs
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* Document list */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24, paddingTop: 12, paddingBottom: 32 }}>
        {documents.map((doc, index) => (
          <Animated.View key={doc.id} entering={FadeInRight.delay(150 + index * 60).duration(350)}>
            <TouchableOpacity
              activeOpacity={doc.verified || doc.uploading ? 1 : 0.7}
              onPress={() => {
                if (!doc.verified && !doc.uploading) {
                  handleUpload(doc.id, doc.name);
                }
              }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 16,
                borderBottomWidth: index < documents.length - 1 ? 1 : 0,
                borderBottomColor: '#F3F4F6',
              }}
            >
              {/* Icon container */}
              <View style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: doc.verified ? '#EFF1FD' : '#FEF3E2',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 14,
              }}>
                <Ionicons
                  name={doc.icon as any}
                  size={22}
                  color={doc.verified ? '#1740DE' : '#D99C45'}
                />
              </View>

              {/* Text */}
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: '#1A1A1A' }}>
                  {doc.name}
                </Text>
                <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: '#4A4A4A', marginTop: 1 }}>
                  {doc.description}
                </Text>
                {doc.verified && doc.verifiedSource && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 }}>
                    <Ionicons name="checkmark-circle" size={13} color="#16A34A" />
                    <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: '#16A34A' }}>
                      Verified via {doc.verifiedSource}
                    </Text>
                  </View>
                )}
              </View>

              {/* Right action */}
              {doc.verified ? (
                <TouchableOpacity style={{ paddingLeft: 8 }}>
                  <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: '#1740DE' }}>
                    View
                  </Text>
                </TouchableOpacity>
              ) : doc.uploading ? (
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#FEF3E2',
                  borderRadius: 8,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  gap: 4,
                }}>
                  <ActivityIndicator size="small" color="#D99C45" />
                  <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 11, color: '#D99C45' }}>
                    Uploading...
                  </Text>
                </View>
              ) : (
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#FEF3E2',
                  borderRadius: 8,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  gap: 4,
                }}>
                  <Ionicons name="cloud-upload" size={14} color="#D99C45" />
                  <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 11, color: '#D99C45' }}>
                    Upload
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>
        ))}
      </ScrollView>
    </View>
  );
}
