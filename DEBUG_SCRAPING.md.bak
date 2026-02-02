# 🔍 Debug : Emails ne S'affichent Pas

## 🎯 Procédure de Debug

### **Étape 1 : Ouvrir la Console du Navigateur**

1. **Ouvrez** : http://localhost:3000
2. **Appuyez sur** : `F12` ou `Cmd+Option+I` (Mac)
3. **Allez dans** : Onglet "Console"

---

### **Étape 2 : Scraper et Observer les Logs**

1. **Cliquez sur** : "🏛️ Mairies"
2. **Cliquez sur** : "🔍 Scraper cette catégorie"
3. **Observez la console**

**Logs attendus dans la console :**
```
📊 Résultat scraping: {success: true, category: "mairies", totalEmails: 10, newEmails: 10, source: "démonstration"}
📥 Chargement des emails pour: mairies
📊 Emails reçus: {category: "mairies", total: 10, sent: 0, pending: 10, emails: Array(10)}
   • Total: 10
✅ 10 emails affichés
✅ Interface mise à jour
```

**Logs attendus dans le terminal serveur :**
```
📝 Utilisation des emails de démonstration pour mairies
📊 Scraping terminé pour mairies:
   • Emails trouvés: 10
   • Total en mémoire: 10
   • Source: démonstration
```

---

### **Étape 3 : Vérifier l'API**

**Testez directement l'API :**

1. **Ouvrez dans le navigateur** :
   ```
   http://localhost:3000/api/emails/mairies
   ```

2. **Résultat attendu** :
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
         "source": "Base de démonstration",
         "sent": false,
         "category": "mairies"
       },
       ...
     ]
   }
   ```

---

## 🔍 Diagnostic des Problèmes

### **Problème 1 : Console dit "0 emails"**

**Logs :**
```
📊 Emails reçus: {emails: Array(0)}
   • Total: 0
```

**Cause :** Le scraping n'a pas fonctionné

**Solution :**
1. Vérifiez les logs du serveur
2. Redémarrez le serveur : `npm start`
3. Rescrapez

---

### **Problème 2 : Erreur dans la console**

**Logs :**
```
❌ Erreur scraping: TypeError: ...
```

**Cause :** Problème de communication avec le serveur

**Solution :**
1. Vérifiez que le serveur tourne
2. Vérifiez l'URL : http://localhost:3000
3. Rafraîchissez la page (F5)

---

### **Problème 3 : API retourne vide**

**Si http://localhost:3000/api/emails/mairies retourne :**
```json
{
  "emails": []
}
```

**Cause :** Les emails ne sont pas en mémoire

**Solution :**
1. Scrapez d'abord via l'interface
2. Vérifiez les logs serveur
3. Redémarrez si nécessaire

---

## ✅ Solution Rapide

### **Si Rien ne Fonctionne**

**Procédure complète :**

1. **Arrêter le serveur**
   ```bash
   pkill -f "node gouvernement-scraper.js"
   ```

2. **Redémarrer**
   ```bash
   npm start
   ```

3. **Attendre le démarrage**
   ```
   ✅ SMTP: francedemocratie2@gmail.com
   ```

4. **Ouvrir une nouvelle fenêtre**
   ```
   http://localhost:3000
   ```

5. **Ouvrir la console** (F12)

6. **Scraper**
   - Cliquez sur "Mairies"
   - Cliquez sur "Scraper"
   - **Observez les logs**

7. **Vérifier**
   - Les emails doivent apparaître
   - La console doit afficher "✅ 10 emails affichés"

---

## 📊 Vérifications

### **Checklist**

- [ ] Serveur démarré (`npm start`)
- [ ] Console navigateur ouverte (F12)
- [ ] Catégorie sélectionnée (Mairies)
- [ ] Scraping lancé (bouton cliqué)
- [ ] Logs visibles dans la console
- [ ] Message "✅ X emails trouvés"
- [ ] Liste des emails visible

---

## 🎯 Test Final

### **Procédure de Test Complète**

```bash
# 1. Terminal : Redémarrer
pkill -f "node gouvernement-scraper.js"
npm start

# 2. Navigateur : Ouvrir
http://localhost:3000

# 3. Navigateur : Console (F12)
# Onglet "Console"

# 4. Interface : Scraper
# Cliquez sur "Mairies"
# Cliquez sur "Scraper"

# 5. Observer :
# - Console navigateur : logs détaillés
# - Terminal : logs serveur
# - Interface : emails affichés
```

---

## 📝 Logs à Copier

### **Si Vous Avez Toujours un Problème**

**Copiez ces informations :**

1. **Logs Console Navigateur** (F12 → Console)
2. **Logs Terminal Serveur**
3. **Réponse API** : http://localhost:3000/api/emails/mairies

**Et partagez-les pour diagnostic.**

---

## ✅ Résultat Attendu

**Après le scraping, vous devez voir :**

### **Dans l'Interface**
```
📧 mairies: 10 emails

📋 Emails collectés

Mairie de Paris          📍 Paris
✉️ mairie@paris.fr
                    [⏳ En attente]

Mairie de Lyon           📍 Lyon
✉️ contact@mairie-lyon.fr
                    [⏳ En attente]

... (8 autres)
```

### **Dans la Console (F12)**
```
📊 Résultat scraping: {success: true, totalEmails: 10, ...}
📥 Chargement des emails pour: mairies
📊 Emails reçus: {emails: Array(10)}
✅ 10 emails affichés
✅ Interface mise à jour
```

### **Dans le Terminal**
```
📝 Utilisation des emails de démonstration pour mairies
📊 Scraping terminé pour mairies:
   • Emails trouvés: 10
   • Total en mémoire: 10
```

---

**Si vous voyez tout ça, ça fonctionne ! 🎉**

---

© 2025 **Maroc Gestion Entreprendre** - Tous droits réservés
