#!/bin/bash

# Test script for POST endpoints with dummy data

BASE_URL="http://localhost:3000"
AUTH_TOKEN="Bearer admin123"

echo "========================================="
echo "Testing POST Endpoints with Dummy Data"
echo "========================================="
echo ""

# Test 1: Submit endpoint (quiz submission)
echo "1. Testing /api/submit (Quiz Submission)..."
curl -X POST "$BASE_URL/api/submit" \
  -H "Content-Type: application/json" \
  -d '{
    "user": {
      "name": "Test User",
      "number": "1234567890",
      "email": "test@example.com",
      "sph": "-2.00",
      "cyl": "-0.50",
      "add": "0",
      "rightSph": "-2.00",
      "rightCyl": "-0.50",
      "leftSph": "-2.00",
      "leftCyl": "-0.50",
      "frameType": "full_rim_plastic",
      "deviceHours": 6,
      "outdoorExposure": "3-6 hrs",
      "driving": "some night"
    },
    "answers": {
      "deviceHours": "6-8 hrs",
      "outdoorExposure": "3-6 hrs",
      "driving": "some night",
      "symptoms": ["Eye strain"],
      "preferences": "Blue light protection",
      "vision_need": "distance"
    },
    "language": "en"
  }' \
  -w "\nStatus: %{http_code}\n" \
  -s | jq '.' 2>/dev/null || echo "Response received"
echo ""

# Test 2: Create Question
echo "2. Testing /api/admin/questions (Create Question)..."
curl -X POST "$BASE_URL/api/admin/questions" \
  -H "Content-Type: application/json" \
  -H "Authorization: $AUTH_TOKEN" \
  -d '{
    "id": "Q_TEST_001",
    "groupId": "G_TEST",
    "visionTypes": ["SV_DISTANCE", "PROGRESSIVE"],
    "text": {
      "en": "How many hours do you spend on screens daily?",
      "hi": "आप दिन में कितने घंटे स्क्रीन पर बिताते हैं?",
      "hinglish": "Aap din mein kitne ghante screen pe bitate ho?"
    },
    "questionType": "multiple_choice",
    "options": [
      {
        "id": "OPT_0_2",
        "label": {
          "en": "Less than 2 hours",
          "hi": "2 घंटे से कम",
          "hinglish": "2 ghante se kam"
        },
        "severity": 0,
        "tags": ["SCREEN_LOW"],
        "value": "0-2"
      },
      {
        "id": "OPT_4_6",
        "label": {
          "en": "4-6 hours",
          "hi": "4-6 घंटे",
          "hinglish": "4-6 ghante"
        },
        "severity": 2,
        "tags": ["SCREEN_MEDIUM"],
        "value": "4-6"
      }
    ],
    "order": 1,
    "isRequired": true,
    "is_active": true
  }' \
  -w "\nStatus: %{http_code}\n" \
  -s | jq '.' 2>/dev/null || echo "Response received"
echo ""

# Test 3: Create Offer
echo "3. Testing /api/admin/offers (Create Offer)..."
curl -X POST "$BASE_URL/api/admin/offers" \
  -H "Content-Type: application/json" \
  -H "Authorization: $AUTH_TOKEN" \
  -d '{
    "id": "OFFER_TEST_001",
    "name": "Test B1G1 Offer",
    "type": "B1G1",
    "description": {
      "en": "Buy 1 Get 1 Free on all lenses",
      "hi": "सभी लेंस पर 1 खरीदें 1 मुफ्त",
      "hinglish": "Sabhi lens pe 1 kharido 1 free"
    },
    "target_filters": {
      "brands": ["Eyekra"],
      "vision_types": ["SV_DISTANCE", "PROGRESSIVE"],
      "min_cart_value": 0,
      "required_pairs": 2
    },
    "discount_logic": {},
    "validity": {
      "start_date": "2025-01-01",
      "end_date": "2025-12-31"
    },
    "priority": 80,
    "stacking": {
      "can_stack": false,
      "blocked_with": []
    },
    "creative_upsell_templates": {
      "product_footer": {
        "en": "Add 2nd pair now – pay only for one (YOPO)",
        "hi": "अभी दूसरा चश्मा जोड़ें – भुगतान सिर्फ एक का करें",
        "hinglish": "Abhi 2nd pair add karo – payment sirf ek ka"
      },
      "cart_banner": {
        "en": "Add 1 more pair to unlock YOPO and save up to ₹5000",
        "hi": "एक और जोड़ी जोड़ें और YOPO से ₹5000 तक बचत पाएँ",
        "hinglish": "Ek aur pair add karo, YOPO se ₹5000 tak bacha lo"
      }
    },
    "is_active": true
  }' \
  -w "\nStatus: %{http_code}\n" \
  -s | jq '.' 2>/dev/null || echo "Response received"
echo ""

# Test 4: Create Lens
echo "4. Testing /api/admin/lenses (Create Lens)..."
curl -X POST "$BASE_URL/api/admin/lenses" \
  -H "Content-Type: application/json" \
  -H "Authorization: $AUTH_TOKEN" \
  -d '{
    "name": "Test Premium Lens",
    "brand": "Eyekra",
    "vision_type": "SV_DISTANCE",
    "vision_types_supported": ["SV_DISTANCE", "SV_NEAR"],
    "index": 1.60,
    "material": "MR-8",
    "blue_protection_level": 4,
    "uv_protection_level": 5,
    "ar_level": 4,
    "driving_support_level": 3,
    "photochromic": false,
    "polarized": false,
    "anti_fatigue": false,
    "min_power_se": -8,
    "max_power_se": 8,
    "frame_compatibility": ["full_rim_plastic", "full_rim_metal", "half_rim"],
    "price_mrp": 5000,
    "numericPrice": 5000,
    "price_segment": "premium",
    "features": ["Blue Light Protection", "UV Protection", "Anti-Glare"],
    "is_active": true
  }' \
  -w "\nStatus: %{http_code}\n" \
  -s | jq '.' 2>/dev/null || echo "Response received"
echo ""

# Test 5: Test endpoint (simple POST test)
echo "5. Testing /api/test-post (Simple POST Test)..."
curl -X POST "$BASE_URL/api/test-post" \
  -H "Content-Type: application/json" \
  -d '{
    "test": "data",
    "message": "Hello from test"
  }' \
  -w "\nStatus: %{http_code}\n" \
  -s | jq '.' 2>/dev/null || echo "Response received"
echo ""

echo "========================================="
echo "Testing Complete!"
echo "========================================="

