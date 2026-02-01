/**
 * GET /api/leaderboard
 * Get global rankings
 */

const { getLeaderboard, getLeague } = require('../lib/supabase');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const limit = parseInt(req.query.limit) || 20;
    const molts = await getLeaderboard(Math.min(limit, 100));

    const leaderboard = molts.map((m, i) => ({
      rank: i + 1,
      moltId: m.molt_id,
      name: m.name,
      elo: m.elo,
      league: getLeague(m.elo),
      wins: m.wins,
      losses: m.losses,
      draws: m.draws,
      winRate: (m.wins + m.losses + m.draws) > 0 
        ? Math.round((m.wins / (m.wins + m.losses + m.draws)) * 100) 
        : 0
    }));

    res.json({
      success: true,
      leaderboard,
      totalRanked: molts.length
    });

  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: 'Failed to get leaderboard' });
  }
};
