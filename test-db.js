require('dotenv').config();

const { Client } = require('pg');

async function testConnection() {
    const client = new Client({ 
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('Tentative de connexion à la base de données...');
        await client.connect();
        
        console.log('Connexion établie, test d\'une requête simple...');
        const result = await client.query('SELECT NOW()');
        
        console.log('✅ Connexion à la base de données réussie');
        console.log('Timestamp du serveur:', result.rows[0].now);
        
        await client.end();
    } catch (err) {
        console.error('❌ Erreur de connexion:', err.message);
        process.exit(1);
    }
}

testConnection();