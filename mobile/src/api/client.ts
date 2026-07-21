import axios from 'axios';
import { Platform } from 'react-native';

// For Android emulator, use 10.0.2.2. For iOS simulator, use localhost.
// Alternatively, if you run on a physical device, you should set EXPO_PUBLIC_API_URL to your machine's local IP.
const baseURL = process.env.EXPO_PUBLIC_API_URL || 
  (Platform.OS === 'android' ? 'http://10.0.2.2:3000/api' : 'http://localhost:3000/api');

const client = axios.create({
  baseURL,
  withCredentials: true, // Needed for cookies (JWT)
  headers: {
    'Content-Type': 'application/json',
  },
});

export default client;
