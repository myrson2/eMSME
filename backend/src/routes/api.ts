import { Router } from 'express';

const router = Router();

// Health Check Endpoint
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Sample API Endpoint
router.get('/message', (_req, res) => {
  res.json({ message: 'Hello from Express Backend!' });
});

export default router;
