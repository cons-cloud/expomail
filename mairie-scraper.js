require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Configuration anti-spam
const EMAIL_CONFIG = {
    DELAY_BETWEEN_EMAILS: 5000, // 5 secondes entre chaque email
    MAX_EMAILS_PER_HOUR: 100,
    BATCH_SIZE: 10, // Nombre d'emails par lot
    DELAY_BETWEEN_BATCHES: 30000 // 30 secondes entre les lots
};

// Base de données en mémoire par catégorie
let emailsByCategory = {
    mairies: [],
    justice: [],
    ministeres: [],
    prefectures: [],
    autres: []
};
let stats = { scraped: 0, sent: 0, errors: 0 };

// Sources supplémentaires d'emails de mairies
const MAIRIE_SOURCES = {
    ANNUAIRE_MAIRIES: [
        'https://www.annuaire-des-mairies.com',
        'https://www.mairies-de-france.fr',
        'https://www.communes.com',
        'https://www.annuaire-mairie.fr',
        'https://www.cartesfrance.fr/carte-france-ville/mairies.html',
        'https://www.maires-france.com'
    ],
    DEPARTEMENTS: Array.from({length: 96}, (_, i) => i + 1)
        .concat([971, 972, 973, 974, 976])  // Ajouter les DOM-TOM
        .map(num => num.toString().padStart(2, '0'))
};

// Configuration SMTP optimisée avec anti-spam
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === '1',
    auth: {
        user: process.env.SMTP_USER || process.env.EMAIL_USER,
        pass: process.env.SMTP_PASS || process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false
    },
    pool: true, // Utiliser le pooling pour les connexions
    maxConnections: 5,
    maxMessages: 100,
    rateDelta: 1000,
    rateLimit: 5 // Limite de 5 emails par seconde
});

// Fonction pour extraire les emails avec validation améliorée
function extractEmails(html, category = 'mairies') {
    const EMAIL_PATTERNS = [
            /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
            /mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g
    ];
    
    const emails = new Set();
    const $ = cheerio.load(html);
    
    // Extraire les emails du HTML
        EMAIL_PATTERNS.forEach(pattern => {
            const matches = html.match(pattern) || [];
            matches.forEach(email => {
                email = email.replace('mailto:', '').toLowerCase();
                // Validation adaptée par catégorie
                if (category === 'mairies') {
                    if (email.includes('mairie') || 
                        email.includes('ville-') || 
                        email.includes('ville.') || 
                        email.includes('commune') ||
                        email.endsWith('.fr')) {
                        emails.add(email);
                    }
                } else {
                    // Pour les autres catégories, accepter plus largement les adresses
                    // se terminant par .fr ou contenant des mots-clés utiles
                    const keywords = ['justice','tribunal','procureur','minister','minist','prefect','prefecture','service','gouv','admin','mairie','ville','commune'];
                    if (email.endsWith('.fr') || keywords.some(k => email.includes(k))) {
                        emails.add(email);
                    }
                }
            });
        });

        // Extraire les emails des liens mailto
        $('a[href^="mailto:"]').each((_, element) => {
            let email = $(element).attr('href').replace('mailto:', '').toLowerCase();
            if (category === 'mairies') {
                if (email.includes('mairie') || email.includes('ville') || email.endsWith('.fr')) {
                    emails.add(email);
                }
            } else {
                const keywords = ['justice','tribunal','procureur','minister','minist','prefect','prefecture','service','gouv','admin'];
                if (email.endsWith('.fr') || keywords.some(k => email.includes(k))) {
                    emails.add(email);
                }
            }
        });

    // Extraire les emails des attributs href et data
    $('a[href^="mailto:"]').each((_, element) => {
        let email = $(element).attr('href').replace('mailto:', '').toLowerCase();
        if (email.includes('mairie') || email.includes('ville') || email.endsWith('.fr')) {
            emails.add(email);
        }
    });

    return Array.from(emails);
}

// Helper: scan objects/arrays/strings for emails (used for JSON API responses)
function findEmailsInObject(obj, path = '') {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const found = new Set();

    function scan(o) {
        if (o === null || o === undefined) return;
        if (typeof o === 'string') {
            // try parse JSON string
            const s = o.trim();
            if ((s.startsWith('{') || s.startsWith('['))) {
                try { scan(JSON.parse(s)); return; } catch (e) {}
            }
            const m = o.match(emailRegex) || [];
            m.forEach(e => found.add(e.toLowerCase()));
            return;
        }
        if (Array.isArray(o)) {
            o.forEach(i => scan(i));
            return;
        }
        if (typeof o === 'object') {
            Object.keys(o).forEach(k => scan(o[k]));
            return;
        }
    }

    scan(obj);
    return Array.from(found);
}

// Fonction pour scraper une URL avec retry et récupération des liens
async function scrapeURL(url, retryCount = 0, category = 'mairies') {
    try {
        console.log(`📍 Analyse de ${url}`);
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'fr,fr-FR;q=0.9,en;q=0.8',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            },
            timeout: 10000
        });

            // Si la réponse est JSON (API), rechercher des emails dans l'objet
            let emails = [];
            if (typeof response.data === 'object') {
                emails = findEmailsInObject(response.data);
            } else {
                const $ = cheerio.load(response.data);
                emails = extractEmails($.html(), category);
            }

            // Ajouter les emails trouvés à la base de données pour la catégorie fournie
            emails.forEach(email => {
                const list = emailsByCategory[category] || [];
                if (!list.find(e => e.email === email)) {
                    emailsByCategory[category].push({
                        email,
                        source: url,
                        date: new Date(),
                        sent: false,
                        validated: true
                    });
                    stats.scraped++;
                }
            });

        if (emails.length > 0) {
            console.log(`✅ Trouvé ${emails.length} email(s) sur ${url}`);
        }

        // Récupérer les liens vers d'autres pages de mairies
        const links = new Set();
        $('a[href]').each((_, element) => {
            const href = $(element).attr('href');
            if (href && (
                href.includes('mairie') ||
                href.includes('commune') ||
                href.includes('ville')
            )) {
                try {
                    const fullUrl = new URL(href, url).href;
                    links.add(fullUrl);
                } catch (e) {
                    // Ignorer les URLs invalides
                }
            }
        });

        return { 
            success: true, 
            found: emails.length,
            emails,
            links: Array.from(links)
        };
    } catch (error) {
        console.error(`❌ Erreur pour ${url}:`, error.message);
        if (retryCount < 3) {
            console.log(`🔄 Tentative ${retryCount + 1}/3...`);
            await new Promise(resolve => setTimeout(resolve, 5000));
            return scrapeURL(url, retryCount + 1);
        }
        return { 
            success: false, 
            error: error.message,
            emails: [],
            links: []
        };
    }
}

// URLs par catégorie
const urlsByCategory = {
    mairies: [
        'https://www.annuaire-mairie.fr',
        'https://www.communes.com',
        'https://www.cartesfrance.fr/carte-france-ville/mairies.html',
        'https://www.maires-france.com'
    ],
    justice: [
        'https://www.justice.gouv.fr',
        'https://www.annuaires.justice.gouv.fr',
        'https://www.conseil-constitutionnel.fr',
        'https://www.courdecassation.fr'
    ],
    ministeres: [
        'https://www.gouvernement.fr',
        'https://www.interieur.gouv.fr',
        'https://www.education.gouv.fr',
        'https://www.economie.gouv.fr',
        'https://www.sante.gouv.fr'
    ],
    prefectures: [
        'https://www.interieur.gouv.fr/Le-ministere/Prefectures',
        'https://lannuaire.service-public.fr'
    ]
};

// Messages par défaut par catégorie
const defaultMessages = {
    mairies: {
        subject: 'Demande de parrainage pour l\'élection présidentielle',
        message: `Monsieur le Maire,

Je vous adresse cette lettre dans le cadre de ma candidature à l'élection présidentielle de 2027, en sollicitant votre parrainage tel que prévu par la loi.

Ma démarche repose sur un engagement fort : lutter contre les injustices sociales, économiques et humaines qui affectent notre société. Il est temps de redonner à chaque homme sa dignité, sa place et ses droits fondamentaux.

Ce parrainage ne constitue pas un soutien politique, mais un acte démocratique permettant le pluralisme et l'expression citoyenne. Je serais honoré de pouvoir compter sur votre signature pour porter cette voix jusqu'au peuple français.

Je reste à votre disposition pour vous transmettre davantage d'informations ou échanger sur cette initiative.

Veuillez agréer, Monsieur le Maire, l'expression de mes salutations respectueuses.

Imam Coban`
    }
};

// API: Page principale
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API: Démarrer le scraping automatique
app.post('/api/scrape-mairies', async (req, res) => {
    const { urls } = req.body;
    const urlsToScrape = urls && urls.length > 0 ? urls : MAIRIE_SOURCES.ANNUAIRE_MAIRIES;
    const processedUrls = new Set();
    let results = [];

    async function processUrl(url, depth = 0) {
        if (processedUrls.has(url) || depth > 2) return;
        processedUrls.add(url);

        const result = await scrapeURL(url);
        results.push({ url, ...result });

        // Traiter jusqu'à 5 liens supplémentaires par niveau
        if (result.success && depth < 2) {
            const subLinks = result.links.slice(0, 5);
            for (const link of subLinks) {
                if (!processedUrls.has(link)) {
                    await processUrl(link, depth + 1);
                }
            }
        }
    }

    try {
        // Traiter les URLs en parallèle avec limite de concurrence
        const chunks = [];
        for (let i = 0; i < urlsToScrape.length; i += 5) {
            chunks.push(urlsToScrape.slice(i, i + 5));
        }

        for (const chunk of chunks) {
            await Promise.all(chunk.map(url => processUrl(url)));
            // Pause entre les chunks pour éviter la surcharge
            if (chunks.indexOf(chunk) < chunks.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }

        res.json({
            success: true,
            results,
            urlsProcessed: processedUrls.size,
            totalEmails: emailsByCategory.mairies.length,
            newEmails: stats.scraped,
            stats
        });
    } catch (error) {
        console.error('Erreur scraping:', error);
        res.status(500).json({ 
            error: 'Erreur lors du scraping',
            partialResults: {
                urlsProcessed: processedUrls.size,
                results
            }
        });
    }
});

// Endpoint générique pour scraper une catégorie (justice, ministeres, prefectures, autres)
app.post('/api/scrape/:category', async (req, res) => {
    const category = req.params.category;
    if (!urlsByCategory[category]) {
        return res.status(400).json({ success: false, error: 'Catégorie inconnue' });
    }

    const urlsToScrape = urlsByCategory[category];
    const processedUrls = new Set();
    let results = [];

    async function processUrlCategory(url, depth = 0) {
        if (processedUrls.has(url) || depth > 2) return;
        processedUrls.add(url);

        const result = await scrapeURL(url, 0, category);
        results.push({ url, ...result });

        if (result.success && depth < 2) {
            const subLinks = result.links.slice(0, 5);
            for (const link of subLinks) {
                if (!processedUrls.has(link)) {
                    await processUrlCategory(link, depth + 1);
                }
            }
        }
    }

    try {
        const chunks = [];
        for (let i = 0; i < urlsToScrape.length; i += 5) {
            chunks.push(urlsToScrape.slice(i, i + 5));
        }

        for (const chunk of chunks) {
            await Promise.all(chunk.map(url => processUrlCategory(url)));
            if (chunks.indexOf(chunk) < chunks.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }

        // Ajouter les emails trouvés dans la catégorie
        let added = 0;
        results.forEach(r => {
            (r.emails || []).forEach(email => {
                if (!emailsByCategory[category].find(e => e.email === email)) {
                    emailsByCategory[category].push({
                        email,
                        source: r.url,
                        date: new Date(),
                        sent: false,
                        validated: true
                    });
                    added++;
                }
            });
        });

        return res.json({ success: true, results, urlsProcessed: processedUrls.size, newEmails: added, totalEmails: emailsByCategory[category].length });
    } catch (error) {
        console.error('Erreur scraping catégorie', category, error);
        return res.status(500).json({ success: false, error: error.message, partialResults: { urlsProcessed: processedUrls.size, results } });
    }
});

// API: Obtenir les emails
app.get('/api/emails', (req, res) => {
    res.json({
        total: emails.length,
        sent: emails.filter(e => e.sent).length,
        pending: emails.filter(e => !e.sent).length,
        emails: emails,
        stats
    });
});

// Configuration anti-spam pour l'envoi d'emails
async function sendEmailWithAntiSpam(emailData, subject, html) {
    try {
        // Personnalisation du message pour chaque mairie
        const customHtml = html.replace('{MAIRIE}', emailData.email.split('@')[0]
            .replace('mairie', '')
            .replace('ville', '')
            .replace(/[.-]/g, ' ')
            .trim()
            .toUpperCase()
        );

        // Configuration de l'email avec les en-têtes anti-spam
        const mailOptions = {
            from: {
                name: process.env.SMTP_NAME || 'Service Démocratique',
                address: process.env.SMTP_USER || process.env.EMAIL_USER
            },
            to: emailData.email,
            subject: subject,
            html: customHtml,
            headers: {
                'X-Priority': '3',
                'X-MSMail-Priority': 'Normal',
                'Importance': 'Normal',
                'X-Mailer': 'Democratie-Service/1.0',
                'List-Unsubscribe': `<mailto:${process.env.SMTP_USER || process.env.EMAIL_USER}?subject=unsubscribe>`,
                'Feedback-ID': `${Date.now()}:mairie:democratie-service:1`
            }
        };
            // Envoyer aussi une copie invisible à l'expéditeur pour garantir que
            // l'expéditeur reçoive une copie dans sa boîte (Gmail 'Envoyés' / Inbox)
            mailOptions.bcc = process.env.SMTP_USER || process.env.EMAIL_USER;

        await transporter.sendMail(mailOptions);
        emailData.sent = true;
        emailData.sentAt = new Date();
        stats.sent++;
        console.log(`📧 Email envoyé à ${emailData.email}`);
        return true;
    } catch (error) {
        console.error(`❌ Erreur d'envoi à ${emailData.email}:`, error.message);
        stats.errors++;
        return false;
    }
}

// API: Envoyer les emails avec gestion anti-spam
app.post('/api/send', async (req, res) => {
    const { subject, message, limit, category = 'mairies' } = req.body;
    
    const emailUser = process.env.SMTP_USER || process.env.EMAIL_USER;
    if (!emailUser) {
        return res.status(500).json({ error: 'Configuration SMTP manquante (SMTP_USER ou EMAIL_USER)' });
    }
    
    if (!subject || !message) {
        return res.status(400).json({ error: 'Sujet et message requis' });
    }
    
    // Récupérer les emails non envoyés de la catégorie
    const toSend = emailsByCategory[category]
        .filter(e => !e.sent && e.validated)
        .slice(0, limit || EMAIL_CONFIG.BATCH_SIZE);
    
    let sent = 0;
    let errors = 0;
    
    // Diviser en lots pour l'envoi
    const batches = [];
    for (let i = 0; i < toSend.length; i += EMAIL_CONFIG.BATCH_SIZE) {
        batches.push(toSend.slice(i, i + EMAIL_CONFIG.BATCH_SIZE));
    }
    
    try {
        for (const batch of batches) {
            // Envoi en parallèle dans chaque lot
            const results = await Promise.all(
                batch.map(emailData => sendEmailWithAntiSpam(emailData, subject, message))
            );
            
            sent += results.filter(r => r).length;
            errors += results.filter(r => !r).length;
            
            // Attendre entre les lots
            if (batches.indexOf(batch) < batches.length - 1) {
                await new Promise(resolve => setTimeout(resolve, EMAIL_CONFIG.DELAY_BETWEEN_BATCHES));
            }
        }
        
        res.json({ 
            success: true, 
            sent, 
            errors, 
            total: toSend.length,
            remainingInCategory: emailsByCategory[category].filter(e => !e.sent).length
        });
    } catch (error) {
        console.error('Erreur envoi:', error);
        res.status(500).json({ error: 'Erreur lors de l\'envoi des emails' });
    }
});

// API: Ajouter un email manuellement
app.post('/api/add-email', (req, res) => {
    const { email } = req.body;
    
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: 'Email invalide' });
    }
    
    if (emails.find(e => e.email === email)) {
        return res.status(400).json({ error: 'Email déjà existant' });
    }
    
    emails.push({
        email,
        source: 'manuel',
        date: new Date(),
        sent: false
    });
    
    res.json({ success: true, total: emails.length });
});

// API: Supprimer tous les emails
app.delete('/api/emails', (req, res) => {
    emails = [];
    stats = { scraped: 0, sent: 0, errors: 0 };
    res.json({ success: true });
});

// API: Statistiques
app.get('/api/stats', (req, res) => {
    res.json({
        total: emails.length,
        sent: emails.filter(e => e.sent).length,
        pending: emails.filter(e => !e.sent).length,
        stats
    });
});

// Démarrage
app.listen(PORT, () => {
    console.log('\n╔════════════════════════════════════════════╗');
    console.log('║   SCRAPER EMAILS MAIRIES FRANÇAISES        ║');
    console.log('╚════════════════════════════════════════════╝\n');
    console.log(`🚀 Serveur: http://localhost:${PORT}`);
    console.log(`📧 Emails collectés: ${emailsByCategory.mairies.length}`);
    console.log(`✉️  Emails envoyés: ${stats.sent}\n`);
    const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
    if (smtpUser) {
        console.log(`✅ Configuration SMTP: ${smtpUser}`);
    } else {
        console.log('⚠️  Configuration SMTP manquante dans .env');
        console.log('   SMTP_USER=votre-email@gmail.com');
        console.log('   SMTP_PASS=votre-mot-de-passe-app');
    }
    console.log('\n');
});
