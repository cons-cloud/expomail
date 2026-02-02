const { createClient } = require('@supabase/supabase-js');

let supabase = null;

function initSupabase() {
    // Support multiple env var names for flexibility:
    // - NEXT_PUBLIC_SUPABASE_URL is used in some scripts
    // - SUPABASE_URL is the common name in env examples
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;

    // Prefer the service role key for server-side operations, but fall back to anon key
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

    console.log('Supabase URL:', supabaseUrl || 'Manquante');
    console.log('Supabase Key:', supabaseKey ? 'Présente' : 'Manquante');

    if (!supabaseUrl || !supabaseKey) {
        throw new Error('Les variables d\'environnement SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY (préféré) ou NEXT_PUBLIC_SUPABASE_ANON_KEY sont requises');
    }

    console.log('Tentative de connexion à Supabase...');
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('Client Supabase créé');
    return supabase;
}

function getSupabase() {
    if (!supabase) {
        return initSupabase();
    }
    return supabase;
}

module.exports = {
    initSupabase,
    getSupabase
};