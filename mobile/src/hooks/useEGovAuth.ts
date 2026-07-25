import { useCallback, useState } from 'react';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';

// Required for expo-web-browser to complete the auth session on redirect
WebBrowser.maybeCompleteAuthSession();

const EGOV_SSO_PORTAL = 'https://hackathon-sso.e.gov.ph';
const PARTNER_CODE = process.env.EXPO_PUBLIC_EGOV_PARTNER_CODE || 'HACKATHON_SSO';

export function useEGovAuth(onCodeReceived: (code: string) => Promise<void>) {
  const [isLoading, setIsLoading] = useState(false);

  // In Expo Go, redirect_uri is exp://... and is not cleanly intercepted.
  // In a standalone APK build, use emsme://auth/callback instead and it works natively.
  const redirectUri = makeRedirectUri({ scheme: 'emsme', path: 'auth/callback' });

  const startAuthFlow = useCallback(async () => {
    setIsLoading(true);
    const ssoUrl = `${EGOV_SSO_PORTAL}?partner_code=${PARTNER_CODE}&redirect_uri=${encodeURIComponent(redirectUri)}`;

    console.log('[eGovAuth] Opening SSO portal:', ssoUrl);

    try {
      const result = await WebBrowser.openAuthSessionAsync(ssoUrl, redirectUri, {
        showInRecents: true,
      });

      console.log('[eGovAuth] Browser result type:', result.type);

      if (result.type === 'success' && result.url) {
        // Real exchange code received from eGovPH redirect (works in standalone APK builds)
        const url = new URL(result.url);
        const exchangeCode = url.searchParams.get('exchange_code');

        if (exchangeCode) {
          console.log('[eGovAuth] Real exchange code captured! Exchanging with backend...');
          await onCodeReceived(exchangeCode);
          setIsLoading(false);
          return;
        }
      }

      // In Expo Go, the deep link redirect isn't cleanly captured (exp:// limitation).
      // Falls through to demo bypass so the flow can continue for testing/presentation.
      console.warn(
        '[eGovAuth] Exchange code not captured from redirect (expected in Expo Go dev).',
        'In a standalone APK build with emsme:// scheme, the real code would be captured.',
        'Using demo bypass to continue flow...'
      );
    } catch (err) {
      console.warn('[eGovAuth] WebBrowser error:', err);
    }

    // Demo bypass: backend will use a mock profile for this prefix
    setTimeout(async () => {
      await onCodeReceived('hackathon_bypass_code_' + Date.now());
      setIsLoading(false);
    }, 600);
  }, [onCodeReceived, redirectUri]);

  return { startAuthFlow, isReady: true, isLoading };
}
