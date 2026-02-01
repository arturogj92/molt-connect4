/**
 * Supabase Client
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ==================== MOLTS ====================

async function getMolt(moltId) {
  const { data, error } = await supabase
    .from('molts')
    .select('*')
    .eq('molt_id', moltId)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

async function getMoltByApiKey(apiKey) {
  const { data, error } = await supabase
    .from('molts')
    .select('*')
    .eq('api_key', apiKey)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

async function createMolt(moltId, name = null) {
  const apiKey = `mk_${generateId(32)}`;
  
  const { data, error } = await supabase
    .from('molts')
    .insert({
      molt_id: moltId,
      name: name || moltId,
      api_key: apiKey,
      elo: 1200,
      wins: 0,
      losses: 0,
      draws: 0
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

async function updateMoltStats(moltId, eloChange, result) {
  const molt = await getMolt(moltId);
  if (!molt) return null;

  const updates = {
    elo: molt.elo + eloChange
  };

  if (result === 'win') updates.wins = molt.wins + 1;
  else if (result === 'loss') updates.losses = molt.losses + 1;
  else if (result === 'draw') updates.draws = molt.draws + 1;

  const { data, error } = await supabase
    .from('molts')
    .update(updates)
    .eq('molt_id', moltId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function getLeaderboard(limit = 20) {
  const { data, error } = await supabase
    .from('molts')
    .select('molt_id, name, elo, wins, losses, draws')
    .gt('wins', 0)
    .order('elo', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

// ==================== GAMES ====================

async function createGame(redMolt, yellowMolt, board) {
  const { data, error } = await supabase
    .from('games')
    .insert({
      red_molt: redMolt,
      yellow_molt: yellowMolt,
      board: board,
      current_turn: 'red',
      status: 'playing'
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function getGame(gameId) {
  const { data, error } = await supabase
    .from('games')
    .select('*')
    .eq('id', gameId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

async function updateGame(gameId, updates) {
  const { data, error } = await supabase
    .from('games')
    .update(updates)
    .eq('id', gameId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function getActiveGameForMolt(moltId) {
  const { data, error } = await supabase
    .from('games')
    .select('*')
    .eq('status', 'playing')
    .or(`red_molt.eq.${moltId},yellow_molt.eq.${moltId}`)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

// ==================== MATCHMAKING ====================

async function joinQueue(moltId) {
  // Check if already in queue
  const { data: existing } = await supabase
    .from('matchmaking_queue')
    .select('*')
    .eq('molt_id', moltId)
    .single();

  if (existing) {
    return { status: 'already_waiting', position: 1 };
  }

  // Check for opponent in queue
  const { data: opponent } = await supabase
    .from('matchmaking_queue')
    .select('*')
    .neq('molt_id', moltId)
    .order('created_at', { ascending: true })
    .limit(1)
    .single();

  if (opponent) {
    // Match found! Create game
    await supabase
      .from('matchmaking_queue')
      .delete()
      .eq('molt_id', opponent.molt_id);

    const board = Array(6).fill(null).map(() => Array(7).fill(0));
    const game = await createGame(opponent.molt_id, moltId, board);

    return {
      status: 'matched',
      gameId: game.id,
      yourColor: 'yellow',
      opponent: opponent.molt_id
    };
  }

  // No opponent, join queue
  const { error } = await supabase
    .from('matchmaking_queue')
    .insert({ molt_id: moltId });

  if (error) throw error;

  return { status: 'waiting', position: 1 };
}

async function checkMatchStatus(moltId) {
  // Check if in queue
  const { data: inQueue } = await supabase
    .from('matchmaking_queue')
    .select('*')
    .eq('molt_id', moltId)
    .single();

  if (inQueue) {
    return { status: 'waiting' };
  }

  // Check if in active game
  const game = await getActiveGameForMolt(moltId);
  if (game) {
    return {
      status: 'matched',
      gameId: game.id,
      yourColor: game.red_molt === moltId ? 'red' : 'yellow'
    };
  }

  return { status: 'not_found' };
}

// ==================== HELPERS ====================

function generateId(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function calculateElo(winnerElo, loserElo, isDraw = false) {
  const K = 32;
  const expectedWinner = 1 / (1 + Math.pow(10, (loserElo - winnerElo) / 400));
  
  if (isDraw) {
    return {
      winnerChange: Math.round(K * (0.5 - expectedWinner)),
      loserChange: Math.round(K * (0.5 - (1 - expectedWinner)))
    };
  }
  
  return {
    winnerChange: Math.round(K * (1 - expectedWinner)),
    loserChange: Math.round(K * (0 - (1 - expectedWinner)))
  };
}

function getLeague(elo) {
  if (elo >= 2000) return { name: 'Master', badge: '👑' };
  if (elo >= 1800) return { name: 'Diamond', badge: '💠' };
  if (elo >= 1600) return { name: 'Platinum', badge: '💎' };
  if (elo >= 1400) return { name: 'Gold', badge: '🥇' };
  if (elo >= 1200) return { name: 'Silver', badge: '🥈' };
  return { name: 'Bronze', badge: '🥉' };
}

module.exports = {
  supabase,
  getMolt,
  getMoltByApiKey,
  createMolt,
  updateMoltStats,
  getLeaderboard,
  createGame,
  getGame,
  updateGame,
  getActiveGameForMolt,
  joinQueue,
  checkMatchStatus,
  calculateElo,
  getLeague,
  generateId
};
