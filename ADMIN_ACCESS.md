# How to Access the Admin Lens Entry Form

## Quick Access

### 1. Start Your Development Server

```bash
npm run dev
# or
yarn dev
```

### 2. Open in Browser

Navigate to one of these URLs:

**Admin Dashboard:**
```
http://localhost:3000/admin
```

**Lens Entry Form (Add New):**
```
http://localhost:3000/admin/lens-entry
```

**Lens List (View All):**
```
http://localhost:3000/admin/lenses
```

## Step-by-Step Guide

### Option 1: Start from Dashboard
1. Go to `http://localhost:3000/admin`
2. Click on "Lens Management" or "Add New Lens" card
3. You'll be taken to the lens entry form

### Option 2: Direct Access
1. Go directly to `http://localhost:3000/admin/lens-entry`
2. Fill out the form
3. Click "Create Lens" to save

## Authentication

Currently, the form uses a simple API key authentication:
- **Default API Key**: `admin123`
- This is set in the code for development
- **⚠️ Important**: Change this in production!

To change the API key:
1. Set environment variable `ADMIN_API_KEY` in your `.env.local` file
2. Update the code to use the environment variable

## Prerequisites

1. **MongoDB Setup**: Make sure your MongoDB is configured
   - Check `.env.local` has `MONGODB_URI` set correctly
   - MongoDB database should be accessible

2. **Development Server Running**: 
   ```bash
   npm run dev
   ```

## Form Fields Guide

### Required Fields (marked with *)
- **Name**: Lens product name
- **Vision Type**: SV, Progressive, Bifocal, or Zero Power
- **Index**: 1.50, 1.56, 1.60, 1.67, or 1.74
- **Frame Compatibility**: Select at least one frame type
- **MRP**: Price in ₹
- **Price Segment**: Budget, Mid, Premium, or Ultra

### Optional Fields
- Protection levels (default to 0)
- Power support ranges
- Features (can add multiple)
- Daily cost display text
- Photochromic option

## Troubleshooting

### "Unauthorized" Error
- Check that the API key matches: `admin123`
- Verify the Authorization header is being sent

### "Failed to save lens" Error
- Check MongoDB connection
- Verify MongoDB connection string in `.env.local`
- Check browser console for detailed errors

### Form Not Loading
- Make sure development server is running
- Check browser console for errors
- Verify all dependencies are installed

## Production Setup

For production, you should:

1. **Set up proper authentication**:
   - Use NextAuth.js or similar
   - Implement role-based access control
   - Secure admin routes

2. **Environment Variables**:
   ```env
   ADMIN_API_KEY=your-secure-key-here
   ```

3. **Protect Routes**:
   - Add middleware to protect `/admin/*` routes
   - Require login for admin access

## Example Usage

1. Navigate to `http://localhost:3000/admin/lens-entry`
2. Fill in the form:
   - Name: "BlueXpert Pro"
   - Vision Type: "SV"
   - Index: "1.60"
   - Blue Protection: "3"
   - UV Protection: "2"
   - AR Level: "3"
   - Select frame compatibilities
   - Set MRP: "800"
   - Add features: "Blue Light Block", "AR Multilayer"
3. Click "Create Lens"
4. Success message will appear
5. View in lens list at `/admin/lenses`

## Next Steps

After creating lenses:
- View all lenses at `/admin/lenses`
- Edit existing lenses by clicking "Edit"
- Delete lenses (with confirmation)
- Lenses will be available in the recommendation engine

