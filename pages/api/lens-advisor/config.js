// pages/api/lens-advisor/config.js
// GET /lens-advisor/config - Returns static configuration

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ 
      success: false, 
      error: "Method not allowed" 
    });
  }

  try {
    const config = {
      languages: ["en", "hi", "hinglish"],
      frame_types: [
        "full_rim_plastic",
        "full_rim_metal",
        "half_rim",
        "rimless"
      ],
      question_keys: [
        "vision_need",
        "screen_hours",
        "outdoor_hours",
        "driving_pattern",
        "symptoms",
        "preference",
        "second_pair_interest"
      ],
      severity_ranges: {
        device: {
          "0-2": 0,
          "2-4": 1,
          "4-6": 2,
          "6-8": 3,
          "8-12": 4,
          "12-24": 5
        },
        outdoor: {
          "minimal": 0,
          "1-3": 2,
          "3-6": 3,
          "6+": 4
        },
        driving: {
          "none": 0,
          "day_only": 1,
          "some_night": 2,
          "daily_night": 4,
          "professional": 5
        },
        power: {
          "0-2": 1,
          "2-4": 2,
          "4-6": 3,
          "6-8": 4,
          "8+": 5
        }
      },
      index_requirements: {
        power: {
          1: 1.50,
          2: 1.56,
          3: 1.60,
          4: 1.67,
          5: 1.74
        }
      },
      offer_types: [
        "b1g1",
        "b1g50",
        "yopo",
        "x_y",
        "percent"
      ],
      vision_types: [
        "sv",
        "progressive",
        "bifocal",
        "zero_power"
      ],
      price_segments: [
        "budget",
        "mid",
        "premium",
        "ultra"
      ]
    };

    return res.status(200).json({
      success: true,
      config
    });
  } catch (error) {
    console.error("Config API error:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
}

