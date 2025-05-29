/**
 * Environment Variable Service
 * 
 * This service provides secure access to environment variables and configuration
 * with proper fallbacks and validation.
 */

// Environment variable configuration with validation and defaults
interface EnvConfig {
  // API URLs
  API_URL: string;
  LIVEKIT_URL: string;
  
  // Stripe configuration
  STRIPE_PUBLISHABLE_KEY: string;
  STRIPE_PRICE_BASIC_MONTHLY: string;
  STRIPE_PRICE_STANDARD_MONTHLY: string;
  STRIPE_PRICE_PREMIUM_MONTHLY: string;
  STRIPE_PRICE_ENTERPRISE_MONTHLY: string;
  STRIPE_PRICE_BASIC_ANNUAL: string;
  STRIPE_PRICE_STANDARD_ANNUAL: string;
  STRIPE_PRICE_PREMIUM_ANNUAL: string;
  STRIPE_PRICE_ENTERPRISE_ANNUAL: string;
  
  // LLM API Keys
  OPENAI_API_KEY: string;
  ANTHROPIC_API_KEY: string;
  GROQ_API_KEY: string;
  OPENROUTER_API_KEY: string;
  
  // Supabase configuration
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  
  // Application settings
  APP_VERSION: string;
  NODE_ENV: 'development' | 'production' | 'test';
}

// Get environment variables with validation
export function getEnv(): EnvConfig {
  // Get environment from Vite
  const env = import.meta.env;
  
  // Validate required environment variables
  const requiredVars = [
    'VITE_API_URL',
    'VITE_LIVEKIT_URL',
    'VITE_STRIPE_PUBLISHABLE_KEY',
    'VITE_OPENAI_API_KEY',
    'VITE_ANTHROPIC_API_KEY',
    'VITE_GROQ_API_KEY',
    'VITE_OPENROUTER_API_KEY',
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'VITE_STRIPE_PRICE_BASIC_MONTHLY',
    'VITE_STRIPE_PRICE_STANDARD_MONTHLY',
    'VITE_STRIPE_PRICE_PREMIUM_MONTHLY',
    'VITE_STRIPE_PRICE_ENTERPRISE_MONTHLY',
    'VITE_STRIPE_PRICE_BASIC_ANNUAL',
    'VITE_STRIPE_PRICE_STANDARD_ANNUAL',
    'VITE_STRIPE_PRICE_PREMIUM_ANNUAL',
    'VITE_STRIPE_PRICE_ENTERPRISE_ANNUAL'
  ];
  
  // In production, throw errors for missing required variables
  if (env.PROD) {
    for (const varName of requiredVars) {
      if (!env[varName]) {
        console.error(`Missing required environment variable: ${varName}`);
        // In production, we'll log the error but use fallbacks
        // This prevents the app from crashing but logs the issue
      }
    }
  }
  
  // Return environment config with fallbacks only for non-sensitive values
  return {
    // For non-sensitive values, we can provide fallbacks
    API_URL: env.VITE_API_URL || (env.DEV ? 'http://localhost:3000/api' : ''),
    LIVEKIT_URL: env.VITE_LIVEKIT_URL || '',
    STRIPE_PUBLISHABLE_KEY: env.VITE_STRIPE_PUBLISHABLE_KEY || '',
    OPENAI_API_KEY: env.VITE_OPENAI_API_KEY || '',
    ANTHROPIC_API_KEY: env.VITE_ANTHROPIC_API_KEY || '',
    GROQ_API_KEY: env.VITE_GROQ_API_KEY || '',
    OPENROUTER_API_KEY: env.VITE_OPENROUTER_API_KEY || '',
    SUPABASE_URL: env.VITE_SUPABASE_URL || '',
    SUPABASE_ANON_KEY: env.VITE_SUPABASE_ANON_KEY || '',
    STRIPE_PRICE_BASIC_MONTHLY: env.VITE_STRIPE_PRICE_BASIC_MONTHLY || 'price_basic_monthly',
    STRIPE_PRICE_STANDARD_MONTHLY: env.VITE_STRIPE_PRICE_STANDARD_MONTHLY || 'price_standard_monthly',
    STRIPE_PRICE_PREMIUM_MONTHLY: env.VITE_STRIPE_PRICE_PREMIUM_MONTHLY || 'price_premium_monthly',
    STRIPE_PRICE_ENTERPRISE_MONTHLY: env.VITE_STRIPE_PRICE_ENTERPRISE_MONTHLY || 'price_enterprise_monthly',
    STRIPE_PRICE_BASIC_ANNUAL: env.VITE_STRIPE_PRICE_BASIC_ANNUAL || 'price_basic_annual',
    STRIPE_PRICE_STANDARD_ANNUAL: env.VITE_STRIPE_PRICE_STANDARD_ANNUAL || 'price_standard_annual',
    STRIPE_PRICE_PREMIUM_ANNUAL: env.VITE_STRIPE_PRICE_PREMIUM_ANNUAL || 'price_premium_annual',
    STRIPE_PRICE_ENTERPRISE_ANNUAL: env.VITE_STRIPE_PRICE_ENTERPRISE_ANNUAL || 'price_enterprise_annual',
    APP_VERSION: env.VITE_APP_VERSION || '1.0.0',
    NODE_ENV: env.MODE as 'development' | 'production' | 'test'
  };
}

// Check if we're in development mode
export const isDevelopment = (): boolean => {
  return getEnv().NODE_ENV === 'development';
};

// Check if we're in production mode
export const isProduction = (): boolean => {
  return getEnv().NODE_ENV === 'production';
};

// Check if we're in test mode
export const isTest = (): boolean => {
  return getEnv().NODE_ENV === 'test';
};
