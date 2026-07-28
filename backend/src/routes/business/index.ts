import { Router, Response } from 'express';
import getDb from '../../db/index.js';
import { authenticateToken, AuthenticatedRequest } from '../../middleware/auth.js';

const router = Router();

// GET /api/business-profiles/my
router.get('/my', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const db = await getDb();
    // SEEDER: Ensure the 2 mock businesses always exist for this user
    const mock1Id = `mock-1-${userId}`;
    const mock2Id = `mock-2-${userId}`;
    const nowIso = new Date().toISOString();

    const existingMock = await db.get('SELECT id FROM business_profiles WHERE id = ?', [mock1Id]);
    if (!existingMock) {
      await db.run(
        `INSERT INTO business_profiles
         (id, owner_id, business_name, business_type, registration_number, bir_tin, industry_category, years_in_operation, is_gov_verified, bir_tin_verified, lgu_permit_verified, verified_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 1, 1, ?, ?)`,
        [mock1Id, userId, 'Dela Cruz Sari-Sari Store', 'Sole Proprietorship', 'DTI-REG-100234', '123-456-789-000', 'Retail', 5, nowIso, nowIso]
      );
      await db.run(
        `INSERT INTO business_profiles
         (id, owner_id, business_name, business_type, registration_number, bir_tin, industry_category, years_in_operation, is_gov_verified, bir_tin_verified, lgu_permit_verified, verified_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 1, 1, ?, ?)`,
        [mock2Id, userId, 'Dela Cruz General Trading', 'Corporation', 'SEC-REG-990881', '987-654-321-000', 'Wholesale Trade', 5, nowIso, nowIso]
      );
    }

    const businesses = await db.all('SELECT * FROM business_profiles WHERE owner_id = ? ORDER BY created_at DESC', [userId]);
    
    // Add completeness and dynamic matchCount metrics
    const enrichedBusinesses = await Promise.all(businesses.map(async (b) => {
      let completeness = 50;
      if (b.is_gov_verified) completeness += 50;

      let status = 'Informal';
      if (b.is_gov_verified) status = 'Verified';
      else if (b.registration_number) status = 'Partial';

      // Count APPROVED loans as matches
      const matchQuery = await db.get('SELECT COUNT(*) as count FROM loan_applications WHERE business_id = ? AND status = "APPROVED"', [b.id]);
      
      return {
        ...b,
        status,
        completeness,
        matchCount: matchQuery?.count || 0,
        verification_checks_json: b.verification_checks_json ? JSON.parse(b.verification_checks_json) : null
      };
    }));

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
