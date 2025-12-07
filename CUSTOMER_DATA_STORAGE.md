# Customer Data Storage Guide

## Where Customer Data is Saved

### Database: **MongoDB**
### Collection: **`customers`**

## Storage Location

Customer data is saved in MongoDB when:
1. User completes the quiz and submits (`/api/submit`)
2. User gets lens recommendations

### MongoDB Structure:
```
Database: lensquiz (or your database name)
  └── Collection: customers
      └── Documents: Each customer submission
```

## What Data is Saved

When a customer completes the quiz, the following data is saved to MongoDB:

```javascript
{
  _id: ObjectId("..."),              // MongoDB auto-generated ID
  name: "John Doe",                  // Customer name
  number: "+1234567890",             // Phone number
  email: "john@example.com",         // Email (optional)
  
  // Power/Prescription Data
  power: {
    right: {
      sph: -2.00,                    // Right eye SPH
      cyl: -0.50                     // Right eye CYL
    },
    left: {
      sph: -1.75,                    // Left eye SPH
      cyl: -0.25                     // Left eye CYL
    }
  },
  add: 2.00,                         // ADD value (for bifocal/progressive)
  frameType: "full_rim_plastic",     // Selected frame type
  
  // Quiz Answers
  answers: {
    vision_need: "...",
    screen_hours: 8,
    outdoor_hours: "moderate",
    driving_pattern: "daily",
    symptoms: ["blur", "headache"],
    preference: "...",
    second_pair_interest: "yes"
  },
  
  // Lens Recommendations
  recommendation: {
    perfectMatch: { ... },
    recommended: { ... },
    safeValue: { ... },
    warnings: [ ... ],
    fullPriceList: [ ... ]
  },
  
  // Selected Options (if customer selects)
  selectedLensId: "bluexpert",
  selectedSecondPairLensId: null,
  selectedOfferId: "bogo",
  
  // Metadata
  language: "en",                    // Language preference
  submissionId: "uuid-string",       // UUID for backward compatibility
  createdAt: ISODate("2024-01-01"),  // Creation timestamp
  updatedAt: ISODate("2024-01-01")   // Last update timestamp
}
```

## API Endpoints

### 1. Save Customer Data
**Endpoint:** `POST /api/submit`

**Location in Code:** `pages/api/submit.js` (lines 96-121)

**What it does:**
- Receives quiz submission from frontend
- Generates lens recommendations
- Saves customer data to MongoDB `customers` collection
- Returns `submissionId` for retrieving results

**Code:**
```javascript
// Save submission to MongoDB
const { getCustomerCollection } = await import('../../models/Customer');
const collection = await getCustomerCollection();
await collection.insertOne({
  name: user.name,
  number: user.number,
  email: user.email || '',
  power: { right: {...}, left: {...} },
  answers,
  recommendation,
  submissionId,
  createdAt: new Date(),
  updatedAt: new Date()
});
```

### 2. Retrieve Customer Data
**Endpoint:** `GET /api/result?id={submissionId}`

**Location in Code:** `pages/api/result.js`

**What it does:**
- Retrieves customer data by `submissionId` or MongoDB `_id`
- Returns customer information and recommendations

## How to View Customer Data

### Option 1: MongoDB Atlas (Cloud)
1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Select your cluster
3. Click **Browse Collections**
4. Select database: `lensquiz`
5. Select collection: `customers`
6. View all customer documents

### Option 2: MongoDB Compass (Desktop)
1. Open MongoDB Compass
2. Connect using your connection string
3. Navigate to: `lensquiz` → `customers`
4. Browse and search customer data

### Option 3: Command Line (mongosh)
```bash
# Connect to MongoDB
mongosh "your-connection-string"

# Switch to database
use lensquiz

# View all customers
db.customers.find().pretty()

# Find specific customer by submissionId
db.customers.findOne({ submissionId: "your-uuid" })

# Find customer by phone number
db.customers.findOne({ number: "+1234567890" })

# Count total customers
db.customers.countDocuments()

# Find recent customers
db.customers.find().sort({ createdAt: -1 }).limit(10)
```

## Data Flow

```
1. User fills quiz form (frontend)
   ↓
2. POST /api/submit
   ↓
3. Generate lens recommendations
   ↓
4. Save to MongoDB: customers collection
   ↓
5. Return submissionId
   ↓
6. Frontend redirects to /result?id={submissionId}
   ↓
7. GET /api/result?id={submissionId}
   ↓
8. Retrieve from MongoDB: customers collection
   ↓
9. Display results to user
```

## Collection Details

### Collection Name: `customers`

### Indexes (Recommended):
```javascript
// Create indexes for faster queries
db.customers.createIndex({ submissionId: 1 })
db.customers.createIndex({ number: 1 })
db.customers.createIndex({ createdAt: -1 })
db.customers.createIndex({ email: 1 })
```

### Query Examples:

**Get all customers:**
```javascript
db.customers.find()
```

**Get customer by submission ID:**
```javascript
db.customers.findOne({ submissionId: "uuid-here" })
```

**Get customers by date range:**
```javascript
db.customers.find({
  createdAt: {
    $gte: new Date("2024-01-01"),
    $lte: new Date("2024-12-31")
  }
})
```

**Get customers who selected a lens:**
```javascript
db.customers.find({ selectedLensId: { $ne: null } })
```

**Get customers by frame type:**
```javascript
db.customers.find({ frameType: "full_rim_plastic" })
```

## Data Model

The customer data model is defined in: `models/Customer.js`

**Key Functions:**
- `createCustomer()` - Create new customer
- `getCustomerById()` - Get customer by MongoDB _id
- `getAllCustomers()` - Get all customers with optional filter
- `updateCustomer()` - Update customer data
- `getCustomerCollection()` - Get MongoDB collection reference

## Important Notes

1. **Unique Identifiers:**
   - `_id`: MongoDB auto-generated ObjectId
   - `submissionId`: UUID string (for backward compatibility with result page)

2. **Data Privacy:**
   - Customer phone numbers and emails are stored
   - Ensure GDPR/compliance measures are in place
   - Consider data encryption for sensitive fields

3. **Data Retention:**
   - No automatic deletion (implement if needed)
   - Consider adding `deletedAt` field for soft deletes

4. **Backup:**
   - Regular MongoDB backups recommended
   - Export data periodically for compliance

## Troubleshooting

### Customer data not saving?
- Check MongoDB connection string in `.env.local`
- Verify MongoDB is accessible
- Check server logs for errors
- Ensure `customers` collection exists (auto-created on first insert)

### Can't retrieve customer data?
- Verify `submissionId` is correct
- Check MongoDB connection
- Verify data exists: `db.customers.find()`
- Check API logs for errors

### Data format issues?
- Ensure all required fields are present
- Check data types match schema
- Verify MongoDB driver is installed: `npm install mongodb`

## Next Steps

1. **Add Customer Management Page:**
   - Create `/admin/customers` page
   - List all customers
   - View customer details
   - Export customer data

2. **Add Analytics:**
   - Track conversion rates
   - Analyze popular lens selections
   - Monitor quiz completion rates

3. **Add Search/Filter:**
   - Search by name, phone, email
   - Filter by date range
   - Filter by selected lens

4. **Add Data Export:**
   - Export to CSV
   - Export to Excel
   - Generate reports

