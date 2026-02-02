const XLSX = require('xlsx');
const fs = require('fs');

// Lire le fichier Excel
try {
    console.log('🔍 Analyse du fichier expo.xlsx...');
    
    const workbook = XLSX.readFile('./public/expo.xlsx');
    console.log('📑 Feuilles trouvées:', workbook.SheetNames);
    
    // Analyser chaque feuille
    workbook.SheetNames.forEach((sheetName, index) => {
        console.log(`\n📊 FEUILLE ${index + 1}: "${sheetName}"`);
        console.log('='.repeat(50));
        
        const worksheet = workbook.Sheets[sheetName];
        
        // Convertir en array
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        console.log(`📏 Dimensions: ${data.length} lignes × ${data[0] ? data[0].length : 0} colonnes`);
        
        // Analyser les 10 premières lignes
        console.log('\n📍 10 premières lignes:');
        data.slice(0, 10).forEach((row, rowIndex) => {
            console.log(`Ligne ${rowIndex + 1}:`, row);
        });
        
        // Chercher des emails dans tout le fichier
        console.log('\n🔍 Recherche des emails...');
        let emailCount = 0;
        let emailExamples = [];
        let orgCount = 0;
        let orgExamples = [];
        
        data.forEach((row, rowIndex) => {
            row.forEach((cell, colIndex) => {
                const cellStr = String(cell || '').trim();
                
                // Vérifier si c'est un email
                if (cellStr.includes('@') && cellStr.length > 5) {
                    emailCount++;
                    if (emailExamples.length < 10) {
                        emailExamples.push({
                            ligne: rowIndex + 1,
                            colonne: colIndex + 1,
                            email: cellStr
                        });
                    }
                } else if (cellStr.length > 2 && !cellStr.includes('@')) {
                    orgCount++;
                    if (orgExamples.length < 10) {
                        orgExamples.push({
                            ligne: rowIndex + 1,
                            colonne: colIndex + 1,
                            organisation: cellStr
                        });
                    }
                }
            });
        });
        
        console.log(`\n📊 RÉSULTATS:`);
        console.log(`→ Total d'emails trouvés: ${emailCount}`);
        console.log(`→ Total d'organisations: ${orgCount}`);
        
        if (emailExamples.length > 0) {
            console.log(`\n📧 Exemples d'emails trouvés:`);
            emailExamples.forEach(ex => {
                console.log(`  Ligne ${ex.ligne}, Colonne ${ex.colonne}: "${ex.email}"`);
            });
        }
        
        if (orgExamples.length > 0) {
            console.log(`\n🏢 Exemples d'organisations:`);
            orgExamples.forEach(ex => {
                console.log(`  Ligne ${ex.ligne}, Colonne ${ex.colonne}: "${ex.organisation}"`);
            });
        }
        
        if (emailCount === 0) {
            console.log('\n❌ Aucun email trouvé dans cette feuille');
        } else {
            console.log(`\n✅ ${emailCount} emails trouvés dans cette feuille !`);
        }
    });
    
} catch (error) {
    console.error('❌ Erreur lecture du fichier:', error.message);
}
