# ⚠️ IMPORTANT: Restart Required

The Next.js dev server is using **cached code** and needs to be restarted to pick up the MongoDB fixes.

## How to Restart

1. **Stop the current server:**
   - Find the terminal where `npm run dev` is running
   - Press `Ctrl + C` to stop it

2. **Clear Next.js cache (optional but recommended):**
   ```bash
   rm -rf .next
   ```

3. **Restart the server:**
   ```bash
   npm run dev
   ```

## What Was Fixed

1. ✅ Removed deprecated MongoDB options (`useUnifiedTopology`, `useNewUrlParser`)
2. ✅ Added explicit database name (`lensquiz`) to all models
3. ✅ Created `getDatabase()` helper function

## After Restart

Run the test script again:
```bash
./test-api.sh
```

All POST endpoints should work correctly after restart!

