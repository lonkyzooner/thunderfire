import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DashboardCard from '../components/DashboardCard';
import { useUserDepartment } from '../contexts/UserDepartmentContext';
import { useStripe } from '../contexts/StripeContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { CheckCircle2, ArrowRight, Shield } from 'lucide-react';
import SimpleDashboard from '../components/SimpleDashboard';

const DashboardPage: React.FC = () => {
  const { user, department } = useUserDepartment();
  const location = useLocation();
  const navigate = useNavigate();
  const { subscriptionTier } = useStripe();
  const [showSuccess, setShowSuccess] = useState(false);
  const [currentLocation, setCurrentLocation] = useState('Baton Rouge, LA');
  
  useEffect(() => {
    // Check if we're coming from a successful subscription
    const urlParams = new URLSearchParams(location.search);
    const isSuccess = urlParams.get('subscription') === 'success';
    
    if (isSuccess) {
      setShowSuccess(true);
      
      // Remove the query parameter after a delay
      const timer = setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [location, navigate]);
  
  // Determine subscription level for display
  const subscriptionName = subscriptionTier === 'premium' 
    ? 'Premium' 
    : subscriptionTier === 'standard'
      ? 'Standard'
      : subscriptionTier === 'enterprise'
        ? 'Enterprise'
        : 'Basic';
  
  // If showing success message, render that first
  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-900 to-blue-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-2 border-green-500 bg-blue-950/50">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 bg-green-500/20 p-3 rounded-full w-16 h-16 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-green-500" />
            </div>
            <CardTitle className="text-2xl text-white">Subscription Activated!</CardTitle>
            <CardDescription className="text-blue-200">
              Your {subscriptionName} plan is now active
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center text-blue-100">
            <p>Thank you for subscribing to LARK. You now have access to all {subscriptionName} features.</p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button 
              onClick={() => setShowSuccess(false)}
              className="bg-blue-600 hover:bg-blue-500"
            >
              Continue to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  // Otherwise show the Clean Dashboard
  return (
    <div className="min-h-screen">
      <SimpleDashboard onLocationChange={setCurrentLocation} />
    </div>
  );
};

export default DashboardPage;
