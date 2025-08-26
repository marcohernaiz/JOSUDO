import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { useAppContext } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, CreditCard, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ open, onClose }) => {
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { user } = useAppContext();
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
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
      toast({
        title: "Error",
        description: "Failed to load credit packages",
        variant: "destructive",
      });
    }
  };

  const handlePayment = async () => {
    if (!selectedPackage) return;

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

      // Load Stripe
      const stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
      if (!stripe) {
        throw new Error('Stripe failed to load');
      }

      // Confirm payment
      console.log('Confirming payment with client secret:', clientSecret.substring(0, 20) + '...');
      
      const { error, paymentIntent } = await stripe.confirmPayment({
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success`,
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
        onClose();
      } else {
        throw new Error('Payment confirmation failed');
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

  if (!open) return null;

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
                    {pkg.credits} credits
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
          <Button
            onClick={handlePayment}
            disabled={!selectedPackage || isProcessing}
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
      </div>
    </div>
  );
};
