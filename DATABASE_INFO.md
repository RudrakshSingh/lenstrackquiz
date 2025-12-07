# Lens Database Storage Information

## Current Storage Setup

### **MongoDB Database (Primary)**
- **Database**: `lensquiz` (or your configured name)
- **Collection**: `lenses`
- **Location**: MongoDB (Atlas or local)
- **Access**: Via Admin Panel (`/admin/lens-entry`)
- **Structure**: Each lens is a document with all fields

**How lenses are stored:**
```javascript
// MongoDB Collection: lenses
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
  frame_compatibility: ["full_rim_plastic", "full_rim_metal", "half_rim"],
  price_mrp: 800,
  numericPrice: 800,
  price_segment: "mid",
  features: ["Blue Light Block", "AR Multilayer"],
  dailyCost: "₹2",
  is_active: true,
  created_at: ISODate("2024-01-01T00:00:00.000Z"),
  updated_at: ISODate("2024-01-01T00:00:00.000Z")
}
```

### **Static Database (Fallback - Default Lenses)**
- **File**: `lib/lensDatabase.js`
- **Type**: JavaScript array export
- **Purpose**: Default lenses and fallback if MongoDB is empty
- **Contains**: Pre-defined lens catalog

## How It Works

### Admin Form → MongoDB
1. Admin fills form at `/admin/lens-entry`
2. Form submits to `/api/admin/lenses` (POST)
3. Lens is saved to MongoDB `lenses` collection
4. Only active lenses (`is_active: true`) are used

### Recommendation API → MongoDB (with Fallback)
1. API receives recommendation request
2. **First**: Tries to fetch from MongoDB `lenses` collection
3. **Fallback**: If MongoDB is empty/fails, uses static `lensDatabase.js`
4. Returns recommendations based on fetched lenses

## Database Access

### View Lenses in MongoDB
1. Go to MongoDB Atlas (or use MongoDB Compass)
2. Navigate to your database
3. Open `lenses` collection
4. View all saved lenses

### View Lenses via Admin Panel
1. Go to `/admin/lenses`
2. See all lenses in a table
3. Edit or delete lenses

### View Static Database
1. Open `lib/lensDatabase.js`
2. See pre-defined lens array
3. Edit directly in code (not recommended for production)

## MongoDB Collection Structure

```
Database: lensquiz
  └── Collection: lenses
      ├── {_id: ObjectId("...")}
      │   ├── name: "BlueXpert"
      │   ├── vision_type: "SV"
      │   ├── index: 1.60
      │   ├── price_mrp: 800
      │   ├── is_active: true
      │   └── ... (all other fields)
      │
      ├── {_id: ObjectId("...")}
      │   └── ...
      │
      └── ...
```

## Querying Lenses

### Get All Active Lenses
```javascript
const lenses = await db.collection('lenses')
  .find({ is_active: true })
  .toArray();
```

### Get Lenses by Vision Type
```javascript
const lenses = await db.collection('lenses')
  .find({ 
    vision_type: 'SV',
    is_active: true 
  })
  .toArray();
```

### Get Lenses by Price Range
```javascript
const lenses = await db.collection('lenses')
  .find({ 
    price_mrp: { $gte: 500, $lte: 2000 },
    is_active: true 
  })
  .toArray();
```

## Important Notes

1. **Active Status**: Only lenses with `is_active: true` are used in recommendations
2. **Fallback**: If MongoDB fails or is empty, system uses static database
3. **ID Field**: MongoDB documents have auto-generated `_id` (ObjectId)
4. **Timestamps**: `created_at` and `updated_at` are automatically added
5. **Validation**: Required fields are validated before saving

## Future Enhancements

- Bulk import from CSV/Excel
- Export lenses to JSON/CSV
- Version control for lens changes
- Audit log for lens modifications

