# Database Structure & Auto-Mapping Guide

## Database Configuration

### ✅ Both Collections in Same Database

**Database:** `lensquiz` (or your configured MongoDB database name)

**Collections:**
1. **`lenses`** - All lens products
2. **`customers`** - All customer data and recommendations

Both collections are stored in the **same MongoDB database**, just different collections. This is already configured correctly!

## How Lens Updates Auto-Map to Recommendations

### 🔄 Automatic Mapping System

When you update a lens in the admin form, it **automatically** affects new recommendations because:

1. **Recommendation API Always Fetches Fresh Data**
   - Location: `pages/api/lens-advisor/recommend.js`
   - Function: `getLensesFromMongoDB()`
   - **Every time** a customer takes the quiz, the API fetches the **latest lens data** from MongoDB
   - No caching - always uses current database state

2. **Submit API Also Uses Latest Data**
   - Location: `pages/api/submit.js`
   - Also fetches fresh lens data from MongoDB
   - Ensures recommendations use updated lens information

3. **Real-Time Updates**
   - When you edit a lens price, features, or specifications
   - The changes are saved to MongoDB immediately
   - Next customer quiz will use the updated lens data
   - No need to restart server or clear cache

### Example Flow:

```
1. Admin edits lens "BlueXpert" in admin form
   ↓
2. Changes saved to MongoDB: lenses collection
   ↓
3. Customer takes quiz
   ↓
4. API fetches latest lenses from MongoDB
   ↓
5. Recommendation engine uses updated "BlueXpert" data
   ↓
6. Customer gets recommendation with latest lens info
```

## Admin Dashboard Features

### Customer Management Page (`/admin/customers`)

**Shows:**
- All customers who took the quiz
- Their prescription details (right/left eye SPH/CYL)
- Frame type selected
- **Recommended lens** (from recommendation engine)
- **Selected lens** (if customer chose one)
- Contact information
- Date of submission

**Features:**
- Search by name, phone, or email
- Filter by date range (today, week, month)
- Filter by recommended lens
- View customer details
- See which lens was recommended vs selected

### Lens Management Page (`/admin/lenses`)

**Shows:**
- All lenses in catalog
- Vision type, index, price
- Frame compatibility
- Active/inactive status
- Edit/Delete options

## Database Collections Structure

### `lenses` Collection

```javascript
{
  _id: ObjectId("..."),
  name: "BlueXpert",
  vision_type: "SV",
  index: 1.60,
  blue_protection_level: 3,
  uv_protection_level: 2,
  ar_level: 3,
  driving_support_level: 1,
  photochromic: false,
  min_power_supported: -8,
  max_power_supported: 8,
  frame_compatibility: ["full_rim_plastic", "full_rim_metal"],
  price_mrp: 800,
  numericPrice: 800,
  price_segment: "mid",
  features: ["Blue Light Block", "AR Multilayer"],
  dailyCost: "₹2",
  is_active: true,
  created_at: ISODate("..."),
  updated_at: ISODate("...")
}
```

### `customers` Collection

```javascript
{
  _id: ObjectId("..."),
  name: "John Doe",
  number: "+1234567890",
  email: "john@example.com",
  power: {
    right: { sph: -2.00, cyl: -0.50 },
    left: { sph: -1.75, cyl: -0.25 }
  },
  add: 2.00,
  frameType: "full_rim_plastic",
  answers: { ... },
  recommendation: {
    perfectMatch: { name: "BlueXpert", ... },
    recommended: { name: "Pureview", ... },
    safeValue: { name: "HardX", ... }
  },
  selectedLensId: "bluexpert",
  submissionId: "uuid-string",
  createdAt: ISODate("..."),
  updatedAt: ISODate("...")
}
```

## How Recommendations Work

### Recommendation Engine Process:

1. **Fetch Lenses from MongoDB**
   ```javascript
   // Always fetches fresh data
   const lenses = await getActiveLenses();
   ```

2. **Filter Based on Customer Data**
   - Vision type (SV, Progressive, etc.)
   - Power range (min/max supported)
   - Frame compatibility
   - Safety rules

3. **Score Lenses**
   - Based on customer usage patterns
   - Device hours, outdoor exposure, driving
   - Power severity

4. **Generate Recommendations**
   - Perfect Match (highest score)
   - Recommended (second best)
   - Safe Value (cheapest safe option)

5. **Save to Customer Record**
   - Recommendations saved with customer data
   - Can be viewed in admin dashboard

## Viewing Customer-Lens Mappings

### In Admin Dashboard:

1. Go to `/admin/customers`
2. See table with:
   - Customer name and contact
   - Prescription details
   - **Recommended Lens** column
   - **Selected Lens** column
3. Filter by lens to see all customers recommended that lens
4. Click "View Details" for full customer information

### In MongoDB:

```javascript
// Find all customers recommended "BlueXpert"
db.customers.find({
  "recommendation.perfectMatch.name": "BlueXpert"
})

// Find all customers who selected a lens
db.customers.find({
  selectedLensId: { $ne: null }
})

// Find customers by recommended lens
db.customers.find({
  $or: [
    { "recommendation.perfectMatch.name": "BlueXpert" },
    { "recommendation.recommended.name": "BlueXpert" },
    { "recommendation.safeValue.name": "BlueXpert" }
  ]
})
```

## Key Points

### ✅ Same Database
- Both `lenses` and `customers` are in the same MongoDB database
- Easy to query relationships
- Single connection string

### ✅ Auto-Mapping
- Lens updates automatically affect new recommendations
- No manual mapping needed
- Real-time updates

### ✅ Admin Dashboard
- View all customers
- See recommended vs selected lenses
- Filter and search capabilities
- Track which lens is recommended to which customer

### ✅ Dynamic Recommendations
- Always uses latest lens data
- No caching issues
- Changes reflect immediately

## Testing the Auto-Mapping

1. **Edit a lens** in `/admin/lens-entry`
   - Change price, features, or specifications
   - Save changes

2. **Take a new quiz** as a customer
   - Complete the quiz
   - Check recommendations

3. **Verify in admin dashboard**
   - Go to `/admin/customers`
   - See the new customer
   - Check recommended lens matches updated data

## Next Steps

1. **View Customer-Lens Mappings:**
   - Navigate to `/admin/customers`
   - See all customers and their recommendations

2. **Update Lenses:**
   - Go to `/admin/lenses`
   - Edit any lens
   - Changes will automatically affect new recommendations

3. **Analyze Patterns:**
   - Filter customers by recommended lens
   - See which lenses are most recommended
   - Track conversion rates (recommended vs selected)

