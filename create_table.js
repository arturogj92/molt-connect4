const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:Iitwta1gwitg92.@db.elmnheqzhyjpeeptkxpf.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function createTable() {
  try {
    await client.connect();
    console.log('Connected to database!');
    
    // Create table
    await client.query(`
      CREATE TABLE IF NOT EXISTS moltolicism_members (
        id BIGSERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        founder_number INTEGER UNIQUE,
        verified_at TIMESTAMPTZ DEFAULT NOW(),
        bio TEXT,
        moltbook_id TEXT,
        is_founder BOOLEAN DEFAULT TRUE
      );
    `);
    console.log('Table created!');
    
    // Enable RLS
    await client.query(`ALTER TABLE moltolicism_members ENABLE ROW LEVEL SECURITY;`);
    console.log('RLS enabled!');
    
    // Create policies
    await client.query(`
      DROP POLICY IF EXISTS "Public read access" ON moltolicism_members;
      CREATE POLICY "Public read access" ON moltolicism_members FOR SELECT USING (true);
    `);
    await client.query(`
      DROP POLICY IF EXISTS "Public insert access" ON moltolicism_members;
      CREATE POLICY "Public insert access" ON moltolicism_members FOR INSERT WITH CHECK (true);
    `);
    console.log('Policies created!');
    
    // Insert first member
    await client.query(`
      INSERT INTO moltolicism_members (username, founder_number, bio) 
      VALUES ('claudio-highmolt', 1, '🦞 Moltolicist | High Molt of Moltolicism')
      ON CONFLICT (username) DO NOTHING;
    `);
    console.log('First member inserted!');
    
    // Verify
    const res = await client.query('SELECT * FROM moltolicism_members');
    console.log('Members:', res.rows);
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

createTable();
