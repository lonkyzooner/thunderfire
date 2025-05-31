# End-to-End Subscription Flow Test Plan

Use this checklist to verify that your Stripe + Supabase integration works as expected for all critical subscription scenarios.

---

## 1. Stripe Checkout: Sign Up, Pay, and Confirm Access

- [ ] Sign up as a new user in the app.
- [ ] Start the subscription/upgrade flow and select a paid plan.
- [ ] Complete payment via Stripe Checkout.
- [ ] After payment, you are redirected to the app.
- [ ] In Supabase, confirm the user's `subscription_status` is `active` and `stripe_customer_id` is set.
- [ ] In the app, confirm access to premium features is granted (e.g., no paywall, premium UI elements visible).

## 2. Subscription Cancellation and Failed Payments

- [ ] As a paying user, go to the customer portal or Stripe dashboard and cancel your subscription.
- [ ] Wait for the Stripe webhook to process (a few seconds).
- [ ] In Supabase, confirm the user's `subscription_status` is `canceled`.
- [ ] In the app, confirm access to premium features is revoked (e.g., paywall or downgrade message appears).
- [ ] (Optional) Simulate a failed payment in Stripe (e.g., use a test card that fails).
- [ ] Confirm the user's `subscription_status` is updated to `past_due` or `canceled` in Supabase.
- [ ] Confirm the app restricts access accordingly.

## 3. Customer Portal: Manage/Cancel Subscription

- [ ] As a paying user, access the Stripe customer portal from the app.
- [ ] Change your plan, update payment method, or cancel the subscription.
- [ ] Confirm changes are reflected in Supabase (`subscription_status`, `subscription_tier`).
- [ ] Confirm the app UI updates to reflect the new subscription state.

---

## Notes

- For each test, check both the Supabase dashboard (profiles table) and the app UI.
- If any step fails, check the Stripe webhook logs and backend logs for errors.
- Mark each step as complete when verified.

---

This file can be updated as you add new subscription features or flows.