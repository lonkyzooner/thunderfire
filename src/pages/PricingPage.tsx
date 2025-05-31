import React, { useState } from 'react';
import { SUBSCRIPTION_TIERS, STRIPE_PRICE_IDS } from '../services/stripeService';
import { useStripe } from '../contexts/StripeContext';
import { Badge } from '../components/ui/badge';

const PricingPage: React.FC = () => {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const { createCheckoutSession } = useStripe();

  const handleSubscribe = async (tier: keyof typeof SUBSCRIPTION_TIERS) => {
    const priceIdKey = `${tier}_${billingPeriod}` as keyof typeof STRIPE_PRICE_IDS;
    const priceId = STRIPE_PRICE_IDS[priceIdKey];
    
    setIsLoading(tier);
    
    try {
      await createCheckoutSession(
        priceId,
        `${window.location.origin}/dashboard?subscription=success`,
        `${window.location.origin}/pricing?cancelled=true`
      );
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert('Error processing payment. Please try again.');
    } finally {
      setIsLoading(null);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getDiscountedPrice = (tier: typeof SUBSCRIPTION_TIERS[keyof typeof SUBSCRIPTION_TIERS]) => {
    if (billingPeriod === 'annual') {
      return tier.priceAnnual;
    }
    return tier.price;
  };

  const getSavings = (tier: typeof SUBSCRIPTION_TIERS[keyof typeof SUBSCRIPTION_TIERS]) => {
    if (billingPeriod === 'annual') {
      const monthlyTotal = tier.price * 12;
      const savings = monthlyTotal - tier.priceAnnual;
      return savings;
    }
    return 0;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative px-6 py-24 mx-auto max-w-7xl">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-white mb-6">
              Choose Your LARK Plan
            </h1>
            <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Professional-grade law enforcement AI assistant with voice intelligence, 
              real-time coordination, and comprehensive incident management.
            </p>
            
            {/* Billing Toggle */}
            <div className="flex items-center justify-center mb-12">
              <div className="bg-white/10 rounded-full p-1 backdrop-blur-sm">
                <div className="flex">
                  <button
                    onClick={() => setBillingPeriod('monthly')}
                    className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                      billingPeriod === 'monthly'
                        ? 'bg-white text-blue-900 shadow-lg'
                        : 'text-white hover:bg-white/10'
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setBillingPeriod('annual')}
                    className={`px-6 py-2 rounded-full text-sm font-medium transition-all relative ${
                      billingPeriod === 'annual'
                        ? 'bg-white text-blue-900 shadow-lg'
                        : 'text-white hover:bg-white/10'
                    }`}
                  >
                    Annual
                    <Badge className="absolute -top-2 -right-2 bg-green-500 text-white text-xs">
                      Save 17%
                    </Badge>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="relative px-6 pb-24 mx-auto max-w-7xl -mt-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.entries(SUBSCRIPTION_TIERS).map(([key, tier]) => {
            const isPopular = key === 'standard';
            const price = getDiscountedPrice(tier);
            const savings = getSavings(tier);
            
            return (
              <div
                key={key}
                className={`relative bg-white rounded-2xl shadow-xl overflow-hidden ${
                  isPopular ? 'ring-4 ring-blue-500 scale-105' : ''
                }`}
              >
                {isPopular && (
                  <div className="absolute top-0 left-0 right-0 bg-blue-500 text-white text-center py-2 text-sm font-medium">
                    Most Popular
                  </div>
                )}
                
                <div className="p-8">
                  <div className={isPopular ? 'mt-6' : ''}>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {tier.name}
                    </h3>
                    <p className="text-gray-600 mb-6">
                      {tier.description}
                    </p>
                    
                    <div className="mb-6">
                      <div className="flex items-baseline">
                        <span className="text-4xl font-bold text-gray-900">
                          {formatPrice(price)}
                        </span>
                        <span className="text-gray-600 ml-2">
                          /{billingPeriod === 'monthly' ? 'month' : 'year'}
                        </span>
                      </div>
                      
                      {billingPeriod === 'annual' && savings > 0 && (
                        <div className="mt-2">
                          <span className="text-green-600 text-sm font-medium">
                            Save {formatPrice(savings)} per year
                          </span>
                        </div>
                      )}
                      
                      {billingPeriod === 'annual' && (
                        <div className="text-gray-500 text-sm mt-1">
                          {formatPrice(Math.round(price / 12))}/month billed annually
                        </div>
                      )}
                    </div>
                    
                    <button
                      onClick={() => handleSubscribe(key as keyof typeof SUBSCRIPTION_TIERS)}
                      disabled={isLoading === key}
                      className={`w-full py-3 px-6 rounded-lg font-medium transition-all ${
                        isPopular
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : 'bg-gray-900 hover:bg-gray-800 text-white'
                      } ${
                        isLoading === key ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {isLoading === key ? 'Processing...' : 'Get Started'}
                    </button>
                  </div>
                  
                  <div className="mt-8">
                    <h4 className="text-sm font-medium text-gray-900 mb-4">
                      What's included:
                    </h4>
                    <ul className="space-y-3">
                      <li className="flex items-center text-sm text-gray-600">
                        <span className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mr-3">
                          ✓
                        </span>
                        {tier.apiQuota === -1 ? 'Unlimited' : tier.apiQuota} API calls/month
                      </li>
                      <li className="flex items-center text-sm text-gray-600">
                        <span className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mr-3">
                          ✓
                        </span>
                        {tier.users === -1 ? 'Unlimited' : tier.users} user{tier.users !== 1 ? 's' : ''}
                      </li>
                      <li className="flex items-center text-sm text-gray-600">
                        <span className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mr-3">
                          ✓
                        </span>
                        {tier.storage} storage
                      </li>
                      
                      {/* Key Features */}
                      {tier.features.slice(0, 6).map((feature, index) => (
                        <li key={index} className="flex items-center text-sm text-gray-600">
                          <span className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mr-3">
                            ✓
                          </span>
                          {feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </li>
                      ))}
                      
                      {tier.features.length > 6 && (
                        <li className="text-sm text-gray-500 italic">
                          + {tier.features.length - 6} more features
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* FAQ Section */}
        <div className="mt-24 text-center">
          <h2 className="text-3xl font-bold text-white mb-12">
            Frequently Asked Questions
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="text-left">
              <h3 className="text-lg font-semibold text-white mb-2">
                Is there a free trial?
              </h3>
              <p className="text-blue-100">
                Yes! All plans include a 14-day free trial. No credit card required to start.
              </p>
            </div>
            
            <div className="text-left">
              <h3 className="text-lg font-semibold text-white mb-2">
                Can I change plans anytime?
              </h3>
              <p className="text-blue-100">
                Absolutely. Upgrade or downgrade your plan at any time. Changes take effect immediately.
              </p>
            </div>
            
            <div className="text-left">
              <h3 className="text-lg font-semibold text-white mb-2">
                What about data security?
              </h3>
              <p className="text-blue-100">
                LARK uses enterprise-grade encryption and complies with law enforcement data standards.
              </p>
            </div>
            
            <div className="text-left">
              <h3 className="text-lg font-semibold text-white mb-2">
                Do you offer department-wide pricing?
              </h3>
              <p className="text-blue-100">
                Yes! Contact us for custom enterprise pricing for large departments and agencies.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
