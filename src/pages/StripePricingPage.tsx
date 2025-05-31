import React from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Check } from 'lucide-react';
import { useAuth } from '../contexts/DevAuthContext';

interface SubscriptionTier {
  id: string;
  name: string;
  price: number;
  features: string[];
  buttonText: string;
  recommended?: boolean;
}

const StripePricingPage: React.FC = () => {
  const { user } = useAuth();

  const subscriptionTiers: SubscriptionTier[] = [
    {
      id: 'basic',
      name: 'Basic',
      price: 14.99,
      features: [
        'Miranda Rights delivery',
        'Basic statute lookups',
        'Voice activation',
        '24/7 availability'
      ],
      buttonText: 'Start Basic'
    },
    {
      id: 'standard',
      name: 'Standard',
      price: 24.99,
      features: [
        'Everything in Basic',
        'Advanced statute lookups',
        'Threat detection',
        'Multi-language support',
        'Proactive tactical feedback'
      ],
      buttonText: 'Start Standard',
      recommended: true
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 49.99,
      features: [
        'Everything in Standard',
        'Training mode',
        'Advanced analytics',
        'Custom department integrations',
        'Priority support',
        'Unlimited API usage'
      ],
      buttonText: 'Start Premium'
    }
  ];

  // Function to handle subscription checkout
  const handleSubscription = async (tier: SubscriptionTier) => {
    if (!user) {
      alert('You must be logged in to subscribe.');
      return;
    }
    try {
      const res = await fetch('/api/subscription/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: tier.id,
          orgId: user.orgId,
          userId: user.userId,
          email: user.email
        })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Error creating checkout session. Please try again.');
        return;
      }
      window.location.href = data.url;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert('Error creating checkout session. Please try again.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-900 to-blue-950">
      <h2 className="text-3xl font-bold text-white mb-8">Choose Your Plan</h2>
      {!user ? (
        <div className="flex flex-col items-center">
          <p className="text-white mb-4">Please sign up or log in to select a plan.</p>
          <div className="flex gap-4">
            <a href="/signup">
              <Button>Sign Up</Button>
            </a>
            <a href="/login">
              <Button variant="outline" className="text-white border-white">Log In</Button>
            </a>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-8 justify-center">
          {subscriptionTiers.map((tier) => (
            <Card key={tier.id} className={`w-80 ${tier.recommended ? 'border-2 border-blue-400' : ''}`}>
              <CardHeader>
                <CardTitle className="text-2xl">{tier.name}</CardTitle>
                <CardDescription className="text-lg text-blue-300">${tier.price}/mo</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="mb-4">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-center text-white">
                      <Check className="w-4 h-4 mr-2 text-green-400" /> {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full" onClick={() => handleSubscription(tier)}>
                  {tier.buttonText}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default StripePricingPage;
