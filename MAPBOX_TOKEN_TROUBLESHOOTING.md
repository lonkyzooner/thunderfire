# Mapbox Token Troubleshooting

## Checklist

1. **Doppler**
   - Ensure `VITE_MAPBOX_TOKEN` is set in the Doppler project for the correct config/environment (e.g., "Production" for production deploys).
   - The value should be a valid Mapbox public access token (starts with `pk.`).

2. **Vercel**
   - In your Vercel project settings, under Environment Variables, confirm that `VITE_MAPBOX_TOKEN` is present for the environment you are deploying to (Production, Preview, or Development).
   - If using Doppler integration, make sure secrets are being injected for all environments.

3. **Codebase**
   - The code should reference the token as `import.meta.env.VITE_MAPBOX_TOKEN`.
   - No hardcoded Mapbox tokens should remain.

## Optional: Add Runtime Error Handling

Add this check to your Mapbox initialization code (e.g., in `OfficerMap.tsx`):

```js
if (!import.meta.env.VITE_MAPBOX_TOKEN) {
  console.error(
    "[Mapbox] VITE_MAPBOX_TOKEN is missing. Please set it in your environment variables (Doppler/Vercel)."
  );
  alert("Mapbox access token is missing. Please contact your administrator.");
}
```

## How to Test

- Deploy your app and open the browser console.
- You should NOT see the "An API access token is required to use Mapbox GL" error.
- The map should load and geocoding requests should return 200, not 401.

If you still see errors, verify the token value in Doppler and Vercel, and redeploy if needed.