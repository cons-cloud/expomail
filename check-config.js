require('dotenv').config();
const { getSupabase } = require('./supabase');
const nodemailer = require('nodemailer');
const fs = require('fs');

async function checkConfiguration() {
    console.log('🔍 Vérification de la configuration...\n');
    let errors = 0;
    
    // 1. Vérifier les variables d'environnement
    console.log("1️⃣  Variables d'environnement :");
    const requiredVars = [
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        'SUPABASE_SERVICE_ROLE_KEY',
        'DATABASE_URL',
        'SMTP_HOST',
        'SMTP_PORT',
        'SMTP_USER',
        'SMTP_PASS'
    ];
    
    for (const v of requiredVars) {
        if (!process.env[v]) {
            console.log(`❌ ${v} manquante`);
            errors++;
        } else {
            console.log(`✅ ${v} présente`);
        }
    }
    
    // 2. Vérifier la connexion Supabase
    console.log('\n2️⃣  Connexion Supabase :');
    try {
        const supabase = getSupabase();
        const { data, error } = await supabase
            .from('emails')
            .select('count')
            .limit(1);
        
        if (error) throw error;
        console.log('✅ Connexion Supabase réussie');
    } catch (error) {
        console.log('❌ Erreur Supabase :', error.message);
        errors++;
    }
    
    // 3. Vérifier la configuration SMTP
    console.log('\n3️⃣  Configuration SMTP :');
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
        
        await transporter.verify();
        console.log('✅ Configuration SMTP valide');
    } catch (error) {
        console.log('❌ Erreur SMTP :', error.message);
        errors++;
    }
    
    // 4. Vérifier les fichiers essentiels
    console.log('\n4️⃣  Fichiers essentiels :');
    const requiredFiles = [
        'server.js',
        'gouvernement-scraper.js',
        'supabase.js',
        'package.json'
    ];
    
    for (const file of requiredFiles) {
        if (fs.existsSync(file)) {
            console.log(`✅ ${file} présent`);
        } else {
            console.log(`❌ ${file} manquant`);
            errors++;
        }
    }
    
    // 5. Vérifier le port
    console.log('\n5️⃣  Configuration du port :');
    const port = process.env.PORT || 3001;
    console.log(`Port configuré : ${port}`);
    
    // Résumé
    console.log('\n📊 Résumé :');
    if (errors === 0) {
        console.log('✅ Configuration valide ! L\'application est prête.');
    } else {
        console.log(`❌ ${errors} problème${errors > 1 ? 's' : ''} trouvé${errors > 1 ? 's' : ''}. Veuillez corriger les erreurs ci-dessus.`);
        process.exit(1);
    }
}

checkConfiguration();