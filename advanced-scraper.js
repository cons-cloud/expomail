// Scraper avancé pour les emails du gouvernement français
const axios = require('axios');
const cheerio = require('cheerio');

// URLs des sources gouvernementales
const SOURCES = {
    MINISTRES: [
        'https://www.gouvernement.fr/composition-du-gouvernement',
        'https://www.elysee.fr/gouvernement',
        'https://www.vie-publique.fr/ministeres'
    ],
    JUSTICE: [
        'http://www.justice.gouv.fr/',
        'https://www.cours-appel.justice.fr/',
        'https://www.tribunal-administratif.fr/'
    ],
    AUTRES: [
        'https://www2.assemblee-nationale.fr/deputes/liste/alphabetique',
        'https://www.senat.fr/senateurs/senatl.html',
        'https://www.conseil-etat.fr/'
    ]
};

// Patterns d'emails à rechercher
const EMAIL_PATTERNS = [
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    /mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g
];

// Fonction pour extraire les emails d'une page
async function extractEmails(url) {
    try {
        console.log(`🔍 Analyse de ${url}`);
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; EmailFinder/1.0; +http://hyperemail.fr)'
            },
            timeout: 10000
        });

        const $ = cheerio.load(response.data);
        const emails = new Set();

        // Rechercher dans le HTML
        const html = $.html();
        EMAIL_PATTERNS.forEach(pattern => {
            const matches = html.match(pattern) || [];
            matches.forEach(email => {
                email = email.replace('mailto:', '').toLowerCase();
                // Accept broader public addresses: prefer .fr domains (gouv, justice, associations publiques)
                if (email.includes('.fr') || email.includes('.gouv') || email.includes('.justice')) {
                    emails.add(email);
                }
            });
        });

        // Rechercher dans les attributs href des liens
        $('a[href^="mailto:"]').each((i, elem) => {
            const email = $(elem).attr('href').replace('mailto:', '').toLowerCase();
            if (email.includes('.gouv.fr') || email.includes('.justice.fr')) {
                emails.add(email);
            }
        });

        return Array.from(emails);
    } catch (error) {
        console.error(`❌ Erreur pour ${url}:`, error.message);
        return [];
    }
}

// Fonction pour scraper une catégorie
async function scrapeCategory(category) {
    const urls = SOURCES[category];
    const allEmails = new Set();

    console.log(`📧 Démarrage du scraping pour ${category}`);
    
    for (const url of urls) {
        try {
            // Extraire les emails de la page principale
            const emails = await extractEmails(url);
            emails.forEach(email => allEmails.add(email));

            // Récupérer et suivre les liens internes
            const response = await axios.get(url);
            const $ = cheerio.load(response.data);
            const internalLinks = new Set();

            $('a[href]').each((i, elem) => {
                const link = $(elem).attr('href');
                if (link && link.startsWith('/') && !link.includes('#')) {
                    const fullUrl = new URL(link, url).href;
                    internalLinks.add(fullUrl);
                }
            });

            // Analyser jusqu'à 20 pages internes (augmenté pour plus de couverture)
            const internalLinksArray = Array.from(internalLinks).slice(0, 20);
            for (const internalLink of internalLinksArray) {
                const internalEmails = await extractEmails(internalLink);
                internalEmails.forEach(email => allEmails.add(email));
            }
        } catch (error) {
            console.error(`❌ Erreur pour ${url}:`, error.message);
            continue;
        }
    }

    return Array.from(allEmails);
}

module.exports = {
    scrapeMinistres: () => scrapeCategory('MINISTRES'),
    scrapeJustice: () => scrapeCategory('JUSTICE'),
    scrapeAutres: () => scrapeCategory('AUTRES')
};