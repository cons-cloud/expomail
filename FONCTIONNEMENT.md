# 🔍 Comment l'Application Récupère les Emails

## 📡 Scraping Automatique sur Internet

L'application **scrape automatiquement** les emails depuis des sites web publics français. Voici comment ça fonctionne :

---

## 🎯 Processus de Récupération

### 1️⃣ **Sélection de Catégorie**
Vous choisissez une catégorie (Mairies, Justice, Ministères, etc.)

### 2️⃣ **Scraping Automatique**
L'application visite automatiquement des sites web prédéfinis :

#### 🏛️ **Mairies**
- `https://www.annuaire-mairie.fr`
- `https://www.communes.com`
- `https://www.cartesfrance.fr/carte-france-ville/mairies.html`

#### ⚖️ **Justice**
- `https://www.justice.gouv.fr`
- `https://www.annuaires.justice.gouv.fr`
- `https://www.conseil-constitutionnel.fr`

#### 🏢 **Ministères**
- `https://www.gouvernement.fr`
- `https://www.interieur.gouv.fr`
- `https://www.education.gouv.fr`
- `https://www.economie.gouv.fr`

#### 🏛️ **Préfectures**
- `https://www.interieur.gouv.fr/Le-ministere/Prefectures`
- `https://lannuaire.service-public.fr`

### 3️⃣ **Extraction des Emails**
L'application utilise une **expression régulière** pour détecter tous les emails sur ces pages :
```javascript
/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
```

### 4️⃣ **Extraction Intelligente**
Pour chaque email trouvé, l'application extrait automatiquement :
- **L'adresse email**
- **Le nom** (Mairie de Paris, Tribunal de Lyon, etc.)
- **La ville** (détectée via code postal ou contexte)

### 5️⃣ **Stockage**
Les informations sont stockées en mémoire avec :
- L'adresse email
- Le nom de l'institution
- La ville
- La source (URL d'où il vient)
- La date de récupération
- Le statut (envoyé ou non)
- La catégorie

---

## ⚙️ Fonctionnement Technique

### **Backend (gouvernement-scraper.js)**
```javascript
// Scraper une URL
async function scrapeURL(url, category) {
    // 1. Télécharge la page web
    const response = await axios.get(url);
    
    // 2. Extrait tous les emails
    const foundEmails = extractEmails(response.data);
    
    // 3. Pour chaque email, extrait le nom et la ville
    foundEmails.forEach(email => {
        if (!emailsByCategory[category].find(e => e.email === email)) {
            // Extraction intelligente du contexte
            const { name, city } = extractContactInfo(response.data, email);
            
            emailsByCategory[category].push({
                email,
                name,      // Ex: "Mairie de Paris"
                city,      // Ex: "Paris"
                source: url,
                date: new Date(),
                sent: false,
                category
            });
        }
    });
}
```

### **Extraction Intelligente**
L'application analyse le contexte HTML autour de chaque email pour détecter :

**Noms détectés :**
- "Mairie de [Ville]"
- "Tribunal de [Ville]"
- "Préfecture de [Département]"
- "Ministère de/des/du [Nom]"
- Titres et en-têtes HTML

**Villes détectées :**
- Codes postaux français (75001, 69002, etc.)
- Format "Ville (Code postal)"
- Mentions "ville: [Nom]"

---

## 📊 Capacités

- **Limite totale** : 200 000 emails maximum
- **Stockage** : En mémoire (volatile)
- **Détection** : Automatique via regex
- **Dédoublonnage** : Automatique (pas de doublons)

---

## 🚀 Utilisation

### **Étape 1 : Scraper**
1. Cliquez sur une catégorie (ex: Mairies)
2. Cliquez sur "🔍 Scraper cette catégorie"
3. L'application visite automatiquement les sites et récupère les emails

### **Étape 2 : Vérifier**
- Consultez la liste des emails collectés
- Vérifiez le nombre d'emails dans chaque catégorie

### **Étape 3 : Envoyer**
1. Rédigez votre sujet et message
2. Entrez le nombre d'emails à envoyer (ex: 100)
3. Cliquez sur "📧 Envoyer"

---

## ⚠️ Important

### **Légalité**
- ✅ Les emails sont récupérés depuis des sites publics
- ⚠️ Respectez le RGPD et la législation française
- 🚫 N'envoyez pas de spam
- 📧 Obtenez les consentements nécessaires

### **Limites SMTP**
- **Gmail** : 500 emails/jour maximum
- **Outlook** : 300 emails/jour maximum
- **Pause** : 3 secondes entre chaque email (automatique)

### **Données Volatiles**
- 💾 Les emails sont stockés **en mémoire uniquement**
- 🔄 Redémarrage du serveur = perte des données
- 🔒 Aucune sauvegarde permanente (protection de la vie privée)

---

## 🛠️ Personnalisation

Vous pouvez ajouter vos propres URLs dans le fichier `gouvernement-scraper.js` :

```javascript
const urlsByCategory = {
    mairies: [
        'https://www.annuaire-mairie.fr',
        'https://votre-site-personnalise.fr',  // ← Ajoutez ici
    ],
    // ...
};
```

---

## 📞 Support

Pour toute question : **support@marocgestion.com**

© 2025 **Maroc Gestion Entreprendre** - Tous droits réservés
