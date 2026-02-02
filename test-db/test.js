const { Client } = require('pg');

async function testConnection() {
    const client = new Client({
        host: 'db.supabase.co',
        port: 5432,
        database: 'postgres',
        user: 'postgres',
        password: 'votre_nouveau_mot_de_passe',
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();
        console.log('Connexion réussie à la base de données !');
        
        // Test simple query
        const result = await client.query('SELECT NOW()');
        console.log('Résultat du test :', result.rows[0]);
        
        await client.end();
    } catch (err) {
        console.error('Erreur de connexion :', err);
    }
}

testConnection();