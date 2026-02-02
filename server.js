// Load .env in development
try { require('dotenv').config(); } catch (e) { }
const express = require('express');
const nodemailer = require('nodemailer');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const { createRemoteJWKSet, jwtVerify } = (() => { try { return require('jose'); } catch (e) { return {}; } })();
const rateLimit = require('express-rate-limit');

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const db = require('./db');

const app = express();
const server = require('http').createServer(app);
const WebSocket = require('ws');

const wss = new WebSocket.Server({ 
    server,
    path: '/ws'
});

wss.on('connection', (ws) => {
    console.log('Client WebSocket connecté');
    
    ws.on('close', () => {
        console.log('Client WebSocket déconnecté');
    });
});

const PORT = process.env.PORT || 3000;

let sendgrid = null;
if (process.env.SENDGRID_API_KEY) {
    sendgrid = require('@sendgrid/mail');
    sendgrid.setApiKey(process.env.SENDGRID_API_KEY);
}

const MAX_RECIPIENTS = parseInt(process.env.MAX_RECIPIENTS || '100000', 10);

// Security Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://cdn.jsdelivr.net', 'https://unpkg.com'],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://cdnjs.cloudflare.com", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "ws:", "wss:", "http://localhost:*", "https://localhost:*", "https://*.supabase.co"],
            scriptSrcElem: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://unpkg.com"],
            styleSrcElem: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"]
        }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Middleware setup
app.use(cors({
    origin: (process.env.ALLOWED_ORIGINS && process.env.ALLOWED_ORIGINS !== '') 
        ? process.env.ALLOWED_ORIGINS.split(',') 
        : (process.env.NODE_ENV === 'production' ? false : '*'),
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
}));

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public', {
    maxAge: '1d',
    etag: true,
}));

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: '1d',
    etag: true,
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.',
    standardHeaders: true,
    legacyHeaders: false,
});

const emailLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 heure
    max: 50,
    message: 'Limite d\'envoi d\'emails atteinte, veuillez réessayer plus tard.',
});

app.use(limiter);

// Health check pour Railway
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// Route de diagnostic
app.get('/api/status', async (req, res) => {
    try {
        const status = {
            database: false,
            smtp: false,
            errors: []
        };

        // Vérifier la base de données
        try {
            const dbModule = require('./db');
            await dbModule.testConnection();
            status.database = true;
        } catch (e) {
            status.errors.push(`Database: ${e.message}`);
        }

        // Vérifier SMTP
        try {
            const nodemailer = require('nodemailer');
            const transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: process.env.SMTP_PORT,
                secure: process.env.SMTP_SECURE === 'true',
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                }
            });
            await transporter.verify();
            status.smtp = true;
        } catch (e) {
            status.errors.push(`SMTP: ${e.message}`);
        }

        res.json(status);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Route principale
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'app.html'));
});

// Helper: ensure a dedicated API user exists when using API_KEY (for list storage)
async function ensureApiUser() {
    const apiEmail = process.env.API_USER_EMAIL || 'api@local';
    try {
        let u = await db.getUserByEmail(apiEmail);
        if (!u) {
            const hash = await bcrypt.hash(process.env.API_USER_PASS || 'api-local-pass', 10);
            const id = await db.createUser(apiEmail, hash);
            try { await db.setAdmin(id); } catch (e) { }
            u = { id, email: apiEmail };
        }
        return u.id;
    } catch (e) {
        return null;
    }
}

// Helper: générer le contenu CSV d'une liste
async function generateListCSV(listId) {
    const recipients = await db.getRecipientsForList(listId);
    const csvRows = recipients.map(r => {
        return [
            r.email || '',
            r.phone || '',
            r.address || '',
            r.nom || '',
            r.source || ''
        ].map(field => `"${(field || '').toString().replace(/"/g, '""')}"`).join(',');
    });
    const headers = ['Email', 'Téléphone', 'Adresse', 'Nom', 'Source'].map(h => `"${h}"`).join(',');
    return [headers, ...csvRows].join('\n');
}

// La configuration de sécurité Helmet est déjà faite au-dessus

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));

app.use(limiter);
app.use(cors({
    origin: (process.env.ALLOWED_ORIGINS && process.env.ALLOWED_ORIGINS !== '') ? process.env.ALLOWED_ORIGINS.split(',') : (process.env.NODE_ENV === 'production' ? false : '*'),
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
}));
app.use(express.json({ limit: '10mb' }));
// Accès direct à l'interface principale sans authentification
app.use(async (req, res, next) => {
    // Accès autorisé sans authentification
    if (req.path === '/' || req.path === '/index.html') {
        return next();
    }
    next();
});

app.use(express.static('public', {
    maxAge: '1d',
    etag: true,
}));

// Minimal config endpoint to expose Supabase config to frontend
// Endpoint de santé pour vérifier la connexion
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});

app.get('/config', (req, res) => {
    res.json({
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || null,
        supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || null
    });
});

// Route principale
// Middleware to protect web pages
async function requireSiteAuth(req, res, next) {
    // Check cookie first
    const token = req.cookies && req.cookies.hyperemail_token;
    const authHeader = req.headers.authorization || '';
    let t = token || (authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null);
    if (!t) return res.redirect('/login');
    // Accept either local JWT or Supabase JWT (if configured)
    try {
        let payload = null;
        const isSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_JWT_AUD;
        if (isSupabase && createRemoteJWKSet) {
            // try Supabase verification first
            const url = new URL('/auth/v1/keys', process.env.NEXT_PUBLIC_SUPABASE_URL);
            const JWKS = createRemoteJWKSet(url);
            try {
                const { payload: p } = await jwtVerify(t, JWKS, { audience: process.env.SUPABASE_JWT_AUD });
                payload = { sub: p.sub, email: p.email };
            } catch (e) {
                // fallback to Supabase shared secret if provided
                if (process.env.SUPABASE_JWT_SECRET) {
                    try {
                        const p2 = jwt.verify(t, process.env.SUPABASE_JWT_SECRET);
                        payload = { sub: p2.sub, email: p2.email };
                    } catch (e2) {
                        // final fallback to local JWT
                        payload = jwt.verify(t, process.env.JWT_SECRET || 'change-me');
                    }
                } else {
                    // final fallback to local JWT
                    payload = jwt.verify(t, process.env.JWT_SECRET || 'change-me');
                }
            }
        } else {
            // If Supabase shared secret available, try it first
            if (isSupabase && process.env.SUPABASE_JWT_SECRET) {
                try {
                    const p2 = jwt.verify(t, process.env.SUPABASE_JWT_SECRET);
                    payload = { sub: p2.sub, email: p2.email };
                } catch (e2) {
                    payload = jwt.verify(t, process.env.JWT_SECRET || 'change-me');
                }
            } else {
                payload = jwt.verify(t, process.env.JWT_SECRET || 'change-me');
            }
        }
        // Enforce single allowed email if configured
        const allowed = process.env.ALLOWED_EMAIL && process.env.ALLOWED_EMAIL.trim();
        if (allowed && payload && payload.email && String(payload.email).toLowerCase() !== String(allowed).toLowerCase()) {
            return res.redirect('/login');
        }
        // check if token revoked
        (async () => {
            try {
                const revoked = await db.isTokenRevoked(t);
                if (revoked) return res.redirect('/login');
                req.user = payload;
                return next();
            } catch (e) {
                return res.redirect('/login');
            }
        })();
    } catch (err) {
        return res.redirect('/login');
    }
}

// Logout: revoke token server-side and clear cookie
app.post('/auth/logout', async (req, res) => {
    const authHeader = req.headers.authorization || '';
    const token = (authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null) || (req.cookies && req.cookies.hyperemail_token);
    if (!token) return res.json({ success: true });
    try {
        const payload = jwt.decode(token);
        const exp = payload && payload.exp ? new Date(payload.exp * 1000) : new Date(Date.now() + 24 * 3600 * 1000);
        await db.addRevokedToken(token, exp);
        res.clearCookie('hyperemail_token');
        return res.json({ success: true });
    } catch (e) {
        res.clearCookie('hyperemail_token');
        return res.json({ success: true });
    }
});

app.get('/', async (req, res, next) => {
    // Accès direct à l'interface principale sans authentification
    return res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
// Redirection de la page login vers la page principale
// Route for login page
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// API login endpoint
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ success: false, error: 'Email et mot de passe requis' });
    }

    try {
        // Check Supabase first if configured
        if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
            // Implement Supabase auth here if needed
        }

        // Fallback to local auth
        const user = await db.getUserByEmail(email);
        if (!user) {
            return res.status(401).json({ success: false, error: 'Utilisateur inconnu' });
        }

        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) {
            return res.status(401).json({ success: false, error: 'Mot de passe incorrect' });
        }

        const token = jwt.sign(
            { sub: user.id, email: user.email },
            process.env.JWT_SECRET || 'change-me',
            { expiresIn: '8h' }
        );

        // Set cookie for browser clients
        res.cookie('hyperemail_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Lax',
            maxAge: 8 * 60 * 60 * 1000 // 8 hours
        });

        return res.json({
            success: true,
            token,
            user: {
                id: user.id,
                email: user.email,
                is_admin: user.is_admin === 1
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({
            success: false,
            error: 'Erreur lors de la connexion'
        });
    }
});

// Auth endpoints
app.post('/auth/register', async (req, res) => {
    // Registration disabled. Only the preconfigured admin account can be used.
    return res.status(403).json({ success: false, error: 'Inscription désactivée' });
});

app.post('/auth/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, error: 'Email et mot de passe requis' });
    // Enforce allowed email if configured
    const allowed = process.env.ALLOWED_EMAIL && process.env.ALLOWED_EMAIL.trim();
    if (allowed && String(email).toLowerCase() !== String(allowed).toLowerCase()) {
        return res.status(403).json({ success: false, error: 'Accès non autorisé' });
    }
    const user = await db.getUserByEmail(email);
    if (!user) return res.status(400).json({ success: false, error: 'Utilisateur inconnu' });
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ success: false, error: 'Mot de passe incorrect' });
    const token = jwt.sign({ sub: user.id, email: user.email }, process.env.JWT_SECRET || 'change-me', { expiresIn: '8h' });
    res.json({ success: true, token });
});

// Return information about the authenticated user
app.get('/auth/me', async (req, res) => {
    const authHeader = req.headers.authorization || '';
    const cookieToken = req.cookies && req.cookies.hyperemail_token;
    const tokenToUse = (authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null) || cookieToken;
    if (!tokenToUse) return res.status(401).json({ success: false, error: 'Token manquant' });
    const isSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_JWT_AUD && createRemoteJWKSet;
    if (isSupabase && createRemoteJWKSet) {
        try {
            const url = new URL('/auth/v1/keys', process.env.NEXT_PUBLIC_SUPABASE_URL);
            const JWKS = createRemoteJWKSet(url);
            const { payload } = await jwtVerify(tokenToUse, JWKS, { audience: process.env.SUPABASE_JWT_AUD });
            // For Supabase users, return minimal profile without requiring local DB user
            return res.json({ success: true, user: { id: payload.sub, email: payload.email || null, is_admin: false, quota_hour: 100 } });
        } catch (e) {
            // fallback to Supabase shared secret if provided
            if (process.env.SUPABASE_SERVICE_KEY) {
                try {
                    const p2 = jwt.verify(tokenToUse, process.env.SUPABASE_SERVICE_KEY);
                    return res.json({ success: true, user: { id: p2.sub, email: p2.email || null, is_admin: false, quota_hour: 100 } });
                } catch (e2) {
                    // fallthrough to local JWT
                }
            }
        }
    }

    // Si pas de Supabase ou échec de l'auth Supabase, on essaie l'auth locale
    try {
        const payload = jwt.verify(tokenToUse, process.env.JWT_SECRET || 'change-me');
        const user = await db.getUserById(payload.sub);
        if (!user) return res.status(404).json({ success: false, error: 'Utilisateur non trouvé' });
        const isAdmin = (user.is_admin === 1 || user.is_admin === true || user.is_admin === '1');
        return res.json({ success: true, user: { id: user.id, email: user.email, is_admin: !!isAdmin, quota_hour: user.quota_hour } });
    } catch (err) {
        return res.status(401).json({ success: false, error: 'Token invalide' });
    }
});

// Serve admin UI (protected)
app.get('/admin', requireSiteAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Middleware: require admin
async function requireAdmin(req, res, next) {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) return res.status(401).json({ success: false, error: 'Admin token requis' });
    const token = authHeader.split(' ')[1];
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET || 'change-me');
        const user = await db.getUserById(payload.sub);
        if (!user || !user.is_admin) return res.status(403).json({ success: false, error: 'Accès refusé' });
        req.user = user;
        next();
    } catch (err) {
        return res.status(401).json({ success: false, error: 'Token invalide' });
    }
}

// Admin routes
app.get('/admin/users', requireAdmin, async (req, res) => {
    // Simple query - for Postgres this should be implemented via db module, here do a quick retrieval
    if (process.env.DATABASE_URL) {
        const { Client } = require('pg');
        const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
        await client.connect();
        const r = await client.query('SELECT id, email, quota_hour, is_admin, created_at FROM users ORDER BY id DESC');
        await client.end();
        return res.json({ success: true, users: r.rows });
    } else {
        const localDb = require('better-sqlite3')(require('path').join(__dirname, 'data', 'hyperemail.db'));
        const rows = localDb.prepare('SELECT id, email, quota_hour, is_admin, created_at FROM users ORDER BY id DESC').all();
        return res.json({ success: true, users: rows });
    }
});

app.get('/admin/logs', requireAdmin, async (req, res) => {
    if (process.env.DATABASE_URL) {
        const { Client } = require('pg');
        const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
        await client.connect();
        const r = await client.query('SELECT * FROM send_logs ORDER BY created_at DESC LIMIT 500');
        await client.end();
        return res.json({ success: true, logs: r.rows });
    } else {
        const localDb = require('better-sqlite3')(require('path').join(__dirname, 'data', 'hyperemail.db'));
        const rows = localDb.prepare('SELECT * FROM send_logs ORDER BY created_at DESC LIMIT 500').all();
        return res.json({ success: true, logs: rows });
    }
});

app.post('/admin/user/:id/quota', requireAdmin, async (req, res) => {
    const userId = parseInt(req.params.id, 10);
    const { quota } = req.body;
    if (!Number.isInteger(quota) || quota < 0) return res.status(400).json({ success: false, error: 'Quota invalide' });
    if (process.env.DATABASE_URL) {
        const { Client } = require('pg');
        const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
        await client.connect();
        await client.query('UPDATE users SET quota_hour = $1 WHERE id = $2', [quota, userId]);
        await client.end();
    } else {
        const localDb = require('better-sqlite3')(require('path').join(__dirname, 'data', 'hyperemail.db'));
        localDb.prepare('UPDATE users SET quota_hour = ? WHERE id = ?').run(quota, userId);
    }
    res.json({ success: true });
});

// API pour envoyer un email
app.post('/api/send-email', emailLimiter, async (req, res) => {
    const { config, emailData } = req.body;
    
    // Validation des données
    if (!config || !emailData) {
        return res.status(400).json({
            success: false,
            error: 'Configuration ou données email manquantes'
        });
    }
    
    if (!config.emailUser || !config.emailPass || !config.smtpHost) {
        return res.status(400).json({
            success: false,
            error: 'Configuration email incomplète'
        });
    }
    
    if (!emailData.email || !emailData.sujet || !emailData.message) {
        return res.status(400).json({
            success: false,
            error: 'Données email incomplètes'
        });
    }
    
    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailData.email)) {
        return res.status(400).json({
            success: false,
            error: 'Adresse email invalide'
        });
    }
    
    try {
        // Créer le transporteur
        const transporter = nodemailer.createTransport({
            host: config.smtpHost,
            port: 587,
            secure: false,
            auth: {
                user: config.emailUser,
                pass: config.emailPass,
            },
        });
        
        // Sanitize les données pour prévenir les injections
        const sanitizeHtml = (text) => {
            return text
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        };
        
        const sanitizedSubject = sanitizeHtml(emailData.sujet);
    const sanitizedMessageHtml = sanitizeHtml(emailData.message).replace(/\n/g, '<br>');
    const sanitizedMessageText = sanitizeHtml(emailData.message).replace(/\n/g, '\n');
        
        // Options de l'email
        const mailOptions = {
            from: config.emailUser,
            to: emailData.email,
            subject: sanitizedSubject,
            text: sanitizedMessageText,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #0f172a 0%, #1f2937 100%); padding: 30px; border-radius: 10px 10px 0 0;">
                        <h1 style="color: white; margin: 0; text-align: center;">
                            <span style="font-size: 2rem;">✉️</span><br>
                            ${sanitizedSubject}
                        </h1>
                    </div>
                    <div style="background: #f8f9fa; padding: 30px; border-radius:0 0 10px 10px;">
                        <div style="background: #e5e7eb; padding: 15px; border-radius: 8px; margin-bottom: 20px; font-size: 12px; color: #374151;">
                            <strong>IMAM COBAN</strong><br>
                            Route Château neuf, 26320, Saint-Marcel de Valence<br>
                            Tel: 0033607517416 | Email: francedemocratie26@gmail.com<br>
                            Site officiel: <a href="https://présidentielle2027.com" style="color: #2563eb;">https://présidentielle2027.com</a><br>
                            <small style="color: #6b7280;">Candidat indépendant - Élection présidentielle 2027</small>
                        </div>
                        <div style="font-size: 16px; line-height: 1.6; color: #333; white-space: pre-line;">
                            ${sanitizedMessageHtml}
                        </div>
                        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                        <p style="font-size: 12px; color: #666; text-align: center;">
                            Envoyé avec HyperEmail 📧
                        </p>
                    </div>
                </div>
            `,
            headers: {
                'Reply-To': config.emailUser,
                'List-Unsubscribe': `<mailto:${config.emailUser}?subject=unsubscribe>`,
                'X-Priority': '3',
                'X-MSMail-Priority': 'Normal',
                'Importance': 'Normal',
                'X-Mailer': 'HyperEmail v1.0',
                'X-Auto-Response-Suppress': 'All',
                'X-Spam-Check': '1',
                'X-Content-Type-Options': 'nosniff',
                'X-Frame-Options': 'DENY',
                'Precedence': 'bulk',
                'X-MC-Important': 'false',
                'X-MC-Track': 'false'
            }
        };
        
        // Envoyer l'email (SendGrid si disponible)
        if (sendgrid) {
            const sgMsg = {
                to: emailData.email,
                from: config.emailUser,
                subject: sanitizedSubject,
                text: sanitizedMessageText,
                html: sanitizedMessageHtml,
                // Ajouter une copie invisible à l'expéditeur pour Gmail "Envoyés"
                bcc: config.emailUser,
                headers: {
                    'Reply-To': config.emailUser,
                    'List-Unsubscribe': `<mailto:${config.emailUser}?subject=unsubscribe>`
                }
            };
            const sgRes = await sendgrid.send(sgMsg);
            const messageId = (sgRes && sgRes[0] && sgRes[0].headers && sgRes[0].headers['x-message-id']) || null;
            console.log(`✅ Email envoyé (SendGrid) à ${emailData.email}`);
            return res.json({ success: true, messageId, email: emailData.email });
        } else {
            // Pour Nodemailer, ajouter une copie invisible à l'expéditeur
            mailOptions.bcc = config.emailUser;
            const info = await transporter.sendMail(mailOptions);
            console.log(`✅ Email envoyé à ${emailData.email} - Message ID: ${info.messageId}`);
            return res.json({ success: true, messageId: info.messageId, email: emailData.email });
        }
        
    } catch (error) {
        console.error(`❌ Erreur lors de l'envoi à ${emailData.email}:`, error.message);
        
        res.status(500).json({
            success: false,
            error: 'Erreur lors de l\'envoi de l\'email',
            email: emailData.email
        });
    }
});

// API pour envoi en masse à partir d'un CSV ou d'un tableau JSON
app.post('/api/bulk-send', emailLimiter, async (req, res) => {
    // Authentification désactivée : tout le monde peut envoyer
    let user = null;
    
    // Compteurs pour le rapport
    let totalEmails = 0;
    let sentEmails = 0;
    let failedEmails = 0;

    let { config, recipients } = req.body;

    // If SendGrid is configured server-side, we only require a 'from' address (config.emailUser) or env SENDGRID_FROM
    if (sendgrid) {
        const from = (config && config.emailUser) || process.env.SENDGRID_FROM;
        if (!from) return res.status(400).json({ success: false, error: 'Adresse d\'expéditeur requise (config.emailUser) ou SENDGRID_FROM' });
        // ensure we set config.emailUser to from for downstream
        config = config || {};
        config.emailUser = config.emailUser || process.env.SENDGRID_FROM;
    } else {
        // Always use environment SMTP settings
        config = {
            smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
            smtpPort: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587,
            emailUser: process.env.SMTP_USER,
            emailPass: process.env.SMTP_PASS,
            secure: process.env.SMTP_SECURE === '1',
            sujet: config.sujet,
            messageText: config.messageText
        };
        
        if (!config.emailUser || !config.emailPass) {
            return res.status(400).json({ success: false, error: 'Configuration SMTP manquante dans les variables d\'environnement' });
        }
    }

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
        return res.status(400).json({ success: false, error: 'Aucun destinataire fourni' });
    }

        // Validate emails
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        let validRecipients = recipients.filter(r => r.email && emailRegex.test(r.email));

        // Vérification pour n'envoyer qu'une seule fois à chaque adresse
        if (process.env.DATABASE_URL) {
            // Postgres
            const { Client } = require('pg');
            const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
            await client.connect();
            const emails = validRecipients.map(r => r.email);
            const query = `SELECT recipient_email FROM send_logs WHERE recipient_email = ANY($1)`;
            const result = await client.query(query, [emails]);
            const alreadySent = new Set(result.rows.map(row => row.recipient_email));
            validRecipients = validRecipients.filter(r => !alreadySent.has(r.email));
            await client.end();
        } else {
            // SQLite
            const localDb = require('better-sqlite3')(require('path').join(__dirname, 'data', 'hyperemail.db'));
            const emails = validRecipients.map(r => r.email);
            const alreadySent = new Set();
            emails.forEach(email => {
                const stmt = localDb.prepare('SELECT 1 FROM send_logs WHERE recipient_email = ? LIMIT 1');
                const res = stmt.get(email);
                if (res) alreadySent.add(email);
            });
            validRecipients = validRecipients.filter(r => !alreadySent.has(r.email));
        }

        if (validRecipients.length === 0) {
                return res.status(400).json({ success: false, error: 'Aucun email valide à envoyer (déjà envoyé à toutes ces adresses)' });
        }
    
        if (validRecipients.length > MAX_RECIPIENTS) {
                // reject overly large requests to avoid accidental huge sends
                return res.status(413).json({ success: false, error: `Nombre de destinataires trop important (${validRecipients.length}). La limite est de ${MAX_RECIPIENTS}.` });
        }

    try {

        let transporter = null;
        if (!sendgrid) {
            transporter = nodemailer.createTransport({
                host: config.smtpHost,
                port: config.smtpPort || 587,
                secure: !!config.secure || false,
                auth: { user: config.emailUser, pass: config.emailPass }
            });

            // Verify transport
            await transporter.verify();
        }

        const results = [];

        // Remove quota check for API usage
        const userId = await ensureApiUser();

        // Send in batches to avoid spam filters and manage large volumes
        totalEmails = validRecipients.length;
        console.log(`📧 Début d'envoi de ${totalEmails} emails...`);
        
        // Traitement par lots de 50 emails avec pause entre les lots
        const BATCH_SIZE = 50;
        const batches = [];
        for (let i = 0; i < validRecipients.length; i += BATCH_SIZE) {
            batches.push(validRecipients.slice(i, i + BATCH_SIZE));
        }
        
        console.log(`📦 Traitement en ${batches.length} lots de ${BATCH_SIZE} emails`);
        
        for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
            const batch = batches[batchIndex];
            console.log(`📤 Envoi du lot ${batchIndex + 1}/${batches.length} (${batch.length} emails)`);
            
            for (const r of batch) {
            const mailOptions = {
                from: config.emailUser,
                to: r.email,
                subject: config.sujet || 'Message',
                text: (r.messageText) ? r.messageText : (config.messageText || ''),
                html: (r.messageHtml) ? r.messageHtml : (config.messageHtml || ''),
                headers: {
                    'X-Priority': '3',
                    'Precedence': 'bulk',
                    'Reply-To': config.emailUser,
                    'List-Unsubscribe': `<mailto:${config.emailUser}?subject=unsubscribe>`,
                    'X-Spam-Check': '1',
                    'X-Content-Type-Options': 'nosniff',
                    'X-Frame-Options': 'DENY',
                    'X-MC-Important': 'false',
                    'X-MC-Track': 'false',
                    'X-Auto-Response-Suppress': 'All'
                }
            };

            try {
                if (sendgrid) {
                    const sgMsg = {
                        to: r.email,
                        from: config.emailUser,
                        subject: config.sujet || 'Message',
                        text: (r.messageText) ? r.messageText : (config.messageText || ''),
                        html: (r.messageHtml) ? r.messageHtml : (config.messageHtml || ''),
                        // Utiliser BCC pour copie invisible
                        bcc: config.emailUser
                    };
                    const sgRes = await sendgrid.send(sgMsg);
                    const messageId = (sgRes && sgRes[0] && sgRes[0].headers && sgRes[0].headers['x-message-id']) || null;
                    results.push({ email: r.email, success: true, messageId });
                    sentEmails++;
                    console.log(`✅ Email envoyé (SendGrid) à ${r.email}`);
                    if (user) await db.addLog(user.id, r.email, true, messageId, null);
                } else {
                    // Pour Nodemailer avec Gmail, utiliser BCC pour copie invisible
                    mailOptions.bcc = config.emailUser;
                    const info = await transporter.sendMail(mailOptions);
                    results.push({ email: r.email, success: true, messageId: info.messageId });
                    sentEmails++;
                    console.log(`✅ Email envoyé (SMTP) à ${r.email} - ID: ${info.messageId}`);
                    if (user) await db.addLog(user.id, r.email, true, info.messageId, null);
                    
                    // Envoyer une notification de succès via Socket.IO
                    io.emit('emailSent', {
                        email: r.email,
                        status: 'success',
                        message: `Email envoyé avec succès à ${r.email}`
                    });
                }
                // Délai optimisé pour éviter le spam (1-2 secondes entre emails)
                const delay = Math.random() * 1000 + 1000; // 1-2 secondes aléatoires
                await new Promise(res => setTimeout(res, delay));
            } catch (err) {
                console.error('Erreur envoi bulk pour', r.email, err && err.message);
                results.push({ email: r.email, success: false, error: err && err.message });
                failedEmails++;
                if (user) await db.addLog(user.id, r.email, false, null, err && err.message);
                
                // Envoyer une notification d'erreur au client
                if (req.socket && req.socket.emit) {
                    req.socket.emit('emailError', {
                        email: r.email,
                        status: 'error',
                        message: `Échec de l'envoi à ${r.email}: ${err && err.message}`
                    });
                }
            }
            }
            
            // Pause entre les lots pour éviter le spam (5-10 secondes)
            if (batchIndex < batches.length - 1) {
                const batchDelay = Math.random() * 5000 + 5000; // 5-10 secondes
                console.log(`⏳ Pause entre lots: ${Math.round(batchDelay/1000)}s`);
                await new Promise(res => setTimeout(res, batchDelay));
            }
        }

        // Rapport final avec statistiques détaillées
        const successRate = totalEmails > 0 ? ((sentEmails / totalEmails) * 100).toFixed(2) : 0;
        const estimatedTime = Math.round((totalEmails * 1.5) / 60); // Estimation en minutes
        
        console.log(`📊 RAPPORT FINAL: ${totalEmails} emails traités, ${sentEmails} envoyés, ${failedEmails} échecs`);
        console.log(`📈 Taux de succès: ${successRate}% | Temps estimé: ${estimatedTime}min`);
        
        res.json({ 
            success: true, 
            results,
            summary: {
                total: totalEmails,
                sent: sentEmails,
                failed: failedEmails,
                successRate: parseFloat(successRate),
                estimatedTime: estimatedTime
            }
        });
    } catch (error) {
        console.error('Erreur bulk-send:', error && error.message);
        res.status(500).json({ success: false, error: 'Erreur lors de l\'envoi en masse' });
    }
});

// Get current user's template
app.get('/api/template', async (req, res) => {
    try {
        const userId = await ensureApiUser();
        const tpl = await db.getTemplate(userId);
        return res.json({ success: true, template: tpl || null });
    } catch (err) {
        return res.status(401).json({ success: false, error: 'Token invalide' });
    }
});

// Save template (from, sujet, message)
app.post('/api/template', async (req, res) => {
    try {
        // Use API user for templates
        const userId = await ensureApiUser();
        const { from, sujet, message } = req.body;
        if (!from || !sujet || !message) return res.status(400).json({ success: false, error: 'from/sujet/message requis' });
        await db.saveTemplate(userId, from, sujet, message);
        return res.json({ success: true });
    } catch (err) {
        console.error('Error saving template:', err);
        return res.status(500).json({ success: false, error: 'Erreur serveur' });
    }
});

// Upload pending list (rows: array of {email,phone,address,source,nom}) and optional mode/name
app.post('/api/pending-list', async (req, res) => {
    try {
        const userId = await ensureApiUser();
        if (!userId) return res.status(500).json({ success: false, error: 'API user indisponible' });
        const { mode, name, rows } = req.body;
        if (!rows || !Array.isArray(rows) || rows.length === 0) return res.status(400).json({ success: false, error: 'Rows requis' });
        if (rows.length > MAX_RECIPIENTS) return res.status(413).json({ success: false, error: `Taille de la liste trop importante (${rows.length}). La limite est de ${MAX_RECIPIENTS}.` });
        const listId = await db.createPendingList(userId, mode || 'manual', name || null);
        for (const r of rows) {
            await db.addPendingRecipient(listId, r.email || null, r.phone || null, r.address || null, r.source || null, r.nom || null);
        }
        // Envoi automatique pour toutes les listes
        const template = await db.getTemplate(userId);
        
        // Vérifier si SMTP est configuré
        const smtpConfigured = process.env.SMTP_USER && process.env.SMTP_PASS;
        
        if (smtpConfigured) {
            const recipients = await db.getRecipientsForList(listId);
            
            // Utiliser le template s'il existe, sinon utiliser un message par défaut
            const defaultSubject = 'Message important';
            const defaultMessage = 'Bonjour {{nom}},\n\nNous vous contactons pour une information importante.\n\nCordialement';
            
            const sujet = template ? template.sujet : defaultSubject;
            const message = template ? template.message : defaultMessage;
            
            const payloadToSend = {
                config: {
                    emailUser: process.env.SMTP_USER,
                    emailPass: process.env.SMTP_PASS,
                    smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
                    smtpPort: parseInt(process.env.SMTP_PORT || '587', 10),
                    sujet: sujet,
                    messageText: message,
                    messageHtml: message.replace(/\n/g, '<br>')
                },
                recipients: recipients.map(r => ({ 
                    email: r.email,
                    messageText: message.replace('{{nom}}', r.nom || 'Monsieur/Madame'),
                    messageHtml: message.replace('{{nom}}', r.nom || 'Monsieur/Madame').replace(/\n/g, '<br>')
                }))
            };
            
            let fetchFn = (typeof fetch === 'function') ? fetch : null;
            if (!fetchFn) {
                try { fetchFn = require('node-fetch'); } catch (e) { fetchFn = null; }
            }
            
            if (fetchFn) {
                try {
                    console.log(`🚀 Démarrage envoi automatique pour la liste ${listId} (${recipients.length} destinataires)`);
                    const resp = await fetchFn(`http://localhost:${PORT}/api/bulk-send`, { 
                        method: 'POST', 
                        headers: { 
                            'Content-Type': 'application/json',
                            'x-api-key': process.env.API_KEY || 'HYPEREMAIL123'
                        }, 
                        body: JSON.stringify(payloadToSend) 
                    });
                    
                    const result = await resp.json();
                    if (result.success) {
                        await db.markListSent(listId);
                        io.emit('notification', { 
                            type: 'success', 
                            message: `✅ Envoi automatique terminé: ${result.summary.sent}/${result.summary.total} emails envoyés` 
                        });
                        console.log(`✅ Auto-send: liste ${listId} envoyée (${result.summary.sent}/${result.summary.total} succès)`);
                    } else {
                        throw new Error(result.error || 'Erreur inconnue');
                    }
                } catch (e) {
                    io.emit('notification', { type: 'error', message: `❌ Erreur auto-send liste ${listId}: ${e && e.message}` });
                    console.error('❌ Envoi automatique échoué:', e && e.message);
                }
            } else {
                io.emit('notification', { type: 'error', message: `❌ Fetch non disponible: auto-send impossible pour la liste ${listId}` });
                console.warn('❌ Fetch non disponible: envoi automatique impossible pour la liste', listId);
            }
        } else {
            console.warn('⚠️ SMTP non configuré: les emails sont stockés mais pas envoyés automatiquement');
            io.emit('notification', { 
                type: 'warning', 
                message: `⚠️ Liste ${listId} stockée. Configurez SMTP_USER et SMTP_PASS pour l'envoi automatique` 
            });
        }
        return res.json({ success: true, listId });
    } catch (err) {
        io.emit('notification', { type: 'error', message: `Erreur API pending-list: ${err && err.message}` });
        return res.status(500).json({ success: false, error: 'Erreur serveur' });
    }
});

// List pending lists for authenticated user
app.get('/api/pending-lists', async (req, res) => {
    const authHeader = req.headers.authorization || '';
    const cookieToken = req.cookies && req.cookies.hyperemail_token;
    const tokenToUse = (authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null) || cookieToken;
    const providedApiKey = req.headers['x-api-key'];
    try {
        if (tokenToUse) {
            const payload = jwt.verify(tokenToUse, process.env.JWT_SECRET || 'change-me');
            const lists = await db.getPendingListsForUser(payload.sub);
            return res.json({ success: true, lists });
        }
        if (process.env.API_KEY && providedApiKey && providedApiKey === process.env.API_KEY) {
            const apiUserId = await ensureApiUser();
            const lists = await db.getPendingListsForUser(apiUserId);
            return res.json({ success: true, lists });
        }
        return res.status(401).json({ success: false, error: 'Authentification requise' });
    } catch (e) {
        return res.status(401).json({ success: false, error: 'Token invalide' });
    }
});

// Download a pending list as CSV
app.get('/api/pending-list/:id/download', async (req, res) => {
    try {
        const listId = parseInt(req.params.id, 10);
        const list = await db.getPendingListById(listId);
        if (!list) {
            return res.status(404).json({ success: false, error: 'Liste non trouvée' });
        }
        const csvContent = await generateListCSV(listId);
        const filename = `liste_${listId}_${new Date().toISOString().split('T')[0]}.csv`;
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        return res.send(csvContent);
    } catch (e) {
        return res.status(500).json({ success: false, error: 'Erreur serveur' });
    }
});

// Delete a pending list
app.delete('/api/pending-list/:id', async (req, res) => {
    const authHeader = req.headers.authorization || '';
    const cookieToken = req.cookies && req.cookies.hyperemail_token;
    const tokenToUse = (authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null) || cookieToken;
    const providedApiKey = req.headers['x-api-key'];
    try {
        const listId = parseInt(req.params.id, 10);
        const list = await db.getPendingListById(listId);
        if (!list) return res.status(404).json({ success: false, error: 'Liste non trouvée' });
        if (tokenToUse) {
            const payload = jwt.verify(tokenToUse, process.env.JWT_SECRET || 'change-me');
            if (list.user_id !== payload.sub) return res.status(403).json({ success: false, error: 'Accès refusé' });
        } else if (process.env.API_KEY && providedApiKey && providedApiKey === process.env.API_KEY) {
            const apiUserId = await ensureApiUser();
            if (list.user_id !== apiUserId) return res.status(403).json({ success: false, error: 'Accès refusé' });
        } else {
            return res.status(401).json({ success: false, error: 'Authentification requise' });
        }
        await db.deletePendingList(listId);
        return res.json({ success: true });
    } catch (e) {
        return res.status(401).json({ success: false, error: 'Token invalide' });
    }
});

// API pour tester la connexion
app.post('/api/test-connection', async (req, res) => {
    const { config } = req.body;
    
    if (sendgrid) {
        // If SendGrid is configured server-side, the key presence is already the verification
        if (!process.env.SENDGRID_API_KEY) return res.status(500).json({ success: false, error: 'SendGrid non configuré' });
        return res.json({ success: true, message: 'SendGrid configuré sur le serveur' });
    }

    if (!config || !config.emailUser || !config.emailPass || !config.smtpHost) {
        return res.status(400).json({ success: false, error: 'Configuration incomplète' });
    }

    try {
        const transporter = nodemailer.createTransport({
            host: config.smtpHost,
            port: 587,
            secure: false,
            auth: {
                user: config.emailUser,
                pass: config.emailPass,
            },
        });
        await transporter.verify();
        res.json({ success: true, message: 'Connexion réussie au serveur SMTP' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Erreur de connexion au serveur SMTP' });
    }
});

// Health check for readiness/liveness probes
app.get('/health', (req, res) => {
    res.json({ success: true, status: 'ok', time: new Date().toISOString() });
});

// Gestion des erreurs 404
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route non trouvée'
    });
});

// Gestion globale des erreurs
app.use((err, req, res, next) => {
    console.error('Erreur serveur:', err.stack);
    res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur'
    });
});

// Démarrer le serveur
// NOTE: We must use a single listener (server.listen) because the HTTP server
// instance is used by WebSocket. Previously app.listen() and server.listen()
// were both called which causes EADDRINUSE. Keep only server.listen().

// Broadcast reload to all connected clients
function broadcastReload() {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send('reload');
        }
    });
}

// Start server
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;

// Create admin user at startup if missing
(async () => {
    try {
        // Only auto-create an admin if both ADMIN_EMAIL and ADMIN_PASS are explicitly provided
        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPass = process.env.ADMIN_PASS;
        if (!adminEmail || !adminPass) {
            console.log('No ADMIN_EMAIL/ADMIN_PASS provided — skipping automatic admin creation.');
        } else {
            const existing = await db.getUserByEmail(adminEmail);
            if (!existing) {
                const hash = await bcrypt.hash(adminPass, 10);
                const id = await db.createUser(adminEmail, hash);
                try { await db.setAdmin(id); } catch (e) { }
                console.log('Admin user created:', adminEmail);
            } else {
                try { await db.setAdmin(existing.id); } catch (e) { }
                console.log('Admin privileges ensured for:', adminEmail);
            }
        }
    } catch (err) {
        console.error('Erreur lors de la création de l\'admin:', err && err.message);
    }
})();

// Export the application
module.exports = app;
