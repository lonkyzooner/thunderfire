# LARK Production Deployment Guide

## 🚀 Complete Vercel Deployment Instructions

### **Prerequisites**
- Vercel account created
- Domain name configured (optional)
- All API keys and credentials ready
- MongoDB database accessible from internet

### **Step 1: Initial Vercel Setup**

1. **Connect Repository to Vercel**
   ```bash
   # Install Vercel CLI (if not installed)
   npm i -g vercel
   
   # Login to Vercel
   vercel login
   
   # Deploy from project directory
   vercel
   ```

2. **Configure Build Settings**
   - Framework Preset: `Vite`
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `dist`

### **Step 2: Environment Variables Configuration**

#### **Frontend Variables (Client-side)**
Configure in Vercel Dashboard → Settings → Environment Variables:

```bash
# AI Services
VITE_OPENAI_API_KEY=sk-your-openai-key
VITE_ANTHROPIC_API_KEY=your-anthropic-key
VITE_GROQ_API_KEY=your-groq-key
VITE_GEMINI_API_KEY=your-gemini-key
VITE_COHERE_API_KEY=your-cohere-key
VITE_OPENROUTER_API_KEY=your-openrouter-key
VITE_HUGGINGFACE_API_KEY=your-hf-key
VITE_PINECONE_API_KEY=your-pinecone-key

# Maps & Location
VITE_MAPBOX_TOKEN=pk.your-mapbox-token
VITE_MAPBOX_ACCESS_TOKEN=pk.your-mapbox-token

# Payment (Public Key Only)
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your-stripe-publishable-key

# Voice Services
VITE_LIVEKIT_URL=wss://your-livekit-domain.livekit.cloud
VITE_LIVEKIT_API_KEY=your-livekit-api-key
VITE_LIVEKIT_API_SECRET=your-livekit-secret

# Authentication
VITE_AUTH0_DOMAIN=your-auth0-domain.auth0.com
VITE_AUTH0_CLIENT_ID=your-auth0-client-id
VITE_AUTH0_AUDIENCE=your-auth0-api-audience

# Database
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# Application
VITE_API_BASE_URL=https://your-vercel-app.vercel.app
VITE_API_URL=https://your-vercel-app.vercel.app/api
VITE_APP_VERSION=1.0.1
VITE_APP_AES_PASSWORD=your-encryption-password
NODE_ENV=production
```

#### **Server Variables (API Functions)**
Also configure in Vercel Dashboard:

```bash
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/lark
MONGO_FIELD_KEY=your-32-char-encryption-key

# Payment (Secret Keys)
STRIPE_SECRET_KEY=sk_live_your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# Stripe Price IDs
STRIPE_PRICE_STANDARD_MONTHLY=price_standard_monthly_id
STRIPE_PRICE_STANDARD_ANNUAL=price_standard_annual_id
STRIPE_PRICE_PREMIUM_MONTHLY=price_premium_monthly_id
STRIPE_PRICE_PREMIUM_ANNUAL=price_premium_annual_id
STRIPE_PRICE_ENTERPRISE_MONTHLY=price_enterprise_monthly_id
STRIPE_PRICE_ENTERPRISE_ANNUAL=price_enterprise_annual_id

# Authentication & Security
JWT_SECRET=your-jwt-secret-64-chars-long

# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@domain.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@yourdomain.com

# Voice Services (Server)
LIVEKIT_API_KEY=your-livekit-api-key
LIVEKIT_API_SECRET=your-livekit-secret

# URLs
FRONTEND_URL=https://your-vercel-app.vercel.app
NEXT_PUBLIC_BASE_URL=https://your-vercel-app.vercel.app

# External APIs
OPENROUTER_API_KEY=your-openrouter-key
```

### **Step 3: Domain Configuration (Optional)**

1. **Add Custom Domain**
   - Vercel Dashboard → Settings → Domains
   - Add your domain (e.g., `lark-ai.com`)
   - Configure DNS records as instructed

2. **Update Environment Variables**
   ```bash
   VITE_API_BASE_URL=https://your-domain.com
   FRONTEND_URL=https://your-domain.com
   NEXT_PUBLIC_BASE_URL=https://your-domain.com
   ```

### **Step 4: External Service Configuration**

#### **MongoDB Setup**
1. Ensure MongoDB Atlas cluster is accessible
2. Add Vercel IP ranges to whitelist (or use 0.0.0.0/0 for simplicity)
3. Test connection with provided URI

#### **Stripe Configuration**
1. **Webhook Endpoint**
   - Stripe Dashboard → Webhooks
   - Add endpoint: `https://your-domain.com/api/stripe/webhook`
   - Select events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`

2. **Price IDs**
   - Create products in Stripe Dashboard
   - Copy price IDs to environment variables

#### **Email Service Setup**
1. **Gmail App Password** (Recommended)
   - Enable 2FA on Gmail account
   - Generate app-specific password
   - Use in `EMAIL_PASSWORD`

2. **Custom SMTP** (Alternative)
   - Configure your email provider
   - Update `EMAIL_SERVICE` accordingly

#### **LiveKit Configuration**
1. Create LiveKit Cloud project
2. Get WebSocket URL and API credentials
3. Configure in environment variables

### **Step 5: Testing Deployment**

1. **Run Deployment Tests**
   ```bash
   npm test -- tests/vercel-deployment.test.js
   ```

2. **Manual Testing Checklist**
   - [ ] Homepage loads correctly
   - [ ] Authentication flow works
   - [ ] API endpoints respond
   - [ ] Magic link emails send
   - [ ] Stripe payments process
   - [ ] Voice services connect
   - [ ] Maps display correctly

### **Step 6: Performance Optimization**

1. **Monitor Performance**
   - Vercel Analytics dashboard
   - Core Web Vitals
   - Function execution times

2. **Optimize if Needed**
   - Increase function memory if timeouts occur
   - Review and optimize slow API endpoints
   - Monitor database connection limits

### **Step 7: Security Validation**

1. **Security Headers Check**
   - Use https://securityheaders.com
   - Verify all security headers are present

2. **Environment Variables Audit**
   - Ensure no secrets in frontend variables
   - All sensitive data in server-only variables

3. **API Security**
   - Test authentication endpoints
   - Verify CORS configuration
   - Check rate limiting (if implemented)

### **Step 8: Monitoring & Maintenance**

1. **Set Up Monitoring**
   - Vercel Functions logs
   - Error tracking (Sentry, LogRocket)
   - Uptime monitoring

2. **Regular Maintenance**
   - Monitor function performance
   - Update dependencies regularly
   - Review security configurations

## 🔧 Troubleshooting Guide

### **Common Issues**

1. **Function Timeouts**
   - Increase memory allocation in vercel.json
   - Optimize database queries
   - Add connection caching

2. **Environment Variables Not Loading**
   - Check variable names (case-sensitive)
   - Ensure proper environment scope (Production/Preview)
   - Redeploy after adding variables

3. **Database Connection Issues**
   - Verify MongoDB URI format
   - Check IP whitelist settings
   - Test connection from external tool

4. **Email Delivery Problems**
   - Verify email service credentials
   - Check spam folders
   - Test with different email providers

5. **Stripe Webhook Failures**
   - Verify webhook URL is accessible
   - Check webhook secret matches
   - Monitor Stripe Dashboard for delivery attempts

## 📊 Performance Expectations

| Metric | Target | Optimized Value |
|--------|--------|-----------------|
| **First Load** | < 3s | ~1.5s |
| **API Response** | < 2s | ~500ms |
| **Cold Start** | < 5s | ~2s |
| **Bundle Size** | < 1MB | ~400KB |

## 🎯 Production Checklist

- [ ] All environment variables configured
- [ ] Domain and SSL certificates set up
- [ ] Database accessible and secure
- [ ] Email service configured and tested
- [ ] Stripe webhooks configured
- [ ] Security headers validated
- [ ] Performance metrics acceptable
- [ ] Error monitoring set up
- [ ] Backup and recovery plan in place

## 🚨 Post-Deployment Validation

Run these commands after deployment:

```bash
# Test API endpoints
curl https://your-domain.com/api/auth/magic-link -X OPTIONS

# Test frontend
curl https://your-domain.com/

# Run full test suite
npm test
```

## 📞 Support & Maintenance

- Monitor Vercel dashboard for function metrics
- Set up alerts for high error rates
- Regular security updates and dependency maintenance
- Performance monitoring and optimization

Your LARK application is now ready for production deployment! 🚀
