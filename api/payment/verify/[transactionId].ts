import type { VercelRequest, VercelResponse } from '@vercel/node';

const ASHTECHPAY_BASE_URL = 'https://ashtechpay.top/api/v1';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ success: false, status: 'unknown' });
  }

  const secretKey = process.env.ASHTECHPAY_SECRET_KEY;
  const publicKey = process.env.ASHTECHPAY_PUBLIC_KEY;

  if (!secretKey || !publicKey) {
    console.error('Missing AshTechPay credentials in server environment');
    return res.status(500).json({ success: false, status: 'unconfigured' });
  }

  const { transactionId } = req.query;

  if (!transactionId || Array.isArray(transactionId)) {
    return res.status(400).json({ success: false, status: 'invalid_request' });
  }

  try {
    const response = await fetch(`${ASHTECHPAY_BASE_URL}/payment/verify/${transactionId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'X-Public-Key': publicKey
      }
    });

    const data = await response.json();

    return res.status(200).json({
      success: data.status === 'success' || data.success,
      status: data.payment_status || data.status || 'unknown'
    });
  } catch (err) {
    console.error('AshTechPay verify error:', err);
    return res.status(502).json({ success: false, status: 'unknown' });
  }
}
