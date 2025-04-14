# Verifying LARK App Functionality with Doppler and Vercel Integration

This guide walks you through verifying that your LARK app is correctly using Doppler for secrets management, is integrated with Vercel, and that you can log in and access the dashboard.

---

## 1. Confirm Doppler Integration

### Locally

1. **Install Doppler CLI**  
   [Doppler CLI Install Guide](https://docs.doppler.com/docs/install-cli)  
   ```sh
   doppler --version
   ```

2. **Authenticate and Select Project**  
   ```sh
   doppler login
   doppler setup
   ```

3. **Run the App with Doppler**  
   ```sh
   doppler run -- npm run dev
   ```
   This injects secrets from Doppler into your environment.

### On Vercel

- Go to your project in the Vercel dashboard.
- Under **Settings → Environment Variables**, confirm Doppler integration is active.
- Ensure all required secrets (API keys, tokens) are present in Doppler and mapped to Vercel.

---

## 2. Start the App

### Locally

- After running `doppler run -- npm run dev`, open your browser to:
  ```
  http://localhost:5173
  ```
  (or the port specified in your Vite config)

### On Vercel

- Visit your deployed Vercel URL, e.g.:
  ```
  https://your-app.vercel.app
  ```

---

## 3. Log In to the App

- Navigate to the login page.
- Enter valid credentials (test or real user).
- If using third-party auth (Auth0, Supabase, etc.), ensure callback URLs and secrets are set in Doppler and Vercel.

---

## 4. Access the Dashboard

- After login, you should be redirected to the dashboard.
- Verify:
  - The dashboard loads without errors.
  - All API-driven features (map, chat, LLM, etc.) work as expected.
  - No missing API key or environment variable errors in the console or UI.

---

## 5. Troubleshooting

- **Secrets Missing:**  
  - Run `doppler secrets download` to check available secrets.
  - Use `doppler run -- printenv` to see injected environment variables.
  - Check Vercel's Environment Variables tab for correct Doppler mapping.

- **Login Fails:**  
  - Check network requests for errors (401, 403, etc.).
  - Verify auth provider configuration in Doppler and Vercel.

---

## 6. (Optional) Doppler CLI Reference

- [Doppler CLI Docs](https://docs.doppler.com/docs/install-cli)
- [Doppler Vercel Integration](https://docs.doppler.com/docs/vercel)

---

## Diagram: App Verification Flow

```mermaid
flowchart TD
    A[Start App] --> B{Doppler Integration}
    B -- Local --> C[Run with Doppler CLI]
    B -- Vercel --> D[Check Vercel-Doppler Integration]
    C --> E[Open App in Browser]
    D --> F[Visit Vercel URL]
    E & F --> G[Login Page]
    G --> H[Enter Credentials]
    H --> I[Dashboard]
    I --> J{All Features Working?}
    J -- Yes --> K[Done]
    J -- No --> L[Troubleshoot Secrets/Auth]