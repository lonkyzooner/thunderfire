# Production Readiness Checklist

Use this checklist to track and complete all critical steps before launching to users.

---

## 1. Authentication & User Management
- [ ] Supabase Auth fully integrated and tested (sign up, login, password reset, profile management)
- [ ] Social login (if needed) configured and tested
- [ ] Email verification and onboarding flows in place

## 2. Subscription & Payments
- [ ] Stripe checkout, billing, and customer portal flows tested end-to-end
- [ ] Stripe webhooks reliably update Supabase with subscription status
- [ ] Access control in the frontend based on Supabase subscription status
- [ ] Graceful handling of failed/canceled payments

## 3. Database & Data Integrity
- [ ] Supabase tables (profiles, subscriptions, etc.) have all required fields and indexes
- [ ] Row Level Security (RLS) policies enabled and tested for all tables
- [ ] Data validation and sanitization on all user input

## 4. Security
- [ ] No secret keys or sensitive data exposed in frontend code or public repos
- [ ] HTTPS enforced for all API endpoints
- [ ] CORS, rate limiting, and helmet configured on backend
- [ ] Regular dependency audits and updates

## 5. Testing & Quality Assurance
- [ ] Automated tests for critical flows (auth, payments, access control)
- [ ] Manual QA for all user journeys (sign up, subscribe, cancel, etc.)
- [ ] Error boundaries and user-friendly error messages in the UI

## 6. Deployment & Environment
- [ ] Environment variables set for all environments (dev, staging, prod)
- [ ] Vercel/Netlify/other deployment pipeline tested
- [ ] Supabase and Stripe credentials set in production environment

## 7. Monitoring & Analytics
- [ ] Logging and alerting for backend errors and webhook failures
- [ ] Basic analytics for user signups, subscriptions, and churn

## 8. User Experience
- [ ] Onboarding and help content for new users
- [ ] Responsive design and accessibility checks
- [ ] Clear upgrade/cancel flows and support contact info

## 9. Documentation
- [ ] Up-to-date README and developer onboarding docs
- [ ] User-facing documentation or FAQ

## 10. Backup & Recovery
- [ ] Regular database backups configured in Supabase
- [ ] Disaster recovery plan for critical data

---

Check off each item as you complete it. This file can be updated and committed as progress is made.