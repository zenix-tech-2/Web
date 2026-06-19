import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { supabase } from '../lib/supabase';
import {
  initiatePayment,
  MOBILE_MONEY_PROVIDERS,
  CURRENCIES,
  convertCurrency,
  formatPhoneNumber
} from '../lib/payment';
import { Button, Input, Card, Badge } from '../components/ui';
import {
  Wallet,
  ArrowLeft,
  ChevronRight,
  CheckCircle,
  Loader2,
  AlertCircle,
  Phone,
  CreditCard
} from 'lucide-react';

const countries = [
  { code: 'CM', name: 'Cameroon', flag: '🇨🇲' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬' },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪' },
  { code: 'GH', name: 'Ghana', flag: '🇬🇭' },
  { code: 'CI', name: 'Ivory Coast', flag: '🇨🇮' },
  { code: 'SN', name: 'Senegal', flag: '🇸🇳' },
  { code: 'MG', name: 'Madagascar', flag: '🇲🇬' },
  { code: 'UG', name: 'Uganda', flag: '🇺🇬' },
  { code: 'TZ', name: 'Tanzania', flag: '🇹🇿' },
  { code: 'RW', name: 'Rwanda', flag: '🇷🇼' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦' },
  { code: 'CD', name: 'DR Congo', flag: '🇨🇩' },
];

const BASE_AMOUNT_XAF = 1800;

export const Payment: React.FC = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useApp();
  const [step, setStep] = useState<'currency' | 'country' | 'provider' | 'phone' | 'processing' | 'success' | 'error'>('currency');
  const [selectedCurrency, setSelectedCurrency] = useState('XAF');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('');
  const [phone, setPhone] = useState('');
  const [_loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [transactionId, setTransactionId] = useState('');

  const providers = selectedCountry ? MOBILE_MONEY_PROVIDERS[selectedCountry] || [] : [];
  const amount = convertCurrency(BASE_AMOUNT_XAF, selectedCurrency);
  const currency = CURRENCIES[selectedCurrency];

  useEffect(() => {
    if (user?.country) {
      setSelectedCountry(user.country);
    }
  }, [user]);

  const handlePayment = async () => {
    if (!phone || !selectedProvider || !selectedCountry) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');
    setStep('processing');

    try {
      const formattedPhone = formatPhoneNumber(phone, selectedCountry);
      
      const result = await initiatePayment({
        amount,
        currency: selectedCurrency,
        phone: formattedPhone,
        country: selectedCountry,
        provider: selectedProvider,
        userId: user?.id || 'guest',
        description: 'WebCash Subscription - 30 Days'
      });

      if (result.success) {
        setTransactionId(result.transactionId);
        
        // Record payment in database
        await supabase.from('payments').insert({
          user_id: user?.id,
          amount,
          currency: selectedCurrency,
          transaction_id: result.transactionId,
          provider: selectedProvider,
          phone: formattedPhone,
          status: 'pending'
        });

        // Simulate payment verification (in production, this would be a callback)
        setTimeout(async () => {
          // Update payment status
          await supabase
            .from('payments')
            .update({ status: 'success' })
            .eq('transaction_id', result.transactionId);

          // Update user subscription
          if (user) {
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 30);
            
            await supabase
              .from('users')
              .update({
                subscription_active: true,
                subscription_expires_at: expiresAt.toISOString()
              })
              .eq('id', user.id);
          }

          setStep('success');
          setLoading(false);
          refreshUser();
        }, 3000);
      } else {
        setError(result.message || 'Payment initiation failed');
        setStep('error');
        setLoading(false);
      }
    } catch {
      setError('Payment failed. Please try again.');
      setStep('error');
      setLoading(false);
    }
  };

  const goBack = () => {
    switch (step) {
      case 'country':
        setStep('currency');
        break;
      case 'provider':
        setStep('country');
        break;
      case 'phone':
        setStep('provider');
        break;
      case 'error':
        setStep('phone');
        break;
      default:
        navigate(-1);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Header */}
      <div className="sticky top-0 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-[#1e1e2d] z-10">
        <div className="flex items-center gap-4 p-4">
          <button
            onClick={goBack}
            className="p-2 hover:bg-[#1e1e2d] rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-white">Complete Payment</h1>
            <p className="text-sm text-gray-400">Step {step === 'currency' ? '1' : step === 'country' ? '2' : step === 'provider' ? '3' : step === 'phone' ? '4' : ''} of 4</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4">
        {/* Amount Card */}
        <Card className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Subscription Fee</p>
                <p className="text-white font-medium">30 Days Access</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-white">
                {currency?.symbol}{amount}
              </p>
              <p className="text-gray-400 text-sm">{selectedCurrency}</p>
            </div>
          </div>
        </Card>

        {/* Currency Selection */}
        {step === 'currency' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white">Select Currency</h2>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(CURRENCIES).map(([code, curr]) => (
                <button
                  key={code}
                  onClick={() => {
                    setSelectedCurrency(code);
                    setStep('country');
                  }}
                  className={`p-4 rounded-xl border transition-all ${
                    selectedCurrency === code
                      ? 'bg-indigo-600/20 border-indigo-500/50'
                      : 'bg-[#0d0d12] border-[#1e1e2d] hover:border-indigo-500/30'
                  }`}
                >
                  <p className="text-white font-semibold">{curr.symbol}{convertCurrency(BASE_AMOUNT_XAF, code)}</p>
                  <p className="text-gray-400 text-sm">{code}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Country Selection */}
        {step === 'country' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white">Select Country</h2>
            <div className="space-y-2">
              {countries.map((country) => (
                <button
                  key={country.code}
                  onClick={() => {
                    setSelectedCountry(country.code);
                    setStep('provider');
                  }}
                  className="w-full flex items-center justify-between p-4 bg-[#0d0d12] border border-[#1e1e2d] rounded-xl hover:border-indigo-500/30 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{country.flag}</span>
                    <span className="text-white font-medium">{country.name}</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Provider Selection */}
        {step === 'provider' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white">Select Payment Method</h2>
            {providers.length > 0 ? (
              <div className="space-y-2">
                {providers.map((provider) => (
                  <button
                    key={provider.name}
                    onClick={() => {
                      setSelectedProvider(provider.name);
                      setStep('phone');
                    }}
                    className="w-full flex items-center justify-between p-4 bg-[#0d0d12] border border-[#1e1e2d] rounded-xl hover:border-indigo-500/30 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-xl flex items-center justify-center">
                        <Wallet className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-white font-medium">{provider.name}</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
                <p className="text-gray-400">No payment methods available for this country</p>
                <Button variant="outline" onClick={() => setStep('country')} className="mt-4">
                  Select Another Country
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Phone Input */}
        {step === 'phone' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-white mb-2">Enter Phone Number</h2>
              <p className="text-gray-400 text-sm">Payment will be initiated via {selectedProvider}</p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <Input
              label="Phone Number"
              type="tel"
              placeholder="Enter your phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              icon={<Phone className="w-5 h-5" />}
            />

            <div className="bg-[#1e1e2d] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-yellow-400" />
                <span className="text-yellow-400 text-sm font-medium">Important</span>
              </div>
              <p className="text-gray-400 text-sm">
                You will receive a payment prompt on your phone. Please enter your PIN to confirm the payment.
              </p>
            </div>

            <Button
              onClick={handlePayment}
              className="w-full"
              size="lg"
              disabled={!phone}
            >
              Pay {currency?.symbol}{amount}
            </Button>
          </div>
        )}

        {/* Processing */}
        {step === 'processing' && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-indigo-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Processing Payment</h2>
            <p className="text-gray-400 mb-4">Please check your phone and enter your PIN to confirm</p>
            <Badge variant="info">Do not close this page</Badge>
          </div>
        )}

        {/* Success */}
        {step === 'success' && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Payment Successful</h2>
            <p className="text-gray-400 mb-4">Your subscription is now active for 30 days</p>
            <p className="text-xs text-gray-500 mb-6">Transaction ID: {transactionId}</p>
            <Button onClick={() => navigate('/dashboard')} size="lg">
              Go to Dashboard
            </Button>
          </div>
        )}

        {/* Error */}
        {step === 'error' && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Payment Failed</h2>
            <p className="text-gray-400 mb-6">{error}</p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('phone')}>
                Try Again
              </Button>
              <Button onClick={() => navigate('/support')}>
                Contact Support
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
