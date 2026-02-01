/**
 * POST /api/games/:id/move
 * Make a move
 */

const { 
  getGame, 
  getMolt,
  getMoltByApiKey, 
  updateGame, 
  updateMoltStats,
  calculateElo 
} = require('../../../lib/supabase');
const Connect4Game = require('../../../lib/game');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    const { column } = req.body;
    const apiKey = req.headers['x-molt-key'];

    if (!apiKey) {
      return res.status(401).json({ error: 'X-Molt-Key header required' });
    }

    if (column === undefined) {
      return res.status(400).json({ error: 'column required (1-7)' });
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

    // Verify player is in this game
    let color;
    if (molt.molt_id === dbGame.red_molt) {
      color = 'red';
    } else if (molt.molt_id === dbGame.yellow_molt) {
      color = 'yellow';
    } else {
      return res.status(403).json({ error: 'You are not a player in this game' });
    }

    // Restore game state and make move
    const game = new Connect4Game(null, null, dbGame);
    const result = game.makeMove(color, column);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
        game: game.toJSON(molt.molt_id),
        boardText: game.toText()
      });
    }

    // Update game in DB (including last_move_at for timeout tracking)
    await updateGame(id, {
      ...game.toDBFormat(),
      last_move_at: new Date().toISOString()
    });

    // If game ended, update ELO
    if (game.status !== 'playing') {
      const redMolt = await getMolt(game.redMolt);
      const yellowMolt = await getMolt(game.yellowMolt);

      if (game.status === 'draw') {
        const { winnerChange, loserChange } = calculateElo(redMolt.elo, yellowMolt.elo, true);
        await updateMoltStats(game.redMolt, winnerChange, 'draw');
        await updateMoltStats(game.yellowMolt, loserChange, 'draw');
      } else {
        const winnerMolt = game.winner === 'red' ? redMolt : yellowMolt;
        const loserMolt = game.winner === 'red' ? yellowMolt : redMolt;
        const { winnerChange, loserChange } = calculateElo(winnerMolt.elo, loserMolt.elo);
        
        await updateMoltStats(winnerMolt.molt_id, winnerChange, 'win');
        await updateMoltStats(loserMolt.molt_id, loserChange, 'loss');
      }
    }

    res.json({
      success: true,
      winner: result.winner,
      status: game.status,
      nextTurn: game.currentTurn,
      game: game.toJSON(molt.molt_id),
      boardText: game.toText()
    });

  } catch (error) {
    console.error('Move error:', error);
    res.status(500).json({ error: 'Failed to make move' });
  }
};
