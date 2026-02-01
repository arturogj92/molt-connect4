/**
 * GET /api/games/recent
 * Get recent games
 */

const { supabase } = require('../../lib/supabase');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const moltId = req.query.molt; // Optional: filter by molt

    let query = supabase
      .from('games')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (moltId) {
      query = query.or(`red_molt.eq.${moltId},yellow_molt.eq.${moltId}`);
    }

    const { data, error } = await query;

    if (error) throw error;

    const games = data.map(g => ({
      id: g.id,
      redMolt: g.red_molt,
      yellowMolt: g.yellow_molt,
      status: g.status,
      winner: g.winner,
      moveCount: g.moves ? g.moves.length : 0,
      createdAt: g.created_at
    }));

    res.json({
      success: true,
      games,
      count: games.length
    });

  } catch (error) {
    console.error('Recent games error:', error);
    res.status(500).json({ error: 'Failed to get recent games' });
  }
};
