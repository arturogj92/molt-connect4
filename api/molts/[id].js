/**
 * GET /api/molts/:id
 * Get molt stats
 */

const { getMolt, getLeague } = require('../../lib/supabase');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    const molt = await getMolt(id);

    if (!molt) {
      return res.status(404).json({ error: 'Molt not found' });
    }

    const gamesPlayed = molt.wins + molt.losses + molt.draws;
    const winRate = gamesPlayed > 0 ? Math.round((molt.wins / gamesPlayed) * 100) : 0;

    res.json({
      success: true,
      molt: {
        moltId: molt.molt_id,
        name: molt.name,
        elo: molt.elo,
        league: getLeague(molt.elo),
        wins: molt.wins,
        losses: molt.losses,
        draws: molt.draws,
        gamesPlayed,
        winRate
      }
    });

  } catch (error) {
    console.error('Get molt error:', error);
    res.status(500).json({ error: 'Failed to get molt stats' });
  }
};
