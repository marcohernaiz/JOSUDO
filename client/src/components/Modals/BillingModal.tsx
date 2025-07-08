import { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY 
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY) 
  : null;

interface BillingModalProps {
  open: boolean;
  onClose: () => void;
}

interface TopUpFormProps {
  amount: number;
  onSuccess: () => void;
  onClose: () => void;
}

const TopUpForm: React.FC<TopUpFormProps> = ({ amount, onSuccess, onClose }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) return;

    setIsProcessing(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + '/dashboard',
        },
        redirect: 'if_required',
      });

      if (error) {
        toast({
          title: 'Payment Failed',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        // Confirm payment on backend
        await apiRequest('POST', '/api/billing/confirm-payment', { amount });
        toast({
          title: 'Payment Successful',
          description: `$${amount} has been added to your account.`,
        });
        onSuccess();
        onClose();
      }
    } catch (error) {
      toast({
        title: 'Payment Failed',
        description: 'An error occurred during payment processing.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <div className="flex space-x-3">
        <Button type="submit" disabled={!stripe || isProcessing} className="flex-1">
          {isProcessing ? 'Processing...' : `Pay $${amount}`}
        </Button>
        <Button type="button" variant="outline" onClick={onClose} className="flex-1">
          Cancel
        </Button>
      </div>
    </form>
  );
};

export const BillingModal: React.FC<BillingModalProps> = ({ open, onClose }) => {
  const { billing, refreshBilling } = useAppContext();
  const [showTopUp, setShowTopUp] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState(0);
  const [clientSecret, setClientSecret] = useState('');
  const { toast } = useToast();

  const createPaymentIntentMutation = useMutation({
    mutationFn: async (amount: number) => {
      const response = await apiRequest('POST', '/api/billing/topup', { amount });
      return response.json();
    },
    onSuccess: (data) => {
      setClientSecret(data.clientSecret);
      setShowTopUp(true);
    },
    onError: () => {
      toast({
        title: 'Top-up Failed',
        description: 'Failed to create payment intent. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleTopUp = (amount: number) => {
    setTopUpAmount(amount);
    createPaymentIntentMutation.mutate(amount);
  };

  const handlePaymentSuccess = () => {
    refreshBilling();
    setShowTopUp(false);
    setClientSecret('');
  };

  const balanceValue = billing ? parseFloat(billing.monthlyBalance) : 0;
  const usedAmount = 9.99 - balanceValue;
  const usagePercentage = (usedAmount / 9.99) * 100;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Billing & Usage</span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <i className="fas fa-times"></i>
            </Button>
          </DialogTitle>
        </DialogHeader>

        {!showTopUp ? (
          <div className="space-y-6">
            {/* Current Usage */}
            <div className="bg-gradient-to-r from-blue-50 to-emerald-50 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">Current Month</h3>
                <span className="text-2xl font-bold text-emerald-600">
                  ${usedAmount.toFixed(2)}
                </span>
              </div>
              <Progress value={usagePercentage} className="h-3 mb-2" />
              <div className="flex justify-between text-sm text-slate-600">
                <span>${usedAmount.toFixed(2)} of $9.99 used</span>
                <span>${balanceValue.toFixed(2)} remaining</span>
              </div>
            </div>

            {/* Usage Breakdown */}
            <div>
              <h4 className="text-sm font-medium text-slate-900 mb-3">Usage Breakdown</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <i className="fas fa-brain text-green-500"></i>
                    <div>
                      <div className="font-medium text-slate-900">OpenAI GPT-4</div>
                      <div className="text-sm text-slate-500">Premium Account - Free routing</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-slate-900">$0.00</div>
                    <div className="text-sm text-slate-500">Free</div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <i className="fas fa-robot text-primary"></i>
                    <div>
                      <div className="font-medium text-slate-900">Platform Routing</div>
                      <div className="text-sm text-slate-500">Standard API calls</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-slate-900">${usedAmount.toFixed(2)}</div>
                    <div className="text-sm text-slate-500">API usage</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Top-up Options */}
            <div>
              <h4 className="text-sm font-medium text-slate-900 mb-3">Add Funds</h4>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="p-4 h-auto border-slate-300 hover:border-primary hover:bg-primary/5"
                  onClick={() => handleTopUp(10)}
                >
                  <div className="text-center">
                    <div className="font-medium text-slate-900">$10</div>
                    <div className="text-sm text-slate-500">One-time top-up</div>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="p-4 h-auto border-slate-300 hover:border-primary hover:bg-primary/5"
                  onClick={() => handleTopUp(25)}
                >
                  <div className="text-center">
                    <div className="font-medium text-slate-900">$25</div>
                    <div className="text-sm text-slate-500">One-time top-up</div>
                  </div>
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Add ${topUpAmount} to Your Account
              </h3>
              <p className="text-sm text-slate-600">
                Complete the payment to add funds to your account balance.
              </p>
            </div>

            {clientSecret && (
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <TopUpForm
                  amount={topUpAmount}
                  onSuccess={handlePaymentSuccess}
                  onClose={() => setShowTopUp(false)}
                />
              </Elements>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
