# 📁 Structure de HyperEmail

## 🗂️ Arborescence Complète

```
HyperEmail-main/
├── 📄 package.json                    # Configuration npm
├── 📄 package-lock.json               # Dépendances verrouillées
├── 📄 .gitignore                      # Fichiers ignorés par Git
├── 📄 .env                            # Configuration (SMTP, etc.)
├── 📄 env.example                     # Exemple de configuration
│
├── ��️  gouvernement-scraper.js        # Serveur principal
├── 🔧 configure.sh                    # Script de configuration
├── ✅ check-app.js                    # Script de vérification
│
├── 📖 README.md                       # Guide principal
├── 📖 DEMARRAGE_RAPIDE.md            # Démarrage en 3 étapes
├── 📖 FONCTIONNEMENT.md              # Explication technique
├── 📖 ANTI_SPAM.md                   # Bonnes pratiques
├── 📖 GUIDE_GMAIL.md                 # Configuration Gmail
├── 📖 EXEMPLE_DONNEES.md             # Format des données
├── 📖 VALIDATION_PRODUCTION.md       # Checklist production
├── 📖 STRUCTURE.md                   # Ce fichier
│
├── 📁 public/                         # Fichiers web
│   ├── 🌐 index.html                 # Page d'accueil
│   ├── 🌐 app.html                   # Application principale
│   ├── 🌐 cgu.html                   # Conditions générales
│   └── 🌐 faq.html                   # Questions fréquentes
│
├── 📁 node_modules/                   # Dépendances (auto)
├── 📁 data/                           # Données (vide)
├── 📁 src/                            # Sources
└── 📁 dataconnect/                    # Supabase (optionnel)
```

---

## 📄 Fichiers Principaux

### **Serveur Backend**
- `gouvernement-scraper.js` - Serveur Express + API REST

### **Interface Frontend**
- `public/app.html` - Application principale (dark mode)
- `public/index.html` - Redirection vers app.html
- `public/cgu.html` - Conditions générales
- `public/faq.html` - Foire aux questions

### **Configuration**
- `.env` - Variables d'environnement (SMTP, etc.)
- `package.json` - Dépendances et scripts npm

### **Scripts Utiles**
- `configure.sh` - Configuration automatique
- `check-app.js` - Vérification de l'installation

### **Documentation**
- `README.md` - Guide complet
- `DEMARRAGE_RAPIDE.md` - Guide express
- `FONCTIONNEMENT.md` - Détails techniques
- `ANTI_SPAM.md` - Éviter le spam
- `GUIDE_GMAIL.md` - Configuration Gmail
- `EXEMPLE_DONNEES.md` - Format des données
- `VALIDATION_PRODUCTION.md` - Checklist

---

## 🔧 Scripts NPM

```bash
npm start          # Démarrer l'application
npm run check      # Vérifier la configuration
npm run configure  # Reconfigurer
```

---

## 📦 Dépendances

### **Production**
- `express` - Serveur web
- `nodemailer` - Envoi d'emails
- `axios` - Requêtes HTTP
- `dotenv` - Variables d'environnement
- `json2csv` - Export CSV

### **Optionnelles**
- `@dataconnect/generated` - Supabase (optionnel)

---

## 🌐 Routes API

### **Pages**
- `GET /` - Page principale (app.html)
- `GET /cgu.html` - Conditions générales
- `GET /faq.html` - FAQ

### **Scraping**
- `POST /api/scrape/:category` - Scraper une catégorie

### **Emails**
- `GET /api/emails/:category` - Liste des emails
- `GET /api/stats` - Statistiques
- `POST /api/send/:category` - Envoyer des emails
- `DELETE /api/emails/:category` - Supprimer

### **Export**
- `GET /api/export/csv/:category` - Export CSV catégorie
- `GET /api/export/csv/all/data` - Export CSV global

### **Messages**
- `GET /api/default-message/:category` - Message par défaut

---

## 💾 Stockage

### **En Mémoire**
```javascript
emailsByCategory = {
    mairies: [],
    justice: [],
    ministeres: [],
    prefectures: [],
    autres: []
}
```

### **Format**
```javascript
{
    email: "mairie@paris.fr",
    name: "Mairie de Paris",
    city: "Paris",
    source: "https://...",
    date: Date,
    sent: false,
    category: "mairies"
}
```

---

## 🎨 Design

### **Thème**
- Mode : Dark
- Couleurs : Violet/Purple (#667eea → #764ba2)
- Police : Inter (Google Fonts)

### **Responsive**
- Mobile : < 480px
- Tablette : 480px - 768px
- Desktop : > 768px

---

## 🔒 Sécurité

### **Protection**
- Rate limiting : 100 req/min par IP
- Headers sécurisés (X-Frame-Options, etc.)
- Validation des entrées
- Limite payload : 10MB

### **SMTP**
- TLS sécurisé
- Pool de connexions
- Rate limiting : 1 email/3 sec

---

## 📊 Capacités

| Métrique | Valeur |
|----------|--------|
| Emails max | 200 000 |
| Envois/jour | 500 (Gmail) |
| Catégories | 5 |
| Port | 3000 |

---

© 2025 **Maroc Gestion Entreprendre**
