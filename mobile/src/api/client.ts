import axios from 'axios';
import Constants from 'expo-constants';

const debuggerHost = Constants.expoConfig?.hostUri || '';
const hostIp = debuggerHost ? debuggerHost.split(':')[0] : 'localhost';

const baseURL = process.env.EXPO_PUBLIC_API_URL || `http://${hostIp}:5000/api`;

console.log('[API Client]: Base URL set to:', baseURL);

const client = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  },
});

export default client;
