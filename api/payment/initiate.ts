import type { VercelRequest, VercelResponse } from '@vercel/node';

const ASHTECHPAY_BASE_URL = 'https://ashtechpay.top/api/v1';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  // Server-only env vars (no VITE_ prefix) — never bundled into client JS.
  const secretKey = process.env.ASHTECHPAY_SECRET_KEY;
  const publicKey = process.env.ASHTECHPAY_PUBLIC_KEY;

  if (!secretKey || !publicKey) {
    console.error('Missing AshTechPay credentials in server environment');
    return res.status(500).json({ success: false, message: 'Payment service is not configured' });
  }

  const { amount, currency, phone, country, provider, userId, description } = req.body || {};

  if (!amount || !currency || !phone || !country || !provider || !userId) {
    return res.status(400).json({ success: false, message: 'Missing required payment fields' });
  }

  const origin = `https://${req.headers.host}`;

  try {
    const response = await fetch(`${ASHTECHPAY_BASE_URL}/payment/initiate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${secretKey}`,
        'X-Public-Key': publicKey
      },
      body: JSON.stringify({
        amount,
        currency,
        phone_number: phone,
        country_code: country,
        provider,
        external_reference: userId,
        description,
        callback_url: `${origin}/payment/callback`,
        return_url: `${origin}/payment/success`
      })
    });

    const data = await response.json();

    return res.status(200).json({
      success: data.status === 'success' || data.success,
      transactionId: data.transaction_id || data.reference,
      status: data.status || 'pending',
      message: data.message || 'Payment initiated',
      paymentUrl: data.payment_url || data.redirect_url
    });
  } catch (err) {
    console.error('AshTechPay initiate error:', err);
    // NOTE: unlike the old client-side code, a failed call here is reported
    // as a failure, not a fake success — see the chat reply for why.
    return res.status(502).json({
      success: false,
      transactionId: null,
      status: 'failed',
      message: 'Unable to reach payment provider, please try again'
    });
  }
}
