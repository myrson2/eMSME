import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import getDb from './db/index.js';

import egovAuthRouter from './routes/auth/egov.js';
import verifyRouter from './routes/verify/index.js';
import onboardingRouter from './routes/onboarding/index.js';
import loanRouter from './routes/loans/index.js';
import paymentRouter from './routes/payments/index.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Initialize SQLite Database on startup
getDb()
  .then(() => console.log('📦 SQLite database initialized with 7 tables.'))
  .catch(err => console.error('❌ Failed to initialize SQLite database:', err));

// Route Mounts
app.use('/api/auth/egov', egovAuthRouter);
app.use('/api/verify', verifyRouter);
app.use('/api/onboarding', onboardingRouter);
app.use('/api/loans', loanRouter);
app.use('/api/payments/egovpay', paymentRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', service: 'eMSME Backend API', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 eMSME Backend running on http://localhost:${PORT}`);
});
