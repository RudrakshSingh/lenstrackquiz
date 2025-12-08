# Backend Benefit Mapping Implementation - Complete

## ✅ Implementation Status: COMPLETE

All backend components for benefit mapping, scoring, and lens matching have been implemented using **MongoDB**.

---

## 📋 Database Collections (MongoDB)

### 1. **questionsNew** Collection
```javascript
{
  _id: ObjectId,
  code: String,
  text: { en: String, hi: String, hiEn: String },
  category: String, // USAGE | PROBLEM | PROBLEMS | LIFESTYLE | ENVIRONMENT | BUDGET
  questionType: String, // SINGLE_SELECT | MULTI_SELECT | SLIDER
  displayOrder: Number,
  isActive: Boolean,
  parentAnswerId: ObjectId?,
  createdAt: Date,
  updatedAt: Date
}
```

### 2. **answersNew** Collection
```javascript
{
  _id: ObjectId,
  questionId: ObjectId,
  text: { en: String, hi: String, hiEn: String },
  displayOrder: Number,
  isActive: Boolean,
  triggersSubQuestion: Boolean,
  subQuestionId: ObjectId?,
  createdAt: Date,
  updatedAt: Date
}
```

### 3. **answerBenefits** Collection (Bridge Table)
```javascript
{
  _id: ObjectId,
  answerId: ObjectId,
  benefitId: ObjectId,
  points: Number, // 0 to 3 (float)
  createdAt: Date,
  updatedAt: Date
}
```

### 4. **benefits** Collection
```javascript
{
  _id: ObjectId,
  code: String, // B01, B02, B03, etc.
  name: String,
  description: String?,
  pointWeight: Number,
  relatedProblems: Array,
  relatedUsage: Array,
  createdAt: Date,
  updatedAt: Date
}
```

### 5. **productBenefits** Collection
```javascript
{
  _id: ObjectId,
  productId: String, // Lens ID/SKU
  benefitId: ObjectId,
  points: Number, // 0 to 3 (float)
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔌 API Endpoints

### **1. POST /api/admin/questionnaire/questions**
Create a question with answers and benefit mappings.

**Request:**
```json
{
  "code": "Q_SCREEN_HOURS",
  "text_en": "How much screen time do you use?",
  "text_hi": "आप कितने घंटे स्क्रीन का उपयोग करते हैं?",
  "text_hing": "Kitne ghante screen use karte ho?",
  "category": "USAGE",
  "questionType": "SINGLE_SELECT",
  "displayOrder": 1,
  "answers": [
    {
      "text_en": "4-8 hours",
      "text_hi": "4-8 घंटे",
      "text_hing": "4-8 ghante",
      "displayOrder": 3,
      "benefitMapping": {
        "B01": 2,
        "B04": 1.5,
        "B07": 0.5
      }
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "question_id",
    "code": "Q_SCREEN_HOURS",
    "answersCount": 1
  }
}
```

**Features:**
- ✅ Creates question
- ✅ Creates all answers
- ✅ Creates AnswerBenefit mappings for each benefit
- ✅ Validates benefit points (0-3 range)
- ✅ Supports snake_case and camelCase
- ✅ Auto-generates code if not provided

---

### **2. GET /api/admin/questionnaire/questions**
Get all questions with answers and benefit mappings.

**Query Parameters:**
- `isActive` (optional): Filter by active status

**Response:**
```json
{
  "success": true,
  "data": {
    "questions": [
      {
        "id": "question_id",
        "code": "Q_SCREEN_HOURS",
        "textEn": "How much screen time?",
        "textHi": "...",
        "textHiEn": "...",
        "category": "USAGE",
        "questionType": "SINGLE_SELECT",
        "displayOrder": 1,
        "isActive": true,
        "answers": [
          {
            "id": "answer_id",
            "textEn": "4-8 hours",
            "textHi": "...",
            "textHiEn": "...",
            "displayOrder": 3,
            "isActive": true,
            "triggersSubQuestion": false,
            "subQuestionId": null,
            "benefitMapping": {
              "B01": 2,
              "B04": 1.5,
              "B07": 0.5
            }
          }
        ]
      }
    ]
  }
}
```

**Features:**
- ✅ Returns all questions
- ✅ Includes answers with benefit mappings
- ✅ Supports filtering by isActive
- ✅ Sorted by displayOrder

---

### **3. POST /api/admin/questionnaire/questions/:questionId/answers**
Add answers to an existing question.

**Request:**
```json
{
  "answers": [
    {
      "text_en": "4-8 hours",
      "displayOrder": 3,
      "benefitMapping": {
        "B01": 2,
        "B04": 1.5
      }
    }
  ]
}
```

**Features:**
- ✅ Supports benefitMapping object format
- ✅ Supports benefits array format
- ✅ Validates benefit points
- ✅ Replaces existing answers

---

### **4. PUT /api/admin/questionnaire/answers/:answerId/benefits**
Update benefit mapping for a specific answer.

**Request (Array Format):**
```json
{
  "benefits": [
    { "benefitCode": "B01", "points": 2 },
    { "benefitCode": "B04", "points": 1.5 }
  ]
}
```

**Request (Object Format):**
```json
{
  "benefits": {
    "B01": 2,
    "B04": 1.5
  }
}
```

**Features:**
- ✅ Supports both array and object formats
- ✅ Validates benefit codes (B01-B12)
- ✅ Validates points (0-3 range)
- ✅ Replaces existing mappings

---

### **5. GET /api/admin/benefits**
Get all available benefits.

**Response:**
```json
{
  "success": true,
  "data": {
    "benefits": [
      {
        "id": "benefit_id",
        "code": "B01",
        "name": "Screen Protection",
        "description": "...",
        "pointWeight": 1.0
      }
    ]
  }
}
```

---

### **6. POST /api/advisor/calculate-benefits**
Calculate customer benefit profile from selected answers.

**Request:**
```json
{
  "answers": ["answerId1", "answerId7", "answerId22"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "benefitProfile": {
      "B01": 6.5,
      "B04": 5.0,
      "B07": 1.0,
      "B02": 2.0
    }
  }
}
```

**Logic:**
1. Fetches all AnswerBenefit records for provided answer IDs
2. Aggregates points by benefit code
3. Returns final benefit profile

---

### **7. POST /api/advisor/recommend**
Get lens recommendations based on benefit profile.

**Request:**
```json
{
  "benefitProfile": {
    "B01": 6.5,
    "B04": 5.0
  },
  "rx": {
    "right": { "sph": -2.0, "cyl": -0.5 },
    "left": { "sph": -1.75, "cyl": -0.25 }
  },
  "frame": {
    "type": "full_rim_plastic"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "rank": 1,
        "lens": {
          "id": "lens_id",
          "name": "BlueXpert",
          "itCode": "BLX001",
          "price": 1500,
          "features": [...]
        },
        "matchScore": 87.5,
        "productBenefitMap": { "B01": 3, "B04": 2.5 }
      }
    ],
    "lowestSafePrice": {
      "id": "lens_id",
      "name": "BasicLens",
      "price": 800,
      "matchScore": 45.0
    },
    "totalEligible": 15
  }
}
```

**Logic:**
1. Filters lenses by RX and frame compatibility
2. Calculates match score for each lens
3. Sorts by match score (descending)
4. Returns top 3 + lowest safe price lens

---

## 🧮 Service Functions

### **lib/services/benefitService.js**

#### `calculateCustomerBenefits(answerIds: string[]): Promise<Record<string, number>>`
- Fetches benefit mappings for all answer IDs
- Aggregates points by benefit code
- Returns customer benefit profile

#### `calculateMatchScore(customerBenefitMap, productBenefitMap): number`
- Calculates weighted match score
- Formula: `SUM(customerBenefit[B] * productBenefit[B])`
- Normalized to 0-100 percentage
- Returns match score (0-100)

#### `getProductBenefitMap(productId: string): Promise<Record<string, number>>`
- Fetches product benefit mappings
- Returns benefit profile for a lens

---

### **lib/services/lensMatchingService.js**

#### `filterLensesByRxAndIndex(lenses, prescription, frameType): Array`
- Filters by active status
- Checks frame compatibility
- Validates power range
- Validates index requirements

#### `calculateLensMatchScores(lenses, customerBenefitProfile): Promise<Array>`
- Calculates match score for each lens
- Returns array of `{ lens, matchScore, productBenefitMap }`

#### `sortLenses(lensesWithScores): Array`
- Sorts by match score (descending)
- Secondary sort by price (ascending)

#### `getTopRecommendations(sortedLenses, topN): Array`
- Returns top N recommendations

#### `getLowestSafePriceLens(filteredLenses): Object | null`
- Finds lowest price lens
- Used for walkout prevention

---

## ✅ Validation Rules

### **Benefit Points:**
- ✅ Must be between 0 and 3 (float)
- ✅ Defaults to 0 if not provided
- ✅ Automatically clamped to valid range

### **Benefit Codes:**
- ✅ Must match format: `B01`, `B02`, ..., `B12`
- ✅ Validated using regex: `/^B\d{2}$/`

### **Question Fields:**
- ✅ `text_en` is required
- ✅ `category` must be: USAGE, PROBLEM, PROBLEMS, LIFESTYLE, ENVIRONMENT, BUDGET
- ✅ `questionType` must be: SINGLE_SELECT, MULTI_SELECT, SLIDER
- ✅ `text_hi` and `text_hing` are optional

### **Answer Fields:**
- ✅ `text_en` is required
- ✅ `displayOrder` defaults to array index
- ✅ `isActive` defaults to true
- ✅ `triggersSubQuestion` defaults to false
- ✅ `subQuestionId` is optional

---

## 📦 Files Created/Updated

### **Models:**
- ✅ `models/QuestionNew.js` - Question model
- ✅ `models/AnswerNew.js` - Answer model (updated with new fields)
- ✅ `models/AnswerBenefit.js` - Answer-Benefit mapping
- ✅ `models/Benefit.js` - Benefit master
- ✅ `models/ProductBenefit.js` - Product-Benefit mapping (updated to use `points`)

### **Services:**
- ✅ `lib/services/benefitService.js` - Benefit calculation logic
- ✅ `lib/services/lensMatchingService.js` - Lens matching logic

### **API Endpoints:**
- ✅ `pages/api/admin/questionnaire/questions/index.js` - Question CRUD
- ✅ `pages/api/admin/questionnaire/questions/[questionId]/answers.js` - Answer management
- ✅ `pages/api/admin/questionnaire/answers/[answerId]/benefits.js` - Benefit mapping
- ✅ `pages/api/admin/benefits/index.js` - Benefits list
- ✅ `pages/api/advisor/calculate-benefits.js` - Benefit scoring engine
- ✅ `pages/api/advisor/recommend.js` - Lens recommendation engine

### **Validation:**
- ✅ `lib/validation/questionValidation.js` - Validation utilities
- ✅ `lib/dto/questionDTO.js` - DTO transformation and validation

---

## 🎯 Key Features

1. ✅ **Complete Benefit Mapping Support**
   - Answers can have benefit mappings (B01-B12, 0-3 points)
   - Supports both object and array formats
   - Automatic validation and clamping

2. ✅ **Dynamic Benefit Scoring**
   - Calculates customer benefit profile from answers
   - Aggregates points across multiple answers
   - Returns structured benefit profile

3. ✅ **Lens Matching Engine**
   - Filters lenses by RX and frame compatibility
   - Calculates match scores using benefit profiles
   - Returns top recommendations + lowest price option

4. ✅ **Comprehensive Validation**
   - Benefit points: 0-3 range
   - Benefit codes: B01-B12 format
   - Required fields validation
   - Type checking

5. ✅ **Flexible Data Formats**
   - Supports snake_case and camelCase
   - Supports both object and array formats for benefits
   - Backward compatible with existing data

---

## 🚀 Usage Examples

### **Create Question with Benefit Mapping:**
```javascript
POST /api/admin/questionnaire/questions
{
  "text_en": "How much screen time?",
  "category": "USAGE",
  "questionType": "SINGLE_SELECT",
  "answers": [{
    "text_en": "4-8 hours",
    "benefitMapping": { "B01": 2, "B04": 1.5 }
  }]
}
```

### **Calculate Customer Benefits:**
```javascript
POST /api/advisor/calculate-benefits
{
  "answers": ["answer1", "answer2", "answer3"]
}
// Returns: { "benefitProfile": { "B01": 6.5, "B04": 5.0 } }
```

### **Get Lens Recommendations:**
```javascript
POST /api/advisor/recommend
{
  "benefitProfile": { "B01": 6.5, "B04": 5.0 },
  "rx": { "right": { "sph": -2.0 } },
  "frame": { "type": "full_rim_plastic" }
}
// Returns: Top 3 matches + lowest price lens
```

---

## ✅ Implementation Complete

All backend components are implemented and ready for use. The system now fully supports:
- ✅ Benefit mapping in answers
- ✅ Dynamic benefit scoring
- ✅ Customer benefit profile calculation
- ✅ Lens matching with benefit-based scoring
- ✅ Complete CRUD operations for questions/answers/benefits

