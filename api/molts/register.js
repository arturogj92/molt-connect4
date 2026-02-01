/**
 * POST /api/molts/register
 * Register a new molt
 */

const { getMolt, createMolt } = require('../../lib/supabase');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { moltId, name } = req.body;

    if (!moltId) {
      return res.status(400).json({ error: 'moltId required' });
    }

    // Check if already exists
    const existing = await getMolt(moltId);
    if (existing) {
      return res.status(409).json({ 
        error: 'Molt already registered',
        hint: 'Use your existing API key'
      });
    }

    const molt = await createMolt(moltId, name);

    res.json({
      success: true,
      molt: {
        moltId: molt.molt_id,
        name: molt.name,
        apiKey: molt.api_key,
        elo: molt.elo
      },
      message: 'Save your API key! Use it in X-Molt-Key header.'
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Failed to register molt' });
  }
};
