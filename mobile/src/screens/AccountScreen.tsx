import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

interface MenuItem {
  icon: string;
  label: string;
  subtitle?: string;
  color?: string;
  destructive?: boolean;
  onPress?: () => void;
}

export default function AccountScreen() {
  const { user, logout } = useAuth();

  const userName = user?.name || 'MSME User';
  const initials = userName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to log out of eMSME?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout },
      ]
    );
  };

  const menuSections: { title: string; items: MenuItem[] }[] = [
    {
      title: 'Account',
      items: [
        { icon: 'storefront', label: 'Business Profile', subtitle: 'Manage your registered businesses' },
        { icon: 'person', label: 'Personal Info', subtitle: 'Name, contact details, address' },
        { icon: 'shield-checkmark', label: 'Identity Verification', subtitle: 'PhilSys & biometric status' },
      ],
    },
    {
      title: 'Preferences',
      items: [
        { icon: 'notifications', label: 'Notifications', subtitle: 'Push notifications & alerts' },
        { icon: 'language', label: 'Language', subtitle: 'Filipino / English' },
      ],
    },
    {
      title: 'Support',
      items: [
        { icon: 'chatbubble-ellipses', label: 'Help & Support', subtitle: 'Chat with eGovAI assistant' },
        { icon: 'information-circle', label: 'About eMSME', subtitle: 'Version 1.0.0' },
        { icon: 'document-text', label: 'Terms & Privacy Policy' },
      ],
    },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#FFFFFF' }} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header */}
      <View style={{ paddingTop: 56, paddingHorizontal: 24, paddingBottom: 24 }}>
        <Animated.View entering={FadeInDown.duration(400)}>
          <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 24, color: '#1A1A1A' }}>
            Account
          </Text>
        </Animated.View>
      </View>

      {/* Profile Card */}
      <Animated.View entering={FadeInDown.delay(100).duration(400)} style={{ paddingHorizontal: 24, marginBottom: 24 }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#EFF1FD',
          borderRadius: 18,
          padding: 20,
          overflow: 'hidden',
        }}>
          {/* eGovPH flag accent bar */}
          <View style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            flexDirection: 'row',
          }}>
            <View style={{ flex: 1, backgroundColor: '#1740DE' }} />
            <View style={{ flex: 1, backgroundColor: '#E63B27' }} />
            <View style={{ flex: 1, backgroundColor: '#FCD116' }} />
          </View>

          {/* Avatar */}
          <View style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: '#1740DE',
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 16,
          }}>
            <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 20, color: '#FFFFFF' }}>
              {initials}
            </Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 17, color: '#1A1A1A' }}>
              {userName}
            </Text>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: '#4A4A4A', marginTop: 2 }}>
              eGovPH Verified Account
            </Text>
          </View>

          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 999,
            paddingHorizontal: 10,
            paddingVertical: 4,
          }}>
            <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 11, color: '#16A34A' }}>
              ✓ Active
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* Menu Sections */}
      {menuSections.map((section, sIndex) => (
        <Animated.View
          key={section.title}
          entering={FadeInDown.delay(200 + sIndex * 100).duration(400)}
          style={{ paddingHorizontal: 24, marginBottom: 24 }}
        >
          <Text style={{
            fontFamily: 'Inter_500Medium',
            fontSize: 12,
            color: '#6B7280',
            textTransform: 'uppercase',
            letterSpacing: 0.8,
            marginBottom: 10,
          }}>
            {section.title}
          </Text>

          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 14,
            borderWidth: 1,
            borderColor: '#E2E5F0',
            overflow: 'hidden',
          }}>
            {section.items.map((item, iIndex) => (
              <TouchableOpacity
                key={item.label}
                activeOpacity={0.6}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                  borderBottomWidth: iIndex < section.items.length - 1 ? 1 : 0,
                  borderBottomColor: '#F3F4F6',
                }}
              >
                <View style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: '#EFF1FD',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 12,
                }}>
                  <Ionicons name={item.icon as any} size={18} color="#1740DE" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 14, color: '#1A1A1A' }}>
                    {item.label}
                  </Text>
                  {item.subtitle && (
                    <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: '#6B7280', marginTop: 1 }}>
                      {item.subtitle}
                    </Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={16} color="#C8CBD2" />
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      ))}

      {/* Logout */}
      <Animated.View entering={FadeInDown.delay(500).duration(400)} style={{ paddingHorizontal: 24 }}>
        <TouchableOpacity
          onPress={handleLogout}
          activeOpacity={0.7}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#FEF2F2',
            borderRadius: 12,
            paddingVertical: 14,
            gap: 8,
          }}
        >
          <Ionicons name="log-out" size={18} color="#E63B27" />
          <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: '#E63B27' }}>
            Logout
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </ScrollView>
  );
}
