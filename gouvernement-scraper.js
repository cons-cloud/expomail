require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const axios = require('axios');
let getSupabase = null;
try {
    const supabaseModule = require('./supabase');
    getSupabase = supabaseModule.getSupabase;
} catch (err) {
    console.log('⚠️ Supabase non disponible, utilisation de la mémoire uniquement');
}
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const crypto = require('crypto');

// Charger les configurations groupées
const SMTP_CONFIG = process.env.SMTP_CONFIG ? JSON.parse(process.env.SMTP_CONFIG) : {};
const AUTH_CONFIG = process.env.AUTH_CONFIG ? JSON.parse(process.env.AUTH_CONFIG) : {};
const API_CONFIG = process.env.API_CONFIG ? JSON.parse(process.env.API_CONFIG) : {};
const cheerio = require('cheerio');
const cookieParser = require('cookie-parser');
const path = require('path');
const { Parser } = require('@json2csv/plainjs');
// Runtime storage: in-memory or Supabase (Firebase removed)

const {
    scrapeMinistres,
    scrapeJustice,
    scrapeAutres
} = require('./advanced-scraper');
const rateLimiter = require('./rate-limiter');

const app = express();
const server = require('http').createServer(app);
const WebSocket = require('ws');

// ===== SÉCURITÉ AVANCÉE =====

// 1. Helmet - Protection des headers HTTP
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-hashes'", "https://cdn.jsdelivr.net"],
            scriptSrcAttr: ["'unsafe-inline'", "'unsafe-hashes'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            frameSrc: ["'none'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            manifestSrc: ["'self'"]
        }
    },
    crossOriginEmbedderPolicy: false,
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
}));

// 2. Rate limiting global
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Limite chaque IP à 1000 requêtes par fenêtre
    message: {
        error: 'Trop de requêtes, veuillez réessayer plus tard',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        const ip = req.ip || req.connection.remoteAddress;
        return ip === '::1' || ip === '127.0.0.1'; // Désactiver pour localhost
    }
});

// 3. Slow down pour ralentir les requêtes abusives
const speedLimiter = slowDown({
    windowMs: 15 * 60 * 1000, // 15 minutes
    delayAfter: 100, // Autoriser 100 requêtes par 15min
    delayMs: 500, // Ajouter 500ms de délai par requête supplémentaire
    maxDelayMs: 20000, // Maximum 20 secondes de délai
    skip: (req) => {
        const ip = req.ip || req.connection.remoteAddress;
        return ip === '::1' || ip === '127.0.0.1';
    }
});

app.use(globalLimiter);
app.use(speedLimiter);

// 4. Rate limiting spécifique pour l'authentification
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Maximum 5 tentatives de connexion
    message: {
        error: 'Trop de tentatives de connexion, veuillez réessayer dans 15 minutes'
    },
    skipSuccessfulRequests: true
});

// 5. Validation et nettoyage des entrées
const sanitizeInput = (req, res, next) => {
    // Nettoyer les headers
    Object.keys(req.headers).forEach(key => {
        req.headers[key] = req.headers[key].toString().trim();
    });
    
    // Limiter la taille des requêtes
    if (req.method === 'POST' && req.headers['content-length']) {
        const size = parseInt(req.headers['content-length']);
        if (size > 10 * 1024 * 1024) { // 10MB max
            return res.status(413).json({ error: 'Requête trop volumineuse' });
        }
    }
    
    next();
};

app.use(sanitizeInput);

// 6. Logging de sécurité
const securityLogger = (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const timestamp = new Date().toISOString();
    
    // Logger les tentatives suspectes
    if (req.path.includes('/api/login') || req.path.includes('/send')) {
        console.log(`🔒 [${timestamp}] ${req.method} ${req.path} - IP: ${ip} - UA: ${userAgent}`);
    }
    
    next();
};

app.use(securityLogger);

// ===== FIN SÉCURITÉ AVANCÉE =====

// Utiliser cookie-parser
app.use(cookieParser());

// Route racine pour le health check Railway
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'app.html'));
});
// Route de healthcheck pour Render
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

const PORT = process.env.PORT || 3001;

// Configuration CORS
const cors = require('cors');
app.use(cors({
    origin: [
        'http://localhost:3001',
        process.env.PRODUCTION_URL,
        'https://hyperemail.up.railway.app',
        'https://hyperemail.onrender.com'
    ].filter(Boolean),
    credentials: true
}));

// Configuration WebSocket Server
const wss = new WebSocket.Server({ 
    server: server,
    path: '/ws/ws'
});

// Configuration WebSocket
wss.on('connection', (ws) => {
    console.log('Client connecté via WebSocket');
    
    ws.on('message', (message) => {
        console.log('Message reçu:', message);
    });
    
    ws.on('close', () => {
        console.log('Client déconnecté');
    });
    
    ws.on('error', (error) => {
        console.error('Erreur WebSocket:', error);
    });
});

// Configuration du rate limiter pour le développement
const devRateLimit = require('express-rate-limit')({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 1000, // 1000 requêtes par minute
    skip: (req) => {
        const ip = req.ip || req.connection.remoteAddress;
        return ip === '::1' || ip === '127.0.0.1'; // Désactiver pour localhost
    },
    message: { error: 'Rate limit dépassé. Veuillez réessayer dans une minute.' }
});

// Appliquer le rate limiter
app.use(devRateLimit);

// Limite maximale d'emails par catégorie
const MAX_EMAILS_PER_CATEGORY = 200000;
const MAX_EMAILS_TOTAL = 200000;

app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

// Gestion des erreurs globale
app.use((err, req, res, next) => {
    console.error('Erreur globale:', err);
    res.status(500).json({
        error: 'Erreur interne du serveur',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Une erreur est survenue'
    });
});

// Gestion propre de l'arrêt
const cleanup = () => {
    console.log('Nettoyage avant arrêt...');
    // Fermer proprement les connexions WebSocket
    wss.clients.forEach(client => {
        client.close();
    });
    // Fermer le serveur HTTP
    server.close(() => {
        console.log('Serveur HTTP arrêté');
        process.exit(0);
    });
};

// Gestion des signaux d'arrêt
process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);

// Gestion des erreurs non capturées
process.on('uncaughtException', (err) => {
    console.error('Erreur non capturée:', err);
    cleanup();
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Promesse rejetée non gérée:', reason);
    cleanup();
});

// Middleware pour vérifier le JWT
const verifyToken = (req, res, next) => {
    // Appliquer la sécurité à login.html aussi, mais bypasser la vérification JWT
    if (req.path === '/login.html' || req.path === '/reload.js' || req.path.startsWith('/api/login')) {
        // Appliquer le middleware de sécurité mais pas la vérification JWT
        return securityMiddleware(req, res, () => next());
    }

    const token = req.cookies?.jwt || req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.redirect('/login.html');
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.redirect('/login.html');
    }
};

// Appliquer la vérification du JWT à toutes les routes
app.use(verifyToken);

// Définir le secret JWT AVANT toute utilisation
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');

// Route de login pour générer le JWT (avec rate limiting)
app.post('/api/login', authLimiter, (req, res) => {
    const { email, password } = req.body;
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'hyperemail@gmail.com';
    const ADMIN_PASS = process.env.ADMIN_PASS || 'Hyperemail1@';
    
    // Validation des entrées
    if (!email || !password) {
        return res.status(400).json({ success: false, error: 'Email et mot de passe requis' });
    }
    
    // Validation basique de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ success: false, error: 'Format d\'email invalide' });
    }
    
    console.log('🔐 Tentative de connexion:', { email, ip: req.ip });
    
    if (email === ADMIN_EMAIL && password === ADMIN_PASS) {
        const token = jwt.sign({ 
            email,
            ip: req.ip,
            userAgent: req.headers['user-agent'],
            loginTime: Date.now()
        }, JWT_SECRET, { expiresIn: '2h' });
        
        // Définir le cookie JWT avec options sécurisées
        res.cookie('jwt', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7200000, // 2 heures
            path: '/'
        });
        
        console.log('✅ Connexion réussie pour:', email);
        return res.json({ success: true, token });
    }
    
    console.log('❌ Échec de connexion: identifiants invalides pour', email);
    res.status(401).json({ success: false, error: 'Identifiants invalides' });
});

// Route pour vérifier la validité du token
app.get('/api/verify-token', (req, res) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(401).json({ valid: false });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ valid: false });
    }

    try {
        jwt.verify(token, JWT_SECRET);
        res.json({ valid: true });
    } catch (error) {
        res.status(401).json({ valid: false });
    }
});

function verifyJWT(req, res, next) {
    // Vérifie le token dans le header Authorization
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.redirect('/login.html');
    const token = authHeader.split(' ')[1];
    if (!token) return res.redirect('/login.html');
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.redirect('/login.html');
        req.user = user;
        next();
    });
}

// Protéger l'accès à app.html
app.get('/app.html', verifyJWT, (req, res, next) => {
    res.sendFile(path.join(__dirname, 'public', 'app.html'));
});
app.use(express.static('public'));

// Sécurité : Headers renforcés
app.use((req, res, next) => {
    // Protection contre le sniffing de type MIME
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // Protection contre le clickjacking
    res.setHeader('X-Frame-Options', 'DENY');
    
    // Protection XSS
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // Content Security Policy
    res.setHeader('Content-Security-Policy', 
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-hashes' https://fonts.googleapis.com; " +
        "script-src-attr 'unsafe-inline' 'unsafe-hashes'; " +
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
        "font-src 'self' https://fonts.gstatic.com; " +
        "img-src 'self' data: https:; " +
        "connect-src 'self';"
    );
    
    // Protection contre les attaques de timing
    res.setHeader('X-DNS-Prefetch-Control', 'off');
    
    // Désactiver le cache pour les pages sensibles
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    // Strict Transport Security (HTTPS)
    if (req.secure) {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    
    next();
});

// Fonction de validation et sanitization
function sanitizeString(input) {
    if (typeof input !== 'string') return input;
    // Supprimer les caractères dangereux
    return input
        .replace(/<script[^>]*>.*?<\/script>/gi, '')
        .replace(/<[^>]+>/g, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .trim()
        .substring(0, 1000); // Limiter la longueur
}

// Validation des catégories
const VALID_CATEGORIES = ['mairies', 'justice', 'ministeres', 'prefectures', 'autres'];
function isValidCategory(category) {
    return VALID_CATEGORIES.includes(category);
}

// Rate limiting renforcé (en mémoire)
const requestCounts = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 100;
const SCRAPING_RATE_LIMIT = 10; // Max 10 scrapings par minute
const scrapingCounts = new Map();

app.use((req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    
    // Bloquer les IPs suspectes
    if (ip === 'unknown') {
        return res.status(403).json({ error: 'Accès refusé' });
    }
    
    if (!requestCounts.has(ip)) {
        requestCounts.set(ip, []);
    }
    
    const requests = requestCounts.get(ip).filter(time => now - time < RATE_LIMIT_WINDOW);
    
    if (requests.length >= MAX_REQUESTS_PER_WINDOW) {
        console.log(`⚠️  Rate limit dépassé pour IP: ${ip}`);
        return res.status(429).json({ error: 'Trop de requêtes, veuillez patienter' });
    }
    
    requests.push(now);
    requestCounts.set(ip, requests);
    
    // Nettoyer les anciennes entrées (toutes les 5 minutes)
    if (Math.random() < 0.01) {
        for (const [key, times] of requestCounts.entries()) {
            const filtered = times.filter(time => now - time < RATE_LIMIT_WINDOW);
            if (filtered.length === 0) {
                requestCounts.delete(key);
            } else {
                requestCounts.set(key, filtered);
            }
        }
    }
    
    next();
});

// Base de données des contacts importés (en mémoire)
let importedContacts = [];

// Limite maximale de contacts
const MAX_CONTACTS_TOTAL = 200000;

// Configuration SMTP : supporte soit JSON dans SMTP_CONFIG soit variables d'env classiques
const resolvedSmtp = (SMTP_CONFIG && SMTP_CONFIG.host) ? {
    host: SMTP_CONFIG.host,
    port: parseInt(SMTP_CONFIG.port || 587, 10),
    secure: SMTP_CONFIG.secure === '1' || SMTP_CONFIG.secure === true,
    auth: {
        user: SMTP_CONFIG.user,
        pass: SMTP_CONFIG.pass
    }
} : {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: (process.env.SMTP_SECURE === '1' || process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465'),
    auth: {
        user: process.env.SMTP_USER || process.env.EMAIL_USER,
        pass: process.env.SMTP_PASS
    }
};

// Fallback pour s'assurer que les champs existent
if (!resolvedSmtp.host || !resolvedSmtp.auth || !resolvedSmtp.auth.user || !resolvedSmtp.auth.pass) {
    console.warn('⚠️  SMTP non entièrement configuré — vérifiez SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS');
}

const transporter = nodemailer.createTransport(Object.assign({}, resolvedSmtp, {
    tls: { rejectUnauthorized: false }
}));

// Vérifier la connexion SMTP au démarrage
transporter.verify().then(() => {
    console.log('✅ SMTP connecté et prêt à envoyer');
}).catch(err => {
    console.error('❌ Échec connexion SMTP:', err && err.message ? err.message : err);
});

// APIs et URLs par catégorie
const urlsByCategory = {
    mairies: [
        // API Annuaire Service Public
        'https://api-lannuaire.service-public.fr/api/explore/v2.1/catalog/datasets/api-lannuaire-administration/records?where=pivotLocal%3D%22mairie%22&limit=100',
        // API Data.gouv.fr - Mairies
        'https://www.data.gouv.fr/api/1/datasets/53699934a3a729239d206227/',
        // API Geo - Communes
        'https://geo.api.gouv.fr/communes?fields=nom,code,codesPostaux,population&format=json&geometry=centre'
    ],
    justice: [
        // API Annuaire (use base records endpoint then filter locally) — avoid fragile "where" encoding
        'https://api-lannuaire.service-public.fr/api/explore/v2.1/catalog/datasets/api-lannuaire-administration/records?limit=100'
    ],
    ministeres: [
        // API Data.gouv.fr - Organisations
        'https://www.data.gouv.fr/api/1/organizations/?page_size=100'
    ],
    prefectures: [
        // API Annuaire Service Public - use base records endpoint and filter locally for 'prefecture'
        'https://api-lannuaire.service-public.fr/api/explore/v2.1/catalog/datasets/api-lannuaire-administration/records?limit=100'
    ],
    autres: []
};

// Emails de démonstration (exemples réels de format)
const demoEmails = {
    mairies: [
        { email: 'mairie@paris.fr', name: 'Mairie de Paris', city: 'Paris' },
        { email: 'contact@mairie-lyon.fr', name: 'Mairie de Lyon', city: 'Lyon' },
        { email: 'mairie@marseille.fr', name: 'Mairie de Marseille', city: 'Marseille' },
        { email: 'contact@mairie-toulouse.fr', name: 'Mairie de Toulouse', city: 'Toulouse' },
        { email: 'mairie@nice.fr', name: 'Mairie de Nice', city: 'Nice' },
        { email: 'contact@mairie-nantes.fr', name: 'Mairie de Nantes', city: 'Nantes' },
        { email: 'mairie@bordeaux.fr', name: 'Mairie de Bordeaux', city: 'Bordeaux' },
        { email: 'contact@mairie-lille.fr', name: 'Mairie de Lille', city: 'Lille' },
        { email: 'mairie@strasbourg.eu', name: 'Mairie de Strasbourg', city: 'Strasbourg' },
        { email: 'contact@mairie-rennes.fr', name: 'Mairie de Rennes', city: 'Rennes' }
    ],
    justice: [
        { email: 'greffe.tgi-paris@justice.fr', name: 'Tribunal de Paris', city: 'Paris' },
        { email: 'contact@tribunal-lyon.fr', name: 'Tribunal de Lyon', city: 'Lyon' },
        { email: 'greffe@tribunal-marseille.fr', name: 'Tribunal de Marseille', city: 'Marseille' }
    ],
    ministeres: [
        { email: 'contact@interieur.gouv.fr', name: 'Ministère de l\'Intérieur', city: 'Paris' },
        { email: 'info@education.gouv.fr', name: 'Ministère de l\'Éducation', city: 'Paris' },
        { email: 'contact@economie.gouv.fr', name: 'Ministère de l\'Économie', city: 'Paris' }
    ],
    prefectures: [
        { email: 'prefecture@paris.gouv.fr', name: 'Préfecture de Paris', city: 'Paris' },
        { email: 'contact@rhone.gouv.fr', name: 'Préfecture du Rhône', city: 'Lyon' }
    ],
    autres: [
        { email: 'contact@exemple.fr', name: 'Institution Exemple', city: 'Paris' }
    ]
};

// Message par défaut pour les mairies
const mairieMessage = {
    subject: 'Demande de parrainage pour l\'élection présidentielle',
    message: `Monsieur le Maire,

Je vous adresse cette lettre dans le cadre de ma candidature à l'élection présidentielle de 2027, en sollicitant votre parrainage tel que prévu par la loi.

Ma démarche repose sur un engagement fort : lutter contre les injustices sociales, économiques et humaines qui affectent notre société. Il est temps de redonner à chaque homme sa dignité, sa place et ses droits fondamentaux.

Ce parrainage ne constitue pas un soutien politique, mais un acte démocratique permettant le pluralisme et l'expression citoyenne. Je serais honoré de pouvoir compter sur votre signature pour porter cette voix jusqu'au peuple français.

Je reste à votre disposition pour vous transmettre davantage d'informations ou échanger sur cette initiative.

Veuillez agréer, Monsieur le Maire, l'expression de mes salutations respectueuses.

Imam Coban`
};

// Extraire les emails
function extractEmails(text) {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    return text.match(emailRegex) || [];
}

// Extraire le nom et la ville à partir du contexte autour de l'email
function extractContactInfo(html, email) {
    const lines = html.split(/[\n\r]+/);
    let name = 'Non spécifié';
    let city = 'Non spécifié';
    
    // Chercher la ligne contenant l'email
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(email)) {
            // Chercher dans les lignes précédentes et suivantes
            const context = lines.slice(Math.max(0, i - 5), Math.min(lines.length, i + 5)).join(' ');
            
            // Extraire le nom (chercher "Mairie de", "Tribunal de", etc.)
            const namePatterns = [
                /Mairie de ([A-ZÀ-Ÿ][a-zà-ÿ-]+(?:\s+[A-ZÀ-Ÿ][a-zà-ÿ-]+)*)/i,
                /Tribunal de ([A-ZÀ-Ÿ][a-zà-ÿ-]+(?:\s+[A-ZÀ-Ÿ][a-zà-ÿ-]+)*)/i,
                /Préfecture de ([A-ZÀ-Ÿ][a-zà-ÿ-]+(?:\s+[A-ZÀ-Ÿ][a-zà-ÿ-]+)*)/i,
                /Ministère (?:de |des |du )?([A-ZÀ-Ÿ][a-zà-ÿ-]+(?:\s+[A-ZÀ-Ÿ][a-zà-ÿ-]+)*)/i,
                /<h[1-6][^>]*>([^<]+)</i,
                /<title>([^<]+)</i,
                /<strong>([A-ZÀ-Ÿ][a-zà-ÿ-]+(?:\s+[A-ZÀ-Ÿ][a-zà-ÿ-]+)*)</i
            ];
            
            for (const pattern of namePatterns) {
                const match = context.match(pattern);
                if (match && match[1]) {
                    name = match[1].trim();
                    break;
                }
            }
            
            // Extraire la ville (codes postaux français + nom de ville)
            const cityPatterns = [
                /(\d{5})\s+([A-ZÀ-Ÿ][a-zà-ÿ-]+(?:\s+[A-ZÀ-Ÿ][a-zà-ÿ-]+)*)/,
                /([A-ZÀ-Ÿ][a-zà-ÿ-]+(?:\s+[A-ZÀ-Ÿ][a-zà-ÿ-]+)*)\s+\(\d{5}\)/,
                /ville[:\s]+([A-ZÀ-Ÿ][a-zà-ÿ-]+(?:\s+[A-ZÀ-Ÿ][a-zà-ÿ-]+)*)/i
            ];
            
            for (const pattern of cityPatterns) {
                const match = context.match(pattern);
                if (match) {
                    city = match[2] || match[1];
                    if (city) {
                        city = city.trim();
                        break;
                    }
                }
            }
            
            break;
        }
    }
    
    return { name, city };
}

// Parser les données des APIs
function parseAPIData(data, url, category) {
    const emails = [];

    // Helper: recursively scan objects/arrays/strings for email-like values
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

    function tryParseJsonString(str) {
        if (typeof str !== 'string') return null;
        str = str.trim();
        if (!(str.startsWith('{') || str.startsWith('['))) return null;
        try {
            return JSON.parse(str);
        } catch (e) {
            return null;
        }
    }

    function scan(obj, path = '') {
        if (obj === null || obj === undefined) return;
        if (typeof obj === 'string') {
            // If string contains JSON, try to parse and scan deeper
            const parsed = tryParseJsonString(obj);
            if (parsed) return scan(parsed, path + "(json)");

            const m = obj.match(emailRegex);
            if (m) {
                m.forEach(e => {
                    emails.push({ email: String(e).trim(), name: 'Non spécifié', city: 'Non spécifié', path });
                });
            }
            return;
        }
        if (Array.isArray(obj)) {
            obj.forEach((v, i) => scan(v, `${path}[${i}]`));
            return;
        }
        if (typeof obj === 'object') {
            Object.keys(obj).forEach(k => scan(obj[k], path ? `${path}.${k}` : k));
            return;
        }
    }

    try {
        // Common heuristics first: service-public, data.gouv, geo
        if (url.includes('api-lannuaire.service-public.fr') || url.includes('api-lannuaire')) {
            // try several containers
            let containers = [];
            if (data.results && Array.isArray(data.results)) containers = data.results;
            else if (data.records && Array.isArray(data.records)) containers = data.records;
            else if (data.data && Array.isArray(data.data)) containers = data.data;
            else if (Array.isArray(data)) containers = data;

            // scan each record deeply (many fields may be JSON strings)
            containers.forEach((record, idx) => {
                const fields = (record && (record.fields || (record.record && record.record.fields))) || record || {};

                // If the caller asked for a specific category (justice/prefectures), try to filter records
                if (category === 'justice' || category === 'prefectures') {
                    const pivot = (fields.pivotLocal || fields.pivot || fields.categorie || fields.type_organisme || '').toString().toLowerCase();
                    const want = category === 'justice' ? 'tribunal' : 'prefecture';
                    if (pivot && !pivot.includes(want)) {
                        // skip this record; it doesn't match the requested pivot
                        return;
                    }
                }

                // scan fields recursively
                scan(fields, `records[${idx}]`);
                // also attempt to read common named email fields
                const direct = (fields.adresse_courriel || fields.adresse_email || fields.email || fields.courriel || fields.adresse_mail || fields.contact_email || fields.mail);
                if (direct) {
                    if (Array.isArray(direct)) direct.forEach(d => scan(d, `records[${idx}].adresse`));
                    else scan(direct, `records[${idx}].adresse`);
                }
            });
        } else if (url.includes('geo.api.gouv.fr')) {
            if (Array.isArray(data)) {
                data.forEach(commune => {
                    const name = `Mairie de ${commune.nom}`;
                    const city = commune.nom;
                    const email = `mairie@${commune.nom.toLowerCase().replace(/[^a-z]/g, '')}.fr`;
                    emails.push({ email, name, city, path: 'geo.autogenerated' });
                });
            }
        } else if (url.includes('data.gouv.fr')) {
            // data.gouv often returns { data: [ ... ] }
            const arr = data.data && Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
            arr.forEach((item, idx) => {
                scan(item, `data[${idx}]`);
                // check direct fields
                const direct = item.email || item.contact_email || (item.contact && item.contact.email) || item.contact_email;
                if (direct) {
                    if (Array.isArray(direct)) direct.forEach(d => scan(d, `data[${idx}].email`));
                    else scan(direct, `data[${idx}].email`);
                }
            });
        } else {
            // Generic fallback: scan entire response
            scan(data, 'root');
        }
    } catch (err) {
        console.error('Erreur parsing API:', err && err.message ? err.message : String(err));
    }

    // Deduplicate by email
    const seen = new Set();
    const out = [];
    for (const e of emails) {
        if (!e || !e.email) continue;
        const key = e.email.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({ email: e.email, name: e.name || 'Non spécifié', city: e.city || 'Non spécifié', path: e.path });
    }

    return out;
}

// Créer la table contacts si elle n'existe pas
/*
async function ensureContactsTable() {
    try {
        // const supabase = getSupabase();
        
        // Vérifier si la table existe en essayant de la lire
        // const { data, error } = await supabase
            //     .from('contacts')
            //     .select('id')
            //     .limit(1);
            
        // if (error && error.code === 'PGRST116') {
        //     // La table n'existe pas, la créer via SQL
        //     console.log('🔧 Création de la table contacts dans Supabase...');
        //     
        //     const { error: createError } = await supabase.rpc('create_contacts_table');
        //     
        //     if (createError) {
        //         console.warn('⚠️ Impossible de créer la table automatiquement. Créez-la manuellement dans Supabase Dashboard.');
        //         console.log('SQL à exécuter dans Supabase Dashboard > SQL Editor:');
        //         console.log(`
        // CREATE TABLE IF NOT EXISTS contacts (
        //     id BIGSERIAL PRIMARY KEY,
        //     email VARCHAR(255) UNIQUE NOT NULL,
        //     organisation TEXT,
        //     sent BOOLEAN DEFAULT FALSE,
        //     sent_date TIMESTAMPTZ,
        //     date TIMESTAMPTZ DEFAULT NOW(),
        //     source VARCHAR(50) DEFAULT 'import',
        //     imported_at TIMESTAMPTZ DEFAULT NOW(),
        //     import_ip INET,
        //     created_at TIMESTAMPTZ DEFAULT NOW(),
        //     updated_at TIMESTAMPTZ DEFAULT NOW()
        // );
        // 
        // -- Créer un index sur l'email pour les performances
        // CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
        // 
        // -- Créer un index sur le statut d'envoi
        // CREATE INDEX IF NOT EXISTS idx_contacts_sent ON contacts(sent);
        //                 `);
        //     } else {
        //         console.log('✅ Table contacts créée avec succès dans Supabase');
        //     }
        // } else {
        //     console.log('✅ Table contacts déjà existante dans Supabase');
        // }
    } catch (err) {
        //     console.warn('⚠️ Erreur vérification table Supabase:', err.message);
    // }
}
*/

// Initialiser Supabase et vérifier la table au démarrage
try {
    if (getSupabase) {
        console.log('🔧 Initialisation Supabase...');
        // Charger les contacts depuis Supabase au démarrage (non bloquant)
        setTimeout(async () => {
            try {
                const supabaseContacts = await loadContactsFromSupabase();
                if (supabaseContacts.length > 0) {
                    console.log(`🔄 Remplacement des contacts mémoire par ${supabaseContacts.length} contacts Supabase`);
                    importedContacts = supabaseContacts;
                }
            } catch (err) {
                console.warn('⚠️ Erreur chargement initial Supabase (non bloquant):', err.message);
            }
        }, 3000); // Attendre 3 secondes que le serveur soit démarré
    } else {
        console.log('⚠️ Supabase non disponible - Utilisation de la mémoire uniquement');
    }
} catch (err) {
    console.warn('⚠️ Erreur initialisation Supabase:', err.message);
}

// Sauvegarder les contacts dans Supabase
async function saveContactsToSupabase(contacts) {
    if (!getSupabase) {
        console.log('⚠️ Supabase non disponible, sauvegarde ignorée');
        return { saved: 0, errors: 0 };
    }
    
    try {
        const supabase = getSupabase();
        console.log(`💾 Sauvegarde de ${contacts.length} contacts dans Supabase...`);
        
        let saved = 0;
        let errors = 0;
        
        for (const contact of contacts) {
            try {
                const { error } = await supabase
                    .from('contacts')
                    .upsert({
                        email: contact.email.toLowerCase(),
                        organisation: contact.organisation || '',
                        sent: contact.sent || false,
                        sent_date: contact.sentDate || null,
                        source: contact.source || 'import',
                        imported_at: contact.importedAt || new Date().toISOString(),
                        import_ip: contact.importIP || null,
                        updated_at: new Date().toISOString()
                    }, {
                        onConflict: 'email' // Mettre à jour si l'email existe déjà
                    });
                    
                if (error) {
                    console.warn(`❌ Erreur sauvegarde contact ${contact.email}:`, error.message);
                    errors++;
                } else {
                    saved++;
                }
            } catch (err) {
                console.warn(`❌ Erreur traitement contact ${contact.email}:`, err.message);
                errors++;
            }
        }
        
        console.log(`✅ Sauvegarde Supabase terminée: ${saved} sauvegardés, ${errors} erreurs`);
        return { saved, errors };
        
    } catch (err) {
        console.warn('⚠️ Erreur générale sauvegarde Supabase:', err.message);
        return { saved: 0, errors: contacts.length };
    }
}

// Charger les contacts depuis Supabase au démarrage
async function loadContactsFromSupabase() {
    if (!getSupabase) {
        console.log('⚠️ Supabase non disponible, chargement ignoré');
        return [];
    }
    
    try {
        const supabase = getSupabase();
        console.log('📥 Chargement des contacts depuis Supabase...');
        
        const { data, error } = await supabase
            .from('contacts')
            .select('*')
            .order('imported_at', { ascending: false });
            
        if (error) {
            console.warn('⚠️ Erreur chargement Supabase:', error.message);
            return [];
        }
        
        console.log(`✅ ${data.length} contacts chargés depuis Supabase`);
        
        // Transformer les données pour le format attendu
        return data.map(contact => ({
            email: contact.email,
            organisation: contact.organisation || '',
            sent: contact.sent,
            sentDate: contact.sent_date,
            date: contact.date,
            source: contact.source,
            importedAt: contact.imported_at,
            importIP: contact.import_ip
        }));
        
    } catch (err) {
        console.warn('⚠️ Erreur générale chargement Supabase:', err.message);
        return [];
    }
}


// Upsert email into Supabase pending_recipients (if configured)
async function upsertToSupabase(emailData) {
    // Only attempt if SUPABASE env is present
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) return; // nothing configured

    try {
        const supabase = getSupabase();
        // Check existing by email
        const { data: existing, error: selErr } = await supabase
            .from('pending_recipients')
            .select('id')
            .eq('email', emailData.email)
            .limit(1);
        if (selErr) {
            console.warn('Supabase select error:', selErr.message || selErr);
        }

        if (existing && existing.length > 0) {
            // update existing record's source/name if useful
            const { error: updErr } = await supabase
                .from('pending_recipients')
                .update({ source: emailData.source, name: emailData.name })
                .eq('email', emailData.email);
            if (updErr) console.warn('Supabase update error:', updErr.message || updErr);
        } else {
            const insertObj = {
                email: emailData.email,
                name: emailData.name || null,
                source: emailData.source || null,
                address: null
            };
            const { error: insErr } = await supabase
                .from('pending_recipients')
                .insert([insertObj]);
            if (insErr) console.warn('Supabase insert error:', insErr.message || insErr);
        }
    } catch (err) {
        console.warn('Erreur Supabase (ignore):', err && err.message ? err.message : String(err));
    }
}

// Scraper une URL ou API
async function scrapeURL(url, category) {
    try {
        console.log(`🔍 Scraping: ${url.substring(0, 60)}...`);
        
        // Vérifier le rate limit avant la requête
        await rateLimiter.checkLimit(url);
        
        const response = await axios.get(url, {
            timeout: 15000,
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/json, text/html, */*'
            }
        });
        
        let emailsData = [];
        
        // Si c'est une API JSON
        if (typeof response.data === 'object') {
            emailsData = parseAPIData(response.data, url, category);
        } 
        // Si c'est du HTML
        else {
            const foundEmails = extractEmails(response.data);
            foundEmails.forEach(email => {
                const { name, city } = extractContactInfo(response.data, email);
                emailsData.push({ email, name, city });
            });
        }
        
    // Ajouter les emails trouvés
    let added = 0;
    for (const { email, name, city } of emailsData) {
            // Vérifier les limites
            if (emailsByCategory[category].length >= MAX_EMAILS_PER_CATEGORY) break;
            
            const totalEmails = Object.values(emailsByCategory).reduce((sum, arr) => sum + arr.length, 0);
            if (totalEmails >= MAX_EMAILS_TOTAL) break;
            
            // Vérifier si l'email n'existe pas déjà
            if (!emailsByCategory[category].find(e => e.email === email)) {
                const emailData = {
                    email,
                    name: name || 'Non spécifié',
                    city: city || 'Non spécifié',
                    source: url,
                    date: new Date(),
                    sent: false,
                    category
                };
                
                emailsByCategory[category].push(emailData);
                added++;
                
                // Persist to Supabase if configured (Supabase)
                try {
                    await upsertToSupabase(emailData);
                } catch (err) {
                    console.warn('Erreur persistance Supabase (non bloquante):', err && err.message ? err.message : String(err));
                }
            }
        }
        
        console.log(`✅ ${added} emails ajoutés depuis cette source`);
        return { success: true, found: added };
        
    } catch (error) {
        console.error(`❌ Erreur scraping: ${error.message}`);
        return { success: false, error: error.message };
    }
}

// Page principale - Rediriger vers app.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'app.html'));
});

// Stats du rate limiter (pour monitoring)
app.get('/api/rate-limiter/stats', (req, res) => {
    const stats = rateLimiter.getStats();
    res.json(stats);
});

// ===== NOUVELLES ROUTES POUR L'IMPORTATION DE CONTACTS =====

// Importer des contacts depuis Excel/CSV (avec sécurité renforcée)
app.post('/api/import-contacts', async (req, res) => {
    try {
        const { contacts } = req.body;
        
        console.log(`📥 RÉCEPTION BACKEND: ${contacts.length} contacts reçus`);
        console.log('📋 Premier contact reçu:', contacts[0]);
        console.log('📋 Détails du premier contact:');
        console.log('   - Organisation:', contacts[0].organisation);
        console.log('   - Email:', contacts[0].email);
        
        // Validation de la structure
        if (!Array.isArray(contacts)) {
            return res.status(400).json({ success: false, error: 'Format invalide' });
        }
        
        // Limiter le nombre de contacts par importation
        if (contacts.length > 10000) {
            return res.status(400).json({ 
                success: false, 
                error: 'Trop de contacts en une seule fois (maximum 10 000)' 
            });
        }
        
        // Valider et filtrer les contacts avec validation stricte
        const validContacts = [];
        const suspiciousContacts = [];
        
        contacts.forEach((contact, index) => {
            const email = (contact.email || '').trim();
            const organisation = (contact.organisation || '').trim();
            
            // Afficher les 3 premiers contacts en détail
            if (index < 3) {
                console.log(`📋 Contact ${index + 1} brut:`, contact);
                console.log(`   - Email brut: "${contact.email}" -> trim: "${email}"`);
                console.log(`   - Organisation brute: "${contact.organisation}" -> trim: "${organisation}"`);
            }
            
            // Validation stricte de l'email
            const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            
            // Vérifier les patterns suspects
            const suspiciousPatterns = [
                /test/i,
                /example/i,
                /fake/i,
                /spam/i,
                /\.test$/,
                /@example\./,
                /@localhost/,
                /@127\.0\.0\.1/
            ];
            
            const isSuspicious = suspiciousPatterns.some(pattern => 
                pattern.test(email) || pattern.test(organisation)
            );
            
            if (isSuspicious) {
                suspiciousContacts.push({ index, email, organisation });
                return;
            }
            
            // Validation de la longueur
            if (email.length > 254 || organisation.length > 255) {
                return;
            }
            
            if (email && emailRegex.test(email)) {
                validContacts.push({
                    email: email.toLowerCase(),
                    organisation: organisation ? organisation.substring(0, 255) : ''
                });
            }
        });
        
        // Logger les contacts suspects
        if (suspiciousContacts.length > 0) {
            console.log(`🚨 Contacts suspects bloqués: ${suspiciousContacts.length}`, suspiciousContacts.slice(0, 5));
        }
        
        // Vider les anciens contacts avant d'ajouter les nouveaux (remplacement)
        console.log(`🗑️ Vidage des ${importedContacts.length} anciens contacts...`);
        importedContacts.length = 0; // Vider le tableau
        
        // Vérifier la limite totale après vidage
        if (validContacts.length > MAX_CONTACTS_TOTAL) {
            return res.status(400).json({ 
                success: false, 
                error: `Trop de contacts. Maximum ${MAX_CONTACTS_TOTAL} contacts autorisés` 
            });
        }
        
        // Ajouter TOUS les contacts sans déduplication
        let added = 0;
        validContacts.forEach(contact => {
            // Ajouter directement tous les contacts valides
            importedContacts.push({
                organisation: contact.organisation || '',
                email: contact.email,
                sent: false,
                date: new Date(),
                source: 'import',
                importedAt: new Date().toISOString(),
                importIP: req.ip
            });
            added++;
        });
        
        console.log(`📥 Importation sécurisée: ${added} contacts ajoutés, 0 doublons (autorisés), ${suspiciousContacts.length} bloqués`);
        
        // Sauvegarder dans Supabase si configuré
        try {
            const supabaseResult = await saveContactsToSupabase(importedContacts);
            console.log(`💾 Supabase: ${supabaseResult.saved} sauvegardés, ${supabaseResult.errors} erreurs`);
        } catch (err) {
            console.warn('⚠️ Erreur sauvegarde Supabase (non bloquant):', err.message);
        }
        
        res.json({ 
            success: true, 
            imported: added,
            duplicates: 0,
            blocked: suspiciousContacts.length,
            total: importedContacts.length
        });
        
    } catch (error) {
        console.error('❌ Erreur importation contacts:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Erreur lors de l\'importation' 
        });
    }
});

// Obtenir tous les contacts
app.get('/api/contacts', (req, res) => {
    try {
        console.log(`📤 ENVOI AU FRONTEND: ${importedContacts.length} contacts envoyés`);
        console.log('📋 Premier contact envoyé:', importedContacts[0]);
        
        res.json({
            success: true,
            contacts: importedContacts,
            total: importedContacts.length,
            sent: importedContacts.filter(c => c.sent).length,
            pending: importedContacts.filter(c => !c.sent).length
        });
    } catch (error) {
        console.error('Erreur récupération contacts:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Erreur lors de la récupération' 
        });
    }
});

// Supprimer tous les contacts
app.delete('/api/contacts', (req, res) => {
    try {
        const count = importedContacts.length;
        importedContacts = [];
        
        console.log(`🗑️ Suppression: ${count} contacts supprimés`);
        
        res.json({ 
            success: true, 
            deleted: count 
        });
    } catch (error) {
        console.error('Erreur suppression contacts:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Erreur lors de la suppression' 
        });
    }
});

// Exporter les contacts en CSV
app.get('/api/export/contacts', (req, res) => {
    try {
        console.log(`📥 Export CSV demandé: ${importedContacts.length} contacts`);
        
        const fields = ['organisation', 'email', 'sent', 'date', 'source'];
        const parser = new Parser({ fields, delimiter: ';' });
        const csv = parser.parse(importedContacts);
        
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="contacts_${Date.now()}.csv"`);
        res.send('\uFEFF' + csv); // UTF-8 BOM for Excel
        
    } catch (error) {
        console.error('Erreur export CSV:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Erreur lors de l\'export' 
        });
    }
});

// Envoyer des emails manuels (sans stockage)
app.post('/api/send-manual-emails', async (req, res) => {
    try {
        const { subject, message, contacts } = req.body;
        
        if (!subject || !message) {
            return res.status(400).json({ error: 'Sujet et message requis' });
        }
        
        if (!Array.isArray(contacts) || contacts.length === 0) {
            return res.status(400).json({ error: 'Aucun contact à envoyer' });
        }
        
        // Valider les contacts
        const validContacts = contacts.filter(contact => {
            const email = (contact.email || '').trim();
            const organisation = (contact.organisation || '').trim();
            const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            
            return email && emailRegex.test(email); // Accepter les emails même sans organisation
        });
        
        if (validContacts.length === 0) {
            return res.status(400).json({ error: 'Aucun contact valide à envoyer' });
        }
        
        // Limiter le nombre d'envois manuels pour protection
        if (validContacts.length > 100) {
            return res.status(400).json({ 
                error: 'Trop de contacts pour envoi manuel (maximum 100)' 
            });
        }
        
        let sent = 0;
        let errors = 0;
        const errorDetails = [];

        // Vérifier la disponibilité SMTP
        try {
            await transporter.verify();
        } catch (err) {
            console.error('SMTP non disponible:', err);
            return res.status(500).json({ 
                success: false, 
                error: 'SMTP non configuré ou authentification échouée' 
            });
        }

        // Envoyer les emails un par un avec pause
        for (const contact of validContacts) {
            try {
                const mailOptions = {
                    from: `"HyperEmail" <${resolvedSmtp.auth.user}>`,
                    to: contact.email,
                    subject: subject,
                    text: message + `\n\n---\n📧 Cet email est envoyé via HyperEmail. Une confirmation de lecture sera demandée.`,
                    html: message.replace(/\n/g, '<br>') + `<br><br><hr><p><small>📧 Cet email est envoyé via HyperEmail. Une confirmation de lecture sera demandée.</small></p>`,
                    // En-têtes anti-spam
                    headers: {
                        'X-Priority': '3', // Priorité normale
                        'X-Mailer': 'HyperEmail System',
                        'X-Auto-Response-Suppress': 'All',
                        'List-Unsubscribe': `<mailto:${resolvedSmtp.auth.user}>?subject=unsubscribe`,
                        'Reply-To': resolvedSmtp.auth.user,
                        'Disposition-Notification-To': resolvedSmtp.auth.user, // Accusé de réception
                        'Return-Receipt-To': resolvedSmtp.auth.user // Accusé de lecture
                    }
                };

                await transporter.sendMail(mailOptions);
                sent++;
                
                console.log(`✅ Email manuel envoyé à ${contact.email} (${contact.organisation})`);
                
                // Pause de 3 secondes entre chaque email
                if (sent < validContacts.length) {
                    await new Promise(resolve => setTimeout(resolve, 3000));
                }
                
            } catch (error) {
                console.error(`❌ Erreur envoi manuel à ${contact.email}:`, error.message);
                errors++;
                errorDetails.push({ email: contact.email, error: error.message });
            }
        }

        console.log(`📊 Envoi manuel terminé: ${sent} envoyés, ${errors} erreurs`);
        
        res.json({
            success: true,
            sent,
            errors,
            total: validContacts.length,
            errorDetails
        });
        
    } catch (error) {
        console.error('Erreur envoi emails manuels:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Erreur lors de l\'envoi manuel' 
        });
    }
});

// Envoyer des emails aux contacts importés
app.post('/api/send-emails', async (req, res) => {
    try {
        const { subject, message, limit } = req.body;
        
        if (!subject || !message) {
            return res.status(400).json({ error: 'Sujet et message requis' });
        }
        
        const toSend = importedContacts.filter(c => !c.sent).slice(0, limit || importedContacts.length);
        
        if (toSend.length === 0) {
            return res.status(400).json({ error: 'Aucun contact à envoyer' });
        }
        
        let sent = 0;
        let errors = 0;
        const errorDetails = [];

        // Vérifier la disponibilité SMTP
        try {
            await transporter.verify();
        } catch (err) {
            console.error('SMTP non disponible:', err);
            return res.status(500).json({ 
                success: false, 
                error: 'SMTP non configuré ou authentification échouée' 
            });
        }

        // Envoyer les emails un par un avec pause
        for (const contact of toSend) {
            try {
                const mailOptions = {
                    from: `"HyperEmail" <${resolvedSmtp.auth.user}>`,
                    to: contact.email,
                    subject: subject,
                    text: message + `\n\n---\n📧 Cet email est envoyé via HyperEmail. Une confirmation de lecture sera demandée.`,
                    html: message.replace(/\n/g, '<br>') + `<br><br><hr><p><small>📧 Cet email est envoyé via HyperEmail. Une confirmation de lecture sera demandée.</small></p>`,
                    // En-têtes anti-spam
                    headers: {
                        'X-Priority': '3', // Priorité normale
                        'X-Mailer': 'HyperEmail System',
                        'X-Auto-Response-Suppress': 'All',
                        'List-Unsubscribe': `<mailto:${resolvedSmtp.auth.user}>?subject=unsubscribe`,
                        'Reply-To': resolvedSmtp.auth.user,
                        'Disposition-Notification-To': resolvedSmtp.auth.user, // Accusé de réception
                        'Return-Receipt-To': resolvedSmtp.auth.user // Accusé de lecture
                    }
                };

                await transporter.sendMail(mailOptions);
                
                // Marquer comme envoyé
                contact.sent = true;
                contact.sentDate = new Date();
                sent++;
                
                // Sauvegarder le statut dans Supabase
                try {
                    const supabase = getSupabase();
                    await supabase
                        .from('contacts')
                        .update({ 
                            sent: true, 
                            sent_date: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                        })
                        .eq('email', contact.email);
                } catch (err) {
                    console.warn(`⚠️ Erreur mise à jour statut Supabase pour ${contact.email}:`, err.message);
                }
                
                console.log(`✅ Email envoyé à ${contact.email} (${contact.organisation})`);
                
                // Pause de 3 secondes entre chaque email
                if (sent < toSend.length) {
                    await new Promise(resolve => setTimeout(resolve, 3000));
                }
                
            } catch (error) {
                console.error(`❌ Erreur envoi à ${contact.email}:`, error.message);
                errors++;
                errorDetails.push({ email: contact.email, error: error.message });
            }
        }

        console.log(`📊 Envoi terminé: ${sent} envoyés, ${errors} erreurs`);
        
        res.json({
            success: true,
            sent,
            errors,
            total: toSend.length,
            errorDetails
        });
        
    } catch (error) {
        console.error('Erreur envoi emails:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Erreur lors de l\'envoi' 
        });
    }
});

// ===== FIN DES NOUVELLES ROUTES =====

// Démarrage du serveur
server.listen(PORT, async () => {
    console.log('\n╔════════════════════════════════════════════╗');
    console.log('║          ⚡ HYPEREMAIL ⚡                  ║');
    console.log('╚════════════════════════════════════════════╝\n');
    console.log(`🚀 Serveur: http://localhost:${PORT}`);
    console.log(`📧 Contacts importés: ${importedContacts.length}`);
    const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
    console.log(`\n✅ SMTP: ${smtpUser || '⚠️  Non configuré'}\n`);
});
