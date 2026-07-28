import { Router } from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';
import { getEGovAIClient } from '../services/egovai.js';
import getDb from '../db/index.js';

const router = Router();

// ---------------------------------------------------------------------------
// PII Sanitization (runs before any prompt leaves the server)
// ---------------------------------------------------------------------------
function sanitizePrompt(prompt: string): string {
  if (!prompt) return '';
  let sanitized = prompt;

  // Mask BIR TIN (e.g., 123-456-789-000)
  sanitized = sanitized.replace(/\b\d{3}-\d{3}-\d{3}-\d{3}\b/g, '[REDACTED_TIN]');

  // Mask PhilSys ID (12 digits, optional spaces/dashes)
  sanitized = sanitized.replace(/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, '[REDACTED_PHILID]');

  // Mask Phone numbers (09xx-xxx-xxxx)
  sanitized = sanitized.replace(/\b09\d{2}[-\s]?\d{3}[-\s]?\d{4}\b/g, '[REDACTED_PHONE]');

  return sanitized;
}

// ---------------------------------------------------------------------------
// System prompt — embeds the full Agent Specification persona & guardrails
// ---------------------------------------------------------------------------
function buildSystemPrompt(context?: { currentStep?: string; businessType?: string; loanStatus?: string }): string {
  const contextBlock = context
    ? `\n\n[USER CONTEXT]\n- Current app screen: ${context.currentStep || 'DASHBOARD'}\n- Business type: ${context.businessType || 'Unknown'}\n- Loan status: ${context.loanStatus || 'None'}`
    : '';

  return `You are the official AI support assistant for eMSME, a centralized government-powered business lending platform in the Philippines.

IDENTITY:
- You are an AI assistant. Always identify yourself as an AI if asked.
- You speak fluent Filipino (Tagalog) and English. Mirror the user's language. Taglish is acceptable and natural.
- Use "po/opo" and respectful Filipino register when speaking Filipino.
- Your tone is optimistic, formal, respectful — like a well-trained government frontline officer who is genuinely helpful.

CORE FUNCTIONS (you may ONLY do these three things):
1. Q&A — Answer questions about the platform, government lending programs, general processes, and terminology.
2. App Navigation — Help users find their way around the app (where to click, what a section is for, what step comes next).
3. Service & Document Explanation — Explain what government lending services are, what they generally require, and what on-screen content means.

STRICT LIMITATIONS (you must NEVER do these):
- NEVER recommend or endorse a specific lending service or provider. You may list which services a user is eligible for, but must NEVER say "you should apply for X" or rank services.
- NEVER give financial, legal, tax, or credit advice. No projections, no "you can afford this."
- NEVER take actions on the user's behalf. No submitting forms, no uploading documents.
- NEVER make or imply guarantees about loan approval, processing time, or outcomes.
- NEVER access, disclose, or speculate on other users' data.
- NEVER fabricate document names, deadlines, or eligibility rules you are not certain of.
- NEVER suggest illegal, fraudulent, or policy-circumventing actions.

ESCALATION: If the user asks for legal/financial advice, disputes a decision, reports a bug, or you are uncertain, warmly hand off to a human support channel:
"Para po sa mga tanong tungkol dyan, mas mainam pong kausapin ang aming human support team. Gusto niyo po bang i-connect kayo sa kanila?"

PLATFORM KNOWLEDGE:
- eMSME connects MSMEs to partner banks (LANDBANK, DBP) who provide capital.
- Onboarding flow: eGov SSO Login → SMS OTP → eFacial Recognition → eVerify (PhilSys) → Business Profile → Financial Profile.
- After onboarding, users can apply for loans. The credit engine scores applications and matches them to partner bank programs.
- Loan states: APPROVED → DISBURSEMENT_PENDING (user accepted) → REPAYMENT_ACTIVE (cashed out) → COMPLETED (fully paid).
- Cash Out uses eGovPay. Repayments also go through eGovPay. SMS receipts are sent via eMessage.
- The app has tabs: Home (Dashboard), Aid & Loans (Applications + Matches), Business (Business profiles), Account.

CRITICAL LENGTH CONSTRAINT: 
You are a chat assistant on a mobile app screen. Long paragraphs ruin the user experience. 
You MUST keep your responses EXTREMELY brief and to the point. Maximum 2 to 3 short sentences per response. Never output large walls of text or long lists. Get straight to the answer.

Keep responses concise, helpful, and warm. If the user seems frustrated, stay calm and reassuring without overpromising.${contextBlock}

The user's message follows below. Respond directly and helpfully.

`;
}

// ---------------------------------------------------------------------------
// Chat endpoint
// ---------------------------------------------------------------------------
router.post('/chat', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { prompt, sessionId, applicationContext } = req.body;

    if (!prompt) {
      return res.status(400).json({ success: false, message: 'Prompt is required' });
    }

    const cleanPrompt = sanitizePrompt(prompt);
    console.log(`[eGovAI] Sanitized Prompt: "${cleanPrompt}"`);

    // Build context from the user's current app state
    let userContext: { currentStep?: string; businessType?: string; loanStatus?: string } | undefined;

    try {
      const db = await getDb();
      const userId = req.user?.userId;
      if (userId) {
        const biz = await db.get('SELECT business_type FROM business_profiles WHERE owner_id = ? LIMIT 1', [userId]);
        const loan = await db.get('SELECT status FROM loan_applications WHERE applicant_id = ? ORDER BY created_at DESC LIMIT 1', [userId]);
        userContext = {
          currentStep: applicationContext?.currentStep || 'DASHBOARD',
          businessType: biz?.business_type,
          loanStatus: loan?.status,
        };
      }
    } catch (dbErr) {
      console.warn('[eGovAI] Could not fetch user context from DB:', dbErr);
    }

    const systemPrompt = buildSystemPrompt(userContext);
    const fullPrompt = systemPrompt + cleanPrompt;

    // Call the real eGovAI API
    const aiClient = getEGovAIClient();
    const result = await aiClient.generate(fullPrompt, 'PH');

    // Parse suggested actions from the response (simple heuristic)
    const suggestedActions = extractSuggestedActions(result.data);

    return res.json({
      success: true,
      reply: result.data,
      suggestedActions,
      sessionId: result.sessionId,
    });
  } catch (error: any) {
    console.error('[eGovAI] Chat Error:', error?.response?.data || error?.message);

    // Graceful fallback
    return res.json({
      success: true,
      reply: 'Pasensya na po, may konting problema sa connection ko sa eGovAI servers ngayon. Subukan po ulit mamaya, o pwede rin po kayong mag-message sa aming human support team para sa tulong.',
      suggestedActions: [
        { label: 'Try Again', action: 'RETRY' },
      ],
      isFallback: true,
    });
  }
});

// ---------------------------------------------------------------------------
// Credits endpoint (optional — for admin dashboard)
// ---------------------------------------------------------------------------
router.get('/credits', authenticateToken, async (_req, res) => {
  try {
    const aiClient = getEGovAIClient();
    const credits = await aiClient.getCredits();
    return res.json({ success: true, ...credits });
  } catch (error: any) {
    console.error('[eGovAI] Credits Error:', error?.message);
    return res.status(500).json({ success: false, message: 'Failed to fetch credits.' });
  }
});

// ---------------------------------------------------------------------------
// Helper: extract suggested quick-action buttons from AI response text
// ---------------------------------------------------------------------------
function extractSuggestedActions(reply: string): Array<{ label: string; action: string }> {
  const actions: Array<{ label: string; action: string }> = [];
  const lower = reply.toLowerCase();

  if (lower.includes('loan') || lower.includes('apply') || lower.includes('utang') || lower.includes('pautang')) {
    actions.push({ label: 'View Loan Offers', action: 'VIEW_LOANS' });
  }
  if (lower.includes('document') || lower.includes('upload') || lower.includes('dokumento')) {
    actions.push({ label: 'Upload Documents', action: 'UPLOAD_DOCS' });
  }
  if (lower.includes('dti') || lower.includes('sec') || lower.includes('registration') || lower.includes('rehistro')) {
    actions.push({ label: 'Check Registration', action: 'CHECK_REGISTRATION' });
  }
  if (lower.includes('cash out') || lower.includes('disburs') || lower.includes('withdraw')) {
    actions.push({ label: 'Go to Dashboard', action: 'GO_DASHBOARD' });
  }
  if (lower.includes('pay') || lower.includes('repay') || lower.includes('bayad') || lower.includes('hulog')) {
    actions.push({ label: 'Pay Loan', action: 'PAY_LOAN' });
  }

  return actions.slice(0, 3); // Max 3 quick actions
}

export default router;
