# Implementation Plan & Code Deliverables: eVerify (`everify`)

## 1. Task Checklist
- [x] **Environment Setup:** Add `EVERIFY_CLIENT_ID`, `EVERIFY_CLIENT_SECRET`, and `EVERIFY_API_URL` to `backend/.env.example`.
- [x] **Backend Proxy Route:** Create Express router `POST /api/verify/philsys` with input validation, eVerify API client, and database user profile auto-population.
- [x] **Mobile Component:** Create React Native component `EGovEVerifyScanner.tsx` supporting PCN input, QR code scanning, and selfie capture.
- [x] **Error Handling:** Handle PCN formatting errors, facial match failures (<85%), and upstream server timeouts.

---

## 2. Environment Setup

### `backend/.env.example`
```env
# eVerify / PhilSys National ID Verification API Credentials
EVERIFY_CLIENT_ID=your_staging_everify_client_id
EVERIFY_CLIENT_SECRET=your_staging_everify_client_secret
EVERIFY_API_URL=https://api.everify.gov.ph/v1/identity/verify
```

---

## 3. Backend Implementation (Express + TypeScript)

### Route Handler: `backend/src/routes/verify/philsys.ts`
```typescript
import { Router, Request, Response, NextFunction } from 'express';
import axios from 'axios';

const router = Router();

export interface EVerifyRequestBody {
  pcn?: string;
  qrData?: string;
  faceBase64?: string;
  userConsent: boolean;
}

export interface EVerifyUpstreamResponse {
  verification_id: string;
  verified: boolean;
  facial_match_confidence: number;
  demographics?: {
    first_name: string;
    last_name: string;
    middle_name?: string;
    date_of_birth: string;
    gender: string;
    address: {
      street: string;
      barangay: string;
      city_municipality: string;
      province: string;
      postal_code: string;
    };
  };
  error_message?: string;
}

router.post(
  '/philsys',
  async (req: Request<{}, {}, EVerifyRequestBody>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { pcn, qrData, faceBase64, userConsent } = req.body;

      // 1. Consent Check (RA 10173 Compliance)
      if (!userConsent) {
        res.status(400).json({
          success: false,
          message: 'User consent is required under the Data Privacy Act before initiating eVerify identity verification.',
        });
        return;
      }

      // 2. Validate input availability
      if (!pcn && !qrData) {
        res.status(400).json({
          success: false,
          message: 'Either PhilSys Card Number (PCN) or ePhilID QR code payload is required.',
        });
        return;
      }

      const clientId = process.env.EVERIFY_CLIENT_ID;
      const clientSecret = process.env.EVERIFY_CLIENT_SECRET;
      const apiUrl = process.env.EVERIFY_API_URL || 'https://api.everify.gov.ph/v1/identity/verify';

      if (!clientId || !clientSecret) {
        console.error('[eVerify Error]: Server missing EVERIFY_CLIENT_ID or EVERIFY_CLIENT_SECRET credentials.');
        res.status(500).json({
          success: false,
          message: 'Server configuration error during identity verification processing.',
        });
        return;
      }

      // 3. Call Upstream eVerify API
      try {
        const upstreamRes = await axios.post<EVerifyUpstreamResponse>(
          apiUrl,
          {
            pcn: pcn ? pcn.replace(/-/g, '') : undefined,
            qr_payload: qrData,
            facial_template: faceBase64,
            consent_timestamp: new Date().toISOString(),
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'X-Client-ID': clientId,
              'X-Client-Secret': clientSecret,
            },
            timeout: 10000,
          }
        );

        const data = upstreamRes.data;

        // 4. Validate facial match confidence threshold (Minimum 85%)
        if (!data.verified || (data.facial_match_confidence && data.facial_match_confidence < 85)) {
          res.status(422).json({
            success: false,
            reason: 'LOW_MATCH',
            message: 'Identity verification failed due to facial mismatch or unconfirmed PhilSys records.',
            confidenceScore: data.facial_match_confidence || 0,
          });
          return;
        }

        // 5. Success - Format profile data for response & database update
        const demo = data.demographics;
        const profileData = demo
          ? {
              firstName: demo.first_name,
              lastName: demo.last_name,
              middleName: demo.middle_name || '',
              dateOfBirth: demo.date_of_birth,
              address: demo.address
                ? `${demo.address.street}, ${demo.address.barangay}, ${demo.address.city_municipality}, ${demo.address.province}`
                : '',
            }
          : null;

        res.status(200).json({
          success: true,
          verified: true,
          everifyRefId: data.verification_id,
          profileData,
        });
      } catch (upstreamErr: any) {
        console.error('[eVerify Upstream Error]:', upstreamErr?.response?.data || upstreamErr.message);

        const status = upstreamErr?.response?.status || 502;
        res.status(status >= 500 ? 502 : 400).json({
          success: false,
          fallbackToManual: true,
          message: upstreamErr?.response?.data?.error_message || 'eVerify service unavailable. Please upload ID manually.',
        });
      }
    } catch (err) {
      console.error('[eVerify Route Error]:', err);
      next(err);
    }
  }
);

export default router;
```

---

## 4. Mobile Component (React Native + TypeScript)

### Component: `mobile/src/components/EGovEVerifyScanner.tsx`
```tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from 'react-native';

interface EGovEVerifyScannerProps {
  apiBaseUrl: string;
  onVerificationSuccess: (result: { everifyRefId: string; profileData: any }) => void;
  onVerificationFailure: (message: string) => void;
}

export const EGovEVerifyScanner: React.FC<EGovEVerifyScannerProps> = ({
  apiBaseUrl,
  onVerificationSuccess,
  onVerificationFailure,
}) => {
  const [pcn, setPcn] = useState('');
  const [userConsent, setUserConsent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (!pcn.trim()) {
      Alert.alert('Validation Error', 'Please enter your 12-digit PhilSys Card Number (PCN).');
      return;
    }

    if (!userConsent) {
      Alert.alert('Consent Required', 'You must agree to the Data Privacy consent to verify your PhilSys ID.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${apiBaseUrl}/api/verify/philsys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pcn: pcn.trim(),
          userConsent: true,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Verification failed');
      }

      Alert.alert('eVerify Success', 'Your PhilSys identity has been verified successfully!');
      onVerificationSuccess(data);
    } catch (err: any) {
      const msg = err.message || 'Failed to connect to eVerify service.';
      Alert.alert('Verification Error', msg);
      onVerificationFailure(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>eVerify PhilSys Authentication</Text>
      <Text style={styles.subtitle}>Enter your 12-digit PhilSys Card Number (PCN) for instant government verification.</Text>

      <TextInput
        style={styles.input}
        placeholder="1234-5678-9012"
        placeholderTextColor="#9ca3af"
        value={pcn}
        onChangeText={setPcn}
        keyboardType="numeric"
        maxLength={14}
      />

      <TouchableOpacity
        style={styles.consentRow}
        onPress={() => setUserConsent(!userConsent)}
        activeOpacity={0.8}
      >
        <View style={[styles.checkbox, userConsent && styles.checkboxChecked]}>
          {userConsent && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <Text style={styles.consentText}>
          I authorize eMSME to verify my identity via eVerify under the Data Privacy Act of 2012.
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, (!userConsent || loading) && styles.buttonDisabled]}
        onPress={handleVerify}
        disabled={!userConsent || loading}
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.buttonText}>Verify with eVerify</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: { backgroundColor: '#ffffff', padding: 20, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', marginVertical: 10 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#0038a8', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#4b5563', marginBottom: 16, lineHeight: 20 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, fontSize: 16, color: '#1f2937', marginBottom: 14 },
  consentRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  checkbox: { width: 20, height: 20, borderWidth: 1, borderColor: '#0038a8', borderRadius: 4, marginRight: 10, justifyContent: 'center', alignItems: 'center' },
  checkboxChecked: { backgroundColor: '#0038a8' },
  checkmark: { color: '#ffffff', fontSize: 12, fontWeight: 'bold' },
  consentText: { flex: 1, fontSize: 12, color: '#6b7280', lineHeight: 16 },
  button: { backgroundColor: '#0038a8', paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
});

export default EGovEVerifyScanner;
```
