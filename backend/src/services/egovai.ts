import axios, { AxiosInstance } from 'axios';

const BASE_URL = 'https://egov-ai-core-ws.oueg.info';

interface TokenData {
  accessToken: string;
  expiresAt: number; // Unix timestamp (ms) when the token expires
  creditsRemaining: number;
}

/**
 * eGovAI API Client
 *
 * Manages automatic token lifecycle (fetch, cache, refresh on expiry)
 * and exposes methods for the AI Assistant and Credits endpoints.
 */
class EGovAIClient {
  private http: AxiosInstance;
  private accessCode: string;
  private tokenData: TokenData | null = null;

  constructor(accessCode: string) {
    this.accessCode = accessCode;
    this.http = axios.create({ baseURL: BASE_URL, timeout: 30000 });
  }

  // -----------------------------------------------------------------------
  // Token Management
  // -----------------------------------------------------------------------

  private isTokenValid(): boolean {
    if (!this.tokenData) return false;
    // Add 60-second buffer so we refresh slightly before actual expiry
    return Date.now() < this.tokenData.expiresAt - 60_000;
  }

  /**
   * Fetches or returns a cached access token.
   * Automatically refreshes when the token is expired.
   */
  async getToken(): Promise<string> {
    if (this.isTokenValid()) return this.tokenData!.accessToken;

    console.log('[eGovAI] Fetching new access token...');

    const res = await this.http.post('/api/v1/egov/integration/token', {
      access_code: this.accessCode,
    });

    const { access_token, expires_in_seconds, credits_remaining } = res.data;

    this.tokenData = {
      accessToken: access_token,
      expiresAt: Date.now() + expires_in_seconds * 1000,
      creditsRemaining: credits_remaining,
    };

    console.log(`[eGovAI] Token acquired. Credits remaining: ${credits_remaining}. Expires in ${expires_in_seconds}s.`);
    return access_token;
  }

  // -----------------------------------------------------------------------
  // AI Assistant
  // -----------------------------------------------------------------------

  /**
   * Sends a prompt to the eGovAI Assistant and returns the generated reply.
   */
  async generate(prompt: string, category: string = 'PH'): Promise<{ data: string; sessionId: string }> {
    const token = await this.getToken();

    const res = await this.http.post(
      '/api/v1/egov/integration/ai_assistant/generate',
      { prompt, category },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    return { data: res.data.data, sessionId: res.data.session_id };
  }

  // -----------------------------------------------------------------------
  // Credits
  // -----------------------------------------------------------------------

  async getCredits(): Promise<{ total: number; used: number; remaining: number; expiresAt: string }> {
    const token = await this.getToken();

    const res = await this.http.get('/api/v1/egov/integration/credits', {
      headers: { Authorization: `Bearer ${token}` },
    });

    return {
      total: res.data.credits_total,
      used: res.data.credits_used,
      remaining: res.data.credits_remaining,
      expiresAt: res.data.expires_at,
    };
  }
}

// ---------------------------------------------------------------------------
// Singleton instance — created lazily on first import if env var is set
// ---------------------------------------------------------------------------
let clientInstance: EGovAIClient | null = null;

export function getEGovAIClient(): EGovAIClient {
  if (!clientInstance) {
    const code = process.env.EGOV_ACCESS_CODE;
    if (!code) throw new Error('EGOV_ACCESS_CODE environment variable is not set.');
    clientInstance = new EGovAIClient(code);
  }
  return clientInstance;
}

export default EGovAIClient;
