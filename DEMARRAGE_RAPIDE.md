# ⚡ HyperEmail - Démarrage Rapide

## 🚀 Lancement en 3 Étapes

### 1️⃣ Vérifier l'Installation
```bash
npm run check
```

**Résultat attendu :**
```
✅ Tout est prêt! L'application peut démarrer.
```

### 2️⃣ Démarrer l'Application
```bash
npm start
```

**Résultat attendu :**
```
╔════════════════════════════════════════════╗
║          ⚡ HYPEREMAIL ⚡                  ║
╚════════════════════════════════════════════╝

🚀 Serveur: http://localhost:3000
✅ SMTP: francedemocratie2@gmail.com
```

### 3️⃣ Ouvrir dans le Navigateur
```
http://localhost:3000
```

---

## 📧 Configuration Email

**Email configuré :** `francedemocratie2@gmail.com`  
**Mot de passe :** Configuré automatiquement  
**Status :** ✅ Prêt à envoyer

### Vérification Gmail
1. Tous les emails envoyés apparaîtront dans "Envoyés"
2. Limite : 500 emails/jour
3. Pause automatique : 3 secondes entre chaque email

---

## 🎯 Utilisation

### Étape 1 : Scraper des Emails
1. Cliquez sur une catégorie (ex: **Mairies**)
2. Cliquez sur **"🔍 Scraper cette catégorie"**
3. Attendez quelques secondes
4. Les emails apparaissent dans la liste

### Étape 2 : Vérifier les Emails
- Consultez la liste des emails collectés
- Vérifiez : **Email + Nom + Ville**
- Compteur mis à jour automatiquement

### Étape 3 : Envoyer des Emails
1. Rédigez votre **sujet**
2. Rédigez votre **message**
3. Entrez le **nombre d'emails** à envoyer
4. Cliquez sur **"📧 Envoyer"**

### Étape 4 : Exporter (Optionnel)
- **Par catégorie** : Cliquez sur "📥 Télécharger CSV/Excel"
- **Tout exporter** : Cliquez sur "📥 Tout Exporter (CSV)"

---

## 📊 Capacités

| Fonctionnalité | Valeur |
|----------------|--------|
| **Emails max** | 200 000 |
| **Envois/jour** | 500 (Gmail) |
| **Catégories** | 5 |
| **Export** | CSV/Excel |
| **Responsive** | ✅ Tous écrans |

---

## 🛡️ Protection Anti-Spam

✅ **Automatique** - Aucune configuration requise

- En-têtes optimisés
- Version texte + HTML
- Pause de 3 secondes
- BCC vers votre email
- Message-ID unique

---

## 🔧 Commandes Utiles

```bash
# Démarrer l'application
npm start

# Vérifier la configuration
npm run check

# Reconfigurer (si nécessaire)
npm run configure
```

---

## 📱 Responsive

L'application s'adapte automatiquement à :
- 📱 **Mobile** (iPhone, Android)
- 📱 **Tablette** (iPad, etc.)
- 💻 **Desktop** (PC, Mac)
- 🖥️ **4K** (Grands écrans)

---

## ⚠️ Limites Gmail

### **IMPORTANT : 500 emails/jour maximum**

**Stratégie recommandée :**
- **Jour 1** : 50 emails (test)
- **Jour 2** : 100 emails
- **Jour 3+** : 400 emails/jour

**L'application respecte automatiquement :**
- ✅ 3 secondes entre chaque email
- ✅ Limite de connexions
- ✅ Rate limiting

---

## 🎯 Exemple d'Utilisation

### Scénario : Envoyer à 100 Mairies

1. **Scraper**
   - Cliquez sur "🏛️ Mairies"
   - Cliquez sur "🔍 Scraper cette catégorie"
   - Attendez 10-30 secondes
   - Résultat : 50-200 emails collectés

2. **Vérifier**
   - Consultez la liste
   - Vérifiez les noms et villes
   - Exemple : "Mairie de Paris - Paris"

3. **Envoyer**
   - Sujet : "Demande de parrainage"
   - Message : Votre texte personnalisé
   - Nombre : 100
   - Cliquez sur "📧 Envoyer"

4. **Résultat**
   - Temps : ~5 minutes (3 sec × 100)
   - Emails dans "Envoyés" Gmail
   - Compteur mis à jour

---

## 📥 Export CSV

### Format du Fichier
```csv
name;city;email;source;sent;date
Mairie de Paris;Paris;mairie@paris.fr;https://...;false;2025-10-26
```

### Compatible avec :
- ✅ Microsoft Excel
- ✅ Google Sheets
- ✅ LibreOffice Calc
- ✅ Numbers (Mac)

---

## 🔍 Vérification

### Après l'Envoi

1. **Ouvrez Gmail**
2. **Allez dans "Envoyés"**
3. **Vérifiez les emails**

Vous devriez voir tous les emails envoyés avec une copie BCC.

---

## 🆘 Problèmes Courants

### Le serveur ne démarre pas
```bash
# Vérifier la configuration
npm run check

# Réinstaller les dépendances
npm install
```

### Erreur SMTP
```bash
# Vérifier le fichier .env
cat .env

# Reconfigurer
npm run configure
```

### Port déjà utilisé
```bash
# Tuer le processus
pkill -f "node gouvernement-scraper.js"

# Redémarrer
npm start
```

---

## 📞 Support

**Email :** support@marocgestion.com

**Documentation :**
- `README.md` - Guide complet
- `FONCTIONNEMENT.md` - Détails techniques
- `ANTI_SPAM.md` - Bonnes pratiques
- `GUIDE_GMAIL.md` - Configuration Gmail

---

## ✅ Checklist Avant Premier Envoi

- [ ] Serveur démarré (`npm start`)
- [ ] URL ouverte (http://localhost:3000)
- [ ] Catégorie sélectionnée
- [ ] Emails scrapés (> 0)
- [ ] Message rédigé
- [ ] Test avec 10 emails
- [ ] Vérification dans Gmail "Envoyés"

---

© 2025 **Maroc Gestion Entreprendre** - Tous droits réservés
