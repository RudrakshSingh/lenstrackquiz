# Lens Advisor V1.0 Specification Compliance Report

## Executive Summary
This document compares the current implementation against the Lens Advisor Developer Specification V1.0 and provides recommendations for alignment.

---

## ✅ IMPLEMENTED FEATURES

### 1. Language Selection (Step 0)
- ✅ English, Hindi, Hinglish support
- ✅ Auto-translation for labels, questions, descriptions
- **Location**: `pages/index.js` (Step 0)

### 2. Prescription Entry (Step 1) - PARTIAL
- ✅ SPH (Right & Left Eye)
- ✅ CYL (Right & Left Eye)
- ✅ ADD field
- ❌ **MISSING**: AXIS field
- ❌ **MISSING**: PD (Pupillary Distance) field
- **Location**: `pages/index.js` (Step 4)

### 3. Frame Entry (Step 2) - PARTIAL
- ✅ Frame Type (Full Rim, Half Rim, Rimless)
- ❌ **MISSING**: Frame Brand field
- ❌ **MISSING**: Sub-category (for Lenstrack frames)
- ❌ **MISSING**: Frame MRP field
- ❌ **MISSING**: Material field
- **Location**: `pages/index.js` (Step 5)

### 4. Questionnaire (Step 3) - PARTIAL
- ✅ Basic questions implemented
- ✅ Dynamic question loading from API
- ❌ **MISSING**: Adaptive flow (Primary → Sub-question → Next Primary)
- ❌ **MISSING**: Dynamic question routing based on answers
- **Location**: `pages/index.js` (Steps 8+), `models/Question.js`

### 5. Scoring Engine (Step 4)
- ✅ Benefit scoring implemented
- ✅ Match percentage calculation
- ✅ Severity calculations (device, outdoor, driving, power)
- **Location**: `lib/lensAdvisorEngine.js`

### 6. Lens Recommendations - PARTIAL
- ✅ Returns 3 recommendations (perfectMatch, recommended, safeValue)
- ❌ **MISSING**: 4th recommendation (Premium Upgrade Lens)
- ❌ **MISSING**: Explicit "Index Recommendation Lens" (thinnest & safest)
- ❌ **MISSING**: Explicit "Budget Walkout Prevention Lens" (lowest price safe option)
- **Location**: `lib/lensAdvisorEngine.js`, `pages/result.js`

### 7. View All Lenses Module - PARTIAL
- ✅ Shows all lenses with suitability badges
- ❌ **MISSING**: Sorting options (Price High→Low, Price Low→High, Match %, Index Thin→Thick)
- ❌ **MISSING**: Thickness warnings (e.g., "42% thicker than recommended")
- ❌ **MISSING**: Thickness comparison display
- **Location**: `pages/result.js` (priceListSection)

### 8. Staff Attribution
- ✅ Store selection
- ✅ Salesperson selection
- ⚠️ **NEEDS REFINEMENT**: Self-Service vs POS mode distinction
- **Location**: `pages/index.js` (Steps 6-7)

---

## ❌ MISSING FEATURES

### 1. Index Recommendation Engine
**Spec Requirement**: 
- Power Range → Index mapping (0 to ±3 → 1.56, ±3 to ±5 → 1.60, etc.)
- Special cases (Rimless → min 1.59, Half-rim + high power → prefer 1.67)

**Current Status**: Basic index calculation exists but not following spec exactly.

**Recommendation**: 
- Implement exact power range → index mapping
- Add special case handling for rimless and half-rim frames

### 2. Rx Band Pricing Engine
**Spec Requirement**: 
- Each lens SKU supports multiple Rx pricing bands
- Example: `-6 to +4, 0 to -4` → Base Price, `-6 to +6, 0 to -6` → + ₹1000

**Current Status**: Not implemented.

**Recommendation**: 
- Add `rxBands` array to LensProduct model
- Implement pricing calculation based on Rx bands
- Update offer price calculation to include Rx band add-ons

### 3. Four Lens Recommendation Types
**Spec Requirement**:
1. **Best Match Lens** - Highest benefit match score
2. **Recommended Index Lens** - Thinnest & safest for Rx
3. **Premium Upgrade Lens** - Match % exceeds 100%, shows extra features
4. **Budget Walkout Prevention Lens** - Lowest-price lens safe for customer's power

**Current Status**: Only 3 recommendations (perfectMatch, recommended, safeValue).

**Recommendation**:
- Modify `getLensRecommendations()` to return 4 explicit recommendations
- Add logic to identify Premium Upgrade (match > 100%)
- Add logic to identify Budget Walkout Prevention (lowest safe price)

### 4. View All Lenses - Sorting & Thickness Warnings
**Spec Requirement**:
- Sorting: High→Low Price (default), Low→High Price, Match % (High→Low), Index (Thin→Thick)
- Thickness warning: "This lens will be ~42% thicker than recommended index"

**Current Status**: No sorting, no thickness warnings.

**Recommendation**:
- Add sorting dropdown to View All Lenses section
- Calculate thickness percentage difference
- Display warning when selected index < recommended index

### 5. Adaptive Questionnaire Flow
**Spec Requirement**:
- Primary Question → Sub-question → Next Primary
- Dynamic routing based on selected answers

**Current Status**: Linear question flow.

**Recommendation**:
- Implement question routing logic based on `showIf` conditions
- Add sub-question support in Question model
- Update UI to handle conditional questions

### 6. Entry Modes (Self-Service vs POS)
**Spec Requirement**:
- `salesMode = SELF_SERVICE` (QR scan) vs `STAFF_ASSISTED` (POS)
- Self-Service: Optional staff selection
- POS: Mandatory staff selection

**Current Status**: Basic store/staff selection exists but no mode distinction.

**Recommendation**:
- Add `salesMode` field to session/submission
- Detect mode from URL params or user context
- Make staff selection conditional based on mode

### 7. Order Flow States
**Spec Requirement**:
- CUSTOMER_CONFIRMED → DRAFT → PRINTED → STORE_ACCEPTED → PUSHED_TO_LAB

**Current Status**: Not fully implemented.

**Recommendation**:
- Add order status tracking
- Implement state transitions
- Add UI for order status management

### 8. PD (Pupillary Distance) Field
**Spec Requirement**: PD input in prescription entry.

**Current Status**: Missing.

**Recommendation**: Add PD field to prescription entry form.

### 9. AXIS Field
**Spec Requirement**: AXIS input in prescription entry.

**Current Status**: Missing.

**Recommendation**: Add AXIS field for both eyes in prescription entry.

### 10. Frame Brand, Sub-category, MRP, Material
**Spec Requirement**: Manual entry of frame details.

**Current Status**: Only frame type is captured.

**Recommendation**: Add fields for brand, sub-category, MRP, and material.

---

## 🔧 RECOMMENDED CHANGES

### Priority 1 (Critical - Core Functionality)

1. **Add Missing Prescription Fields**
   - Add AXIS field (Right & Left Eye)
   - Add PD field
   - Update validation and data model

2. **Implement 4 Lens Recommendations**
   - Modify recommendation engine to return 4 explicit types
   - Update result page to display all 4 recommendations
   - Add Premium Upgrade and Budget Walkout Prevention logic

3. **Add Frame Details Fields**
   - Frame Brand
   - Sub-category (for Lenstrack)
   - Frame MRP
   - Material

4. **Implement Rx Band Pricing**
   - Add `rxBands` to LensProduct model
   - Update pricing calculation logic
   - Integrate with offer engine

### Priority 2 (Important - User Experience)

5. **View All Lenses - Sorting & Thickness**
   - Add sorting dropdown
   - Calculate and display thickness warnings
   - Show thickness percentage difference

6. **Adaptive Questionnaire**
   - Implement conditional question routing
   - Add sub-question support
   - Update UI for dynamic flow

7. **Index Recommendation Engine**
   - Implement exact power range → index mapping
   - Add special case handling

### Priority 3 (Enhancement - Workflow)

8. **Entry Modes**
   - Add salesMode detection
   - Make staff selection conditional

9. **Order Flow States**
   - Implement status tracking
   - Add state transition logic

---

## 📋 IMPLEMENTATION CHECKLIST

### Phase 1: Core Data Model Updates
- [ ] Add AXIS fields to prescription entry
- [ ] Add PD field to prescription entry
- [ ] Add Frame Brand, Sub-category, MRP, Material fields
- [ ] Add `rxBands` array to LensProduct model
- [ ] Add `salesMode` to session/submission model

### Phase 2: Recommendation Engine Updates
- [ ] Modify recommendation engine to return 4 explicit recommendations
- [ ] Add Premium Upgrade Lens logic (match > 100%)
- [ ] Add Budget Walkout Prevention Lens logic (lowest safe price)
- [ ] Implement Index Recommendation Lens (thinnest & safest)
- [ ] Update Index Recommendation Engine with exact power ranges

### Phase 3: UI/UX Enhancements
- [ ] Update prescription entry form with AXIS and PD
- [ ] Update frame entry form with brand, sub-category, MRP, material
- [ ] Update result page to show 4 recommendations
- [ ] Add sorting to View All Lenses
- [ ] Add thickness warnings to View All Lenses
- [ ] Implement adaptive questionnaire flow

### Phase 4: Pricing & Offers
- [ ] Implement Rx Band Pricing calculation
- [ ] Integrate Rx Band Pricing with offer engine
- [ ] Update pricing display to show Rx band adjustments

### Phase 5: Workflow & Modes
- [ ] Implement salesMode detection (Self-Service vs POS)
- [ ] Make staff selection conditional based on mode
- [ ] Implement order flow states
- [ ] Add order status tracking UI

---

## 📝 API CHANGES REQUIRED

### POST /lens/recommend
**Current**: Returns 3 recommendations
**Required**: Return 4 recommendations with explicit types
```json
{
  "bestMatch": {...},
  "indexRecommendation": {...},
  "premiumOption": {...},
  "budgetOption": {...}
}
```

### GET /lens/view-all?sort=price_high
**Current**: Returns unsorted list
**Required**: 
- Add sorting parameter (price_high, price_low, match_high, index_thin)
- Include thickness warnings in response
- Include thickness percentage difference

---

## 🎯 NEXT STEPS

1. **Review and prioritize** the recommended changes
2. **Create detailed implementation plan** for Phase 1
3. **Update data models** to support new fields
4. **Modify recommendation engine** to return 4 recommendations
5. **Update UI components** to display new fields and recommendations
6. **Test thoroughly** with various prescription scenarios
7. **Update documentation** as changes are implemented

---

## 📚 RELATED FILES

- `pages/index.js` - Main quiz flow
- `pages/result.js` - Results display
- `lib/lensAdvisorEngine.js` - Recommendation engine
- `models/LensProduct.js` - Lens product model
- `models/Question.js` - Question model
- `pages/api/lens-advisor/recommend.js` - Recommendation API
- `pages/api/submit.js` - Submission API

---

**Last Updated**: 2024-12-19
**Spec Version**: Lens Advisor Developer Specification V1.0

