require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function testSupabase() {
    console.log('Initialisation de Supabase...');
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    try {
        console.log('Test de la connexion Supabase...');
        const { data, error } = await supabase
            .from('users')
            .select('id')
            .limit(1);

        if (error) throw error;

        console.log('✅ Connexion Supabase réussie !');
        console.log('Données reçues:', data);
    } catch (err) {
        console.error('❌ Erreur Supabase:', err.message);
        process.exit(1);
    }
}

testSupabase();