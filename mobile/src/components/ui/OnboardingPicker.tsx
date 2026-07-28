import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, SafeAreaView, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radius, text } from '../../lib/theme';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';

interface OnboardingPickerProps {
  label: string;
  value: string;
  onValueChange: (v: string) => void;
  placeholder: string;
  options: string[];
}

export default function OnboardingPicker({
  label,
  value,
  onValueChange,
  placeholder,
  options,
}: OnboardingPickerProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const openModal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setModalVisible(true);
    // Tiny delay to ensure modal is mounted before triggering reanimated entering
    setTimeout(() => setIsOpen(true), 10);
  };

  const closeModal = () => {
    setIsOpen(false);
    // Wait for exiting animations (SlideOutDown/FadeOut) to finish before unmounting modal
    setTimeout(() => {
      setModalVisible(false);
    }, 300);
  };

  const handleSelect = (opt: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onValueChange(opt);
    closeModal();
  };

  return (
    <View style={{ marginBottom: 18 }}>
      <Text
        style={{
          fontFamily: fonts.medium,
          fontSize: 12,
          color: colors.body,
          marginBottom: 8,
          letterSpacing: 0.1,
        }}
      >
        {label}
      </Text>
      
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={openModal}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radius.sm,
          backgroundColor: colors.surfaceRaised,
          paddingHorizontal: 16,
          paddingVertical: 14,
        }}
      >
        <Text style={{
          fontFamily: fonts.sans,
          fontSize: 14,
          letterSpacing: 0,
          color: value ? colors.ink : colors.placeholder,
        }}>
          {value || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={colors.body} />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="none"
        onRequestClose={closeModal}
      >
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          {/* Animated Backdrop */}
          {isOpen && (
            <Animated.View 
              entering={FadeIn.duration(250)} 
              exiting={FadeOut.duration(200)}
              style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' }} 
            >
              <Pressable style={{ flex: 1 }} onPress={closeModal} />
            </Animated.View>
          )}

          {/* Animated Bottom Sheet */}
          {isOpen && (
            <Animated.View
              entering={SlideInDown.springify().damping(22).stiffness(220).mass(0.8)}
              exiting={SlideOutDown.duration(200)}
              style={{
                backgroundColor: colors.surface,
                borderTopLeftRadius: radius.xl,
                borderTopRightRadius: radius.xl,
                paddingTop: 24,
                paddingBottom: 40,
                maxHeight: '75%',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -10 },
                shadowOpacity: 0.1,
                shadowRadius: 20,
                elevation: 20,
              }}
            >
              <View style={{ paddingHorizontal: 24, marginBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={[text.h3, { color: colors.ink }]}>Select {label.toLowerCase()}</Text>
                <TouchableOpacity onPress={closeModal} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                  <Ionicons name="close-circle" size={28} color={colors.border} />
                </TouchableOpacity>
              </View>
              <ScrollView contentContainerStyle={{ paddingHorizontal: 16 }}>
                {options.map((opt, index) => (
                  <Animated.View 
                    key={opt}
                    entering={FadeIn.delay(100 + index * 40).springify()}
                  >
                    <TouchableOpacity
                      onPress={() => handleSelect(opt)}
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingVertical: 16,
                        paddingHorizontal: 16,
                        backgroundColor: value === opt ? colors.primaryMuted : colors.surfaceRaised,
                        borderRadius: radius.md,
                        marginBottom: 8,
                        borderWidth: 1,
                        borderColor: value === opt ? colors.primary : colors.borderSubtle,
                      }}
                    >
                      <Text style={{
                        fontFamily: value === opt ? fonts.medium : fonts.sans,
                        fontSize: 15,
                        color: value === opt ? colors.primaryDark : colors.ink,
                      }}>
                        {opt}
                      </Text>
                      {value === opt && (
                        <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                      )}
                    </TouchableOpacity>
                  </Animated.View>
                ))}
              </ScrollView>
            </Animated.View>
          )}
        </View>
      </Modal>
    </View>
  );
}
