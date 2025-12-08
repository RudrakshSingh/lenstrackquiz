# Lens V2 Frontend Update Summary

## Status
- ✅ Backend models updated
- ✅ API endpoints updated
- ✅ Helper functions created
- ⏳ Frontend UI update in progress

## Required Frontend Changes

### 1. General Tab
- IT Code *
- Name *
- Brand Line * (string input, not dropdown)
- Vision Type * (SINGLE_VISION, PROGRESSIVE, BIFOCAL, ANTI_FATIGUE, MYOPIA_CONTROL)
- Lens Index * (INDEX_156, INDEX_160, INDEX_167, INDEX_174)
- Tint Option (CLEAR, TINT, PHOTOCHROMIC, TRANSITION)
- Category (ECONOMY, STANDARD, PREMIUM, ULTRA)
- Base Offer Price *
- Add-on Price
- Delivery Days (default 4)
- YOPO Eligible (checkbox)

### 2. RX Ranges Tab (NEW)
- Table with columns: SPH Min | SPH Max | CYL Min | CYL Max | Add-on Price | Delete
- Button: + Add RX Range
- Each row is a separate RX range

### 3. Features Tab
- Checklist of F01-F11 features
- Only show features with codes F01 through F11

### 4. Benefits Tab
- 12 sliders (B01-B12) with 0-3 scale
- Remove "Comfort, Clarity, Style, Value" benefits

### 5. Specifications Tab
- Keep as is (Group | Key | Value)

### 6. Remove
- Answer Boosts tab
- All Answer Boosts related code

