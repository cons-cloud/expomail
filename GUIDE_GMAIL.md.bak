# 📧 Guide Gmail - Éviter le Ban et Recevoir les Emails

## ⚠️ IMPORTANT : Configuration Gmail

Pour que **francedemocratie2@gmail.com** ne soit PAS banni et que vous receviez tous les emails envoyés :

---

## 🔐 1. Configuration du Compte Gmail

### **Étape 1 : Activer la Validation en 2 Étapes**
1. Allez sur https://myaccount.google.com/security
2. Activez "Validation en 2 étapes"
3. Suivez les instructions

### **Étape 2 : Créer un Mot de Passe d'Application**
1. Toujours sur https://myaccount.google.com/security
2. Cherchez "Mots de passe des applications"
3. Créez un nouveau mot de passe pour "Mail"
4. **COPIEZ** ce mot de passe (16 caractères)

### **Étape 3 : Configurer le .env**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=francedemocratie2@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx  # ← Mot de passe d'application
SMTP_SECURE=0

# Nom affiché (IMPORTANT)
SENDER_NAME=France Démocratie
```

---

## 📬 2. Recevoir les Emails dans "Envoyés"

### **Configuration Automatique**
L'application envoie automatiquement une **copie BCC** à votre adresse.

**Résultat :**
- ✅ Chaque email envoyé apparaît dans votre dossier "Envoyés"
- ✅ Vous avez un historique complet
- ✅ Vous pouvez suivre tous les envois

### **Vérification**
Après avoir envoyé des emails :
1. Ouvrez Gmail
2. Allez dans "Envoyés"
3. Vous verrez tous les emails envoyés

---

## 🛡️ 3. Éviter le Ban Gmail

### **Limites Gmail**
- **500 emails par jour** MAXIMUM
- **3 secondes** entre chaque email (automatique)
- **100 emails par connexion** (automatique)

### **Protections Intégrées**

#### **1. Rate Limiting Automatique**
```javascript
rateDelta: 3000,  // 3 secondes entre chaque email
rateLimit: 1      // 1 email par période
```

#### **2. Pool de Connexions**
```javascript
pool: true,
maxConnections: 1,
maxMessages: 100
```

#### **3. En-têtes Optimisés**
- Priorité normale (pas de haute priorité)
- Lien de désinscription
- Message-ID unique
- Version texte + HTML

---

## ✅ 4. Bonnes Pratiques

### **À FAIRE**

1. **Ne dépassez JAMAIS 500 emails/jour**
   - Comptez vos envois
   - Répartissez sur plusieurs jours si nécessaire

2. **Utilisez un objet clair**
   ```
   ✅ "Demande de parrainage pour l'élection présidentielle"
   ❌ "URGENT !!! CLIQUEZ ICI !!!"
   ```

3. **Rédigez un message professionnel**
   - Pas de majuscules excessives
   - Pas de mots spam
   - Français correct

4. **Configurez SENDER_NAME**
   ```env
   SENDER_NAME=France Démocratie
   ```

5. **Testez d'abord**
   - Envoyez 10 emails test
   - Vérifiez qu'ils arrivent bien
   - Vérifiez qu'ils ne sont pas en spam

### **À ÉVITER**

❌ Envoyer plus de 500 emails/jour
❌ Utiliser des mots spam ("gratuit", "urgent", "cliquez")
❌ Envoyer trop rapidement (respectez les 3 secondes)
❌ Utiliser des majuscules excessives
❌ Ajouter des pièces jointes suspectes

---

## 📊 5. Surveillance

### **Compteur d'Envois**
L'application affiche :
- Nombre d'emails envoyés
- Nombre d'erreurs
- Statut de chaque email

### **Vérification Gmail**
1. Allez dans "Envoyés"
2. Comptez vos emails du jour
3. **Ne dépassez pas 500**

### **Si Vous Approchez de 500**
- ⚠️ Arrêtez les envois
- ⏰ Attendez le lendemain
- 📊 Répartissez vos envois

---

## 🚨 6. Que Faire en Cas de Problème ?

### **Emails en Spam**
1. Testez sur https://www.mail-tester.com
2. Améliorez votre score (> 8/10)
3. Ajustez le contenu du message

### **Erreur d'Authentification**
1. Vérifiez le mot de passe d'application
2. Vérifiez que la validation 2 étapes est active
3. Régénérez un nouveau mot de passe d'application

### **Compte Bloqué**
1. Allez sur https://accounts.google.com
2. Vérifiez les alertes de sécurité
3. Suivez les instructions de Google
4. Attendez 24h avant de réessayer

---

## 🎯 7. Configuration Optimale

### **Fichier .env Complet**
```env
# SMTP Gmail
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=francedemocratie2@gmail.com
SMTP_PASS=votre_mot_de_passe_application_16_caracteres
SMTP_SECURE=0

# Nom d'expéditeur
SENDER_NAME=France Démocratie

# Port du serveur
PORT=3000
```

### **Vérification de la Configuration**
Au démarrage, vous verrez :
```
✅ SMTP: francedemocratie2@gmail.com
```

---

## 📈 8. Stratégie d'Envoi Recommandée

### **Jour 1**
- Envoyez 50 emails test
- Vérifiez qu'ils arrivent bien
- Vérifiez le dossier "Envoyés"

### **Jour 2**
- Envoyez 100 emails
- Surveillez les erreurs
- Vérifiez le taux de délivrabilité

### **Jour 3+**
- Envoyez jusqu'à 400 emails/jour
- Gardez une marge de sécurité (pas 500)
- Répartissez sur la journée

---

## 🔍 9. Vérifications Quotidiennes

**Avant d'envoyer :**
- [ ] Vérifier le nombre d'emails déjà envoyés aujourd'hui
- [ ] Vérifier que le message est professionnel
- [ ] Vérifier que SENDER_NAME est configuré

**Après l'envoi :**
- [ ] Vérifier le dossier "Envoyés" Gmail
- [ ] Compter les emails envoyés
- [ ] Noter les erreurs éventuelles

---

## 📞 Support

Pour toute question : **support@marocgestion.com**

© 2025 **Maroc Gestion Entreprendre** - Tous droits réservés
