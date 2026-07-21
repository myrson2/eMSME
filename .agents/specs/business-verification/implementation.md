# Implementation Tasks & Deliverables: Business Verification (`business-verification`)

## 1. Task Checklist
- [ ] **Adapter Shell:** Implement `callAdapter()` generic wrapper with 10s timeout and structured `VerificationAdapterResult` output.
- [ ] **DTI Adapter:** Implement `callAdapter('DTI', ...)` call.
- [ ] **SEC Adapter:** Implement `callAdapter('SEC', ...)` call.
- [ ] **CDA Adapter:** Implement `callAdapter('CDA', ...)` call.
- [ ] **BIR Adapter:** Implement `callAdapter('BIR', ...)` call.
- [ ] **LGU Adapter:** Implement `callAdapter('LGU', ...)` call.
- [ ] **Router:** Implement `routeBusinessVerification()` orchestrator with `Promise.allSettled` for secondary checks.
- [ ] **DB Schema Update:** Add `is_gov_verified`, `bir_tin_verified`, `lgu_permit_verified`, `verification_checks_json`, `years_in_operation`, `verified_at` columns to `business_profiles`.
- [ ] **Route Integration:** Wire `routeBusinessVerification()` into `POST /api/onboarding/business/verify` (in `user-onboarding` route).
- [ ] **Mobile Screen:** Create `BusinessVerifyScreen.tsx` with per-check status indicators.
- [ ] **Env Vars:** Add `DTI_API_URL`, `SEC_API_URL`, `CDA_API_URL`, `BIR_API_URL`, `LGU_API_URL` to `backend/.env.example`.

---

## 2. Mobile Screen Implementation

### `mobile/src/screens/BusinessVerifyScreen.tsx`
```tsx
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';

type CheckStatus = 'pending' | 'pass' | 'fail' | 'loading';

interface CheckItem {
  agency: string;
  status: CheckStatus;
}

const STATUS_ICON: Record<CheckStatus, string> = {
  pending: '⏳',
  loading: '🔄',
  pass: '✅',
  fail: '❌',
};

export const BusinessVerifyScreen = ({ navigation, apiBaseUrl, userId }: any) => {
  const [checks, setChecks] = useState<CheckItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runVerification = async () => {
    setLoading(true);
    setError(null);

    // Optimistically show all as loading
    setChecks([
      { agency: 'DTI / SEC / CDA', status: 'loading' },
      { agency: 'BIR TIN', status: 'loading' },
      { agency: 'LGU Permit', status: 'loading' },
    ]);

    try {
      const res = await fetch(`${apiBaseUrl}/api/onboarding/business/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();

      if (res.status === 200 && data.success) {
        setChecks([
          { agency: 'DTI / SEC / CDA', status: 'pass' },
          { agency: 'BIR TIN', status: 'pass' },
          { agency: 'LGU Permit', status: 'pass' },
        ]);
        setTimeout(() => navigation.navigate('Financials'), 1500);
      } else {
        const failed: string[] = data.failedChecks ?? [];
        setChecks([
          { agency: 'DTI / SEC / CDA', status: failed.some(f => ['DTI','SEC','CDA'].includes(f)) ? 'fail' : 'pass' },
          { agency: 'BIR TIN', status: failed.includes('BIR') ? 'fail' : 'pass' },
          { agency: 'LGU Permit', status: failed.includes('LGU') ? 'fail' : 'pass' },
        ]);
        setError(`Verification failed for: ${failed.join(', ')}. Please check your details and retry.`);
      }
    } catch (err: any) {
      setError('Network error. Please try again.');
      setChecks(prev => prev.map(c => ({ ...c, status: 'fail' })));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { runVerification(); }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verifying Your Business</Text>
      <Text style={styles.subtitle}>Checking government registries...</Text>

      {checks.map(c => (
        <View key={c.agency} style={styles.checkRow}>
          <Text style={styles.checkIcon}>{STATUS_ICON[c.status]}</Text>
          <Text style={styles.checkLabel}>{c.agency}</Text>
        </View>
      ))}

      {error && <Text style={styles.errorText}>{error}</Text>}

      {error && !loading && (
        <TouchableOpacity style={styles.retryBtn} onPress={runVerification}>
          <Text style={styles.retryText}>Retry Verification</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#f9fafb' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#111827', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#6b7280', marginBottom: 24 },
  checkRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  checkIcon: { fontSize: 20, marginRight: 12 },
  checkLabel: { fontSize: 16, color: '#374151' },
  errorText: { color: '#dc2626', marginTop: 16, fontSize: 14, lineHeight: 20 },
  retryBtn: { marginTop: 20, backgroundColor: '#0038a8', padding: 14, borderRadius: 8, alignItems: 'center' },
  retryText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
```
