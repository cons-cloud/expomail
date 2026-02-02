# 🔥 Créer les Collections dans Supabase Console

## 📋 Guide Pas à Pas

### **Étape 1 : Ouvrir Supabase Console**

1. Allez sur : https://app.supabase.io/project/hyperemail-a5e30
2. Vous devriez voir "Supabase Database"
3. Si Supabase n'est pas activé, cliquez sur **"Créer une base de données"**

---

### **Étape 2 : Activer Supabase (Si Nécessaire)**

Si c'est la première fois :

1. Cliquez sur **"Créer une base de données"**
2. Mode : **"Démarrer en mode production"**
3. Région : **"europe-west1"** (ou la plus proche)
4. Cliquez sur **"Activer"**

---

### **Étape 3 : Créer la Collection "emails"**

1. Cliquez sur **"Démarrer la collection"**
2. **ID de collection** : `emails`
3. Cliquez sur **"Suivant"**

**Créer le premier document :**
- **ID du document** : `mairies_test`
- Ajoutez les champs suivants :

| Nom du champ | Type | Valeur |
|--------------|------|--------|
| email | string | mairie@paris.fr |
| name | string | Mairie de Paris |
| city | string | Paris |
| source | string | Base de test |
| category | string | mairies |
| sent | boolean | false |
| date | timestamp | [Cliquez sur "Ajouter l'heure du serveur"] |

4. Cliquez sur **"Enregistrer"**

---

### **Étape 4 : Ajouter Plus d'Emails**

**Dans la collection "emails", cliquez sur "Ajouter un document" :**

**Document 2 :**
- **ID** : `mairies_lyon`
- email : `contact@mairie-lyon.fr`
- name : `Mairie de Lyon`
- city : `Lyon`
- source : `Base de test`
- category : `mairies`
- sent : `false`
- date : [Timestamp]

**Document 3 :**
- **ID** : `mairies_marseille`
- email : `mairie@marseille.fr`
- name : `Mairie de Marseille`
- city : `Marseille`
- source : `Base de test`
- category : `mairies`
- sent : `false`
- date : [Timestamp]

---

### **Étape 5 : Créer la Collection "categories"**

1. Retour à la racine Supabase
2. Cliquez sur **"Démarrer la collection"**
3. **ID de collection** : `categories`

**Document 1 : mairies**
- **ID** : `mairies`
- name : `Mairies`
- icon : `🏛️`
- description : `Mairies françaises`
- active : `true`
- emailCount : `0` (number)

**Document 2 : justice**
- **ID** : `justice`
- name : `Justice`
- icon : `⚖️`
- description : `Tribunaux`
- active : `true`
- emailCount : `0`

**Document 3 : ministeres**
- **ID** : `ministeres`
- name : `Ministères`
- icon : `🏢`
- description : `Ministères français`
- active : `true`
- emailCount : `0`

---

### **Étape 6 : Créer la Collection "stats"**

1. **ID de collection** : `stats`

**Document : global**
- **ID** : `global`
- totalEmails : `0` (number)
- totalSent : `0` (number)
- totalPending : `0` (number)

---

## ✅ Résultat Final

Après ces étapes, vous devriez voir dans Supabase Console :

```
Supabase Database
├── 📧 emails (3 documents)
│   ├── mairies_test
│   ├── mairies_lyon
│   └── mairies_marseille
│
├── 📁 categories (3 documents)
│   ├── mairies
│   ├── justice
│   └── ministeres
│
└── 📊 stats (1 document)
    └── global
```

---

## 🎯 Pourquoi Faire Ça Manuellement ?

### **Problème Actuel**

L'application ne peut pas créer automatiquement les collections car :
- ❌ Pas de vraies credentials Supabase (supabase.js)
- ❌ Les données restent en mémoire uniquement

### **Solution Temporaire**

Créer manuellement les collections pour :
- ✅ Voir la structure dans Supabase
- ✅ Tester l'interface Supabase
- ✅ Comprendre le fonctionnement

### **Solution Permanente (Plus Tard)**

1. Télécharger le fichier JSON depuis Supabase Console
2. Le placer comme `supabase.js`
3. Redémarrer l'app
4. Les données seront automatiquement synchronisées

---

## 📸 Captures d'Écran

### **Créer une Collection**
![Créer Collection](https://firebase.google.com/docs/firestore/images/console-add-collection.png)

### **Ajouter un Document**
![Ajouter Document](https://firebase.google.com/docs/firestore/images/console-add-document.png)

---

## 🔗 Liens Utiles

**Supabase Console :**
https://console.firebase.google.com/u/0/project/hyperemail-a5e30/firestore

**Documentation Supabase :**
https://firebase.google.com/docs/firestore/quickstart

---

## ⚡ Alternative Rapide

### **Script de Création Automatique**

Si vous avez Supabase CLI installé :

```bash
# Installer Supabase CLI
npm install -g firebase-tools

# Se connecter
firebase login

# Sélectionner le projet
firebase use hyperemail-a5e30
```

Mais pour l'instant, **la création manuelle est plus simple** !

---

## ✅ Vérification

Après avoir créé les collections, rafraîchissez la page Supabase Console.

Vous devriez voir :
- ✅ Collection "emails" avec 3 documents
- ✅ Collection "categories" avec 3 documents
- ✅ Collection "stats" avec 1 document

---

© 2025 **Maroc Gestion Entreprendre** - Tous droits réservés
