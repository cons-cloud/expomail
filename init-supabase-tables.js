require('dotenv').config();
const { getSupabase } = require('./supabase');

async function createTables() {
    try {
        const supabase = getSupabase();
        
        // Créer la table des emails si elle n'existe pas
        const { error: emailsError } = await supabase.rpc('execute_sql', {
            sql: `
                CREATE TABLE IF NOT EXISTS emails (
                    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
                    email TEXT UNIQUE NOT NULL,
                    category TEXT NOT NULL,
                    status TEXT DEFAULT 'pending',
                    metadata JSONB,
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    updated_at TIMESTAMPTZ DEFAULT NOW()
                );
            `
        });
        if (emailsError) throw emailsError;
        console.log('✅ Table emails créée');
        
        // Créer la table des stats
        const { error: statsError } = await supabase.rpc('create_table_if_not_exists', {
            table_name: 'stats',
            schema: `
                id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
                category TEXT NOT NULL,
                total_emails INTEGER DEFAULT 0,
                valid_emails INTEGER DEFAULT 0,
                last_updated TIMESTAMPTZ DEFAULT NOW()
            `
        });
        
        if (statsError) throw statsError;
        console.log('✅ Table stats créée');
        
        // Créer la table des logs
        const { error: logsError } = await supabase.rpc('create_table_if_not_exists', {
            table_name: 'logs',
            schema: `
                id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
                event_type TEXT NOT NULL,
                details JSONB,
                created_at TIMESTAMPTZ DEFAULT NOW()
            `
        });
        
        if (logsError) throw logsError;
        console.log('✅ Table logs créée');
        
        // Créer la table des utilisateurs
        const { error: usersError } = await supabase.rpc('create_table_if_not_exists', {
            table_name: 'users',
            schema: `
                id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                role TEXT DEFAULT 'user',
                settings JSONB DEFAULT '{}',
                created_at TIMESTAMPTZ DEFAULT NOW(),
                last_login TIMESTAMPTZ
            `
        });
        
        if (usersError) throw usersError;
        console.log('✅ Table users créée');
        
        console.log('✅ Toutes les tables ont été créées avec succès');
        
    } catch (error) {
        console.error('❌ Erreur lors de la création des tables:', error.message);
        process.exit(1);
    }
}

createTables();