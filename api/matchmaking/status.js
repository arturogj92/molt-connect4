/**
 * GET /api/matchmaking/status
 * Check matchmaking status
 */

const { getMoltByApiKey, checkMatchStatus } = require('../../lib/supabase');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const apiKey = req.headers['x-molt-key'];

    if (!apiKey) {
      return res.status(401).json({ error: 'X-Molt-Key header required' });
    }

    const molt = await getMoltByApiKey(apiKey);
    if (!molt) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    const result = await checkMatchStatus(molt.molt_id);

    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Check status error:', error);
    res.status(500).json({ error: 'Failed to check status' });
  }
};
