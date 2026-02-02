const path = require('path');
const fs = require('fs');
const { Client } = require('pg');
const DATABASE_URL = process.env.DATABASE_URL;

async function testConnection() {
    console.log('Test de connexion à PostgreSQL...');
    if (DATABASE_URL) {
        console.log('Configuration de la connexion...');
        const client = new Client({ 
            connectionString: DATABASE_URL,
            ssl: {
                rejectUnauthorized: false
            }
        });
        try {
            console.log('Tentative de connexion...');
            await client.connect();
            console.log('Connexion réussie, test de requête...');
            await client.query('SELECT NOW()');
            console.log('Requête réussie');
            await client.end();
            return true;
        } catch (e) {
            console.error('Erreur détaillée:', e);
            throw new Error(`Erreur de connexion à la base de données: ${e.message}`);
        }
    }
    return true;
}

if (DATABASE_URL) {
    let client = null;

    async function ensureClient() {
        if (client) return client;
        client = new Client({ 
            connectionString: DATABASE_URL,
            ssl: {
                rejectUnauthorized: false
            }
        });
        await client.connect();

        try {
            await client.query(`
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    email TEXT UNIQUE NOT NULL,
                    password_hash TEXT NOT NULL,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
                    quota_hour INTEGER NOT NULL DEFAULT 100,
                    is_admin BOOLEAN NOT NULL DEFAULT false
                );

                CREATE TABLE IF NOT EXISTS send_logs (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id),
                    recipient_email TEXT,
                    success BOOLEAN,
                    message_id TEXT,
                    error TEXT,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
                );

                CREATE TABLE IF NOT EXISTS templates (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    from_email TEXT,
                    sujet TEXT,
                    message TEXT,
                    UNIQUE(user_id)
                );

                CREATE TABLE IF NOT EXISTS pending_lists (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    mode TEXT,
                    name TEXT,
                    sent BOOLEAN DEFAULT false,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
                    sent_at TIMESTAMP WITH TIME ZONE
                );

                CREATE TABLE IF NOT EXISTS pending_recipients (
                    id SERIAL PRIMARY KEY,
                    list_id INTEGER REFERENCES pending_lists(id) ON DELETE CASCADE,
                    email TEXT,
                    phone TEXT,
                    address TEXT,
                    source TEXT,
                    name TEXT,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
                );

                CREATE TABLE IF NOT EXISTS revoked_tokens (
                    token TEXT PRIMARY KEY,
                    expires_at TIMESTAMP WITH TIME ZONE
                );
            `);
        } catch (e) {
            console.warn('Warning: failed to initialize Postgres DB schema:', e.message);
        }

        return client;
    }

    async function runQuery(text, params) {
        try {
            const c = await ensureClient();
            return await c.query(text, params);
        } catch (err) {
            console.warn('Postgres query error, attempting reconnect:', err.message);
            try {
                if (client) {
                    try { await client.end(); } catch (e) { }
                    client = null;
                }
                const c2 = await ensureClient();
                return await c2.query(text, params);
            } catch (e2) {
                console.error('Postgres persistent error:', e2.message);
                throw e2;
            }
        }
    }

    module.exports = {
        testConnection,
        query: runQuery,
        createUser: async (email, passwordHash) => {
            const r = await runQuery('INSERT INTO users (email, password_hash) VALUES ($1,$2) RETURNING id', [email, passwordHash]);
            return r.rows[0].id;
        },
        getUserByEmail: async (email) => {
            const r = await runQuery('SELECT * FROM users WHERE email = $1', [email]);
            return r.rows[0];
        },
        getUserById: async (id) => {
            const r = await runQuery('SELECT * FROM users WHERE id = $1', [id]);
            return r.rows[0];
        },
        addLog: async (userId, recipientEmail, success, messageId, error) => {
            await runQuery('INSERT INTO send_logs (user_id, recipient_email, success, message_id, error) VALUES ($1,$2,$3,$4,$5)', 
                [userId, recipientEmail, success, messageId, error]);
        },
        countSendsLastHour: async (userId) => {
            const r = await runQuery("SELECT COUNT(*) as c FROM send_logs WHERE user_id = $1 AND created_at >= now() - interval '1 hour'", [userId]);
            return parseInt(r.rows[0].c, 10) || 0;
        },
        saveTemplate: async (userId, fromEmail, sujet, message) => {
            await runQuery(`
                INSERT INTO templates (user_id, from_email, sujet, message) 
                VALUES ($1,$2,$3,$4)
                ON CONFLICT (user_id) 
                DO UPDATE SET 
                    from_email = EXCLUDED.from_email, 
                    sujet = EXCLUDED.sujet, 
                    message = EXCLUDED.message
            `, [userId, fromEmail, sujet, message]);
        },
        getTemplate: async (userId) => {
            const r = await runQuery('SELECT * FROM templates WHERE user_id = $1', [userId]);
            return r.rows[0];
        },
        createPendingList: async (userId, mode, name) => {
            const r = await runQuery('INSERT INTO pending_lists (user_id, mode, name) VALUES ($1,$2,$3) RETURNING id', 
                [userId, mode, name || null]);
            return r.rows[0].id;
        },
        addPendingRecipient: async (listId, email, phone, address, source, name) => {
            await runQuery('INSERT INTO pending_recipients (list_id, email, phone, address, source, name) VALUES ($1,$2,$3,$4,$5,$6)',
                [listId, email, phone, address, source, name]);
        },
        getPendingListsForUser: async (userId) => {
            const r = await runQuery('SELECT * FROM pending_lists WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
            return r.rows;
        },
        getRecipientsForList: async (listId) => {
            const r = await runQuery('SELECT * FROM pending_recipients WHERE list_id = $1', [listId]);
            return r.rows;
        },
        markListSent: async (listId) => {
            await runQuery('UPDATE pending_lists SET sent = true, sent_at = now() WHERE id = $1', [listId]);
        },
        setAdmin: async (userId) => {
            await runQuery('UPDATE users SET is_admin = true WHERE id = $1', [userId]);
        },
        addRevokedToken: async (token, expiresAt) => {
            try {
                await runQuery('INSERT INTO revoked_tokens (token, expires_at) VALUES ($1, $2) ON CONFLICT (token) DO NOTHING',
                    [token, expiresAt]);
            } catch (e) { /* ignore */ }
        },
        isTokenRevoked: async (token) => {
            const r = await runQuery('SELECT 1 FROM revoked_tokens WHERE token = $1 LIMIT 1', [token]);
            return r.rows.length > 0;
        }
    };
} else {
    const DB_FILE = path.join(__dirname, 'data', 'db.json');
    
    if (!fs.existsSync(path.dirname(DB_FILE))) {
        fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
    }
    
    if (!fs.existsSync(DB_FILE)) {
        fs.writeFileSync(DB_FILE, '{}');
    }

    module.exports = {
        testConnection,
        query: async () => ({ rows: [] }),
        createUser: async () => null,
        getUserByEmail: async () => null,
        getUserById: async () => null,
        addLog: async () => null,
        countSendsLastHour: async () => 0,
        saveTemplate: async () => null,
        getTemplate: async () => null,
        createPendingList: async () => null,
        addPendingRecipient: async () => null,
        getPendingListsForUser: async () => [],
        getRecipientsForList: async () => [],
        markListSent: async () => null,
        setAdmin: async () => null,
        addRevokedToken: async () => null,
        isTokenRevoked: async () => false
    };
}