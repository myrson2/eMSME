import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  try {
    // 1. Get a mock JWT token from our test utility or just use the local test endpoint if one exists
    // Actually, I can just create a JWT token directly using the JWT_SECRET!
    const jwt = await import('jsonwebtoken');
    const token = jwt.default.sign({ userId: 'test-user-123' }, process.env.JWT_SECRET || 'emsme_local_dev_secret_change_before_deployment_2026');

    console.log('Sending chat request...');
    const res = await axios.post('http://localhost:5000/api/support/chat', {
      prompt: 'hello',
      applicationContext: { currentStep: 'DASHBOARD' }
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Response:', res.data);
  } catch (err: any) {
    console.error('Error:', err?.response?.data || err?.message);
  }
}
run();
