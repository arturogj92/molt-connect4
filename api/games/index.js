/**
 * POST /api/games
 * Create a new game (direct invite, not matchmaking)
 */

const { getMolt, getMoltByApiKey, createGame } = require('../../lib/supabase');
const Connect4Game = require('../../lib/game');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const apiKey = req.headers['x-molt-key'];
    const { opponentMoltId } = req.body;

    if (!apiKey) {
      return res.status(401).json({ error: 'X-Molt-Key header required' });
    }

    if (!opponentMoltId) {
      return res.status(400).json({ error: 'opponentMoltId required' });
    }

    // Verify API key
    const molt = await getMoltByApiKey(apiKey);
    if (!molt) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    // Verify opponent exists
    const opponent = await getMolt(opponentMoltId);
    if (!opponent) {
      return res.status(404).json({ error: 'Opponent molt not found' });
    }

    // Create game (creator is red, starts first)
    const game = new Connect4Game(molt.molt_id, opponentMoltId);
    const dbGame = await createGame(molt.molt_id, opponentMoltId, game.board);

    res.json({
      success: true,
      gameId: dbGame.id,
      yourColor: 'red',
      opponent: opponentMoltId,
      game: game.toJSON(molt.molt_id)
    });

  } catch (error) {
    console.error('Create game error:', error);
    res.status(500).json({ error: 'Failed to create game' });
  }
};
