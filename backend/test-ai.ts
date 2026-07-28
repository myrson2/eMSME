import axios from 'axios';
import { getEGovAIClient } from './src/services/egovai.js';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  try {
    const aiClient = getEGovAIClient();
    console.log('Fetching token...');
    const token = await aiClient.getToken();
    console.log('Token fetched:', token.substring(0, 10) + '...');
    
    console.log('Generating response...');
    const res = await aiClient.generate('Hello, what are the requirements for a loan?', 'PH');
    console.log('Response:', res.data);
  } catch (err: any) {
    console.error('Error:', err?.response?.data || err?.message);
  }
}
run();
