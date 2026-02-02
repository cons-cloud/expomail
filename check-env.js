require('dotenv').config();
// Script de vérification de l'environnement
console.log('\n=== Vérification de l\'environnement ===\n');

// Vérifier les variables simples
const SIMPLE_VARS = ['NODE_ENV', 'PORT', 'PRODUCTION_URL'];
console.log('\nVérification des variables simples:');
SIMPLE_VARS.forEach(varName => {
    if (process.env[varName]) {
        console.log(`✅ ${varName} = ${process.env[varName]}`);
    } else {
        console.log(`❌ ${varName} n'est pas défini`);
    }
});

// Vérifier la configuration SMTP
console.log('\nVérification de la configuration SMTP:');
const SMTP_VARS = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_SECURE', 'SENDER_NAME'];
let smtpValid = true;
SMTP_VARS.forEach(varName => {
    if (process.env[varName]) {
        console.log(`✅ ${varName} est présent`);
    } else {
        console.log(`❌ ${varName} n'est pas défini`);
        smtpValid = false;
    }
});

// Vérifier la configuration Auth
console.log('\nVérification de la configuration Auth:');
const AUTH_VARS = ['JWT_SECRET', 'API_KEY'];
let authValid = true;
AUTH_VARS.forEach(varName => {
    if (process.env[varName]) {
        console.log(`✅ ${varName} est présent`);
    } else {
        console.log(`❌ ${varName} n'est pas défini`);
        authValid = false;
    }
});

// Vérifier la configuration Supabase
console.log('\nVérification de la configuration Supabase:');
const SUPABASE_VARS = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'];
let supabaseValid = true;
SUPABASE_VARS.forEach(varName => {
    if (process.env[varName]) {
        console.log(`✅ ${varName} est présent`);
    } else {
        console.log(`❌ ${varName} n'est pas défini`);
        supabaseValid = false;
    }
});

console.log('\n=== Résultat de la vérification ===');
if (smtpValid && authValid && supabaseValid) {
    console.log('✅ Toutes les configurations sont valides\n');
    process.exit(0);
} else {
    console.log('❌ Certaines configurations sont manquantes ou invalides\n');
    process.exit(1);
}