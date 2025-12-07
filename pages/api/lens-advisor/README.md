# Lens Advisor API Documentation

## Base URL
`/api/lens-advisor`

## Endpoints

### 1. GET /lens-advisor/config

Returns static configuration needed by the frontend.

**Response:**
```json
{
  "success": true,
  "config": {
    "languages": ["en", "hi", "hinglish"],
    "frame_types": ["full_rim_plastic", "full_rim_metal", "half_rim", "rimless"],
    "question_keys": [...],
    "severity_ranges": {...},
    "index_requirements": {...},
    "offer_types": [...],
    "vision_types": [...],
    "price_segments": [...]
  }
}
```

### 2. POST /lens-advisor/recommend

Main endpoint that generates lens recommendations based on customer inputs.

**Request Body:**
```json
{
  "language": "en",
  "power": {
    "right": { "sph": -5.50, "cyl": -1.50 },
    "left": { "sph": -5.00, "cyl": -1.25 }
  },
  "frame_type": "rimless",
  "answers": {
    "vision_need": "distance",
    "screen_hours": 10,
    "outdoor_hours": "minimal",
    "driving_pattern": "daily_night",
    "symptoms": ["eye_strain"],
    "preference": "best_clarity",
    "second_pair_interest": "driving"
  }
}
```

**Response:**
```json
{
  "success": true,
  "usage_summary": {
    "device_severity": 4,
    "outdoor_severity": 3,
    "driving_severity": 4,
    "power_severity": 4,
    "final_required_index": 1.67,
    "safety_notes": [...]
  },
  "recommendations": {
    "perfect_match": {
      "lens_id": "sv-167-bz-ar",
      "name": "DIGI360 Advanced",
      "mrp": 3000,
      "index": 1.67,
      "features": [...],
      "reason": "..."
    },
    "recommended": {...},
    "safe_value": {...}
  },
  "full_price_list": [...],
  "session_id": "uuid-string"
}
```

### 3. POST /lens-advisor/offer-preview

Calculates final pricing and savings for a cart with selected offer.

**Request Body:**
```json
{
  "items": [
    { "type": "pair", "frame_price": 1999, "lens_price": 3999 },
    { "type": "pair", "frame_price": 1499, "lens_price": 2999 }
  ],
  "selected_offer_id": "B1G1",
  "offer_config": {
    "x": 5000,
    "y": 2000,
    "percentage": 20
  }
}
```

**Response:**
```json
{
  "success": true,
  "price_without_offer": 10496,
  "price_with_offer": 6998,
  "you_save_value": 3498,
  "you_save_percent": 33.34,
  "applied_offer_id": "B1G1",
  "line_level_discounts": [
    { "item_index": 1, "discount": 1499, "description": "Free (B1G1)" }
  ]
}
```

## Offer Types

- **B1G1 / BOGO**: Buy 1 Get 1 Free (cheapest item free)
- **B1G50 / BOGO_50**: Buy 1 Get 50% Off (50% off cheaper item)
- **YOPO**: You Only Pay for One (pay only for most expensive)
- **X_Y**: Buy at X price, get second at Y price (requires offer_config.x and offer_config.y)
- **PERCENT / PERCENT_OFF**: Percentage discount (requires offer_config.percentage)

## Error Responses

All endpoints return errors in this format:
```json
{
  "success": false,
  "error": "Error message"
}
```

Common HTTP status codes:
- `200`: Success
- `400`: Bad Request (validation error)
- `405`: Method Not Allowed
- `500`: Internal Server Error

