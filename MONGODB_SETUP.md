# MongoDB Setup Guide

## Overview

This application now uses **MongoDB** to store:
- **Lens data** (in `lenses` collection)
- **Customer data** (in `customers` collection)

## Quick Setup

### 1. Get MongoDB Connection String

#### Option A: MongoDB Atlas (Cloud - Recommended)
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up/Login
3. Create a free cluster (M0 - Free tier)
4. Click **Connect** → **Connect your application**
5. Copy the connection string
6. Replace `<password>` with your database user password
7. Replace `<dbname>` with `lensquiz` (or your preferred database name)

#### Option B: Local MongoDB
1. Install MongoDB locally
2. Start MongoDB service
3. Use connection string: `mongodb://localhost:27017/lensquiz`

### 2. Create `.env.local` File

Create `.env.local` in the root directory:

```env
# MongoDB Connection String
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/lensquiz?retryWrites=true&w=majority

# Or for local MongoDB:
# MONGODB_URI=mongodb://localhost:27017/lensquiz

# Admin API Key
ADMIN_API_KEY=admin123

# OCR API Key (if using)
NEXT_PUBLIC_OCR_API_KEY=your-ocr-api-key
```

### 3. Install MongoDB Driver

```bash
npm install mongodb
```

### 4. Restart Development Server

```bash
npm run dev
```

## Database Collections

### `lenses` Collection
Stores all lens products with fields:
- `name`, `vision_type`, `index`
- `blue_protection_level`, `uv_protection_level`, `ar_level`, `driving_support_level`
- `photochromic`, `min_power_supported`, `max_power_supported`
- `frame_compatibility`, `price_mrp`, `price_segment`
- `features`, `dailyCost`, `is_active`
- `created_at`, `updated_at`

### `customers` Collection
Stores customer submissions and data:
- `name`, `number`, `email`
- `power` (right/left eye SPH/CYL)
- `add`, `frameType`
- `answers` (questionnaire responses)
- `recommendation` (lens recommendations)
- `selectedLensId`, `selectedSecondPairLensId`, `selectedOfferId`
- `language`, `submissionId`
- `createdAt`, `updatedAt`

## Viewing Your Data

### MongoDB Atlas (Cloud)
1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Select your cluster
3. Click **Browse Collections**
4. Select your database (`lensquiz`)
5. View collections: `lenses`, `customers`

### MongoDB Compass (Local/Desktop)
1. Download [MongoDB Compass](https://www.mongodb.com/products/compass)
2. Connect using your connection string
3. Browse collections and documents

### Command Line (mongosh)
```bash
mongosh "your-connection-string"
use lensquiz
db.lenses.find()
db.customers.find()
```

## Connection String Format

### MongoDB Atlas
```
mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
```

### Local MongoDB
```
mongodb://localhost:27017/<database>
```

### With Authentication
```
mongodb://<username>:<password>@<host>:<port>/<database>
```

## Security Notes

1. **Never commit `.env.local`** to git (already in `.gitignore`)
2. **Use strong passwords** for database users
3. **Enable IP Whitelist** in MongoDB Atlas (add your server IPs)
4. **Use environment variables** for connection strings in production
5. **Change `ADMIN_API_KEY`** from default in production

## Migration from Firestore

If you have existing data in Firestore:

1. Export data from Firestore
2. Transform to MongoDB format
3. Import to MongoDB using `mongoimport` or MongoDB Compass
4. Update connection string in `.env.local`

## Troubleshooting

### "MONGODB_URI is not defined"
- Check that `.env.local` exists in root directory
- Verify variable name is exactly `MONGODB_URI`
- Restart development server after creating/updating `.env.local`

### "Connection timeout"
- Check MongoDB Atlas IP whitelist (add `0.0.0.0/0` for development)
- Verify connection string is correct
- Check network/firewall settings

### "Authentication failed"
- Verify username and password in connection string
- Check database user has proper permissions
- Ensure password is URL-encoded if it contains special characters

### "Database not found"
- MongoDB will create the database automatically on first write
- Or create it manually: `use lensquiz` in mongosh

## Production Deployment

For production (Vercel, Netlify, etc.):

1. Add `MONGODB_URI` to environment variables
2. Use MongoDB Atlas connection string
3. Set up proper IP whitelist
4. Use strong database user credentials
5. Enable MongoDB Atlas monitoring and alerts

## Example Connection String

```env
# MongoDB Atlas Example
MONGODB_URI=mongodb+srv://lensquiz_user:MySecurePassword123@cluster0.abc123.mongodb.net/lensquiz?retryWrites=true&w=majority

# Local MongoDB Example
MONGODB_URI=mongodb://localhost:27017/lensquiz
```

## Next Steps

1. Create `.env.local` with your MongoDB connection string
2. Install MongoDB driver: `npm install mongodb`
3. Restart server: `npm run dev`
4. Test admin form: Go to `/admin/lens-entry`
5. Create a lens and verify it appears in MongoDB

