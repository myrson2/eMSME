/**
 * OnboardingField — Reusable form field for onboarding screens
 * Consistent label/input/prefix pattern using design system tokens.
 */

import React from 'react';
import { View, Text, TextInput } from 'react-native';
import { colors, fonts, radius } from '../../lib/theme';

interface OnboardingFieldProps {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
  multiline?: boolean;
  prefix?: string;
  mono?: boolean;   // Use GeistMono for data-type inputs
}

export default function OnboardingField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  multiline,
  prefix,
  mono = false,
}: OnboardingFieldProps) {
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
      <View
        style={{
          flexDirection: 'row',
          alignItems: multiline ? 'flex-start' : 'center',
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radius.sm,
          backgroundColor: colors.surfaceRaised,
          overflow: 'hidden',
        }}
      >
        {prefix && (
          <View
            style={{
              paddingHorizontal: 14,
              paddingVertical: 14,
              borderRightWidth: 1,
              borderRightColor: colors.borderSubtle,
              backgroundColor: colors.surface,
            }}
          >
            <Text style={{ fontFamily: fonts.mono, fontSize: 15, color: colors.body }}>
              {prefix}
            </Text>
          </View>
        )}
        <TextInput
          style={{
            flex: 1,
            paddingHorizontal: 16,
            paddingVertical: 14,
            fontFamily: mono || prefix ? fonts.mono : fonts.sans,
            fontSize: 14,
            color: colors.ink,
            minHeight: multiline ? 88 : undefined,
            textAlignVertical: multiline ? 'top' : 'center',
          }}
          placeholder={placeholder}
          placeholderTextColor={colors.placeholder}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          multiline={multiline}
        />
      </View>
    </View>
  );
}
