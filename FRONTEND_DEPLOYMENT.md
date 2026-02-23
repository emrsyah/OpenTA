# 🚀 OpenTA Frontend Deployment Guide

This guide explains how to deploy the OpenTA frontend to Vercel (Main branch) and Render (Dev branch), integrated with the Python backend.

---

## 🏗️ Deployment Strategy

| Environment | Branch | Cloud Provider | Purpose |
|-------------|--------|----------------|---------|
| **Production** | `main` | **Vercel** | High-performance, global CDN |
| **Development** | `dev` | **Render** | Dev environment for testing |

---

## 🔧 Environment Variables

Both deployments require the following variables:

| Variable | Example Value | Description |
|----------|---------------|-------------|
| `DATABASE_URL` | `postgresql://...` | Same Supabase URL used by the backend |
| `NEXT_PUBLIC_BACKEND_URL` | `https://openta-backend.onrender.com` | URL of your deployed Python backend |
| `BETTER_AUTH_SECRET` | `your-32-char-secret` | Generate with `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | `https://your-frontend-url.com` | Base URL of your frontend |
| `NEXT_PUBLIC_APP_URL` | `https://your-frontend-url.com` | Same as above |
| `GOOGLE_CLIENT_ID` | `...apps.googleusercontent.com` | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | `...` | From Google Cloud Console |
| `SKIP_ENV_VALIDATION` | `true` | Required for build step on Vercel/Render |

---

## ⚡ Vercel Deployment (Production - Main Branch)

1. **Connect Repository**:
   - Go to [Vercel Dashboard](https://vercel.com/new).
   - Import your `open-ta-telyu` repository.
2. **Configure Build Settings**:
   - Vercel will automatically detect **Next.js**.
   - Ensure the root directory is set to the frontend project if it's in a monorepo.
3. **Set Environment Variables**:
   - Add all variables listed in the table above.
4. **Deploy**:
   - Vercel will deploy your `main` branch automatically on every push.

---

## ☁️ Render Deployment (Development - Dev Branch)

We use the provided `render.yaml` blueprint for the development environment.

1. **Go to [Render Dashboard](https://dashboard.render.com)**.
2. **New + → Blueprint**:
   - Select your repository.
   - Render will detect `render.yaml`.
3. **Update Variables**:
   - Render will prompt for variables defined in `render.yaml`.
   - Make sure to set `NEXT_PUBLIC_BACKEND_URL` to your backend's URL.
4. **Apply Blueprint**:
   - Render will create a **Node.js Web Service** and deploy the `dev` branch.

---

## 🚢 Integration Check

To verify the integration:

1. **Backend Health**: Ensure `https://your-backend.com/health` returns `healthy`.
2. **CORS Configuration**: Your backend's `CORS_ORIGINS_STR` MUST include your frontend URLs:
   ```bash
   CORS_ORIGINS_STR=https://your-vercel-domain.vercel.app,https://your-render-dev.onrender.com
   ```
3. **Database Sharing**: Ensure both frontend and backend use the **same `DATABASE_URL`** to share conversations and research data.

---

## 🛠️ Troubleshooting

- **Authentication Fails**: Check if `BETTER_AUTH_URL` matches your current domain exactly (no trailing slash).
- **Chat Not Responding**: Open Browser DevTools (F12) → Network tab. Check if the `/api/chat` request fails. If it returns 500, check the frontend logs. If it fails with "Backend not reached", check `NEXT_PUBLIC_BACKEND_URL`.
- **Database Errors**: Ensure you have run the migrations:
  ```bash
  bun run db:push
  ```
  (This should be done once locally pointing to your Supabase instance).
