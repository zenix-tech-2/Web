// AshTechPay Payment Integration
// All calls go through our own /api/payment/* serverless routes so that the
// AshTechPay secret key is never present in client-side code or the browser bundle.

interface PaymentRequest {
  amount: number;
  currency: string;
  phone: string;
  country: string;
  provider: string;
  userId: string;
  description: string;
}

interface PaymentResponse {
  success: boolean;
  transactionId: string;
  status: string;
  message: string;
  paymentUrl?: string;
}

export const MOBILE_MONEY_PROVIDERS: Record<string, { name: string; logo: string; countries: string[] }[]> = {
  CM: [
    { name: 'Orange Money', logo: 'orange', countries: ['CM'] },
    { name: 'MTN Mobile Money', logo: 'mtn', countries: ['CM'] }
  ],
  NG: [
    { name: 'MTN Mobile Money', logo: 'mtn', countries: ['NG'] },
    { name: 'Airtel Money', logo: 'airtel', countries: ['NG'] }
  ],
  KE: [
    { name: 'M-Pesa', logo: 'mpesa', countries: ['KE'] },
    { name: 'Airtel Money', logo: 'airtel', countries: ['KE'] }
  ],
  GH: [
    { name: 'MTN Mobile Money', logo: 'mtn', countries: ['GH'] },
    { name: 'Vodafone Cash', logo: 'vodafone', countries: ['GH'] },
    { name: 'AirtelTigo Money', logo: 'airteltigo', countries: ['GH'] }
  ],
  CI: [
    { name: 'Orange Money', logo: 'orange', countries: ['CI'] },
    { name: 'MTN Mobile Money', logo: 'mtn', countries: ['CI'] },
    { name: 'Moov Money', logo: 'moov', countries: ['CI'] }
  ],
  SN: [
    { name: 'Orange Money', logo: 'orange', countries: ['SN'] },
    { name: 'Wave', logo: 'wave', countries: ['SN'] },
    { name: 'Free Money', logo: 'free', countries: ['SN'] }
  ],
  MG: [
    { name: 'MVola', logo: 'mvola', countries: ['MG'] },
    { name: 'Orange Money', logo: 'orange', countries: ['MG'] },
    { name: 'Airtel Money', logo: 'airtel', countries: ['MG'] }
  ],
  UG: [
    { name: 'MTN Mobile Money', logo: 'mtn', countries: ['UG'] },
    { name: 'Airtel Money', logo: 'airtel', countries: ['UG'] }
  ],
  TZ: [
    { name: 'M-Pesa', logo: 'mpesa', countries: ['TZ'] },
    { name: 'Airtel Money', logo: 'airtel', countries: ['TZ'] },
    { name: 'Tigo Pesa', logo: 'tigo', countries: ['TZ'] }
  ],
  RW: [
    { name: 'MTN Mobile Money', logo: 'mtn', countries: ['RW'] },
    { name: 'Airtel Money', logo: 'airtel', countries: ['RW'] }
  ],
  ZA: [
    { name: 'Vodapay', logo: 'voda', countries: ['ZA'] },
    { name: 'MTN Mobile Money', logo: 'mtn', countries: ['ZA'] }
  ],
  CD: [
    { name: 'M-Pesa', logo: 'mpesa', countries: ['CD'] },
    { name: 'Orange Money', logo: 'orange', countries: ['CD'] },
    { name: 'Airtel Money', logo: 'airtel', countries: ['CD'] }
  ]
};

export const CURRENCIES: Record<string, { code: string; symbol: string; rate: number }> = {
  XAF: { code: 'XAF', symbol: 'FCFA', rate: 1 },
  USD: { code: 'USD', symbol: '$', rate: 0.00167 },
  EUR: { code: 'EUR', symbol: '€', rate: 0.00152 },
  NGN: { code: 'NGN', symbol: '₦', rate: 2.5 },
  KES: { code: 'KES', symbol: 'KSh', rate: 0.21 },
  GHS: { code: 'GHS', symbol: 'GH₵', rate: 0.026 },
  CDF: { code: 'CDF', symbol: 'FC', rate: 4.8 },
  ZAR: { code: 'ZAR', symbol: 'R', rate: 0.031 },
  MAD: { code: 'MAD', symbol: 'د.م.', rate: 0.016 },
  TND: { code: 'TND', symbol: 'د.ت', rate: 0.0051 }
};

export const convertCurrency = (amountXAF: number, toCurrency: string): number => {
  const currency = CURRENCIES[toCurrency];
  if (!currency) return amountXAF;
  return Math.round(amountXAF * currency.rate * 100) / 100;
};

export const initiatePayment = async (paymentData: PaymentRequest): Promise<PaymentResponse> => {
  try {
    const response = await fetch('/api/payment/initiate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentData)
    });

    const data = await response.json();

    return {
      success: !!data.success,
      transactionId: data.transactionId,
      status: data.status || 'failed',
      message: data.message || 'Payment could not be initiated',
      paymentUrl: data.paymentUrl
    };
  } catch {
    return {
      success: false,
      transactionId: '',
      status: 'failed',
      message: 'Unable to reach payment service, please try again'
    };
  }
};

export const verifyPayment = async (transactionId: string): Promise<{ success: boolean; status: string }> => {
  try {
    const response = await fetch(`/api/payment/verify/${transactionId}`);
    const data = await response.json();
    return { success: !!data.success, status: data.status || 'unknown' };
  } catch {
    return { success: false, status: 'unknown' };
  }
};

export const formatPhoneNumber = (phone: string, countryCode: string): string => {
  const prefixes: Record<string, string> = {
    CM: '+237',
    NG: '+234',
    KE: '+254',
    GH: '+233',
    CI: '+225',
    SN: '+221',
    MG: '+261',
    UG: '+256',
    TZ: '+255',
    RW: '+250',
    ZA: '+27',
    CD: '+243'
  };

  const prefix = prefixes[countryCode] || '';
  let cleanPhone = phone.replace(/\D/g, '');

  if (cleanPhone.startsWith('0')) {
    cleanPhone = cleanPhone.substring(1);
  }

  if (cleanPhone.startsWith(prefix.replace('+', ''))) {
    return `+${cleanPhone}`;
  }

  return `${prefix}${cleanPhone}`;
};
