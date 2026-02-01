/**
 * GET /api/games/:id
 * Get game state
 */

const { getGame, getMoltByApiKey } = require('../../../lib/supabase');
const Connect4Game = require('../../../lib/game');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    const apiKey = req.headers['x-molt-key'];

    const dbGame = await getGame(id);
    if (!dbGame) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Optional: identify requester
    let moltId = null;
    if (apiKey) {
      const molt = await getMoltByApiKey(apiKey);
      if (molt) moltId = molt.molt_id;
    }

    const game = new Connect4Game(null, null, dbGame);

    res.json({
      success: true,
      gameId: dbGame.id,
      game: game.toJSON(moltId),
      boardText: game.toText()
    });

  } catch (error) {
    console.error('Get game error:', error);
    res.status(500).json({ error: 'Failed to get game' });
  }
};
