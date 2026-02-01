# ⚡ HyperEmail - Version Professionnelle

Application moderne et professionnelle pour récupérer automatiquement des emails depuis internet, les organiser par catégorie et envoyer des messages personnalisés en masse.

**Version:** 3.0.0  
**Status:** ✅ Production Ready

## ✨ Fonctionnalités

- 🎯 **5 catégories** : Mairies, Justice, Ministères, Préfectures, Autres
- 📊 **Capacité maximale** : 200 000 emails
- 🎨 **Interface moderne** : Design professionnel avec animations fluides
- 📧 **Envoi automatisé** : Pause de 3 secondes entre chaque email
- 📱 **Responsive** : Compatible mobile, tablette et desktop
- 🔒 **Sécurisé** : Données en mémoire uniquement

## 🚀 Démarrage Rapide

### 1. Configuration SMTP

Créez un fichier `.env` à la racine du projet :

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre-email@gmail.com
SMTP_PASS=votre-mot-de-passe-application
SMTP_SECURE=0
```

**Pour Gmail** : 
1. Allez sur https://myaccount.google.com/security
2. Activez la validation en 2 étapes
3. Créez un mot de passe d'application
4. Utilisez ce mot de passe dans `SMTP_PASS`

### 2. Installation

```bash
npm install
```

### 3. Lancement

```bash
npm start
```

Ouvrez : **http://localhost:3000**

## 📋 Utilisation

### **Récupération Automatique des Emails**

L'application **scrape automatiquement** les emails depuis des sites web publics :

1. **Sélectionnez une catégorie** (Mairies, Justice, Ministères, Préfectures, Autres)
2. **Cliquez sur "Scraper cette catégorie"** → L'application visite automatiquement les sites web prédéfinis
3. **Les emails sont extraits automatiquement** depuis les pages HTML
4. **Vérifiez** : Consultez la liste des emails collectés

### **Envoi des Emails**

1. **Personnalisez** : Rédigez votre sujet et message
2. **Choisissez** : Entrez le nombre d'emails à envoyer (ex: 100)
3. **Envoyez** : Cliquez sur "📧 Envoyer" ou "🚀 Envoyer à TOUS"

📖 **Pour plus de détails**, consultez le fichier [FONCTIONNEMENT.md](FONCTIONNEMENT.md)

## 📊 Limites et Capacités


## 🎨 Design Moderne


## 🛠️ Structure du Projet

```
HyperEmail-main/
├── gouvernement-scraper.js    # Serveur principal
├── public/
│   ├── app.html              # Interface principale
│   ├── index.html            # Page d'accueil
│   ├── cgu.html              # Conditions générales
│   └── faq.html              # Foire aux questions
├── .env                      # Configuration (à créer)
├── package.json              # Dépendances
└── README.md                 # Documentation
```

## 📝 Notes Importantes


## 📞 Support

Pour toute question : **support@marocgestion.com**


© 2025 **Maroc Gestion Entreprendre** - Tous droits réservés
# hyperemail-expobeton
