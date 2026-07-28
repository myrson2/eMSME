import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import getDb from './db/index.js';

import egovAuthRouter from './routes/auth/egov.js';
import smsRouter from './routes/auth/sms.js';
import verifyRouter from './routes/verify/index.js';
import onboardingRouter from './routes/onboarding/index.js';
import loanRouter from './routes/loans/index.js';
import paymentRouter from './routes/payments/index.js';
import businessRouter from './routes/business/index.js';
import documentsRouter from './routes/documents/index.js';
import notificationsRouter from './routes/notifications.js';
import supportRouter from './routes/support.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));

// Initialize SQLite Database on startup
getDb()
  .then(() => console.log('📦 SQLite database initialized with 7 tables.'))
  .catch(err => console.error('❌ Failed to initialize SQLite database:', err));

// Route Mounts
app.use('/api/auth/egov', egovAuthRouter);
app.use('/api/auth', egovAuthRouter);
app.use('/api/auth/sms', smsRouter);
app.use('/api/verify', verifyRouter);
app.use('/api/onboarding', onboardingRouter);
app.use('/api/loans', loanRouter);
app.use('/api/payments/egovpay', paymentRouter);
app.use('/api/business-profiles', businessRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/support', supportRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', service: 'eMSME Backend API', timestamp: new Date().toISOString() });
});

// Global JSON error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Unhandled Server Error]:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

app.listen(PORT as number, '0.0.0.0', () => {
  console.log(`🚀 eMSME Backend running on http://0.0.0.0:${PORT}`);
});
