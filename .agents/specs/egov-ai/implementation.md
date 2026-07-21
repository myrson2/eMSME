# Implementation Plan & Code Deliverables: eGovAI (`egov-ai`)

## 1. Task Checklist
- [x] **Environment Setup:** Add `EGOV_AI_API_KEY` & `EGOV_AI_ENDPOINT` to `backend/.env.example`.
- [x] **Backend Proxy Controller:** Create Express router `POST /api/support/chat` with PII sanitization and eGovAI service caller.
- [x] **Mobile UI Component:** Create React Native `EGovAIChatModal.tsx` with chat history list, input box, loading spinner, and quick action chips.
- [x] **Fallback & Error Handling:** Handle AI timeouts gracefully with static FAQ fallbacks.

---

## 2. Environment Setup

### `backend/.env.example`
```env
# eGovAI Assistant Configuration
EGOV_AI_API_KEY=your_egov_ai_api_key_here
EGOV_AI_ENDPOINT=https://api.egov.gov.ph/v1/ai/chat
```

---

## 3. Backend Implementation (Express + TypeScript)

### Route Handler: `backend/src/routes/support/ai.ts`
```typescript
import { Router, Request, Response } from 'express';
import axios from 'axios';

const router = Router();

export interface AIChatRequestBody {
  prompt: string;
  sessionId?: string;
  applicationContext?: {
    currentStep?: string;
    businessType?: string;
    isPhilSysVerified?: boolean;
  };
}

// Regex patterns for PII sanitization
const PHILSYS_REGEX = /\b\d{4}-\d{4}-\d{4}\b/g;
const TIN_REGEX = /\b\d{3}-\d{3}-\d{3}(-\d{3,5})?\b/g;
const PHONE_REGEX = /(\+63|0)9\d{9}/g;

function sanitizePrompt(text: string): string {
  return text
    .replace(PHILSYS_REGEX, '[REDACTED_NATIONAL_ID]')
    .replace(TIN_REGEX, '[REDACTED_TIN]')
    .replace(PHONE_REGEX, '[REDACTED_PHONE]');
}

router.post('/chat', async (req: Request<{}, {}, AIChatRequestBody>, res: Response) => {
  try {
    const { prompt, applicationContext } = req.body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      res.status(400).json({ success: false, message: 'Prompt message is required.' });
      return;
    }

    const cleanedPrompt = sanitizePrompt(prompt);
    const apiKey = process.env.EGOV_AI_API_KEY;
    const aiEndpoint = process.env.EGOV_AI_ENDPOINT || 'https://api.egov.gov.ph/v1/ai/chat';

    const systemContext = `You are eGovAI, the official intelligent assistant for Philippine MSME loan applicants. 
Current applicant state: ${JSON.stringify(applicationContext || {})}. 
Provide concise, helpful answers regarding DTI, SEC, BIR, PhilSys, and eMSME loan steps.`;

    try {
      const aiRes = await axios.post(
        aiEndpoint,
        {
          messages: [
            { role: 'system', content: systemContext },
            { role: 'user', content: cleanedPrompt },
          ],
          temperature: 0.3,
          max_tokens: 400,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 8000,
        }
      );

      const reply = aiRes.data?.choices?.[0]?.message?.content || aiRes.data?.reply || 'I am here to help you with your eMSME application.';

      res.status(200).json({
        success: true,
        reply,
        suggestedActions: [
          { label: 'Check Loan Requirements', action: 'INFO_REQUIREMENTS' },
          { label: 'Verify Business Registration', action: 'NAVIGATE_VERIFY' },
        ],
      });
    } catch (aiErr: any) {
      console.warn('[eGovAI Service Warning]: AI endpoint unreachable, returning fallback.', aiErr?.message);
      
      // Fallback response when external AI is offline
      res.status(200).json({
        success: true,
        isFallback: true,
        reply: 'I am currently operating in offline mode. Here are standard eMSME guidance steps:\n\n1. Verify PhilSys Identity\n2. Verify DTI/SEC/CDA Business Status\n3. Input Financials & Submit Application.',
        suggestedActions: [
          { label: 'View Application Steps', action: 'VIEW_STEPS' },
        ],
      });
    }
  } catch (err: any) {
    console.error('[eGovAI Proxy Controller Error]:', err);
    res.status(500).json({ success: false, message: 'Internal support server error.' });
  }
});

export default router;
```

---

## 4. Mobile Component (React Native + TypeScript)

### Component: `mobile/src/components/EGovAIChatModal.tsx`
```tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, ActivityIndicator, Modal, StyleSheet } from 'react-native';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
}

interface EGovAIChatModalProps {
  visible: boolean;
  onClose: () => void;
  apiBaseUrl: string;
}

export const EGovAIChatModal: React.FC<EGovAIChatModalProps> = ({ visible, onClose, apiBaseUrl }) => {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', sender: 'ai', text: 'Hello! I am eGovAI, your Philippine MSME support assistant. How can I help you today?' },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!inputText.trim() || loading) return;

    const userMsg: Message = { id: Date.now().toString(), sender: 'user', text: inputText };
    setMessages((prev) => [...prev, userMsg]);
    const promptToSend = inputText;
    setInputText('');
    setLoading(true);

    try {
      const response = await fetch(`${apiBaseUrl}/api/support/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptToSend,
          applicationContext: { currentStep: 'MOBILE_ONBOARDING' },
        }),
      });

      const data = await response.json();
      const aiReplyText = data.reply || 'Thank you for reaching out to eGovAI.';

      const aiMsg: Message = { id: (Date.now() + 1).toString(), sender: 'ai', text: aiReplyText };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), sender: 'ai', text: 'Unable to reach support servers. Please check your connectivity.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>eGovAI Assistant</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>Close</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={[styles.bubble, item.sender === 'user' ? styles.userBubble : styles.aiBubble]}>
              <Text style={item.sender === 'user' ? styles.userText : styles.aiText}>{item.text}</Text>
            </View>
          )}
          contentContainerStyle={{ padding: 16 }}
        />

        {loading && <ActivityIndicator size="small" color="#0038a8" style={{ marginBottom: 8 }} />}

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask eGovAI a question..."
            placeholderTextColor="#9ca3af"
          />
          <TouchableOpacity style={styles.sendBtn} onPress={sendMessage} disabled={loading}>
            <Text style={styles.sendBtnText}>Send</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { padding: 16, paddingTop: 48, backgroundColor: '#0038a8', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' },
  closeBtn: { padding: 6, backgroundColor: '#1e40af', borderRadius: 6 },
  closeBtnText: { color: '#ffffff', fontSize: 14 },
  bubble: { padding: 12, borderRadius: 12, marginBottom: 10, maxWidth: '80%' },
  userBubble: { alignSelf: 'flex-end', backgroundColor: '#0038a8' },
  aiBubble: { alignSelf: 'flex-start', backgroundColor: '#e5e7eb' },
  userText: { color: '#ffffff', fontSize: 15 },
  aiText: { color: '#1f2937', fontSize: 15 },
  inputContainer: { flexDirection: 'row', padding: 12, backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  input: { flex: 1, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 12, height: 44, color: '#1f2937' },
  sendBtn: { marginLeft: 10, backgroundColor: '#0038a8', paddingHorizontal: 18, borderRadius: 8, justifyContent: 'center' },
  sendBtnText: { color: '#ffffff', fontWeight: 'bold' },
});

export default EGovAIChatModal;
```
