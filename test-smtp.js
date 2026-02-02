require('dotenv').config();
const nodemailer = require('nodemailer');

// Configuration du transporteur SMTP
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === '1',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    },
    tls: {
        rejectUnauthorized: false
    }
});

// Test de la configuration
async function testSMTP() {
    console.log('📧 Test de la configuration SMTP...');
    console.log(`Host: ${process.env.SMTP_HOST}`);
    console.log(`Port: ${process.env.SMTP_PORT}`);
    console.log(`User: ${process.env.SMTP_USER}`);
    
    try {
        // Vérifier la configuration
        await transporter.verify();
        console.log('✅ Configuration SMTP valide\n');

        // Envoyer un email de test
        const info = await transporter.sendMail({
            from: `"${process.env.SENDER_NAME}" <${process.env.SMTP_USER}>`,
            to: process.env.SMTP_USER,
            subject: "Test de configuration SMTP HyperEmail",
            html: `
            <h2>Test de configuration SMTP</h2>
            <p>Si vous recevez cet email, la configuration SMTP est fonctionnelle.</p>
            <p>Détails :</p>
            <ul>
                <li>Date : ${new Date().toLocaleString()}</li>
                <li>Serveur : ${process.env.SMTP_HOST}</li>
                <li>Port : ${process.env.SMTP_PORT}</li>
                <li>Expéditeur : ${process.env.SMTP_USER}</li>
            </ul>
            `,
            headers: {
                'X-Priority': '3',
                'X-MSMail-Priority': 'Normal',
                'Importance': 'Normal',
                'X-Mailer': 'HyperEmail-Test/1.0'
            }
        });

        console.log('✅ Email de test envoyé');
        console.log('ID Message:', info.messageId);
        console.log('\nVérifiez votre boîte de réception et le dossier Envoyés');
        
    } catch (error) {
        console.error('❌ Erreur:', error.message);
        if (error.code === 'EAUTH') {
            console.log('\n⚠️ Problème d\'authentification possible :');
            console.log('1. Vérifiez que le mot de passe d\'application est correct');
            console.log('2. Assurez-vous que l\'authentification à 2 facteurs est activée');
            console.log('3. Le mot de passe doit être un "mot de passe d\'application" Gmail');
        }
    }
}

testSMTP();