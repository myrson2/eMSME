import axios from 'axios';

async function run() {
  try {
    const res = await axios.get('https://banner-say-satirical.ngrok-free.dev/api/health', {
      headers: { 'ngrok-skip-browser-warning': 'true' }
    });
    console.log('Success:', res.data);
  } catch (err: any) {
    console.error('Error:', err?.message, err?.response?.data || '');
  }
}
run();
