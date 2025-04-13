import React, { createContext, useContext, useState, useEffect } from 'react';

// Define user subscription levels
export type SubscriptionTier = 'free' | 'basic' | 'standard' | 'premium' | 'enterprise';

export interface UserProfile {
  sub: string;
  email: string;
  name: string;
  picture?: string;
  departmentId?: string;
  badgeNumber?: string;
  role?: string;
  subscriptionTier?: SubscriptionTier;
  subscriptionStatus?: 'active' | 'past_due' | 'canceled' | 'trialing' | 'inactive';
  subscriptionExpiry?: Date;
  features?: string[];
  apiQuota?: {
    total: number;
    used: number;
    reset: Date;
  };
  lastLogin?: Date;
  metadata?: Record<string, any>;
  orgId?: string;
  userId?: string;
}

const mockUserProfile: UserProfile = {
  sub: 'mock-user-123',
  email: 'officer@lark-demo.com',
  name: 'Demo Officer',
  picture: 'https://i.pravatar.cc/150?u=officer@lark-demo.com',
  departmentId: 'LAPD-12345',
  badgeNumber: 'B-9876',
  role: 'patrol',
  subscriptionTier: 'premium',
  subscriptionStatus: 'active',
  subscriptionExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  features: [
    'voice_control',
    'incident_reporting',
    'map_view',
    'admin_panel'
  ],
  apiQuota: {
    total: 10000,
    used: 100,
    reset: new Date(Date.now() + 24 * 60 * 60 * 1000)
  },
  lastLogin: new Date(),
  metadata: {},
  orgId: 'mock-org-123',
  userId: 'mock-user-123'
};

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserProfile | null;
  hasFeature: (feature: string) => boolean;
  hasSubscriptionTier: (tier: SubscriptionTier) => boolean;
  login: (user: UserProfile, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  user: null,
  hasFeature: () => false,
  hasSubscriptionTier: () => false,
  login: () => {},
  logout: () => {}
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for JWT and user info in localStorage
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (token && userStr) {
      try {
        const userObj = JSON.parse(userStr);
        setUser(userObj);
        setIsAuthenticated(true);
      } catch {
        setUser(null);
        setIsAuthenticated(false);
      }
    } else {
      // Fallback to mock user in development
      setUser(mockUserProfile);
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const hasFeature = (feature: string) => {
    return user?.features?.includes(feature) ?? false;
  };

  const hasSubscriptionTier = (tier: SubscriptionTier) => {
    if (!user?.subscriptionTier) return false;
    const tiers: SubscriptionTier[] = ['free', 'basic', 'standard', 'premium', 'enterprise'];
    return tiers.indexOf(user.subscriptionTier) >= tiers.indexOf(tier);
  };

  const login = (user: UserProfile, token: string) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setUser(user);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, user, hasFeature, hasSubscriptionTier, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
