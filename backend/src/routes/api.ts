import { Router } from 'express';
import supportRouter from './support.js';

const router = Router();

// Health Check Endpoint
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Sample API Endpoint
router.get('/message', (_req, res) => {
  res.json({ message: 'Hello from Express Backend!' });
});

// Mount support routes (eGovAI)
router.use('/support', supportRouter);

export default router;
