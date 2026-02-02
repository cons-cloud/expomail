# 🌐 APIs Utilisées pour le Scraping

## ✅ APIs Officielles Intégrées

### **1. API Annuaire Service Public**

**URL :** https://api-lannuaire.service-public.fr

**Utilisation :**
- ✅ **Mairies** : Récupère les coordonnées des mairies françaises
- ✅ **Tribunaux** : Coordonnées des tribunaux
- ✅ **Préfectures** : Coordonnées des préfectures

**Exemple de requête :**
```
https://api-lannuaire.service-public.fr/api/explore/v2.1/catalog/datasets/api-lannuaire-administration/records?where=pivotLocal%3D%22mairie%22&limit=100
```

**Données récupérées :**
- Email officiel
- Nom de l'institution
- Ville
- Adresse
- Téléphone

---

### **2. API Geo - Communes**

**URL :** https://geo.api.gouv.fr

**Utilisation :**
- ✅ **Liste des communes** françaises
- ✅ **Informations géographiques**
- ✅ **Population**

**Exemple de requête :**
```
https://geo.api.gouv.fr/communes?fields=nom,code,codesPostaux,population&format=json
```

**Données récupérées :**
- Nom de la commune
- Code postal
- Population
- Coordonnées GPS

**Note :** Les emails sont générés au format probable : `mairie@[ville].fr`

---

### **3. API Data.gouv.fr**

**URL :** https://www.data.gouv.fr/api

**Utilisation :**
- ✅ **Organisations publiques**
- ✅ **Datasets gouvernementaux**
- ✅ **Contacts officiels**

**Exemple de requête :**
```
https://www.data.gouv.fr/api/1/organizations/?page_size=100
```

**Données récupérées :**
- Email de contact
- Nom de l'organisation
- Description
- Site web

---

## 📊 Avantages des APIs

### **Vs Scraping HTML Classique**

| Critère | Scraping HTML | APIs |
|---------|---------------|------|
| **Fiabilité** | ⚠️ Faible | ✅ Élevée |
| **Vitesse** | ⚠️ Lent | ✅ Rapide |
| **Blocage** | ❌ Fréquent | ✅ Rare |
| **Données** | ⚠️ Non structurées | ✅ Structurées JSON |
| **Maintenance** | ❌ Difficile | ✅ Facile |
| **Légalité** | ⚠️ Zone grise | ✅ Autorisé |

---

## 🎯 Résultats Attendus

### **Mairies**
- **Source** : API Annuaire Service Public + API Geo
- **Emails attendus** : 100+ emails officiels
- **Format** : `mairie@[ville].fr` ou `contact@mairie-[ville].fr`

### **Justice**
- **Source** : API Annuaire Service Public
- **Emails attendus** : 50+ tribunaux
- **Format** : `greffe@tribunal-[ville].fr`

### **Ministères**
- **Source** : API Data.gouv.fr
- **Emails attendus** : 20+ organisations
- **Format** : `contact@[ministere].gouv.fr`

### **Préfectures**
- **Source** : API Annuaire Service Public
- **Emails attendus** : 100+ préfectures
- **Format** : `prefecture@[departement].gouv.fr`

---

## 🔍 Comment Ça Fonctionne

### **Processus de Scraping**

```
1. Requête API
   ↓
2. Réception JSON
   ↓
3. Parsing des données
   ↓
4. Extraction emails
   ↓
5. Validation format
   ↓
6. Sauvegarde mémoire
   ↓
7. Sauvegarde Supabase
```

### **Exemple de Réponse API**

```json
{
  "results": [
    {
      "fields": {
        "nom": "Mairie de Paris",
        "adresse_courriel": "mairie@paris.fr",
        "commune": "Paris",
        "telephone": "01 42 76 40 40"
      }
    }
  ]
}
```

---

## ⚙️ Configuration

### **Timeout**
- **15 secondes** par requête
- Évite les blocages sur APIs lentes

### **Headers**
```javascript
{
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
  'Accept': 'application/json, text/html, */*'
}
```

### **Limites**
- **100 résultats** par requête API
- **200,000 emails** max par catégorie
- **200,000 emails** max total

---

## 🚀 Test

### **Pour Tester le Scraping API**

1. **Ouvrez** : http://localhost:3000
2. **Connectez-vous**
3. **Cliquez sur "Mairies"**
4. **Cliquez sur "Scraper"**
5. **Observez la console** :

```
🔍 Scraping: https://api-lannuaire.service-public.fr/api/explore...
✅ 50 emails ajoutés depuis cette source
🔍 Scraping: https://geo.api.gouv.fr/communes...
✅ 100 emails ajoutés depuis cette source
```

---

## 📝 Logs Détaillés

### **Dans le Terminal Serveur**

```
🔍 Scraping: https://api-lannuaire.service-public.fr...
✅ 50 emails ajoutés depuis cette source
🔍 Scraping: https://www.data.gouv.fr/api...
✅ 25 emails ajoutés depuis cette source
📊 Scraping terminé pour mairies:
   • Emails trouvés: 75
   • Total en mémoire: 75
   • Source: scraping
```

---

## ✅ Avantages

- ✅ **Données officielles** et vérifiées
- ✅ **Pas de blocage** anti-bot
- ✅ **Format structuré** (JSON)
- ✅ **Rapide** et efficace
- ✅ **Légal** et autorisé
- ✅ **Mise à jour** régulière par l'État

---

## 🔗 Liens Utiles

**API Annuaire Service Public :**
https://api-lannuaire.service-public.fr/explore/

**API Geo :**
https://geo.api.gouv.fr/decoupage-administratif

**API Data.gouv.fr :**
https://www.data.gouv.fr/fr/apidoc/

---

## ⚠️ Notes Importantes

### **Emails Générés**

Certains emails (API Geo) sont **générés** au format probable :
- `mairie@paris.fr`
- `mairie@lyon.fr`

Ces formats sont **standards** mais **non garantis**.

### **Emails Officiels**

Les emails de l'API Annuaire Service Public sont **officiels** et **vérifiés**.

---

© 2025 **Maroc Gestion Entreprendre** - Tous droits réservés
