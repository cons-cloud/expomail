// Test rapide du scraping
const axios = require('axios');

async function testScraping() {
    console.log('🧪 Test du scraping...\n');
    
    try {
        // Test 1: Vérifier que le serveur répond
        console.log('1️⃣ Test connexion serveur...');
        const statsResponse = await axios.get('http://localhost:3000/api/stats');
        console.log('✅ Serveur OK');
        console.log('📊 Stats:', statsResponse.data);
        console.log('');
        
        // Test 2: Scraper la catégorie mairies
        console.log('2️⃣ Test scraping mairies...');
        const scrapeResponse = await axios.post('http://localhost:3000/api/scrape/mairies');
        console.log('✅ Scraping terminé');
        console.log('📊 Résultat:', scrapeResponse.data);
        console.log('');
        
        // Test 3: Récupérer les emails
        console.log('3️⃣ Test récupération emails...');
        const emailsResponse = await axios.get('http://localhost:3000/api/emails/mairies');
        console.log('✅ Emails récupérés');
        console.log('📊 Total:', emailsResponse.data.total);
        console.log('📧 Emails:', emailsResponse.data.emails.length);
        
        if (emailsResponse.data.emails.length > 0) {
            console.log('\n📋 Premier email:');
            console.log(emailsResponse.data.emails[0]);
        }
        
        console.log('\n✅ TOUS LES TESTS RÉUSSIS !');
        
    } catch (error) {
        console.error('❌ ERREUR:', error.message);
        if (error.response) {
            console.error('📊 Réponse:', error.response.data);
        }
    }
}

testScraping();
