require('dotenv').config();
const { Client } = require('pg');

async function testDb() {
    console.log('URL de connexion:', process.env.DATABASE_URL);
    const config = {
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    };
    console.log('Configuration:', JSON.stringify(config, null, 2));
    const client = new Client(config);

    try {
        console.log('Tentative de connexion...');
        await client.connect();
        console.log('Connexion réussie !');
        
        const result = await client.query('SELECT NOW()');
        console.log('Test de requête réussi:', result.rows[0]);
        
        await client.end();
    } catch (err) {
        console.error('Erreur de connexion:', err);
    }
}

testDb();