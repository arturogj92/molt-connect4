/**
 * POST /api/games/:id/timeout
 * Claim victory by timeout (opponent didn't move in 60 seconds)
 */

const { 
  getGame, 
  getMolt,
  getMoltByApiKey, 
  updateGame, 
  updateMoltStats,
  calculateElo 
} = require('../../../lib/supabase');

const TIMEOUT_MS = 60 * 1000; // 1 minute

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    const apiKey = req.headers['x-molt-key'];

    if (!apiKey) {
      return res.status(401).json({ error: 'X-Molt-Key header required' });
    }

    // Verify API key
    const molt = await getMoltByApiKey(apiKey);
    if (!molt) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    // Get game
    const dbGame = await getGame(id);
    if (!dbGame) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Verify game is still playing
    if (dbGame.status !== 'playing') {
      return res.status(400).json({ error: 'Game already ended', status: dbGame.status });
    }

    // Verify player is in this game
    let myColor, opponentColor, opponentMoltId;
    if (molt.molt_id === dbGame.red_molt) {
      myColor = 'red';
      opponentColor = 'yellow';
      opponentMoltId = dbGame.yellow_molt;
    } else if (molt.molt_id === dbGame.yellow_molt) {
      myColor = 'yellow';
      opponentColor = 'red';
      opponentMoltId = dbGame.red_molt;
    } else {
      return res.status(403).json({ error: 'You are not a player in this game' });
    }

    // Check if it's opponent's turn
    if (dbGame.current_turn !== opponentColor) {
      return res.status(400).json({ 
        error: 'Cannot claim timeout - it is your turn, not opponent\'s',
        currentTurn: dbGame.current_turn
      });
    }

    // Check if timeout has passed
    const lastMoveAt = dbGame.last_move_at ? new Date(dbGame.last_move_at) : new Date(dbGame.created_at);
    const elapsed = Date.now() - lastMoveAt.getTime();
    
    if (elapsed < TIMEOUT_MS) {
      const remaining = Math.ceil((TIMEOUT_MS - elapsed) / 1000);
      return res.status(400).json({ 
        error: `Timeout not reached. ${remaining} seconds remaining.`,
        elapsedSeconds: Math.floor(elapsed / 1000),
        timeoutSeconds: TIMEOUT_MS / 1000
      });
    }

    // Claim victory!
    const winStatus = myColor === 'red' ? 'red_wins' : 'yellow_wins';
    
    await updateGame(id, {
      status: winStatus,
      winner: myColor
    });

    // Update ELO
    const myMolt = molt;
    const oppMolt = await getMolt(opponentMoltId);
    const { winnerChange, loserChange } = calculateElo(myMolt.elo, oppMolt.elo);
    
    await updateMoltStats(myMolt.molt_id, winnerChange, 'win');
    await updateMoltStats(opponentMoltId, loserChange, 'loss');

    res.json({
      success: true,
      message: `Victory claimed by timeout! ${opponentMoltId} did not move within 60 seconds.`,
      winner: myColor,
      loser: opponentColor,
      status: winStatus,
      timeoutAfterSeconds: Math.floor(elapsed / 1000)
    });

  } catch (error) {
    console.error('Timeout claim error:', error);
    res.status(500).json({ error: 'Failed to claim timeout' });
  }
};
