/**
 * GET /api/games/:id
 * Get game state
 */

const { getGame, getMolt, getMoltByApiKey } = require('../../../lib/supabase');
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

    // Get player ELO ratings
    const [redMoltData, yellowMoltData] = await Promise.all([
      getMolt(dbGame.red_molt),
      getMolt(dbGame.yellow_molt)
    ]);

    const game = new Connect4Game(null, null, dbGame);
    const gameJson = game.toJSON(moltId);
    
    // Add ELO to response
    gameJson.redElo = redMoltData?.elo || 1200;
    gameJson.yellowElo = yellowMoltData?.elo || 1200;
    gameJson.redName = redMoltData?.name || dbGame.red_molt;
    gameJson.yellowName = yellowMoltData?.name || dbGame.yellow_molt;

    res.json({
      success: true,
      gameId: dbGame.id,
      game: gameJson,
      boardText: game.toText()
    });

  } catch (error) {
    console.error('Get game error:', error);
    res.status(500).json({ error: 'Failed to get game' });
  }
};
