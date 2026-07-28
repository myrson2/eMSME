import { useCallback, useState } from 'react';

/**
 * useEGovAuth — Direct API-based SSO authentication.
 *
 * The eGov hackathon staging host (hackathon-sso.e.gov.ph) is a headless API
 * service with NO browser login page. Opening a WebBrowser to it just shows
 * raw JSON. Instead we call the backend directly, which performs the
 * server-to-server token exchange and profile fetch.
 *
 * In production with a real eGov OAuth portal, this hook would be updated to
 * use expo-auth-session with a proper browser redirect.
 */
export function useEGovAuth(onCodeReceived: (code: string) => Promise<void>) {
  const [isLoading, setIsLoading] = useState(false);

  const startAuthFlow = useCallback(async () => {
    setIsLoading(true);
    console.log('[eGovAuth] Starting direct API authentication (no browser redirect)...');

    try {
      // Signal the backend to perform the full server-to-server SSO exchange.
      // The backend will call /api/token + /api/partner/sso_authentication
      // and return a session. If the staging API is unreachable it falls back
      // to a demo profile.
      await onCodeReceived('egov_api_auth');
    } catch (err) {
      console.error('[eGovAuth] Authentication failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, [onCodeReceived]);

  return { startAuthFlow, isReady: true, isLoading };
}
