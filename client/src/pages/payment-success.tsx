import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, ArrowLeft, Zap } from 'lucide-react';

export const PaymentSuccess: React.FC = () => {
  const [, navigate] = useLocation();
  const [credits, setCredits] = useState<number>(0);

  useEffect(() => {
    // Extract payment_intent from URL if present
    const urlParams = new URLSearchParams(window.location.search);
    const paymentIntent = urlParams.get('payment_intent');
    if (paymentIntent) {
      // You could fetch payment details here if needed
      console.log('Payment Intent:', paymentIntent);
    }
  }, []);

  const handleBackToApp = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <CardTitle className="text-2xl text-green-600 dark:text-green-400">
            Payment Successful!
          </CardTitle>
          <CardDescription className="text-lg">
            Thank you for your purchase!
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                Credits Added to Your Account
              </span>
            </div>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Your credits have been added and you can now continue using the AI services.
            </p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleBackToApp}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              size="lg"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to App
            </Button>
            
            <p className="text-xs text-slate-500 dark:text-slate-400">
              You will receive a confirmation email shortly.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
