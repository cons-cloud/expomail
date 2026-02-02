# 🔐 Authentification HyperEmail

## ✅ Système de Connexion Sécurisé

HyperEmail dispose maintenant d'un **système d'authentification obligatoire** pour protéger l'accès à l'application.

---

## 🔑 Credentials d'Accès

### **Email Autorisé**
```
hyperemail@gmail.com
```

### **Mot de Passe**
```
Hyperemail1@
```

**⚠️ Ces credentials sont les SEULS autorisés à accéder à l'application.**

---

## 🚀 Fonctionnement

### **1. Page de Connexion**

Lorsque vous lancez l'application :

```bash
npm start
```

Et que vous ouvrez :
```
http://localhost:3000
```

**Vous êtes automatiquement redirigé vers la page de connexion.**

### **2. Authentification**

1. **Entrez l'email** : `hyperemail@gmail.com`
2. **Entrez le mot de passe** : `Hyperemail1@`
3. **Cliquez sur "Se connecter"**

**Résultat :**
```
✅ Connexion réussie ! Redirection...
```

### **3. Accès à l'Application**

Après authentification réussie :
- ✅ Redirection automatique vers `/app.html`
- ✅ Session créée (valide 24 heures)
- ✅ Accès complet à toutes les fonctionnalités

---

## 🛡️ Sécurité

### **Protections Implémentées**

#### **1. Validation des Credentials**
- ✅ Email et mot de passe vérifiés côté client
- ✅ Comparaison stricte (case-sensitive)
- ✅ Aucune autre combinaison acceptée

#### **2. Rate Limiting**
- ✅ **Maximum 5 tentatives** de connexion
- ✅ **Blocage 5 minutes** après 5 échecs
- ✅ Logs des tentatives échouées

```javascript
❌ Tentative de connexion échouée (3/5)
⚠️ Compte temporairement bloqué
```

#### **3. Session Sécurisée**
- ✅ **Durée** : 24 heures
- ✅ **Stockage** : localStorage (navigateur)
- ✅ **Vérification** : À chaque chargement de page
- ✅ **Expiration automatique**

#### **4. Protection de la Page App**
- ✅ Vérification de session au chargement
- ✅ Redirection automatique si non connecté
- ✅ Vérification périodique (toutes les minutes)

#### **5. Protections Anti-Hack**
- ✅ Désactivation du clic droit
- ✅ Blocage F12 (DevTools)
- ✅ Blocage Ctrl+Shift+I
- ✅ Désactivation copier-coller mot de passe

---

## 🔄 Gestion de Session

### **Durée de Session**
```
24 heures (86400000 ms)
```

### **Renouvellement**
- La session se renouvelle automatiquement à chaque connexion
- Pas besoin de se reconnecter pendant 24h

### **Expiration**
Après 24 heures :
```
⚠️ Session expirée. Veuillez vous reconnecter.
```
Redirection automatique vers `/login.html`

---

## 🚪 Déconnexion

### **Bouton de Déconnexion**

Dans l'interface app.html :
- **Bouton** : "🚪 Déconnexion" (en haut à droite)
- **Action** : Supprime la session et redirige vers login

### **Déconnexion Manuelle**

```javascript
// Dans la console du navigateur
localStorage.removeItem('hyperemail_session');
window.location.href = '/login.html';
```

---

## 📊 Flux d'Authentification

```
┌─────────────────────────────────────────┐
│  1. Lancer l'application                │
│     npm start                           │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  2. Ouvrir http://localhost:3000        │
│     → Redirection automatique           │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  3. Page de Connexion                   │
│     /login.html                         │
│     • Email : hyperemail@gmail.com      │
│     • Mot de passe : Hyperemail1@       │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  4. Validation                          │
│     ✅ Credentials corrects ?           │
└─────────────────┬───────────────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
        ▼                   ▼
    ✅ OUI              ❌ NON
        │                   │
        ▼                   ▼
┌───────────────┐   ┌───────────────┐
│ Créer Session │   │ Erreur        │
│ Rediriger     │   │ Réessayer     │
│ /app.html     │   │ (5 max)       │
└───────────────┘   └───────────────┘
```

---

## 🔍 Logs de Sécurité

### **Connexion Réussie**
```
✅ Connexion réussie: hyperemail@gmail.com
```

### **Connexion Échouée**
```
❌ Tentative de connexion échouée (1/5)
```

### **Compte Bloqué**
```
⚠️ Compte temporairement bloqué
🚫 Trop de tentatives échouées. Compte bloqué pendant 5 minutes.
```

### **Déconnexion**
```
🚪 Déconnexion réussie
```

---

## 🎯 Utilisation

### **Première Connexion**

1. **Démarrez** l'application
   ```bash
   npm start
   ```

2. **Ouvrez** le navigateur
   ```
   http://localhost:3000
   ```

3. **Connectez-vous**
   - Email : `hyperemail@gmail.com`
   - Mot de passe : `Hyperemail1@`

4. **Utilisez** l'application
   - Scraping
   - Envoi d'emails
   - Export CSV
   - Etc.

5. **Déconnectez-vous** (optionnel)
   - Cliquez sur "🚪 Déconnexion"

### **Connexions Suivantes**

Si vous vous reconnectez dans les 24 heures :
- ✅ **Session active** : Accès direct à `/app.html`
- ❌ **Session expirée** : Reconnexion requise

---

## ⚠️ Important

### **Sécurité des Credentials**

**NE PARTAGEZ JAMAIS** les credentials :
- ❌ Pas par email
- ❌ Pas par message
- ❌ Pas dans le code source public

### **Changement de Mot de Passe**

Pour changer le mot de passe, modifiez dans `/public/login.html` :

```javascript
const AUTHORIZED_PASSWORD = 'VotreNouveauMotDePasse';
```

**Et dans `/public/app.html` :**

```javascript
const AUTHORIZED_EMAIL = 'hyperemail@gmail.com';
```

---

## 🔧 Configuration

### **Durée de Session**

Pour modifier la durée (actuellement 24h) :

```javascript
// Dans login.html et app.html
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 heures

// Exemples :
// 1 heure : 1 * 60 * 60 * 1000
// 12 heures : 12 * 60 * 60 * 1000
// 7 jours : 7 * 24 * 60 * 60 * 1000
```

### **Limite de Tentatives**

Pour modifier le nombre de tentatives (actuellement 5) :

```javascript
// Dans login.html
const MAX_ATTEMPTS = 5; // Changez cette valeur
```

---

## ✅ Résumé

**Système d'authentification complet :**

- ✅ **Page de connexion** obligatoire
- ✅ **Credentials uniques** : hyperemail@gmail.com / Hyperemail1@
- ✅ **Session 24h** avec renouvellement automatique
- ✅ **Rate limiting** : 5 tentatives max
- ✅ **Protection anti-hack** : DevTools bloqués
- ✅ **Déconnexion** sécurisée
- ✅ **Logs** de toutes les actions

**L'application est maintenant protégée et accessible uniquement avec les bons credentials !** 🔐

---

© 2025 **Maroc Gestion Entreprendre** - Tous droits réservés
