require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs').promises;
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const crypto = require('crypto');

const app = express();

// Middleware de sécurité
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
            scriptSrcAttr: ["'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"]
        }
    }
}));

// Rate limiting pour le login
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // maximum 5 tentatives
    message: { success: false, error: 'Trop de tentatives de connexion. Réessayez plus tard.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limiting général pour les API (plus permissif)
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // augmenté à 1000 requêtes
    message: { success: false, error: 'Trop de requêtes. Réessayez plus tard.' },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        // Ne pas limiter les ressources statiques
        return req.url.includes('.') && !req.url.includes('/api/');
    }
});

app.use(apiLimiter);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());
app.use(express.static('public'));

// Configuration SMTP
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    },
    tls: { rejectUnauthorized: false }
});

// Variables globales
let importedContacts = [];
const emailTracking = new Map(); // Suivi des emails envoyés

// Sécurité : JWT secret aléatoire ou depuis environnement
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');

// Credentials sécurisés depuis environnement uniquement
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASS = process.env.ADMIN_PASS;

// Vérification des credentials au démarrage
if (!ADMIN_EMAIL || !ADMIN_PASS) {
    console.error('🚨 ERREUR: ADMIN_EMAIL et ADMIN_PASS doivent être définis dans les variables d\'environnement');
    process.exit(1);
}

// Fichiers de persistance
const DATA_DIR = path.join(__dirname, 'data');
const CONTACTS_FILE = path.join(DATA_DIR, 'contacts.json');
const TRACKING_FILE = path.join(DATA_DIR, 'tracking.json');
const MANUAL_RECIPIENTS_FILE = path.join(DATA_DIR, 'manual-recipients.json');

// Destinataires manuels persistants
let manualRecipients = [];

// Assurer que le dossier data existe
async function ensureDataDir() {
    try {
        await fs.mkdir(DATA_DIR, { recursive: true });
    } catch (error) {
        console.log('📁 Dossier data déjà existant');
    }
}

// Sauvegarder les contacts dans un fichier
async function saveContactsToFile() {
    try {
        await ensureDataDir();
        await fs.writeFile(CONTACTS_FILE, JSON.stringify(importedContacts, null, 2));
        console.log(`💾 ${importedContacts.length} contacts sauvegardés dans ${CONTACTS_FILE}`);
    } catch (error) {
        console.error('❌ Erreur sauvegarde contacts:', error);
    }
}

// Charger les contacts depuis un fichier
async function loadContactsFromFile() {
    try {
        await ensureDataDir();
        const data = await fs.readFile(CONTACTS_FILE, 'utf8');
        importedContacts = JSON.parse(data);
        console.log(`📂 ${importedContacts.length} contacts chargés depuis ${CONTACTS_FILE}`);
        return true;
    } catch (error) {
        console.log('📂 Aucun fichier de contacts trouvé, démarrage avec liste vide');
        importedContacts = [];
        return false;
    }
}

// Sauvegarder le tracking dans un fichier
async function saveTrackingToFile() {
    try {
        await ensureDataDir();
        const trackingObject = Object.fromEntries(emailTracking);
        await fs.writeFile(TRACKING_FILE, JSON.stringify(trackingObject, null, 2));
        console.log(`💾 ${emailTracking.size} suivis sauvegardés dans ${TRACKING_FILE}`);
    } catch (error) {
        console.error('❌ Erreur sauvegarde tracking:', error);
    }
}

// Charger le tracking depuis un fichier
async function loadTrackingFromFile() {
    try {
        await ensureDataDir();
        const data = await fs.readFile(TRACKING_FILE, 'utf8');
        const trackingObject = JSON.parse(data);
        emailTracking.clear();
        Object.entries(trackingObject).forEach(([key, value]) => {
            emailTracking.set(key, value);
        });
        console.log(`📂 ${emailTracking.size} suivis chargés depuis ${TRACKING_FILE}`);
        return true;
    } catch (error) {
        console.log('📂 Aucun fichier de tracking trouvé, démarrage avec suivi vide');
        emailTracking.clear();
        return false;
    }
}

// Sauvegarde automatique toutes les 5 minutes
setInterval(async () => {
    await saveContactsToFile();
    await saveTrackingToFile();
    await saveManualRecipientsToFile();
}, 5 * 60 * 1000); // 5 minutes

// Sauvegarder les destinataires manuels dans un fichier
async function saveManualRecipientsToFile() {
    try {
        await ensureDataDir();
        await fs.writeFile(MANUAL_RECIPIENTS_FILE, JSON.stringify(manualRecipients, null, 2));
        console.log(`💾 ${manualRecipients.length} destinataires manuels sauvegardés`);
    } catch (error) {
        console.error('❌ Erreur sauvegarde destinataires manuels:', error);
    }
}

// Charger les destinataires manuels depuis un fichier
async function loadManualRecipientsFromFile() {
    try {
        await ensureDataDir();
        const data = await fs.readFile(MANUAL_RECIPIENTS_FILE, 'utf8');
        manualRecipients = JSON.parse(data);
        console.log(`📂 ${manualRecipients.length} destinataires manuels chargés`);
        return true;
    } catch (error) {
        console.log('📂 Aucun fichier de destinataires manuels trouvé, démarrage avec liste vide');
        manualRecipients = [];
        return false;
    }
}

// Route de login avec rate limiting
app.post('/api/login', loginLimiter, (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('🔐 Tentative de connexion:', { email });
        
        if (!email || !password) {
            return res.status(400).json({ success: false, error: 'Email et mot de passe requis' });
        }
        
        if (email === ADMIN_EMAIL && password === ADMIN_PASS) {
            const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: '2h' });
            
            res.cookie('jwt', token, {
                httpOnly: true,
                secure: false,
                sameSite: 'strict',
                maxAge: 7200000,
                path: '/'
            });
            
            console.log('✅ Connexion réussie pour:', email);
            return res.json({ success: true, token });
        }
        
        console.log('❌ Échec de connexion pour:', email);
        res.status(401).json({ success: false, error: 'Identifiants invalides' });
        
    } catch (error) {
        console.error('❌ Erreur login:', error);
        res.status(500).json({ success: false, error: 'Erreur serveur' });
    }
});

// Middleware pour vérifier le JWT
const verifyToken = (req, res, next) => {
    if (req.path === '/login.html' || req.path.startsWith('/api/login')) {
        return next();
    }

    const token = req.cookies.jwt;
    if (!token) {
        return res.status(401).json({ success: false, error: 'Token manquant' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ success: false, error: 'Token invalide' });
    }
};

app.use('/api', verifyToken);

// Routes API
// Tableau de bord de suivi en temps réel
app.get('/api/dashboard-stats', (req, res) => {
    try {
        const tracking = Array.from(emailTracking.entries()).map(([emailId, data]) => ({
            emailId,
            ...data
        }));
        
        const stats = {
            // Stats contacts
            totalContacts: importedContacts.length,
            sentContacts: importedContacts.filter(c => c.sent).length,
            pendingContacts: importedContacts.filter(c => !c.sent).length,
            
            // Stats tracking
            totalSent: tracking.length,
            totalOpened: tracking.filter(t => t.opened).length,
            totalReplied: tracking.filter(t => t.replied).length,
            
            // Taux de conversion
            openRate: tracking.length > 0 ? Math.round((tracking.filter(t => t.opened).length / tracking.length) * 100) : 0,
            
            // Dernières activités
            recentOpens: tracking
                .filter(t => t.opened)
                .sort((a, b) => new Date(b.openedAt) - new Date(a.openedAt))
                .slice(0, 5),
                
            recentSends: tracking
                .sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt))
                .slice(0, 5),
                
            // Liste complète pour l'interface
            allTracking: tracking.sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt))
        };
        
        res.json({
            success: true,
            stats,
            tracking,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Erreur dashboard:', error);
        res.status(500).json({ success: false, error: 'Erreur dashboard' });
    }
});

// Obtenir les statistiques de suivi
app.get('/api/email-tracking', (req, res) => {
    try {
        const tracking = Array.from(emailTracking.entries()).map(([email, data]) => ({
            email,
            ...data
        }));
        
        res.json({
            success: true,
            tracking,
            total: tracking.length,
            sent: tracking.filter(t => t.status === 'sent').length,
            opened: tracking.filter(t => t.opened).length,
            replied: tracking.filter(t => t.replied).length
        });
    } catch (error) {
        console.error('❌ Erreur tracking:', error);
        res.status(500).json({ success: false, error: 'Erreur tracking' });
    }
});

// Marquer un email comme ouvert (tracking pixel)
app.get('/api/track-open/:emailId', (req, res) => {
    try {
        const { emailId } = req.params;
        const tracking = emailTracking.get(emailId);
        
        if (tracking) {
            tracking.opened = true;
            tracking.openedAt = new Date();
            tracking.openCount = (tracking.openCount || 0) + 1;
            emailTracking.set(emailId, tracking);
            console.log(`📧 Email ouvert: ${tracking.email}`);
        }
        
        // Retourner un pixel transparent 1x1
        res.setHeader('Content-Type', 'image/png');
        res.send(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64'));
    } catch (error) {
        console.error('❌ Erreur tracking open:', error);
        res.status(500).send('');
    }
});

app.get('/api/contacts', (req, res) => {
    res.json({
        success: true,
        contacts: importedContacts,
        total: importedContacts.length
    });
});

// API pour les destinataires manuels persistants
app.get('/api/manual-recipients', (req, res) => {
    res.json({
        success: true,
        recipients: manualRecipients,
        total: manualRecipients.length
    });
});

app.post('/api/manual-recipients', async (req, res) => {
    try {
        const { recipients } = req.body;
        
        if (!Array.isArray(recipients)) {
            return res.status(400).json({ success: false, error: 'Format invalide' });
        }
        
        // Valider les destinataires
        const validRecipients = recipients.filter(recipient => {
            const email = (recipient.email || '').trim();
            const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            return email && emailRegex.test(email);
        });
        
        manualRecipients = validRecipients;
        
        // Sauvegarder automatiquement
        await saveManualRecipientsToFile();
        
        console.log(`💾 ${manualRecipients.length} destinataires manuels sauvegardés`);
        
        res.json({
            success: true,
            recipients: manualRecipients,
            total: manualRecipients.length
        });
        
    } catch (error) {
        console.error('❌ Erreur sauvegarde destinataires manuels:', error);
        res.status(500).json({ success: false, error: 'Erreur sauvegarde' });
    }
});

app.delete('/api/manual-recipients', async (req, res) => {
    try {
        const count = manualRecipients.length;
        manualRecipients = [];
        
        // Sauvegarder automatiquement
        await saveManualRecipientsToFile();
        
        console.log(`🗑️ ${count} destinataires manuels supprimés`);
        
        res.json({
            success: true,
            message: `${count} destinataires supprimés avec succès`
        });
        
    } catch (error) {
        console.error('❌ Erreur suppression destinataires manuels:', error);
        res.status(500).json({ success: false, error: 'Erreur suppression' });
    }
});

app.post('/api/import-contacts', async (req, res) => {
    try {
        const { contacts } = req.body;
        console.log(`📥 Importation: ${contacts.length} contacts reçus`);
        
        // Vider les anciens contacts
        importedContacts = [];
        
        // Ajouter les nouveaux contacts
        contacts.forEach(contact => {
            importedContacts.push({
                email: contact.email,
                organisation: contact.organisation || '',
                sent: false,
                date: new Date(),
                source: 'import'
            });
        });
        
        console.log(`✅ ${importedContacts.length} contacts importés`);
        
        // Sauvegarder automatiquement après importation
        await saveContactsToFile();
        
        res.json({
            success: true,
            imported: importedContacts.length,
            total: importedContacts.length
        });
        
    } catch (error) {
        console.error('❌ Erreur importation:', error);
        res.status(500).json({ success: false, error: 'Erreur importation' });
    }
});

app.post('/api/send-emails', async (req, res) => {
    try {
        const { subject, message } = req.body;
        
        if (!subject || !message) {
            return res.status(400).json({ error: 'Sujet et message requis' });
        }
        
        const toSend = importedContacts.filter(c => !c.sent);
        
        if (toSend.length === 0) {
            return res.status(400).json({ error: 'Aucun contact à envoyer' });
        }
        
        let sent = 0;
        let errors = 0;
        
        for (const contact of toSend) {
            try {
                // Générer un ID unique pour le tracking
                const emailId = Buffer.from(`${contact.email}-${Date.now()}`).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
                
                // Enregistrer le suivi
                emailTracking.set(emailId, {
                    email: contact.email,
                    organisation: contact.organisation,
                    subject: subject,
                    sentAt: new Date(),
                    status: 'sent',
                    opened: false,
                    replied: false
                });
                
                const trackingPixel = `<img src="http://localhost:3000/api/track-open/${emailId}" width="1" height="1" style="display:none;">`;
                
                const mailOptions = {
                    from: `"EXPOBETONRDC" <${process.env.SMTP_USER}>`,
                    to: contact.email,
                    subject: subject,
                    text: message + `\n\n---\n📧 Cet email est envoyé via EXPOBETONRDC\n🔍 Suivi d'ouverture activé`,
                    html: `
                        ${message.replace(/\n/g, '<br>')}
                        <br><br><hr>
                        <p style="color: #666; font-size: 12px;">
                            📧 Cet email est envoyé via EXPOBETONRDC<br>
                            🔍 Suivi d'ouverture activé
                        </p>
                        ${trackingPixel}
                    `
                };

                await transporter.sendMail(mailOptions);
                contact.sent = true;
                contact.sentDate = new Date();
                sent++;
                
                console.log(`✅ Email envoyé à ${contact.email} (ID: ${emailId})`);
                
                // Pause de 3 secondes
                if (sent < toSend.length) {
                    await new Promise(resolve => setTimeout(resolve, 3000));
                }
                
            } catch (error) {
                console.error(`❌ Erreur envoi à ${contact.email}:`, error.message);
                errors++;
            }
        }

        res.json({
            success: true,
            sent,
            errors,
            total: toSend.length
        });
        
    } catch (error) {
        console.error('❌ Erreur envoi emails:', error);
        res.status(500).json({ success: false, error: 'Erreur envoi' });
    }
});

// Envoyer des emails manuels
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
            const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            return email && emailRegex.test(email);
        });
        
        if (validContacts.length === 0) {
            return res.status(400).json({ error: 'Aucun contact valide à envoyer' });
        }
        
        // Limiter le nombre d'envois manuels
        if (validContacts.length > 100) {
            return res.status(400).json({ 
                error: 'Trop de contacts pour envoi manuel (maximum 100)' 
            });
        }
        
        let sent = 0;
        let errors = 0;
        
        for (const contact of validContacts) {
            try {
                // Générer un ID de suivi unique
                const emailId = Buffer.from(`${contact.email}-${Date.now()}`).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
                
                // Créer le tracking pixel
                const trackingPixel = `<img src="http://localhost:3000/api/track-open/${emailId}" width="1" height="1" style="display:none;">`;
                
                const mailOptions = {
                    from: `"EXPOBETONRDC" <${process.env.SMTP_USER}>`,
                    to: contact.email,
                    subject: subject,
                    text: message,
                    html: message.replace(/\n/g, '<br>') + trackingPixel
                };

                await transporter.sendMail(mailOptions);
                sent++;
                
                // Enregistrer le suivi pour les emails manuels
                emailTracking.set(emailId, {
                    email: contact.email,
                    organisation: contact.organisation || 'Manuel',
                    subject: subject,
                    sentAt: new Date().toISOString(),
                    opened: false,
                    openedAt: null,
                    openCount: 0,
                    type: 'manual',
                    replied: false
                });
                
                console.log(`✅ Email manuel envoyé à ${contact.email} (ID: ${emailId})`);
                
                // Pause de 3 secondes
                if (sent < validContacts.length) {
                    await new Promise(resolve => setTimeout(resolve, 3000));
                }
                
            } catch (error) {
                console.error(`❌ Erreur envoi manuel à ${contact.email}:`, error.message);
                errors++;
            }
        }

        res.json({
            success: true,
            sent,
            errors,
            total: validContacts.length
        });
        
        // Sauvegarder le tracking après envoi manuel
        await saveTrackingToFile();
        console.log(`💾 ${sent} emails manuels sauvegardés dans le suivi`);
        
    } catch (error) {
        console.error('❌ Erreur envoi emails manuels:', error);
        res.status(500).json({ success: false, error: 'Erreur lors de l\'envoi des emails' });
    }
});

// Démarrage serveur
const PORT = process.env.PORT || 3000;

async function startServer() {
    // Charger les données persistantes au démarrage
    console.log('🔄 Chargement des données persistantes...');
    await loadContactsFromFile();
    await loadTrackingFromFile();
    await loadManualRecipientsFromFile();
    
    app.listen(PORT, () => {
        console.log('╔════════════════════════════════════════════╗');
        console.log('║         🚀  HYPEREMAIL PERSISTANT        ║');
        console.log('╚════════════════════════════════════════════╝');
        console.log(`🚀 Serveur: http://localhost:${PORT}`);
        console.log(`📧 Contacts: ${importedContacts.length}`);
        console.log(`👥 Destinataires manuels: ${manualRecipients.length}`);
        console.log(`📊 Tracking: ${emailTracking.size} suivis`);
        console.log(`✅ SMTP: ${process.env.SMTP_USER}`);
        console.log('💾 Persistance: Activée (fichiers locaux)');
        console.log('🔄 Auto-save: Toutes les 5 minutes');
        console.log('✅ Serveur prêt !');
    });
}

startServer();
