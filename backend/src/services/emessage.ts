import axios from 'axios';

export interface EMessageResult {
  messageId?: string;
}

/**
 * eMessage accepts Philippine mobile numbers in local format (09XXXXXXXXX),
 * whereas the mobile app and API use E.164 (+639XXXXXXXXX).
 */
export function toEMessageMobileNumber(mobileNumber: string): string {
  const compact = mobileNumber.trim().replace(/[\s()-]/g, '');
  let localNumber: string;

  if (/^\+639\d{9}$/.test(compact)) {
    localNumber = `0${compact.slice(3)}`;
  } else if (/^639\d{9}$/.test(compact)) {
    localNumber = `0${compact.slice(2)}`;
  } else if (/^09\d{9}$/.test(compact)) {
    localNumber = compact;
  } else {
    throw new Error('mobileNumber must be a valid Philippine mobile number.');
  }

  return localNumber;
}

export async function sendEMessageSms(mobileNumber: string, message: string): Promise<EMessageResult> {
  const baseUrl = process.env.EMESSAGE_API_URL?.trim().replace(/\/$/, '');
  const token = process.env.EMESSAGE_API_TOKEN?.trim();

  if (!baseUrl || !token) {
    throw new Error('EMESSAGE_API_URL and EMESSAGE_API_TOKEN must be configured.');
  }

  const smsRes = await axios.post(
    `${baseUrl}/messaging/v1/sms/push`,
    { number: toEMessageMobileNumber(mobileNumber), message },
    {
      headers: {
        'X-EMESSAGE-Auth': token,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      timeout: 10_000,
    }
  );

  return {
    messageId: smsRes.data?.data?.message_id ?? smsRes.data?.message_id ?? smsRes.data?.data?.id ?? smsRes.data?.id,
  };
}
