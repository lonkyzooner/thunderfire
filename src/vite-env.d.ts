/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_WS_URL: string
  readonly VITE_OPENROUTER_API_KEY: string
  readonly VITE_MAPBOX_TOKEN: string
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_STRIPE_PUBLISHABLE_KEY: string
  readonly VITE_STRIPE_PRICE_BASIC_MONTHLY: string
  readonly VITE_STRIPE_PRICE_STANDARD_MONTHLY: string
  readonly VITE_STRIPE_PRICE_PREMIUM_MONTHLY: string
  readonly VITE_STRIPE_PRICE_ENTERPRISE_MONTHLY: string
  readonly VITE_STRIPE_PRICE_BASIC_ANNUAL: string
  readonly VITE_STRIPE_PRICE_STANDARD_ANNUAL: string
  readonly VITE_STRIPE_PRICE_PREMIUM_ANNUAL: string
  readonly VITE_STRIPE_PRICE_ENTERPRISE_ANNUAL: string
  readonly VITE_APP_VERSION: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
