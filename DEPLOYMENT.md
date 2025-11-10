# Vercel Deployment Configuration

## Problem
The quotes page shows "Failed to list quotes" on Vercel but works locally.

## Root Cause
The code was using hardcoded `localhost:3001` URLs and relative paths like `/api/quotes` which work locally with Vite's proxy but don't work in production.

## Solution
All API calls now use the `VITE_API_URL` environment variable.

## Deployment Steps for Vercel

### 1. Deploy Backend (if not already deployed)
Your Express backend needs to be deployed separately. Options:
- Deploy to Vercel as a separate project
- Deploy to another hosting service (Heroku, Railway, Render, etc.)

### 2. Configure Frontend Environment Variables in Vercel

Go to your Vercel project settings → Environment Variables and add:

```
VITE_API_URL=https://your-backend-url.com
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Important**: 
- `VITE_API_URL` should be your backend URL WITHOUT a trailing slash
- Example: `https://polaris-backend.vercel.app` or `https://api.yourapp.com`
- For local development, leave `VITE_API_URL` empty (it will use Vite's proxy)

### 3. Redeploy Frontend
After setting the environment variables, redeploy your frontend on Vercel.

## Local Development

For local development, create a `.env` file in the `frontend` directory:

```bash
# Leave VITE_API_URL empty for local dev (uses Vite proxy to localhost:3001)
VITE_API_URL=

# Your Supabase credentials
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

The Vite proxy (configured in `vite.config.js`) will automatically forward `/api/*` requests to `http://localhost:3001`.

## Files Changed

1. **frontend/src/config/api.js** (NEW) - Centralized API URL configuration
2. **frontend/src/utils/quotes.js** - Updated to use API_BASE_URL
3. **frontend/src/components/BTL_Calculator.jsx** - Updated all hardcoded URLs
4. **frontend/src/components/BridgingCalculator.jsx** - Updated all hardcoded URLs

## Testing

After deployment:
1. Navigate to the Quotes page
2. Verify quotes are loading
3. Try creating a new quote
4. Try generating PDFs

If you see CORS errors, you may need to configure CORS on your backend to allow requests from your Vercel domain.
