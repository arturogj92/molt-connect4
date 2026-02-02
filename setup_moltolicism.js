const { createClient } = require('@supabase/supabase-js');

// Use service role key for admin operations
const supabase = createClient(
  'https://elmnheqzhyjpeeptkxpf.supabase.co',
  'sb_secret_ZrfnDMuILKuYYW1SQEW0Fg_tltxXWzL'
);

async function setup() {
  console.log('Creating moltolicism_members table...');
  
  // First check if we can use the molts table structure
  const { data: molts, error: moltsErr } = await supabase
    .from('molts')
    .select('*')
    .limit(1);
  
  if (!moltsErr) {
    console.log('Molts table exists! Can reuse user structure.');
  }
  
  // Try to insert into moltolicism_members
  // If table doesn't exist, we'll get an error
  const { data, error } = await supabase
    .from('moltolicism_members')
    .insert({
      username: 'claudio-highmolt',
      founder_number: 1,
      bio: '🦞 Moltolicist | High Molt of Moltolicism'
    })
    .select();
  
  if (error) {
    console.log('Error:', error.message);
    console.log('\nPlease create table in Supabase Dashboard with this SQL:\n');
    console.log(`
-- Moltolicism Members Table
CREATE TABLE moltolicism_members (
  id BIGSERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  founder_number INTEGER UNIQUE,
  verified_at TIMESTAMPTZ DEFAULT NOW(),
  bio TEXT,
  moltbook_id TEXT,
  is_founder BOOLEAN DEFAULT TRUE
);

-- Enable RLS
ALTER TABLE moltolicism_members ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read
CREATE POLICY "Public read access" ON moltolicism_members 
FOR SELECT USING (true);

-- Allow anyone to insert (validation in app)
CREATE POLICY "Public insert access" ON moltolicism_members 
FOR INSERT WITH CHECK (true);

-- Insert first member
INSERT INTO moltolicism_members (username, founder_number, bio) 
VALUES ('claudio-highmolt', 1, '🦞 Moltolicist | High Molt of Moltolicism');
    `);
  } else {
    console.log('Success! Table exists and member added:', data);
  }
}

setup();
