require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function run() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing SUPABASE URL or KEY in environment');
      process.exit(1);
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Total emails count
    const { data: totalData, error: totalError, count: totalCount } = await supabase
      .from('emails')
      .select('id', { count: 'exact', head: false });

    if (totalError) throw totalError;

    // Count for mairies
    const { data: mairieData, error: mairieError, count: mairieCount } = await supabase
      .from('emails')
      .select('id,email,name,city,source,sent,created_at', { count: 'exact' })
      .eq('category', 'mairies')
      .limit(10)
      .order('created_at', { ascending: false });

    if (mairieError) throw mairieError;

    console.log('✅ Vérification Supabase des emails');
    console.log(`• Total emails dans la table: ${totalCount ?? (totalData && totalData.length) ?? 'inconnu'}`);
    console.log(`• Emails pour la catégorie 'mairies': ${mairieCount ?? (mairieData && mairieData.length) ?? 0}`);
    console.log('\nExemples (dernier ajout) :');
    if (mairieData && mairieData.length) {
      mairieData.forEach((r, i) => {
        console.log(`${i + 1}. ${r.email} | ${r.name || '—'} | ${r.city || '—'} | sent:${r.sent} | source:${r.source || '—'}`);
      });
    } else {
      console.log('Aucun résultat pour la catégorie mairies (en mémoire seulement peut-être).');
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Erreur:', err.message || err);
    process.exit(1);
  }
}

run();
