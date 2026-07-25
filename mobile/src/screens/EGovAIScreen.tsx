import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, KeyboardAvoidingView, Platform, Keyboard, StyleSheet } from 'react-native';
import Animated, { FadeInUp, FadeInDown, Layout, useAnimatedStyle, withSpring, useSharedValue } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import client from '../api/client';
import { colors, text, spacing, radius, fonts } from '../lib/theme';
import * as Haptics from 'expo-haptics';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  actions?: { label: string; action: string }[];
  isTyping?: boolean;
}

// ---------------------------------------------------------------------------
// High-End Animated Button Component (Double-Bezel & Haptics)
// ---------------------------------------------------------------------------
function PressableAction({ label, onPress, index }: { label: string; onPress: () => void; index: number }) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => { scale.value = withSpring(0.96, { stiffness: 400, damping: 20 }); };
  const handlePressOut = () => { scale.value = withSpring(1, { stiffness: 400, damping: 20 }); };

  return (
    <Animated.View 
      entering={FadeInUp.delay(100 * index).springify()} 
      style={[animatedStyle, { margin: 4 }]}
    >
      <TouchableOpacity
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        style={{
          backgroundColor: colors.primaryMuted,
          paddingVertical: 10,
          paddingHorizontal: 16,
          borderRadius: 100,
          borderWidth: 1,
          borderColor: 'rgba(23, 64, 222, 0.1)',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <Text style={{ fontFamily: fonts.semiBold, fontSize: 13, color: colors.primary }}>
          {label}
        </Text>
        <View style={{
          width: 20,
          height: 20,
          borderRadius: 10,
          backgroundColor: 'rgba(23, 64, 222, 0.1)',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <Ionicons name="arrow-forward" size={10} color={colors.primary} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------
export default function EGovAIScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Mabuhay! I am the eGovAI Assistant. How can I help you with your eMSME journey today?',
    },
  ]);
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    Keyboard.dismiss();
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text.trim() };
    const typingMsg: Message = { id: 'typing', role: 'assistant', content: '...', isTyping: true };

    setMessages((prev) => [...prev, userMsg, typingMsg]);
    setInputText('');
    setLoading(true);

    try {
      const res = await client.post('/support/chat', {
        prompt: text,
        sessionId: 'session_123',
        applicationContext: { currentStep: 'ACCOUNT_DASHBOARD' },
      });

      if (res.data.success) {
        setMessages((prev) => 
          prev.filter(m => m.id !== 'typing').concat({
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: res.data.reply,
            actions: res.data.suggestedActions,
          })
        );
      }
    } catch (err) {
      setMessages((prev) => 
        prev.filter(m => m.id !== 'typing').concat({
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'I am having trouble connecting to the eGov servers right now. Please try again later.',
        })
      );
    } finally {
      setLoading(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const renderMessage = ({ item, index }: { item: Message, index: number }) => {
    const isUser = item.role === 'user';
    const isNextSameRole = index < messages.length - 1 && messages[index + 1].role === item.role;
    const isPrevSameRole = index > 0 && messages[index - 1].role === item.role;

    // Asymmetric border radii logic
    const baseRadius = 24;
    const smallRadius = 4;
    
    let borderTopLeft = baseRadius;
    let borderBottomLeft = baseRadius;
    let borderTopRight = baseRadius;
    let borderBottomRight = baseRadius;

    if (isUser) {
      if (isPrevSameRole) borderTopRight = smallRadius;
      if (isNextSameRole) borderBottomRight = smallRadius;
    } else {
      if (isPrevSameRole) borderTopLeft = smallRadius;
      if (isNextSameRole) borderBottomLeft = smallRadius;
    }

    return (
      <Animated.View 
        entering={FadeInUp.duration(400).springify().stiffness(150).damping(20)} 
        layout={Layout.springify().stiffness(150).damping(20)}
        style={{
          alignSelf: isUser ? 'flex-end' : 'flex-start',
          maxWidth: '85%',
          marginBottom: isNextSameRole ? 4 : 24, // Tighter grouping for same-role messages
        }}
      >
        <View
          style={{
            backgroundColor: isUser ? colors.primary : '#FFFFFF',
            paddingVertical: 14,
            paddingHorizontal: 18,
            borderTopLeftRadius: borderTopLeft,
            borderBottomLeftRadius: borderBottomLeft,
            borderTopRightRadius: borderTopRight,
            borderBottomRightRadius: borderBottomRight,
            shadowColor: isUser ? colors.primary : '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: isUser ? 0.15 : 0.03,
            shadowRadius: 12,
            elevation: 2,
            borderWidth: isUser ? 0 : 1,
            borderColor: 'rgba(0,0,0,0.03)',
          }}
        >
          {item.isTyping ? (
            <View style={{ flexDirection: 'row', gap: 4, height: 20, alignItems: 'center' }}>
              <Animated.View entering={FadeInDown.delay(0).duration(200)} style={styles.typingDot} />
              <Animated.View entering={FadeInDown.delay(100).duration(200)} style={styles.typingDot} />
              <Animated.View entering={FadeInDown.delay(200).duration(200)} style={styles.typingDot} />
            </View>
          ) : (
            <Text style={{ 
              fontFamily: fonts.medium, 
              fontSize: 15, 
              color: isUser ? colors.white : colors.ink,
              lineHeight: 22,
            }}>
              {item.content}
            </Text>
          )}
        </View>
        
        {/* Quick Actions (Only display if last message to avoid clutter) */}
        {item.actions && item.actions.length > 0 && index === messages.length - 1 && (
          <View style={{ marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', marginLeft: -4 }}>
            {item.actions.map((act, idx) => (
              <PressableAction key={idx} label={act.label} onPress={() => sendMessage(act.label)} index={idx} />
            ))}
          </View>
        )}
      </Animated.View>
    );
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={{ flex: 1, backgroundColor: '#F9FAFB' }} // "Canvas White"
    >
      {/* Floating Header (Fluid Island) */}
      <View style={{
        position: 'absolute',
        top: Math.max(insets.top + 8, 48),
        left: 0,
        right: 0,
        zIndex: 50,
        alignItems: 'center',
        paddingHorizontal: spacing.screen,
      }}>
        <BlurView
          intensity={80}
          tint="light"
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 10,
            paddingHorizontal: 16,
            borderRadius: 100,
            overflow: 'hidden',
            backgroundColor: 'rgba(255,255,255,0.7)',
            borderWidth: 1,
            borderColor: 'rgba(0,0,0,0.05)',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.05,
            shadowRadius: 16,
            elevation: 5,
          }}
        >
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{ width: 32, height: 32, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.04)', borderRadius: 16, marginRight: 12 }}
          >
            <Ionicons name="arrow-back" size={18} color={colors.ink} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: fonts.semiBold, fontSize: 14, color: colors.ink }}>eGovAI</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#22C55E' }} />
              <Text style={{ fontFamily: fonts.medium, fontSize: 11, color: '#71717A' }}>Always Online</Text>
            </View>
          </View>
        </BlurView>
      </View>

      {/* Chat Area */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderMessage}
        contentContainerStyle={{ 
          paddingHorizontal: spacing.screen, 
          paddingTop: Math.max(insets.top, 48) + 100, // Space for floating header 
          paddingBottom: 24 
        }}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
        showsVerticalScrollIndicator={false}
      />

      {/* Double-Bezel Input Area */}
      <Animated.View 
        entering={FadeInDown.duration(600).delay(300).springify().stiffness(100).damping(20)}
        style={{
          paddingHorizontal: spacing.screen,
          paddingTop: 12,
          paddingBottom: Math.max(insets.bottom, 16),
          backgroundColor: '#F9FAFB', // Matches background
        }}
      >
        {/* Outer Shell */}
        <View style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 32, // Large outer radius
          padding: 6, // Padding before the inner core
          borderWidth: 1,
          borderColor: 'rgba(0,0,0,0.04)',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.02,
          shadowRadius: 16,
          flexDirection: 'row',
          alignItems: 'center',
          elevation: 2,
        }}>
          {/* Inner Core TextInput */}
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask about compliance, loans..."
            placeholderTextColor="#A1A1AA" // Zinc-400
            style={{
              flex: 1,
              paddingLeft: 18,
              paddingRight: 12,
              paddingVertical: Platform.OS === 'ios' ? 14 : 10,
              fontFamily: fonts.medium,
              fontSize: 15,
              color: colors.ink,
              minHeight: 44, // Matches the button height for perfect vertical alignment
            }}
            onSubmitEditing={() => sendMessage(inputText)}
            returnKeyType="send"
          />
          {/* Button-in-Button */}
          <TouchableOpacity
            onPress={() => sendMessage(inputText)}
            disabled={!inputText.trim() || loading}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: inputText.trim() && !loading ? colors.primary : '#F4F4F5', // Zinc-100
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Ionicons 
              name="arrow-up" 
              size={20} 
              color={inputText.trim() && !loading ? colors.white : '#A1A1AA'} 
            />
          </TouchableOpacity>
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  typingDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#A1A1AA',
  }
});
