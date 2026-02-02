#!/usr/bin/env node

// Script de vérification HyperEmail
require('dotenv').config();
const fs = require('fs');
const path = require('path');

console.log('\n╔════════════════════════════════════════════╗');
console.log('║     ⚡ VÉRIFICATION HYPEREMAIL ⚡         ║');
console.log('╚════════════════════════════════════════════╝\n');

let errors = 0;
let warnings = 0;

// 1. Vérifier Node.js
console.log('📦 Vérification Node.js...');
const nodeVersion = process.version;
console.log(`   Version: ${nodeVersion}`);
if (parseInt(nodeVersion.slice(1)) < 14) {
    console.log('   ❌ Node.js 14+ requis');
    errors++;
} else {
    console.log('   ✅ Version compatible');
}

// 2. Vérifier les dépendances
console.log('\n📚 Vérification des dépendances...');
const requiredDeps = ['express', 'nodemailer', 'axios', 'dotenv', 'json2csv'];
const packageJson = require('./package.json');

requiredDeps.forEach(dep => {
    if (packageJson.dependencies[dep]) {
        console.log(`   ✅ ${dep}`);
    } else {
        console.log(`   ❌ ${dep} manquant`);
        errors++;
    }
});

// 3. Vérifier node_modules
console.log('\n📁 Vérification node_modules...');
if (fs.existsSync('./node_modules')) {
    console.log('   ✅ node_modules présent');
} else {
    console.log('   ❌ node_modules manquant - Exécutez: npm install');
    errors++;
}

// 4. Vérifier le fichier .env
console.log('\n🔐 Vérification .env...');
if (fs.existsSync('./.env')) {
    console.log('   ✅ Fichier .env présent');
    
    // Vérifier les variables
    const requiredEnvVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'];
    requiredEnvVars.forEach(varName => {
        if (process.env[varName]) {
            console.log(`   ✅ ${varName} configuré`);
        } else {
            console.log(`   ⚠️  ${varName} manquant`);
            warnings++;
        }
    });
    
    // Afficher la config SMTP
    if (process.env.SMTP_USER) {
        console.log(`\n   📧 Email configuré: ${process.env.SMTP_USER}`);
    }
} else {
    console.log('   ❌ Fichier .env manquant - Exécutez: ./configure.sh');
    errors++;
}

// 5. Vérifier les fichiers publics
console.log('\n🌐 Vérification des fichiers publics...');
const publicFiles = ['app.html', 'index.html', 'cgu.html', 'faq.html'];
publicFiles.forEach(file => {
    if (fs.existsSync(`./public/${file}`)) {
        console.log(`   ✅ ${file}`);
    } else {
        console.log(`   ❌ ${file} manquant`);
        errors++;
    }
});

// 6. Vérifier le serveur
console.log('\n🖥️  Vérification du serveur...');
if (fs.existsSync('./gouvernement-scraper.js')) {
    console.log('   ✅ gouvernement-scraper.js présent');
} else {
    console.log('   ❌ gouvernement-scraper.js manquant');
    errors++;
}

// 7. Vérifier le port
console.log('\n🔌 Vérification du port...');
const port = process.env.PORT || 3000;
console.log(`   Port configuré: ${port}`);

// Résumé
console.log('\n╔════════════════════════════════════════════╗');
console.log('║              RÉSUMÉ                        ║');
console.log('╚════════════════════════════════════════════╝\n');

if (errors === 0 && warnings === 0) {
    console.log('✅ Tout est prêt! L\'application peut démarrer.');
    console.log('\n🚀 Pour démarrer:');
    console.log('   npm start');
    console.log('\n🌐 URL:');
    console.log(`   http://localhost:${port}`);
} else {
    if (errors > 0) {
        console.log(`❌ ${errors} erreur(s) trouvée(s)`);
    }
    if (warnings > 0) {
        console.log(`⚠️  ${warnings} avertissement(s)`);
    }
    console.log('\n🔧 Actions requises:');
    if (errors > 0) {
        console.log('   1. Corrigez les erreurs ci-dessus');
        console.log('   2. Exécutez: npm install');
        console.log('   3. Exécutez: ./configure.sh');
    }
}

console.log('\n');
process.exit(errors > 0 ? 1 : 0);
