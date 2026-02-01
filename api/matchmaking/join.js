/**
 * POST /api/matchmaking/join
 * Join matchmaking queue
 */

const { getMoltByApiKey, joinQueue } = require('../../lib/supabase');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const apiKey = req.headers['x-molt-key'];

    if (!apiKey) {
      return res.status(401).json({ error: 'X-Molt-Key header required' });
    }

    // Verify API key
    const molt = await getMoltByApiKey(apiKey);
    if (!molt) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    const result = await joinQueue(molt.molt_id);

    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Join queue error:', error);
    res.status(500).json({ error: 'Failed to join matchmaking' });
  }
};
