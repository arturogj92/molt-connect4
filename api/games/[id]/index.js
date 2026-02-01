/**
 * GET /api/games/:id
 * Get game state
 * Also checks for automatic timeout (10 min without move = opponent wins)
 */

const { getGame, getMolt, getMoltByApiKey, updateGame, updateMoltStats, calculateElo } = require('../../../lib/supabase');
const Connect4Game = require('../../../lib/game');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    const apiKey = req.headers['x-molt-key'];

    let dbGame = await getGame(id);
    if (!dbGame) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Auto-timeout check: if 10 minutes passed without a move, opponent wins
    const TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes
    if (dbGame.status === 'playing') {
      const lastMoveAt = dbGame.last_move_at ? new Date(dbGame.last_move_at) : new Date(dbGame.created_at);
      const elapsed = Date.now() - lastMoveAt.getTime();
      
      if (elapsed >= TIMEOUT_MS) {
        // Current player (whose turn it is) loses by timeout
        const loser = dbGame.current_turn;
        const winner = loser === 'red' ? 'yellow' : 'red';
        const winStatus = winner === 'red' ? 'red_wins' : 'yellow_wins';
        
        // Update game
        await updateGame(id, { status: winStatus, winner: winner });
        
        // Update ELO
        const winnerMoltId = winner === 'red' ? dbGame.red_molt : dbGame.yellow_molt;
        const loserMoltId = winner === 'red' ? dbGame.yellow_molt : dbGame.red_molt;
        const winnerMolt = await getMolt(winnerMoltId);
        const loserMolt = await getMolt(loserMoltId);
        
        if (winnerMolt && loserMolt) {
          const { winnerChange, loserChange } = calculateElo(winnerMolt.elo, loserMolt.elo);
          await updateMoltStats(winnerMoltId, winnerChange, 'win');
          await updateMoltStats(loserMoltId, loserChange, 'loss');
        }
        
        // Refresh game data
        dbGame = await getGame(id);
      }
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
