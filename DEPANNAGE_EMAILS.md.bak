# 🔧 Dépannage : Emails Non Affichés

## ✅ Le Scraping Fonctionne !

**Test effectué :** Le serveur scrape correctement les emails.

```
✅ Scraping terminé
📊 Résultat: 10 emails trouvés
📧 Premier email: mairie@paris.fr
```

---

## 🎯 Procédure de Dépannage

### **Étape 1 : Vérifier la Connexion**

1. **Ouvrez** : http://localhost:3000
2. **Vous devez voir** : Page de connexion
3. **Connectez-vous** :
   - Email : `hyperemail@gmail.com`
   - Mot de passe : `Hyperemail1@`

### **Étape 2 : Accéder à l'Application**

Après connexion, vous devez être sur : `http://localhost:3000/app.html`

**Vérifiez l'URL dans la barre d'adresse !**

### **Étape 3 : Ouvrir la Console**

1. **Appuyez sur F12** (ou Cmd+Option+I sur Mac)
2. **Allez dans l'onglet "Console"**
3. **Gardez-la ouverte**

### **Étape 4 : Scraper**

1. **Cliquez sur "🏛️ Mairies"**
2. **Cliquez sur "🔍 Scraper cette catégorie"**
3. **Observez la console**

**Logs attendus :**
```
📊 Résultat scraping: {success: true, totalEmails: 10, ...}
📥 Chargement des emails pour: mairies
📊 Emails reçus: {emails: Array(10)}
✅ 10 emails affichés
```

### **Étape 5 : Vérifier l'Affichage**

Dans la section "📋 Emails collectés", vous devez voir :

```
Mairie de Paris          📍 Paris
✉️ mairie@paris.fr
                    [⏳ En attente]

Mairie de Lyon           📍 Lyon
✉️ contact@mairie-lyon.fr
                    [⏳ En attente]

... (8 autres emails)
```

---

## 🔍 Problèmes Courants

### **Problème 1 : Page Blanche**

**Cause :** Pas connecté ou session expirée

**Solution :**
1. Allez sur http://localhost:3000
2. Connectez-vous
3. Vous serez redirigé vers /app.html

### **Problème 2 : "Aucun email"**

**Cause :** Scraping pas encore effectué

**Solution :**
1. Sélectionnez une catégorie (cliquez sur la carte)
2. Cliquez sur "🔍 Scraper cette catégorie"
3. Attendez 2-3 secondes

### **Problème 3 : Console dit "0 emails"**

**Cause :** Erreur de chargement

**Solution :**
```javascript
// Dans la console, tapez :
location.reload()
```

Puis rescrapez.

### **Problème 4 : Erreur dans la Console**

**Erreurs possibles :**

```javascript
// Erreur 1 : Session expirée
⚠️ Pas de catégorie sélectionnée
// Solution : Cliquez sur une catégorie

// Erreur 2 : Connexion perdue
❌ Erreur chargement emails
// Solution : Redémarrez le serveur
```

---

## 🧪 Test Manuel

### **Test API Direct**

**Dans le navigateur, ouvrez :**

```
http://localhost:3000/api/emails/mairies
```

**Vous devriez voir :**
```json
{
  "category": "mairies",
  "total": 10,
  "sent": 0,
  "pending": 10,
  "emails": [
    {
      "email": "mairie@paris.fr",
      "name": "Mairie de Paris",
      "city": "Paris",
      ...
    },
    ...
  ]
}
```

**Si vous voyez ça :** ✅ Le serveur fonctionne, le problème est dans l'interface

**Si vous voyez `[]` :** ❌ Rescrapez d'abord

---

## 🔄 Solution Rapide

### **Procédure Complète**

```bash
# 1. Arrêter le serveur
pkill -f "node gouvernement-scraper.js"

# 2. Redémarrer
npm start

# 3. Attendre le démarrage
# Vous devez voir : ✅ SMTP: francedemocratie2@gmail.com
```

**Puis dans le navigateur :**

1. Ouvrez : http://localhost:3000
2. Connectez-vous
3. Cliquez sur "Mairies"
4. Cliquez sur "Scraper"
5. **Résultat** : 10 emails apparaissent !

---

## 📊 Vérification Finale

### **Checklist**

- [ ] Serveur démarré (`npm start`)
- [ ] Connecté à l'application
- [ ] Sur la page `/app.html`
- [ ] Console ouverte (F12)
- [ ] Catégorie sélectionnée
- [ ] Scraping effectué
- [ ] Logs visibles dans la console

**Si tout est coché :** Les emails DOIVENT apparaître !

---

## 🆘 Si Rien ne Fonctionne

### **Reset Complet**

```bash
# 1. Tuer tous les processus Node
pkill -f node

# 2. Nettoyer le cache
rm -rf node_modules/.cache

# 3. Redémarrer
npm start

# 4. Vider le cache du navigateur
# Chrome/Edge : Ctrl+Shift+Delete
# Firefox : Ctrl+Shift+Delete
# Safari : Cmd+Option+E

# 5. Rouvrir
http://localhost:3000
```

---

## ✅ Résumé

**Le scraping fonctionne côté serveur.**

**Si les emails ne s'affichent pas :**
1. Vérifiez que vous êtes connecté
2. Vérifiez que vous êtes sur `/app.html`
3. Ouvrez la console (F12)
4. Scrapez et observez les logs
5. Les emails doivent apparaître

**Test réussi :** ✅ 10 emails scrapés et disponibles !

---

© 2025 **Maroc Gestion Entreprendre** - Tous droits réservés
