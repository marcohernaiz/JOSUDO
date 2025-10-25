# 🔐 Google OAuth Setup Guide for JOSUDO

This guide helps you configure Google OAuth authentication properly to avoid redirect URI mismatch errors.

## 🚨 Common Error: "Error 400: redirect_uri_mismatch"

This error occurs when the redirect URI in your Google Cloud Console doesn't match what your application is sending.

## 🔧 Quick Fix Steps

### Step 1: Check Your Current Setup

First, determine what URL your application is running on:

**For Local Development:**
- URL: `http://localhost:5000`
- Callback: `http://localhost:5000/api/auth/google/callback`

**For Production:**
- URL: `https://yourdomain.com`
- Callback: `https://yourdomain.com/api/auth/google/callback`

### Step 2: Update Google Cloud Console

1. **Go to Google Cloud Console**
   - Visit [Google Cloud Console](https://console.cloud.google.com/)
   - Select your project

2. **Navigate to Credentials**
   - Go to "APIs & Services" > "Credentials"
   - Find your OAuth 2.0 Client ID

3. **Edit OAuth Client**
   - Click on your OAuth client ID
   - In "Authorized redirect URIs" section, add:

   **For Development:**
   ```
   http://localhost:5000/api/auth/google/callback
   ```

   **For Production:**
   ```
   https://yourdomain.com/api/auth/google/callback
   ```

   **For Replit/Development Platforms:**
   ```
   https://your-replit-url.replit.dev/api/auth/google/callback
   ```

4. **Save Changes**
   - Click "Save"
   - Wait 5-10 minutes for changes to propagate

### Step 3: Update Your Environment Variables

Add the callback URL to your `.env` file:

```env
# For local development
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# For production
GOOGLE_CALLBACK_URL=https://yourdomain.com/api/auth/google/callback
```

### Step 4: Restart Your Application

```bash
# Stop and restart your application
docker-compose restart app

# Or if running locally
npm run dev
```

## 📋 Complete Environment Setup

### Local Development (.env)

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Other required variables
SESSION_SECRET=your_random_session_secret_here
DATABASE_URL=postgresql://username:password@localhost:5432/josudo_db
```

### Production (.env)

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_CALLBACK_URL=https://yourdomain.com/api/auth/google/callback

# Other required variables
NODE_ENV=production
SESSION_SECRET=your_super_secure_session_secret_here
DATABASE_URL=postgresql://username:password@your-db-host:5432/josudo_db
```

## 🔍 Troubleshooting

### Error: "redirect_uri_mismatch"

**Causes:**
1. Redirect URI in Google Console doesn't match your app's URL
2. Using HTTP instead of HTTPS (or vice versa)
3. Missing `/api/auth/google/callback` path
4. Port number mismatch

**Solutions:**
1. Double-check the exact URL in Google Console
2. Ensure protocol matches (http vs https)
3. Verify the full callback path
4. Check if port is included correctly

### Error: "invalid_client"

**Causes:**
1. Wrong `GOOGLE_CLIENT_ID`
2. Wrong `GOOGLE_CLIENT_SECRET`
3. Client ID not enabled

**Solutions:**
1. Copy exact Client ID from Google Console
2. Copy exact Client Secret from Google Console
3. Ensure OAuth consent screen is configured

### Error: "access_denied"

**Causes:**
1. User cancelled the OAuth flow
2. OAuth consent screen not configured
3. App not verified (for production)

**Solutions:**
1. Configure OAuth consent screen
2. Add test users for development
3. Submit for verification (production)

## 🛠️ Google Cloud Console Setup

### 1. Create OAuth 2.0 Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project or create a new one
3. Navigate to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "OAuth 2.0 Client ID"
5. Choose "Web application"
6. Add authorized redirect URIs:
   - `http://localhost:5000/api/auth/google/callback` (development)
   - `https://yourdomain.com/api/auth/google/callback` (production)

### 2. Configure OAuth Consent Screen

1. Go to "APIs & Services" > "OAuth consent screen"
2. Choose "External" (unless you have a Google Workspace)
3. Fill in required information:
   - App name: "JOSUDO"
   - User support email: your email
   - Developer contact: your email
4. Add scopes:
   - `../auth/userinfo.email`
   - `../auth/userinfo.profile`
   - `../auth/drive.file` (for Google Drive integration)
5. Add test users (for development)

### 3. Enable Required APIs

1. Go to "APIs & Services" > "Library"
2. Enable these APIs:
   - Google+ API (for profile info)
   - Google Drive API (for file storage)

## 🔄 Testing OAuth Flow

### 1. Test Local Development

```bash
# Start your application
npm run dev

# Visit the login page
# Click "Login with Google"
# Should redirect to Google OAuth
# After authorization, should redirect back to your app
```

### 2. Test Production

```bash
# Deploy your application
docker-compose up -d

# Visit your production URL
# Test the OAuth flow
```

### 3. Debug OAuth Issues

Add logging to see what's happening:

```bash
# Check application logs
docker-compose logs -f app

# Look for OAuth-related errors
# Check network requests in browser dev tools
```

## 📱 Mobile/App Configuration

If you're building a mobile app or PWA, you might need additional configurations:

### For Mobile Apps

Add these redirect URIs to Google Console:
```
com.yourapp.ios://oauth/callback
com.yourapp.android://oauth/callback
```

### For PWAs

Ensure your PWA domain is added to authorized origins:
```
https://yourdomain.com
```

## 🔐 Security Best Practices

1. **Use HTTPS in Production**
   - Never use HTTP for OAuth in production
   - Get SSL certificate for your domain

2. **Keep Secrets Secure**
   - Never commit `.env` files to git
   - Use environment variables in production
   - Rotate secrets regularly

3. **Validate Redirect URIs**
   - Only add necessary redirect URIs
   - Remove unused URIs
   - Use exact matches (no wildcards)

4. **Monitor OAuth Usage**
   - Check Google Cloud Console for usage stats
   - Monitor for suspicious activity
   - Set up alerts for unusual patterns

## 🚀 Deployment Checklist

Before deploying to production:

- [ ] OAuth consent screen configured
- [ ] Production redirect URI added to Google Console
- [ ] SSL certificate installed
- [ ] Environment variables set correctly
- [ ] OAuth flow tested in production
- [ ] Error handling implemented
- [ ] Logging configured

## 📞 Support

If you're still having issues:

1. **Check Google Cloud Console logs**
   - Go to "APIs & Services" > "Credentials"
   - Check "OAuth consent screen" for errors

2. **Verify your setup**
   - Double-check all URLs and credentials
   - Test with a simple OAuth flow

3. **Common mistakes to avoid**
   - Wrong protocol (http vs https)
   - Missing path in redirect URI
   - Incorrect domain name
   - Using test credentials in production

---

## 🎯 Quick Reference

**Development URLs:**
- App: `http://localhost:5000`
- Callback: `http://localhost:5000/api/auth/google/callback`

**Production URLs:**
- App: `https://yourdomain.com`
- Callback: `https://yourdomain.com/api/auth/google/callback`

**Environment Variables:**
```env
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
```

Happy OAuth-ing! 🔐✨






