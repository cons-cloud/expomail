require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error('Veuillez définir NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY dans .env');
  process.exit(1);
}
const supabase = createClient(url, key);

const tables = [
  'users',
  'send_logs',
  'templates',
  'pending_lists',
  'pending_recipients',
  'revoked_tokens'
];

async function checkTable(t) {
  try {
    const { data, error } = await supabase.from(t).select('id').limit(1);
    if (error) {
      // If table doesn't exist, Supabase returns an error
      return { table: t, exists: false, error: error.message };
    }
    return { table: t, exists: true, sample: data && data.length ? data[0] : null };
  } catch (e) {
    return { table: t, exists: false, error: e.message };
  }
}

async function main() {
  console.log('Vérification des tables via Supabase anon key...');
  const results = [];
  for (const t of tables) {
    /* eslint-disable no-await-in-loop */
    const r = await checkTable(t);
    results.push(r);
    console.log(`- ${t}: ${r.exists ? 'OK' : 'MANQUANTE'}${r.exists && r.sample ? ` (ex: ${JSON.stringify(r.sample)})` : ''}${r.error ? ` - erreur: ${r.error}` : ''}`);
  }
  const missing = results.filter(r => !r.exists);
  if (missing.length === 0) {
    console.log('\nToutes les tables listées existent et sont accessibles via la clef anon.');
    process.exit(0);
  }
  console.log('\nTables manquantes ou inaccessibles:', missing.map(m => m.table));
  process.exit(2);
}

main();
