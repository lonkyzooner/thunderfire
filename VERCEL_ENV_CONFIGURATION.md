# Vercel Environment Variables Configuration

This document outlines all environment variables needed for successful Vercel deployment of the LARK application.

## 🚨 CRITICAL SECURITY FIXES REQUIRED

**SECURITY ISSUE FOUND**: `VITE_STRIPE_SECRET_KEY` is exposed to frontend code, which is a **major security vulnerability**. Secret keys should NEVER be in frontend environment variables.

## Frontend Environment Variables (VITE_ prefix)

These variables are bundled into the client-side code and are public. **Only put non-sensitive data here.**

### 🔑 API Keys (Frontend)
```bash
VITE_OPENAI_API_KEY=sk-your-openai-key
VITE_ANTHROPIC_API_KEY=your-anthropic-key
VITE_GROQ_API_KEY=your-groq-key
VITE_GEMINI_API_KEY=your-gemini-key
VITE_COHERE_API_KEY=your-cohere-key
VITE_OPENROUTER_API_KEY=your-openrouter-key
VITE_HUGGINGFACE_API_KEY=your-hf-key
VITE_PINECONE_API_KEY=your-pinecone-key
```

### 🗺️ Maps & Location
```bash
VITE_MAPBOX_TOKEN=pk.your-mapbox-token
VITE_MAPBOX_ACCESS_TOKEN=pk.your-mapbox-token
```

### 💳 Stripe (Public Keys Only)
```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your-stripe-publishable-key
# REMOVE: VITE_STRIPE_SECRET_KEY (SECURITY RISK!)
```

### 🎙️ LiveKit Configuration
```bash
VITE_LIVEKIT_URL=wss://your-livekit-domain.livekit.cloud
VITE_LIVEKIT_API_KEY=your-livekit-api-key
VITE_LIVEKIT_API_SECRET=your-livekit-secret
```

### 🔐 Auth0 Configuration
```bash
VITE_AUTH0_DOMAIN=your-auth0-domain.auth0.com
VITE_AUTH0_CLIENT_ID=your-auth0-client-id
VITE_AUTH0_AUDIENCE=your-auth0-api-audience
```

### 🗄️ Supabase Configuration
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### ⚙️ Application Configuration
```bash
VITE_API_BASE_URL=https://your-vercel-app.vercel.app
VITE_API_URL=https://your-vercel-app.vercel.app/api
VITE_APP_VERSION=1.0.1
VITE_APP_AES_PASSWORD=your-encryption-password
NODE_ENV=production
```

## Server-Side Environment Variables

These variables are used by API functions and are kept secure on the server.

### 🗄️ Database Configuration
```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/lark
MONGO_FIELD_KEY=your-32-char-encryption-key
```

### 💳 Stripe Configuration (Server)
```bash
STRIPE_SECRET_KEY=sk_live_your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# Stripe Price IDs
STRIPE_PRICE_STANDARD_MONTHLY=price_standard_monthly_id
STRIPE_PRICE_STANDARD_ANNUAL=price_standard_annual_id
STRIPE_PRICE_PREMIUM_MONTHLY=price_premium_monthly_id
STRIPE_PRICE_PREMIUM_ANNUAL=price_premium_annual_id
STRIPE_PRICE_ENTERPRISE_MONTHLY=price_enterprise_monthly_id
STRIPE_PRICE_ENTERPRISE_ANNUAL=price_enterprise_annual_id

# Legacy price IDs (if needed)
STRIPE_PRICE_ID_BASIC=price_basic_id
STRIPE_PRICE_ID_PRO=price_pro_id
STRIPE_PRICE_ID_ENTERPRISE=price_enterprise_id
```

### 🔐 Authentication & Security
```bash
JWT_SECRET=your-jwt-secret-64-chars-long
```

### 📧 Email Configuration
```bash
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@domain.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@yourdomain.com
```

### 🎙️ LiveKit (Server)
```bash
LIVEKIT_API_KEY=your-livekit-api-key
LIVEKIT_API_SECRET=your-livekit-secret
```

### 🔗 URLs & Routing
```bash
FRONTEND_URL=https://your-vercel-app.vercel.app
NEXT_PUBLIC_BASE_URL=https://your-vercel-app.vercel.app
```

### 🤖 AI Services (Server)
```bash
OPENROUTER_API_KEY=your-openrouter-key
```

## 📋 Vercel Dashboard Configuration Steps

### 1. Navigate to Vercel Project Settings
- Go to your Vercel dashboard
- Select your project
- Click "Settings" → "Environment Variables"

### 2. Add Frontend Variables
Add all `VITE_` prefixed variables with their values.

### 3. Add Server Variables
Add all non-`VITE_` variables for API functions.

### 4. Set Environment Scope
- **Production**: Use for live deployment
- **Preview**: Use for staging/testing
- **Development**: Use for local development

## 🔧 Security Best Practices

### ✅ DO:
- Keep secret keys in server environment variables only
- Use different API keys for production vs development
- Regularly rotate sensitive credentials
- Use Vercel's encrypted environment variables

### ❌ DON'T:
- Put secret keys in `VITE_` variables
- Commit real API keys to version control
- Use development keys in production
- Share credentials in plain text

## 🧪 Environment Validation

Add this to your Vite config to validate critical environment variables:

```typescript
// vite.config.ts
const requiredEnvVars = [
  'VITE_OPENAI_API_KEY',
  'VITE_LIVEKIT_URL',
  'VITE_STRIPE_PUBLISHABLE_KEY'
];

requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    console.warn(`⚠️ Missing environment variable: ${envVar}`);
  }
});
```

## 🚀 Deployment Checklist

- [ ] All frontend `VITE_` variables configured
- [ ] All server variables configured
- [ ] Removed `VITE_STRIPE_SECRET_KEY` from frontend
- [ ] Updated Stripe integration to use server-side secret
- [ ] Verified all API keys are valid for production
- [ ] Tested deployment with environment variables
