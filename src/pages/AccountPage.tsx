import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { UserCircle, CreditCard, Settings2, Bell, Lock, LogOut, CheckCircle, Clock } from 'lucide-react';
import { useStripe } from '../contexts/StripeContext';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/DevAuthContext';
import { useUserDepartment } from '../contexts/UserDepartmentContext';
import SubscriptionManager from '../components/SubscriptionManager';

const AccountPage: React.FC = () => {
  const { user, logout } = useAuth();
  const { subscriptionTier, hasFeature } = useStripe();
  const [activeTab, setActiveTab] = useState('overview');
  const [subscriptionDetails, setSubscriptionDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
// Editable profile state
const [editName, setEditName] = useState(user?.name || "");
const [editEmail, setEditEmail] = useState(user?.email || "");
const [editDepartmentId, setEditDepartmentId] = useState(user?.departmentId || "");
const [editBadgeNumber, setEditBadgeNumber] = useState(user?.badgeNumber || "");
const { user: userCtx, setUser: setUserCtx } = useUserDepartment();
const [editRank, setEditRank] = useState(userCtx?.rank || "officer");
const [profileSaving, setProfileSaving] = useState(false);

// Notification preferences state
const [emailNotifications, setEmailNotifications] = useState(true);
const [appNotifications, setAppNotifications] = useState(true);
const [prefsSaving, setPrefsSaving] = useState(false);

// Save profile handler
const handleSaveProfile = async () => {
  setProfileSaving(true);
  try {
    // Example: Replace with real API call
    const res = await fetch(`/api/admin/users/${userCtx.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({
        name: editName,
        rank: editRank,
        email: editEmail,
        departmentId: editDepartmentId,
        badgeNumber: editBadgeNumber,
      }),
    });
    if (!res.ok) throw new Error("Failed to update profile");
    const data = await res.json();
    setUserCtx({
      ...userCtx,
      name: data.user.name,
      rank: data.user.rank,
      email: data.user.email,
      departmentId: data.user.departmentId,
      badgeNumber: data.user.badgeNumber,
    });
    // show success feedback (toast/snackbar)
  } catch (e) {
    // show error feedback
  } finally {
    setProfileSaving(false);
  }
};

// Cancel profile edits
const handleCancelProfile = () => {
  setEditName(user?.name || "");
  setEditEmail(user?.email || "");
  setEditDepartmentId(user?.departmentId || "");
  setEditBadgeNumber(user?.badgeNumber || "");
};

// Save preferences handler
const handleSavePreferences = async () => {
  setPrefsSaving(true);
  try {
    // TODO: Replace with real API call or context update
    await new Promise(res => setTimeout(res, 800));
    // show success feedback
  } catch (e) {
    // show error feedback
  } finally {
    setPrefsSaving(false);
  }
};

  // Fetch subscription details
  useEffect(() => {
    const fetchSubscriptionDetails = async () => {
      if (!subscriptionTier) return;
      
      setIsLoading(true);
      try {
        // In production, you would fetch real subscription data from your backend
        // For now, we'll simulate it with local data
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const tierDetails = {
          'basic': {
            name: 'Basic Plan',
            amount: 14.99,
            billingPeriod: 'monthly',
            nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            features: ['Miranda Rights delivery', 'Basic statute lookups', 'Voice activation']
          },
          'standard': {
            name: 'Standard Plan',
            amount: 24.99,
            billingPeriod: 'monthly',
            nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            features: ['Miranda Rights delivery', 'Advanced statute lookups', 'Voice activation', 'Threat detection', 'Multi-language support']
          },
          'premium': {
            name: 'Premium Plan',
            amount: 49.99,
            billingPeriod: 'monthly',
            nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            features: ['Miranda Rights delivery', 'Advanced statute lookups', 'Voice activation', 'Threat detection', 'Multi-language support', 'Training mode', 'Advanced analytics']
          }
        };
        
        setSubscriptionDetails(tierDetails[subscriptionTier as keyof typeof tierDetails]);
      } catch (error) {
        console.error('Error fetching subscription details:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSubscriptionDetails();
  }, [subscriptionTier]);

  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 to-blue-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
<Link to="/dashboard">
  <Button variant="secondary" className="mb-2 mr-4">Dashboard</Button>
</Link>
          <h1 className="text-3xl font-bold text-white">My Account</h1>
          <p className="text-blue-200">Manage your LARK subscription and settings</p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <div className="w-full md:w-64 shrink-0">
            <Card className="bg-blue-950/50 border-blue-800/50">
              <CardContent className="p-4">
                <div className="text-center mb-6 pt-4">
                  <div className="h-20 w-20 rounded-full bg-blue-800 mx-auto flex items-center justify-center">
                    <UserCircle className="h-12 w-12 text-white" />
                  </div>
                  <h3 className="mt-4 font-medium text-white text-lg">{user?.name || 'Officer'}</h3>
                  <p className="text-blue-300 text-sm">{user?.email || 'user@example.com'}</p>
                  
                  {subscriptionTier && (
                    <Badge className="mt-2 bg-blue-600">{
                      subscriptionTier === 'basic' ? 'Basic Plan' :
                      subscriptionTier === 'standard' ? 'Standard Plan' :
                      subscriptionTier === 'premium' ? 'Premium Plan' : 'Free Trial'
                    }</Badge>
                  )}
                </div>
                
                <nav className="mt-4 space-y-1">
                  <Button 
                    variant={activeTab === 'overview' ? 'default' : 'ghost'} 
                    className="w-full justify-start" 
                    onClick={() => setActiveTab('overview')}
                  >
                    <UserCircle className="mr-2 h-4 w-4" />
                    Overview
                  </Button>
                  
                  <Button 
                    variant={activeTab === 'billing' ? 'default' : 'ghost'} 
                    className="w-full justify-start" 
                    onClick={() => setActiveTab('billing')}
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Billing
                  </Button>
                  
                  <Button 
                    variant={activeTab === 'settings' ? 'default' : 'ghost'} 
                    className="w-full justify-start" 
                    onClick={() => setActiveTab('settings')}
                  >
                    <Settings2 className="mr-2 h-4 w-4" />
                    Settings
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-900/20" 
                    onClick={logout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </Button>
                </nav>
              </CardContent>
            </Card>
          </div>
          
          {/* Main Content */}
          <div className="flex-1">
            {activeTab === 'overview' && (
              <Card className="bg-blue-950/50 border-blue-800/50">
                <CardHeader>
                  <CardTitle>Account Overview</CardTitle>
                  <CardDescription className="text-blue-300">
                    Review your account details and subscription status
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Subscription Status */}
                  <div>
                    <h3 className="text-lg font-medium text-white mb-4">Subscription Status</h3>
                    
                    {!subscriptionTier ? (
                      <Alert className="bg-blue-900/50 border-blue-700">
                        <Clock className="h-4 w-4 text-blue-400" />
                        <AlertTitle className="text-white">No active subscription</AlertTitle>
                        <AlertDescription className="text-blue-200">
                          You don't have an active subscription. 
                          <Link to="/pricing" className="ml-2 text-blue-400 underline">
                            View pricing plans
                          </Link>
                        </AlertDescription>
                      </Alert>
                    ) : isLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                      </div>
                    ) : (
                      <div className="bg-blue-900/30 rounded-lg p-4 border border-blue-800/50">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center">
                              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                              <h4 className="font-semibold text-white">{subscriptionDetails?.name}</h4>
                            </div>
                            <p className="text-blue-300 mt-1">
                              ${subscriptionDetails?.amount}/month
                            </p>
                          </div>
                          <Button size="sm" asChild>
                            <Link to="/pricing">Change Plan</Link>
                          </Button>
                        </div>
                        
                        <div className="mt-4 pt-4 border-t border-blue-800/30">
                          <p className="text-blue-300 text-sm">
                            Next billing date: {subscriptionDetails?.nextBillingDate && formatDate(subscriptionDetails.nextBillingDate)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Features */}
                  {subscriptionTier && subscriptionDetails && (
                    <div>
                      <h3 className="text-lg font-medium text-white mb-4">Included Features</h3>
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {subscriptionDetails.features.map((feature: string, index: number) => (
                          <li key={index} className="flex items-center">
                            <CheckCircle className="h-4 w-4 text-green-500 mr-2 shrink-0" />
                            <span className="text-blue-200">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Recent Activity */}
                  <div>
                    <h3 className="text-lg font-medium text-white mb-4">Recent Activity</h3>
                    <div className="bg-blue-900/30 rounded-lg p-4 border border-blue-800/50 text-center py-8">
                      <p className="text-blue-300">No recent activity to display</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {activeTab === 'billing' && (
              <div className="space-y-6">
                <Card className="bg-blue-950/50 border-blue-800/50">
                  <CardHeader>
                    <CardTitle>Billing & Subscription</CardTitle>
                    <CardDescription className="text-blue-300">
                      Manage your subscription and payment methods
                    </CardDescription>
                  </CardHeader>
                </Card>
                
                <div className="bg-gradient-to-b from-gray-50 to-white rounded-lg p-6">
                  <SubscriptionManager />
                </div>
              </div>
            )}
            
            {activeTab === 'settings' && (
              <Card className="bg-blue-950/50 border-blue-800/50">
                <CardHeader>
                  <CardTitle>Account Settings</CardTitle>
                  <CardDescription className="text-blue-300">
                    Manage your profile and application preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Profile Settings */}
                  <div>
                    <h3 className="text-lg font-medium text-white mb-4">Profile Information</h3>
                    <div className="bg-blue-900/30 rounded-lg p-4 border border-blue-800/50 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-blue-300 mb-1">Name</label>
                          <input
                            type="text"
                            value={editName}
                            onChange={e => setEditName(e.target.value)}
                            className="w-full bg-blue-900/50 border border-blue-800 rounded-md px-3 py-2 text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-blue-300 mb-1">Email</label>
                          <input
                            type="email"
                            value={editEmail}
                            onChange={e => setEditEmail(e.target.value)}
                            className="w-full bg-blue-900/50 border border-blue-800 rounded-md px-3 py-2 text-white"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-blue-300 mb-1">Department ID</label>
                        <input
                          type="text"
                          value={editDepartmentId}
                          onChange={e => setEditDepartmentId(e.target.value)}
                          placeholder="Enter your department ID"
                          className="w-full bg-blue-900/50 border border-blue-800 rounded-md px-3 py-2 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-blue-300 mb-1">Badge Number</label>
                        <input
                          type="text"
                          value={editBadgeNumber}
                          onChange={e => setEditBadgeNumber(e.target.value)}
                          placeholder="Enter your badge number"
                          className="w-full bg-blue-900/50 border border-blue-800 rounded-md px-3 py-2 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-blue-300 mb-1">Rank</label>
                        <select
                          value={editRank}
                          onChange={e => setEditRank(e.target.value)}
                          className="w-full bg-blue-900/50 border border-blue-800 rounded-md px-3 py-2 text-white"
                        >
                          <option value="officer">Officer</option>
                          <option value="deputy">Deputy</option>
                          <option value="sergeant">Sergeant</option>
                          <option value="lieutenant">Lieutenant</option>
                          <option value="captain">Captain</option>
                          <option value="chief">Chief</option>
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleSaveProfile} disabled={profileSaving}>
                          {profileSaving ? "Saving..." : "Save"}
                        </Button>
                        <Button variant="ghost" onClick={handleCancelProfile} disabled={profileSaving}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Notification Settings */}
                  <div>
                    <h3 className="text-lg font-medium text-white mb-4">Notification Preferences</h3>
                    <div className="bg-blue-900/30 rounded-lg p-4 border border-blue-800/50 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Bell className="h-5 w-5 text-blue-400 mr-3" />
                          <span className="text-white">Email Notifications</span>
                        </div>
                        <div className="relative inline-block w-12 h-6">
                          <input
                            type="checkbox"
                            className="sr-only"
                            id="toggle-email"
                            checked={emailNotifications}
                            onChange={e => setEmailNotifications(e.target.checked)}
                          />
                          <div className="block bg-blue-800 w-12 h-6 rounded-full"></div>
                          <div
                            className={`dot absolute top-1 bg-white w-4 h-4 rounded-full transition ${emailNotifications ? "left-7" : "left-1"}`}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Bell className="h-5 w-5 text-blue-400 mr-3" />
                          <span className="text-white">App Notifications</span>
                        </div>
                        <div className="relative inline-block w-12 h-6">
                          <input
                            type="checkbox"
                            className="sr-only"
                            id="toggle-app"
                            checked={appNotifications}
                            onChange={e => setAppNotifications(e.target.checked)}
                          />
                          <div className="block bg-blue-600 w-12 h-6 rounded-full"></div>
                          <div
                            className={`dot absolute top-1 bg-white w-4 h-4 rounded-full transition ${appNotifications ? "left-7" : "left-1"}`}
                          ></div>
                        </div>
                      </div>
                      
                      <Button onClick={handleSavePreferences} disabled={prefsSaving}>
                        {prefsSaving ? "Saving..." : "Save Preferences"}
                      </Button>
                    </div>
                  </div>
                  
                  {/* Security Settings */}
                  <div>
                    <h3 className="text-lg font-medium text-white mb-4">Security</h3>
                    <div className="bg-blue-900/30 rounded-lg p-4 border border-blue-800/50 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Lock className="h-5 w-5 text-blue-400 mr-3" />
                          <span className="text-white">Change Password</span>
                        </div>
                        <Button variant="outline" size="sm">Update</Button>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Lock className="h-5 w-5 text-blue-400 mr-3" />
                          <span className="text-white">Two-Factor Authentication</span>
                        </div>
                        <Button variant="outline" size="sm">Enable</Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountPage;
