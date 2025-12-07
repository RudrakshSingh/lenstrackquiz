# Removing Firebase Dependencies

## ✅ Completed

1. ✅ Created `.env.local.example` with only MongoDB configuration
2. ✅ Deleted `config/firebaseAdmin.js`
3. ✅ Deleted `config/firebaseClient.js`
4. ✅ Deleted `FIREBASE_SETUP.md`
5. ✅ Updated `DATABASE_INFO.md` to remove Firebase references

## ⚠️ Manual Steps Required

### 1. Remove Firebase Packages (Optional)

If you want to completely remove Firebase from your project:

```bash
npm uninstall firebase firebase-admin
```

**Note:** This is optional. The packages won't cause issues if they're installed but not used.

### 2. Update Your `.env.local` File

Make sure your `.env.local` file only contains MongoDB configuration:

```env
# MongoDB Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/lensquiz?retryWrites=true&w=majority

# Admin API Key
ADMIN_API_KEY=admin123
```

**Remove all Firebase-related variables:**
- ❌ Remove: `FIREBASE_TYPE`
- ❌ Remove: `FIREBASE_PROJECT_ID`
- ❌ Remove: `FIREBASE_PRIVATE_KEY`
- ❌ Remove: `FIREBASE_CLIENT_EMAIL`
- ❌ Remove: All other `FIREBASE_*` variables
- ❌ Remove: All `NEXT_PUBLIC_FIREBASE_*` variables

### 3. Verify No Firebase Imports

All Firebase imports have been removed from:
- ✅ API routes
- ✅ Models
- ✅ Components

The codebase now uses MongoDB exclusively.

## Current Database Setup

- **Database**: MongoDB
- **Collections**: 
  - `lenses` - Lens products
  - `customers` - Customer data and recommendations
- **Connection**: Via `lib/mongodb.js`
- **Models**: `models/Lens.js` and `models/Customer.js`

## Verification

To verify everything is working:

1. Check `.env.local` has only MongoDB config
2. Restart your dev server: `npm run dev`
3. Test admin form: Go to `/admin/lens-entry`
4. Test customer quiz: Complete a quiz and verify data saves to MongoDB

## Need Help?

- See `MONGODB_SETUP.md` for MongoDB setup instructions
- See `DATABASE_STRUCTURE.md` for database structure details
- See `CUSTOMER_DATA_STORAGE.md` for customer data information

