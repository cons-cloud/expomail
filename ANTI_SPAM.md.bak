# 🛡️ Protection Anti-Spam

## Mesures Implémentées

L'application intègre plusieurs techniques pour **éviter que vos emails soient marqués comme spam**.

---

## ✅ Optimisations Techniques

### **1. En-têtes Email Optimisés**

```javascript
headers: {
    'X-Priority': '3',              // Priorité normale
    'X-MSMail-Priority': 'Normal',  // Pas de haute priorité
    'Importance': 'Normal',         // Importance normale
    'List-Unsubscribe': '<mailto:...>', // Lien de désinscription
    'X-Mailer': 'NodeMailer'        // Identification du mailer
}
```

### **2. Nom d'Expéditeur Personnalisé**

Au lieu de `email@gmail.com`, vos emails affichent :
```
"Votre Nom" <email@gmail.com>
```

Configurez dans `.env` :
```env
SENDER_NAME=Votre Nom ou Organisation
```

### **3. Version Texte + HTML**

Chaque email contient :
- **Version HTML** : Avec mise en forme
- **Version texte** : Sans balises HTML

Les filtres anti-spam préfèrent les emails avec les deux versions.

### **4. Adresse de Réponse (Reply-To)**

Les destinataires peuvent répondre directement à votre email.

### **5. Pause Entre Envois**

**3 secondes** entre chaque email pour éviter :
- Le blocage par le serveur SMTP
- La détection comme spam massif
- Les limites de débit

---

## 📋 Bonnes Pratiques à Suivre

### **✅ À FAIRE**

1. **Utilisez un nom d'expéditeur clair**
   ```env
   SENDER_NAME=Association XYZ
   ```

2. **Rédigez un objet pertinent**
   - ❌ "URGENT !!!" 
   - ✅ "Demande de parrainage pour l'élection présidentielle"

3. **Personnalisez le message**
   - Évitez les majuscules excessives
   - Pas de mots "spam" (gratuit, urgent, cliquez ici)
   - Utilisez un français correct

4. **Incluez vos coordonnées**
   - Nom complet
   - Adresse postale
   - Téléphone (optionnel)

5. **Respectez les limites**
   - Gmail : 500 emails/jour maximum
   - Outlook : 300 emails/jour maximum
   - Ne dépassez JAMAIS ces limites

6. **Utilisez un domaine professionnel**
   - ✅ `contact@votre-domaine.fr`
   - ⚠️ `email123@gmail.com`

### **❌ À ÉVITER**

1. ❌ Majuscules excessives : "URGENT !!!"
2. ❌ Trop de points d'exclamation : "!!!"
3. ❌ Mots spam : "gratuit", "cliquez ici", "urgent"
4. ❌ Pièces jointes suspectes
5. ❌ Liens raccourcis (bit.ly, etc.)
6. ❌ Envoyer trop rapidement (respectez la pause)
7. ❌ Utiliser des emails génériques (@gmail, @yahoo)

---

## 🎯 Configuration Recommandée

### **Fichier .env**

```env
# SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre.email@gmail.com
SMTP_PASS=votre_mot_de_passe_application
SMTP_SECURE=0

# Nom d'expéditeur (IMPORTANT)
SENDER_NAME=Votre Nom Complet ou Organisation
```

### **Exemple de Message Bien Rédigé**

```
Objet : Demande de parrainage pour l'élection présidentielle

Monsieur le Maire,

Je vous adresse cette lettre dans le cadre de ma candidature 
à l'élection présidentielle de 2027, en sollicitant votre 
parrainage tel que prévu par la loi.

Ma démarche repose sur un engagement fort : lutter contre 
les injustices sociales, économiques et humaines qui 
affectent notre société.

Ce parrainage ne constitue pas un soutien politique, mais 
un acte démocratique permettant le pluralisme et 
l'expression citoyenne.

Je reste à votre disposition pour vous transmettre 
davantage d'informations.

Cordialement,

[Votre Nom]
[Votre Adresse]
[Votre Téléphone]
[Votre Email]
```

---

## 🔍 Vérification Anti-Spam

### **Outils de Test**

Avant d'envoyer massivement, testez votre email :

1. **Mail-Tester** : https://www.mail-tester.com
   - Envoyez un email test
   - Obtenez un score /10
   - Corrigez les problèmes détectés

2. **GlockApps** : https://glockapps.com
   - Test de délivrabilité
   - Vérification des filtres spam

3. **Envoyez-vous un test**
   - Envoyez à votre propre email
   - Vérifiez s'il arrive en spam
   - Ajustez si nécessaire

---

## 📊 Indicateurs de Qualité

### **Score Anti-Spam Idéal**

| Critère | Score |
|---------|-------|
| **Mail-Tester** | > 8/10 |
| **Taux de délivrabilité** | > 95% |
| **Taux d'ouverture** | > 15% |
| **Taux de spam** | < 0.1% |

---

## 🚨 Signes d'Alerte

Si vos emails sont marqués comme spam :

1. **Vérifiez votre score** sur Mail-Tester
2. **Réduisez le volume** d'envoi
3. **Améliorez le contenu** (moins de mots spam)
4. **Utilisez un domaine professionnel**
5. **Configurez SPF/DKIM** (avancé)

---

## 💾 Export CSV/Excel

### **Sauvegarde des Données**

L'application permet d'exporter vos contacts en CSV :

**Boutons disponibles :**
- 📥 **Télécharger CSV/Excel** (par catégorie)
- 📥 **Tout Exporter (CSV)** (toutes catégories)

**Format du fichier :**
```csv
name;city;email;source;sent;date
Mairie de Paris;Paris;mairie@paris.fr;https://...;false;2025-10-26
```

**Compatible avec :**
- ✅ Microsoft Excel
- ✅ Google Sheets
- ✅ LibreOffice Calc
- ✅ Tout logiciel CSV

**Encodage :** UTF-8 avec BOM (pour Excel)

---

## 📞 Support

Pour toute question : **support@marocgestion.com**

© 2025 **Maroc Gestion Entreprendre** - Tous droits réservés
