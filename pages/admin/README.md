# Lens Advisor Admin Panel

## Overview

The admin panel allows you to manage lens products in the Lens Advisor catalog. You can add, edit, and delete lenses with all their specifications.

## Access

Navigate to `/admin` to access the admin dashboard.

## Features

### 1. Lens Entry Form (`/admin/lens-entry`)
- Add new lenses or edit existing ones
- All fields from the lens database structure are supported
- Form validation ensures data integrity

### 2. Lens List (`/admin/lenses`)
- View all lenses in the catalog
- Edit or delete existing lenses
- Filter and search capabilities (can be added)

## Required Fields

### Basic Information
- **Name**: Lens product name (e.g., "BlueXpert")
- **Vision Type**: SV, Progressive, Bifocal, or Zero Power
- **Index**: 1.50, 1.56, 1.60, 1.67, or 1.74

### Protection Levels (0-5)
- **Blue Protection Level**: Blue light blocking capability
- **UV Protection Level**: UV protection strength
- **AR Level**: Anti-reflective coating level
- **Driving Support Level**: Driving-specific features

### Power Support
- **Min Power Supported**: Minimum prescription power (e.g., -8)
- **Max Power Supported**: Maximum prescription power (e.g., 8)

### Frame Compatibility
Select all compatible frame types:
- Full Rim (Plastic)
- Full Rim (Metal)
- Half Rim
- Semi-Rimless
- Rimless
- Drilled

### Pricing
- **MRP**: Maximum Retail Price in ₹
- **Numeric Price**: Numeric value for calculations (auto-filled from MRP)
- **Price Segment**: Budget, Mid, Premium, or Ultra
- **Daily Cost**: Display text (e.g., "₹1")

### Features
- Add multiple features as tags
- Examples: "Blue Light Block", "AR Multilayer", "Scratch Armor"

### Additional Options
- **Photochromic**: Check if lens has auto-tint capability
- **Active**: Check to show lens in catalog

## API Authentication

The admin API endpoints require authentication via Bearer token:

```
Authorization: Bearer <ADMIN_API_KEY>
```

Set `ADMIN_API_KEY` in your environment variables. Default is `admin123` (change in production!).

## API Endpoints

### Create Lens
```
POST /api/admin/lenses
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "BlueXpert",
  "vision_type": "SV",
  "index": 1.60,
  ...
}
```

### Get All Lenses
```
GET /api/admin/lenses
Authorization: Bearer <token>
```

### Get Single Lens
```
GET /api/admin/lenses/{id}
Authorization: Bearer <token>
```

### Update Lens
```
PUT /api/admin/lenses/{id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Name",
  ...
}
```

### Delete Lens
```
DELETE /api/admin/lenses/{id}
Authorization: Bearer <token>
```

## Data Storage

Lenses are stored in Firestore under the `lenses` collection with the following structure:

```javascript
{
  name: string,
  vision_type: 'SV' | 'progressive' | 'bifocal' | 'zero_power',
  index: number,
  blue_protection_level: 0-5,
  uv_protection_level: 0-5,
  ar_level: 0-5,
  driving_support_level: 0-5,
  photochromic: boolean,
  min_power_supported: number,
  max_power_supported: number,
  frame_compatibility: string[],
  price_mrp: number,
  numericPrice: number,
  price_segment: 'budget' | 'mid' | 'premium' | 'ultra',
  features: string[],
  dailyCost: string,
  is_active: boolean,
  created_at: ISO string,
  updated_at: ISO string
}
```

## Usage Tips

1. **Index Selection**: Choose the appropriate index based on power requirements and frame type
2. **Frame Compatibility**: Select all frame types the lens can be used with
3. **Protection Levels**: Use 0-5 scale where 0 = none and 5 = maximum
4. **Features**: Add descriptive feature tags that help customers understand benefits
5. **Price Segment**: Choose based on target market and features

## Future Enhancements

- Bulk import/export
- Image upload for lenses
- Advanced filtering and search
- Analytics dashboard
- Offer management
- User management

