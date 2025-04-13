import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { UserProfile, SubscriptionTier } from '../contexts/AuthContext';

interface SupabaseAuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserProfile | null;
  error: Error | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<boolean>;
  hasFeature: (featureName: string) => boolean;
  hasSubscriptionTier: (minimumTier: SubscriptionTier) => boolean;
  refreshUserProfile: () => Promise<void>;
}

const SupabaseAuthContext = createContext<SupabaseAuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  user: null,
  error: null,
  login: async () => {},
  signup: async () => {},
  logout: async () => {},
  getAccessToken: async () => null,
  updateUserProfile: async () => false,
  hasFeature: () => false,
  hasSubscriptionTier: () => false,
  refreshUserProfile: async () => {},
});

const tierHierarchy: Record<SubscriptionTier, number> = {
  'free': 0,
  'basic': 1,
  'standard': 2,
  'premium': 3,
  'enterprise': 4
};

export const SupabaseAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { handleError } = useErrorHandler();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch user profile from Supabase
  const fetchUserProfile = useCallback(async () => {
    setIsLoading(true);
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    const { user: supabaseUser } = sessionData.session;
    // Example: fetch additional profile data from a 'profiles' table
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', supabaseUser.id)
      .single();

    setUser({
      sub: supabaseUser.id,
      email: supabaseUser.email || '',
      name: profileData?.name || supabaseUser.email || '',
      picture: profileData?.avatar_url || '',
      orgId: profileData?.orgId || '',
      departmentId: profileData?.departmentId,
      badgeNumber: profileData?.badgeNumber,
      role: profileData?.role,
      subscriptionTier: profileData?.subscriptionTier || 'free',
      subscriptionStatus: profileData?.subscriptionStatus || 'inactive',
      subscriptionExpiry: profileData?.subscriptionExpiry ? new Date(profileData.subscriptionExpiry) : undefined,
      features: profileData?.features || [],
      apiQuota: profileData?.apiQuota || { total: 0, used: 0, reset: new Date() },
      lastLogin: new Date(),
      metadata: profileData?.metadata || {}
    });
    setIsLoading(false);
  }, []);

  // Signup
  const signup = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setError(error);
      handleError({ message: error.message, source: 'SupabaseAuth', recoverable: true });
    }
    await fetchUserProfile();
    setIsLoading(false);
  }, [fetchUserProfile, handleError]);

  // Login
  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error);
      handleError({ message: error.message, source: 'SupabaseAuth', recoverable: true });
    }
    await fetchUserProfile();
    setIsLoading(false);
  }, [fetchUserProfile, handleError]);

  // Logout
  const logout = useCallback(async () => {
    setIsLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      setError(error);
      handleError({ message: error.message, source: 'SupabaseAuth', recoverable: true });
    }
    setUser(null);
    setIsLoading(false);
  }, [handleError]);

  // Get access token
  const getAccessToken = useCallback(async (): Promise<string | null> => {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session) return null;
    return data.session.access_token;
  }, []);

  // Update user profile
  const updateUserProfile = useCallback(async (updates: Partial<UserProfile>): Promise<boolean> => {
    if (!user) return false;
    // Example: update the 'profiles' table
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.sub);
    if (error) {
      setError(error);
      handleError({ message: error.message, source: 'SupabaseAuth', recoverable: true });
      return false;
    }
    await fetchUserProfile();
    return true;
  }, [user, fetchUserProfile, handleError]);

  // Check if user has a specific feature
  const hasFeature = useCallback((featureName: string): boolean => {
    if (!user) return false;
    return user.features.includes(featureName);
  }, [user]);

  // Check if user has at least the specified subscription tier
  const hasSubscriptionTier = useCallback((minimumTier: SubscriptionTier): boolean => {
    if (!user) return false;
    if (user.subscriptionStatus !== 'active' && user.subscriptionStatus !== 'trialing') {
      return false;
    }
    const userTierLevel = tierHierarchy[user.subscriptionTier];
    const requiredTierLevel = tierHierarchy[minimumTier];
    return userTierLevel >= requiredTierLevel;
  }, [user]);

  // Refresh user profile
  const refreshUserProfile = useCallback(async (): Promise<void> => {
    await fetchUserProfile();
  }, [fetchUserProfile]);

  // Listen for auth state changes
  useEffect(() => {
    fetchUserProfile();
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      fetchUserProfile();
    });
    return () => {
      listener.subscription.unsubscribe();
    };
  }, [fetchUserProfile]);

  const contextValue: SupabaseAuthContextType = {
    isAuthenticated: !!user,
    isLoading,
    user,
    error,
    login,
    signup,
    logout,
    getAccessToken,
    updateUserProfile,
    hasFeature,
    hasSubscriptionTier,
    refreshUserProfile
  };

  return (
    <SupabaseAuthContext.Provider value={contextValue}>
      {children}
    </SupabaseAuthContext.Provider>
  );
};

export const useSupabaseAuth = () => useContext(SupabaseAuthContext);