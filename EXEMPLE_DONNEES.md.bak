# 📋 Exemple de Données Extraites

## Format des Données Collectées

Lorsque l'application scrape les sites web, elle extrait et stocke les informations suivantes pour chaque contact :

---

## 🏛️ Exemple pour MAIRIES

```json
{
  "email": "mairie@paris.fr",
  "name": "Mairie de Paris",
  "city": "Paris",
  "source": "https://www.annuaire-mairie.fr",
  "date": "2025-10-26T10:00:00.000Z",
  "sent": false,
  "category": "mairies"
}
```

```json
{
  "email": "contact@mairie-lyon.fr",
  "name": "Mairie de Lyon",
  "city": "Lyon",
  "source": "https://www.communes.com",
  "date": "2025-10-26T10:01:00.000Z",
  "sent": false,
  "category": "mairies"
}
```

---

## ⚖️ Exemple pour JUSTICE

```json
{
  "email": "tribunal@justice.gouv.fr",
  "name": "Tribunal de Grande Instance de Marseille",
  "city": "Marseille",
  "source": "https://www.justice.gouv.fr",
  "date": "2025-10-26T10:02:00.000Z",
  "sent": false,
  "category": "justice"
}
```

```json
{
  "email": "contact@tribunal-bordeaux.fr",
  "name": "Tribunal de Bordeaux",
  "city": "Bordeaux",
  "source": "https://www.annuaires.justice.gouv.fr",
  "date": "2025-10-26T10:03:00.000Z",
  "sent": false,
  "category": "justice"
}
```

---

## 🏢 Exemple pour MINISTÈRES

```json
{
  "email": "contact@interieur.gouv.fr",
  "name": "Ministère de l'Intérieur",
  "city": "Paris",
  "source": "https://www.interieur.gouv.fr",
  "date": "2025-10-26T10:04:00.000Z",
  "sent": false,
  "category": "ministeres"
}
```

```json
{
  "email": "info@education.gouv.fr",
  "name": "Ministère de l'Éducation Nationale",
  "city": "Paris",
  "source": "https://www.education.gouv.fr",
  "date": "2025-10-26T10:05:00.000Z",
  "sent": false,
  "category": "ministeres"
}
```

---

## 🏛️ Exemple pour PRÉFECTURES

```json
{
  "email": "prefecture@rhone.gouv.fr",
  "name": "Préfecture du Rhône",
  "city": "Lyon",
  "source": "https://www.interieur.gouv.fr/Le-ministere/Prefectures",
  "date": "2025-10-26T10:06:00.000Z",
  "sent": false,
  "category": "prefectures"
}
```

---

## 📊 Structure des Champs

| Champ | Type | Description | Exemple |
|-------|------|-------------|---------|
| **email** | String | Adresse email | `mairie@paris.fr` |
| **name** | String | Nom de l'institution | `Mairie de Paris` |
| **city** | String | Ville | `Paris` |
| **source** | String | URL source | `https://www.annuaire-mairie.fr` |
| **date** | Date | Date de récupération | `2025-10-26T10:00:00.000Z` |
| **sent** | Boolean | Statut d'envoi | `false` ou `true` |
| **category** | String | Catégorie | `mairies`, `justice`, etc. |

---

## 🎯 Affichage dans l'Interface

Dans l'application web, chaque contact s'affiche ainsi :

```
┌─────────────────────────────────────────────────────────┐
│ Mairie de Paris          📍 Paris                       │
│ ✉️ mairie@paris.fr                                      │
│                                           [⏳ En attente]│
└─────────────────────────────────────────────────────────┘
```

Après envoi :

```
┌─────────────────────────────────────────────────────────┐
│ Mairie de Lyon           📍 Lyon                        │
│ ✉️ contact@mairie-lyon.fr                               │
│                                              [✅ Envoyé] │
└─────────────────────────────────────────────────────────┘
```

---

## 🔍 Détection Automatique

### **Noms Détectés**
L'application cherche automatiquement :
- `Mairie de [Ville]`
- `Tribunal de [Ville]`
- `Préfecture de [Département]`
- `Ministère de/des/du [Nom]`
- Balises HTML `<h1>`, `<h2>`, `<title>`, `<strong>`

### **Villes Détectées**
L'application cherche automatiquement :
- Codes postaux : `75001 Paris`, `69002 Lyon`
- Format parenthèses : `Paris (75001)`
- Mentions explicites : `ville: Paris`

### **Si Non Trouvé**
Si le nom ou la ville ne peut pas être extrait :
- **name** : `"Non spécifié"`
- **city** : `"Non spécifié"`

---

## 💾 Stockage

Les données sont stockées **en mémoire** dans un objet JavaScript :

```javascript
emailsByCategory = {
    mairies: [
        { email: "...", name: "...", city: "...", ... },
        { email: "...", name: "...", city: "...", ... }
    ],
    justice: [...],
    ministeres: [...],
    prefectures: [...],
    autres: [...]
}
```

**⚠️ Important** : Les données sont **volatiles** et perdues au redémarrage du serveur.

---

© 2025 **Maroc Gestion Entreprendre** - Tous droits réservés
