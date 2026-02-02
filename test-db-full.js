require('dotenv').config();
const db = require('./db');

async function testDatabaseConnection() {
    try {
        console.log('1. Test de la connexion de base...');
        await db.testConnection();
        
        console.log('2. Test de création d\'un utilisateur test...');
        const testEmail = 'test_' + Date.now() + '@test.com';
        const userId = await db.createUser(testEmail, 'test_hash');
        console.log('Utilisateur créé avec ID:', userId);
        
        console.log('3. Test de récupération de l\'utilisateur...');
        const user = await db.getUserByEmail(testEmail);
        console.log('Utilisateur récupéré:', user);
        
        console.log('4. Test de création d\'un template...');
        await db.saveTemplate(userId, 'test@email.com', 'Test Subject', 'Test Message');
        
        console.log('5. Test de récupération du template...');
        const template = await db.getTemplate(userId);
        console.log('Template récupéré:', template);
        
        console.log('6. Test de création d\'une liste d\'envoi...');
        const listId = await db.createPendingList(userId, 'test', 'Test List');
        console.log('Liste créée avec ID:', listId);
        
        console.log('7. Test d\'ajout d\'un destinataire...');
        await db.addPendingRecipient(listId, 'recipient@test.com', null, null, 'test', 'Test Name');
        
        console.log('8. Test de récupération des destinataires...');
        const recipients = await db.getRecipientsForList(listId);
        console.log('Nombre de destinataires:', recipients.length);
        
        console.log('\n✅ Tous les tests ont réussi ! La base de données est complètement fonctionnelle et synchronisée.');
        
        // Nettoyage
        await db.query('DELETE FROM users WHERE email = $1', [testEmail]);
        
    } catch (error) {
        console.error('\n❌ Erreur lors des tests :', error);
        console.error('Message détaillé:', error.message);
        if (error.stack) {
            console.error('Stack trace:', error.stack);
        }
    }
}

testDatabaseConnection();