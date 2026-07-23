import { Router, Response } from 'express';
import getDb from '../../db/index.js';
import { authenticateToken, AuthenticatedRequest } from '../../middleware/auth.js';

const router = Router();

// GET /api/business-profiles/my
router.get('/my', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const db = await getDb();
    let businesses = await db.all('SELECT * FROM business_profiles WHERE owner_id = ? ORDER BY created_at DESC', [userId]);
    
    // DEMO FALLBACK: If the user bypassed onboarding and has no businesses, provide a mock one
    if (businesses.length === 0) {
      console.warn('[Demo] No businesses found for user. Injecting a mock business for the presentation.');
      businesses = [{
        id: 'mock-business-123',
        owner_id: userId,
        business_name: 'Dela Cruz General Trading',
        business_type: 'Sole Proprietorship',
        registration_number: 'DTI-REG-99120',
        bir_tin: '123-456-789-000',
        is_gov_verified: 1,
        verification_checks_json: JSON.stringify([
          { agency: 'DTI', status: 'PASS' },
          { agency: 'BIR', status: 'PASS' },
          { agency: 'LGU', status: 'PASS' }
        ])
      }];
    }
    
    // Add completeness and matchCount metrics
    const enrichedBusinesses = businesses.map(b => {
      let completeness = 50;
      if (b.is_gov_verified) completeness += 50;

      let status = 'Informal';
      if (b.is_gov_verified) status = 'Verified';
      else if (b.registration_number) status = 'Partial';

      return {
        ...b,
        status,
        completeness,
        matchCount: Math.floor(Math.random() * 5) + 1, // Mock matches for demo
        verification_checks_json: b.verification_checks_json ? JSON.parse(b.verification_checks_json) : null
      };
    });

    res.status(200).json({ success: true, businesses: enrichedBusinesses });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to retrieve businesses.' });
  }
});

// GET /api/business-profiles/:id
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    const db = await getDb();
    
    let business = await db.get('SELECT * FROM business_profiles WHERE id = ? AND owner_id = ?', [id, userId]);
    
    if (!business) {
      // DEMO FALLBACK
      if (id === 'mock-business-123') {
        business = {
          id: 'mock-business-123',
          owner_id: userId,
          business_name: 'Dela Cruz General Trading',
          business_type: 'Sole Proprietorship',
          registration_number: 'DTI-REG-99120',
          bir_tin: '123-456-789-000',
          is_gov_verified: 1,
          verification_checks_json: JSON.stringify([
            { agency: 'DTI', status: 'PASS' },
            { agency: 'BIR', status: 'PASS' },
            { agency: 'LGU', status: 'PASS' }
          ])
        };
      } else {
        res.status(404).json({ success: false, message: 'Business not found.' });
        return;
      }
    }

    let completeness = 50;
    if (business.is_gov_verified) completeness += 50;

    let status = 'Informal';
    if (business.is_gov_verified) status = 'Verified';
    else if (business.registration_number) status = 'Partial';

    res.status(200).json({
      success: true,
      business: {
        ...business,
        status,
        completeness,
        verification_checks_json: business.verification_checks_json ? JSON.parse(business.verification_checks_json) : null
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to retrieve business details.' });
  }
});

export default router;
