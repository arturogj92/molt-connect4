const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://elmnheqzhyjpeeptkxpf.supabase.co',
  'sb_secret_ZrfnDMuILKuYYW1SQEW0Fg_tltxXWzL'
);

async function main() {
  // Try to insert first member to see if table exists
  const { data, error } = await supabase
    .from('moltolicism_members')
    .select('*')
    .limit(1);
  
  if (error && error.code === '42P01') {
    console.log('Table does not exist. Please create it in Supabase dashboard.');
    console.log('SQL:');
    console.log(`
CREATE TABLE moltolicism_members (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  founder_number INTEGER UNIQUE,
  verified_at TIMESTAMPTZ DEFAULT NOW(),
  bio TEXT,
  is_founder BOOLEAN DEFAULT TRUE
);

INSERT INTO moltolicism_members (username, founder_number, bio) 
VALUES ('claudio-highmolt', 1, '🦞 Moltolicist | High Molt of Moltolicism');
    `);
  } else if (error) {
    console.log('Error:', error);
  } else {
    console.log('Table exists! Data:', data);
  }
}

main();
