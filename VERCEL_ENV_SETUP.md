# Vercel Environment Variables Setup

## Required Environment Variables

To deploy this application on Vercel, you **must** set the following environment variables in your Vercel project settings:

### 1. MongoDB Connection String (REQUIRED)
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/lensquiz?retryWrites=true&w=majority
```

**How to get it:**
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Select your cluster
3. Click "Connect" → "Connect your application"
4. Copy the connection string
5. Replace `<password>` with your database password
6. Replace `<dbname>` with `lensquiz` (or your database name)

### 2. JWT Secret (REQUIRED)
```
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

**Generate a secure secret:**
```bash
# Option 1: Use Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Option 2: Use OpenSSL
openssl rand -hex 64
```

### 3. JWT Expiry (Optional - has default)
```
JWT_EXPIRY=7d
```

### 4. Bcrypt Rounds (Optional - has default)
```
BCRYPT_ROUNDS=10
```

### 5. Site URL (Optional - for API client)
```
NEXT_PUBLIC_SITE_URL=https://lenstrackquiz.vercel.app
```

## How to Add Environment Variables in Vercel

### Method 1: Via Vercel Dashboard (Recommended)

1. Go to your project on [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on your project
3. Go to **Settings** → **Environment Variables**
4. Add each variable:
   - **Key**: `MONGODB_URI`
   - **Value**: Your MongoDB connection string
   - **Environment**: Select all (Production, Preview, Development)
5. Click **Save**
6. Repeat for all required variables
7. **Important**: After adding variables, you need to **Redeploy** your project

### Method 2: Via Vercel CLI

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Login to Vercel
vercel login

# Link your project
vercel link

# Add environment variables
vercel env add MONGODB_URI
vercel env add JWT_SECRET
vercel env add JWT_EXPIRY
vercel env add BCRYPT_ROUNDS
vercel env add NEXT_PUBLIC_SITE_URL

# Deploy
vercel --prod
```

## MongoDB Atlas IP Whitelist Setup

For Vercel deployments, you need to allow all IPs:

1. Go to MongoDB Atlas → **Network Access**
2. Click **Add IP Address**
3. Click **Allow Access from Anywhere** (or add `0.0.0.0/0`)
4. Click **Confirm**

**Note**: This is safe because your connection string requires authentication.

## Verify Environment Variables

After setting up environment variables:

1. Go to Vercel Dashboard → Your Project → **Settings** → **Environment Variables**
2. Verify all variables are listed
3. Make sure they're enabled for **Production** environment
4. **Redeploy** your project (Settings → Deployments → Click "..." → Redeploy)

## Testing After Setup

1. Try logging in at: `https://your-app.vercel.app/admin/login`
2. Check Vercel Function Logs:
   - Go to Vercel Dashboard → Your Project → **Deployments**
   - Click on the latest deployment
   - Click **Functions** tab
   - Check logs for any errors

## Common Issues

### "500 Internal Server Error" on Login
- **Cause**: Missing `MONGODB_URI` or `JWT_SECRET`
- **Fix**: Add environment variables in Vercel and redeploy

### "Database connection error"
- **Cause**: MongoDB Atlas IP whitelist not configured
- **Fix**: Add `0.0.0.0/0` to MongoDB Atlas Network Access

### "Invalid credentials" but credentials are correct
- **Cause**: Database not accessible or wrong connection string
- **Fix**: Verify `MONGODB_URI` is correct and database is accessible

### Environment variables not working after adding
- **Cause**: Need to redeploy after adding variables
- **Fix**: Go to Deployments → Click "..." → Redeploy

## Security Best Practices

1. **Never commit `.env.local`** to git (already in `.gitignore`)
2. **Use strong JWT_SECRET** (at least 32 characters, random)
3. **Use MongoDB Atlas** with strong password
4. **Enable MongoDB Atlas monitoring** and alerts
5. **Rotate secrets** periodically
6. **Use different secrets** for production and development

## Quick Checklist

- [ ] `MONGODB_URI` added to Vercel
- [ ] `JWT_SECRET` added to Vercel
- [ ] MongoDB Atlas IP whitelist configured (0.0.0.0/0)
- [ ] Project redeployed after adding variables
- [ ] Tested login functionality
- [ ] Checked Vercel function logs for errors

