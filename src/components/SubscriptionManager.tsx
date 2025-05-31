import React, { useState, useEffect } from 'react';
import { SUBSCRIPTION_TIERS, hasFeatureAccess, getSubscriptionStatus } from '../services/stripeService';
import { useStripe } from '../contexts/StripeContext';

interface SubscriptionData {
  tier: string;
  status: string;
  features: string[];
  expiresAt: string;
}

const SubscriptionManager: React.FC = () => {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { createCheckoutSession, subscriptionTier } = useStripe();

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    try {
      setLoading(true);
      const data = await getSubscriptionStatus();
      setSubscription(data);
    } catch (err) {
      setError('Failed to load subscription data');
      console.error('Subscription loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (targetTier: string) => {
    try {
      // Get the price ID for the target tier (monthly by default)
      const priceIdKey = `${targetTier}_monthly` as any;
      const priceId = (window as any).STRIPE_PRICE_IDS?.[priceIdKey] || `price_${targetTier}_monthly`;
      
      await createCheckoutSession(
        priceId,
        `${window.location.origin}/account?upgrade=success`,
        `${window.location.origin}/account?upgrade=cancelled`
      );
    } catch (error) {
      console.error('Upgrade error:', error);
      alert('Error processing upgrade. Please try again.');
    }
  };

  const getCurrentTierInfo = () => {
    if (!subscription) return null;
    return SUBSCRIPTION_TIERS[subscription.tier as keyof typeof SUBSCRIPTION_TIERS];
  };

  const getAvailableUpgrades = () => {
    if (!subscription) return [];
    
    const currentTier = subscription.tier;
    const tiers = ['basic', 'standard', 'premium', 'enterprise'];
    const currentIndex = tiers.indexOf(currentTier);
    
    return tiers.slice(currentIndex + 1);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="text-red-700">
          <h3 className="font-medium">Error Loading Subscription</h3>
          <p className="text-sm mt-1">{error}</p>
          <button 
            onClick={loadSubscriptionData}
            className="mt-3 text-sm text-red-600 hover:text-red-800 underline"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const currentTier = getCurrentTierInfo();
  const availableUpgrades = getAvailableUpgrades();

  return (
    <div className="space-y-6">
      {/* Current Subscription */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Subscription</h2>
        
        {subscription && currentTier ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{currentTier.name}</h3>
                <p className="text-gray-600">{currentTier.description}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">
                  ${currentTier.price}/month
                </div>
                <div className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                  subscription.status === 'active' 
                    ? 'bg-green-100 text-green-800'
                    : subscription.status === 'past_due'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-3 bg-gray-50 rounded">
                <div className="text-lg font-semibold text-gray-900">
                  {currentTier.apiQuota === -1 ? '∞' : currentTier.apiQuota.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">API Calls/Month</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded">
                <div className="text-lg font-semibold text-gray-900">
                  {currentTier.users === -1 ? '∞' : currentTier.users}
                </div>
                <div className="text-sm text-gray-600">Users</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded">
                <div className="text-lg font-semibold text-gray-900">{currentTier.storage}</div>
                <div className="text-sm text-gray-600">Storage</div>
              </div>
            </div>
            
            {/* Features */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Included Features</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {currentTier.features.map((feature, index) => (
                  <div key={index} className="flex items-center text-sm text-gray-600">
                    <span className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center mr-2 text-green-600 text-xs">
                      ✓
                    </span>
                    {feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No active subscription found</p>
            <a 
              href="/pricing" 
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            >
              Choose a Plan
            </a>
          </div>
        )}
      </div>

      {/* Upgrade Options */}
      {availableUpgrades.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Upgrade Options</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableUpgrades.map((tierKey) => {
              const tier = SUBSCRIPTION_TIERS[tierKey as keyof typeof SUBSCRIPTION_TIERS];
              return (
                <div key={tierKey} className="border rounded-lg p-4 hover:border-blue-500 transition">
                  <h3 className="font-semibold text-gray-900 mb-2">{tier.name}</h3>
                  <p className="text-gray-600 text-sm mb-3">{tier.description}</p>
                  <div className="text-xl font-bold text-gray-900 mb-3">
                    ${tier.price}/month
                  </div>
                  <button
                    onClick={() => handleUpgrade(tierKey)}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition text-sm"
                  >
                    Upgrade to {tier.name}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Usage & Billing */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Usage & Billing</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-gray-900 mb-3">This Month's Usage</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">API Calls</span>
                <span className="font-medium">347 / {currentTier?.apiQuota === -1 ? '∞' : currentTier?.apiQuota}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Storage Used</span>
                <span className="font-medium">2.3 GB / {currentTier?.storage}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Active Users</span>
                <span className="font-medium">3 / {currentTier?.users === -1 ? '∞' : currentTier?.users}</span>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-900 mb-3">Billing Information</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Next Billing Date</span>
                <span className="font-medium">
                  {subscription?.expiresAt ? new Date(subscription.expiresAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Payment Method</span>
                <span className="font-medium">•••• 4242</span>
              </div>
            </div>
            
            <div className="mt-4 space-y-2">
              <button className="text-blue-600 hover:text-blue-800 text-sm">
                Update Payment Method
              </button>
              <br />
              <button className="text-blue-600 hover:text-blue-800 text-sm">
                Download Invoices
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionManager;
