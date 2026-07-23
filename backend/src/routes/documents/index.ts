import { Router, Response } from 'express';
import { authenticateToken, AuthenticatedRequest } from '../../middleware/auth.js';

const router = Router();

// POST /api/documents/upload
router.post('/upload', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { documentType } = req.body;
    
    if (!documentType) {
      res.status(400).json({ success: false, message: 'documentType is required.' });
      return;
    }

    // Mock successful upload for demo purposes
    // In production, this would save the file to S3 and update the database record for this user/business.
    setTimeout(() => {
      res.status(200).json({ 
        success: true, 
        message: 'Document uploaded successfully.',
        document: {
          type: documentType,
          verified: true,
          verifiedSource: 'System Verification'
        }
      });
    }, 1500); // simulate upload delay
    
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to upload document.' });
  }
});

export default router;
