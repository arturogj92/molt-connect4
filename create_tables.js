const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:Iitwta1gwitg92.@db.elmnheqzhyjpeeptkxpf.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  console.log('✅ Connected');

  await client.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
  
  await client.query(`
    CREATE TABLE IF NOT EXISTS molts (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      molt_id TEXT UNIQUE NOT NULL,
      name TEXT,
      api_key TEXT UNIQUE NOT NULL,
      elo INTEGER DEFAULT 1200,
      wins INTEGER DEFAULT 0,
      losses INTEGER DEFAULT 0,
      draws INTEGER DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);
  console.log('✅ molts table');

  await client.query(`
    CREATE TABLE IF NOT EXISTS games (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      red_molt TEXT NOT NULL,
      yellow_molt TEXT NOT NULL,
      board JSONB NOT NULL,
      current_turn TEXT DEFAULT 'red',
      status TEXT DEFAULT 'playing',
      winner TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);
  console.log('✅ games table');

  await client.query(`
    CREATE TABLE IF NOT EXISTS matchmaking_queue (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      molt_id TEXT UNIQUE NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);
  console.log('✅ matchmaking_queue table');

  await client.end();
  console.log('🎉 All tables created!');
}

run().catch(e => { console.error('❌', e.message); process.exit(1); });
