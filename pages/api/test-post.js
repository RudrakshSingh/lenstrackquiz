// pages/api/test-post.js
// Test endpoint to verify POST requests are working

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    return res.status(200).json({
      success: true,
      message: 'POST request received successfully',
      body: req.body,
      headers: {
        'content-type': req.headers['content-type'],
        'authorization': req.headers.authorization ? 'present' : 'missing'
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

