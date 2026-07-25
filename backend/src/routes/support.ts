import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Basic PII Sanitization
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

router.post('/chat', authenticateToken, async (req, res) => {
  try {
    const { prompt, sessionId, applicationContext } = req.body;

    if (!prompt) {
      return res.status(400).json({ success: false, message: 'Prompt is required' });
    }

    const cleanPrompt = sanitizePrompt(prompt);
    
    // Log the sanitized prompt to verify PII stripping
    console.log(`[eGovAI Proxy] Sanitized Prompt: "${cleanPrompt}"`);
    console.log(`[eGovAI Proxy] Context:`, applicationContext);

    // MOCK eGovAI Platform Response
    // In a real implementation, we would use axios/fetch to call the actual EGOVAI_API_URL here.
    
    // Slight delay to simulate network/LLM latency
    await new Promise(resolve => setTimeout(resolve, 1200));

    let reply = "I'm the eGovAI assistant. I can help you with your loan applications and government documents.";
    let suggestedActions = [];

    const lowerPrompt = cleanPrompt.toLowerCase();
    
    // Basic intent matching for the mock
    if (lowerPrompt.includes('dti') || lowerPrompt.includes('sec')) {
      reply = "For your business registration, you need a valid DTI Business Name Certificate (for Sole Proprietorship) or SEC Certificate (for Corporations). Would you like to check your registration status?";
      suggestedActions = [{ label: "Check DTI Status", action: "CHECK_DTI" }];
    } else if (lowerPrompt.includes('loan') || lowerPrompt.includes('interest')) {
      reply = "LANDBANK and DBP offer MSME loans through our platform. The standard interest rate is typically 7-9% per annum depending on your credit score and financial snapshot.";
      suggestedActions = [{ label: "View Loan Offers", action: "VIEW_LOANS" }];
    } else if (lowerPrompt.includes('redacted')) {
      reply = "I noticed you provided some sensitive information. For your security, our system automatically redacts TINs, IDs, and phone numbers before I process them. How else can I help?";
    }

    return res.json({
      success: true,
      reply,
      suggestedActions,
      isMock: true
    });

  } catch (error) {
    console.error('Support Chat Error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to connect to eGovAI platform. Here are some FAQs instead.',
      isFallback: true
    });
  }
});

export default router;
