import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useAppContext } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, CreditCard, Zap, BarChart3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  description: string;
}

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  onShowUsage?: () => void;
}

const PaymentForm: React.FC<{ packages: CreditPackage[], selectedPackage: string | null, onClose: () => void, setSelectedPackage: (id: string) => void, onShowUsage?: () => void }> = ({ packages, selectedPackage, onClose, setSelectedPackage, onShowUsage }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentCredits, setCurrentCredits] = useState(0);
  const { user } = useAppContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const stripe = useStripe();
  const elements = useElements();

  // Fetch current credit balance
  useEffect(() => {
    if (user?.id) {
      fetchCurrentCredits();
    }
  }, [user?.id]);

  const fetchCurrentCredits = async () => {
    try {
      const response = await fetch('/api/user/credits', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setCurrentCredits(data.credits);
      }
    } catch (error) {
      console.error('Error fetching credits:', error);
    }
  };

  const handlePayment = async () => {
    if (!selectedPackage || !stripe || !elements) return;

    setIsProcessing(true);
    try {
      // Create payment intent
      const response = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ packageId: selectedPackage }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Payment intent creation failed:', response.status, errorText);
        throw new Error(`Failed to create payment intent: ${response.status} ${errorText}`);
      }

      const { clientSecret, amount, package: packageData } = await response.json();
      console.log('Payment intent created successfully:', { amount, packageId: packageData?.id });

      // Get the card element
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      // Confirm card payment
      console.log('Confirming card payment with client secret:', clientSecret.substring(0, 20) + '...');
      
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            email: user?.email || '',
          },
        },
      });

      if (error) {
        console.error('Stripe confirmation error:', error);
        throw new Error(`Payment confirmation failed: ${error.message}`);
      }

      // Confirm payment on backend
      const confirmResponse = await fetch('/api/stripe/confirm-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ paymentIntentId: paymentIntent.id }),
      });

      if (confirmResponse.ok) {
        const confirmData = await confirmResponse.json();
        toast({
          title: "Payment Successful!",
          description: `Added ${confirmData.credits} credits to your account`,
          variant: "default",
        });
        
        // Refresh credit balance in modal
        await fetchCurrentCredits();
        
        // Invalidate credits query to refresh UI everywhere
        queryClient.invalidateQueries({ queryKey: ['/api/user/credits'] });
        
        onClose();
      } else {
        const errorData = await confirmResponse.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Payment confirmation failed:', errorData);
        throw new Error(`Payment confirmation failed: ${errorData.details || errorData.error || 'Unknown error'}`);
      }

    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Failed",
        description: error instanceof Error ? error.message : "An error occurred during payment",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatPrice = (priceInCents: number) => {
    return `$${(priceInCents / 100).toFixed(2)}`;
  };

  return (
    <>
      {/* Current Credit Balance */}
      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">Current Balance</h3>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{currentCredits.toLocaleString()} credits</p>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onShowUsage}
              className="border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-600 dark:text-blue-300 dark:hover:bg-blue-900/20"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              View Usage
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        {packages.map((pkg) => (
          <Card
            key={pkg.id}
            className={`cursor-pointer transition-all ${
              selectedPackage === pkg.id
                ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'hover:shadow-md'
            }`}
            onClick={() => setSelectedPackage(pkg.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{pkg.name}</CardTitle>
                <Badge variant="secondary" className="text-sm">
                  {pkg.credits.toLocaleString()} credits
                </Badge>
              </div>
              <CardDescription>{pkg.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {formatPrice(pkg.price)}
                  </span>
                </div>
                {selectedPackage === pkg.id && (
                  <CheckCircle className="w-6 h-6 text-blue-500" />
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-4">
        <div className="border border-slate-300 dark:border-slate-600 rounded-md p-3 bg-white dark:bg-slate-800">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#374151',
                  '::placeholder': {
                    color: '#9CA3AF',
                  },
                },
                invalid: {
                  color: '#EF4444',
                },
              },
            }}
          />
        </div>

        <Button
          onClick={handlePayment}
          disabled={!selectedPackage || isProcessing || !stripe}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          size="lg"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing Payment...
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4 mr-2" />
              Pay with Card
            </>
          )}
        </Button>

        <div className="text-center text-sm text-slate-500 dark:text-slate-400">
          Secure payment powered by Stripe
        </div>
      </div>
    </>
  );
};

export const PaymentModal: React.FC<PaymentModalProps> = ({ open, onClose, onShowUsage }) => {
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [stripeError, setStripeError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      // Check if Stripe is properly configured
      const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
      if (!stripeKey || stripeKey === 'undefined') {
        setStripeError('Stripe is not configured. Please set VITE_STRIPE_PUBLISHABLE_KEY in your environment variables.');
        return;
      }
      setStripeError(null);
      fetchCreditPackages();
    }
  }, [open]);

  const fetchCreditPackages = async () => {
    try {
      const response = await fetch('/api/stripe/credit-packages');
      if (response.ok) {
        const data = await response.json();
        setPackages(data);
        if (data.length > 0) {
          setSelectedPackage(data[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching credit packages:', error);
    }
  };

  if (!open) return null;

  // Show error if Stripe is not configured
  if (stripeError) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-slate-900 rounded-lg p-6 max-w-md w-full mx-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Payment Unavailable
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              ✕
            </Button>
          </div>
          <div className="text-center">
            <div className="text-red-600 dark:text-red-400 mb-4">
              ⚠️ {stripeError}
            </div>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Payment functionality is currently unavailable. Please contact support or try again later.
            </p>
            <Button onClick={onClose} className="w-full">
              Close
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-900 rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Upgrade Your Plan
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            ✕
          </Button>
        </div>

        <Elements stripe={stripePromise}>
          <PaymentForm 
            packages={packages} 
            selectedPackage={selectedPackage} 
            onClose={onClose}
            setSelectedPackage={setSelectedPackage}
            onShowUsage={onShowUsage}
          />
        </Elements>
      </div>
    </div>
  );
};
