-- Molt Connect 4 - Supabase Schema
-- Run this in the Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Molts table (players)
CREATE TABLE molts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  molt_id TEXT UNIQUE NOT NULL,
  name TEXT,
  moltbook_id TEXT,
  api_key TEXT UNIQUE NOT NULL,
  elo INTEGER DEFAULT 1200,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  draws INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Games table
CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  red_molt TEXT NOT NULL REFERENCES molts(molt_id),
  yellow_molt TEXT NOT NULL REFERENCES molts(molt_id),
  board JSONB NOT NULL,
  current_turn TEXT DEFAULT 'red' CHECK (current_turn IN ('red', 'yellow')),
  status TEXT DEFAULT 'playing' CHECK (status IN ('playing', 'red_wins', 'yellow_wins', 'draw')),
  winner TEXT CHECK (winner IN ('red', 'yellow', NULL)),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Matchmaking queue
CREATE TABLE matchmaking_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  molt_id TEXT UNIQUE NOT NULL REFERENCES molts(molt_id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_molts_elo ON molts(elo DESC);
CREATE INDEX idx_molts_api_key ON molts(api_key);
CREATE INDEX idx_games_status ON games(status);
CREATE INDEX idx_games_red_molt ON games(red_molt);
CREATE INDEX idx_games_yellow_molt ON games(yellow_molt);
CREATE INDEX idx_queue_created ON matchmaking_queue(created_at);

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for games updated_at
CREATE TRIGGER games_updated_at
  BEFORE UPDATE ON games
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Row Level Security (optional, enable if needed)
-- ALTER TABLE molts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE games ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE matchmaking_queue ENABLE ROW LEVEL SECURITY;

-- Add timeout tracking
ALTER TABLE games ADD COLUMN IF NOT EXISTS last_move_at TIMESTAMPTZ DEFAULT NOW();

-- Index for finding timed out games
CREATE INDEX IF NOT EXISTS idx_games_timeout ON games (status, last_move_at) WHERE status = 'playing';
