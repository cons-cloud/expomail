#!/bin/bash

# Script de configuration HyperEmail
echo "🔧 Configuration de HyperEmail..."

# Créer le fichier .env
cat > .env << 'EOF'
# Configuration SMTP Gmail
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=francedemocratie2@gmail.com
SMTP_PASS=gukniiqmunegbckt
SMTP_SECURE=0

# Nom de l'expéditeur
SENDER_NAME=France Démocratie

# Port du serveur
PORT=3000

# Clé API
API_KEY=HYPEREMAIL123

# Secret JWT
JWT_SECRET=hyperemail-secret-2025

# Limite de destinataires
MAX_RECIPIENTS=200000

# Email API utilisateur
API_USER_EMAIL=api@hyperemail.local
API_USER_PASS=api-hyperemail-2025
EOF

echo "✅ Fichier .env créé avec succès!"
echo ""
echo "📧 Configuration SMTP:"
echo "   Email: francedemocratie2@gmail.com"
echo "   Status: Configuré"
echo ""
echo "🚀 Pour démarrer l'application:"
echo "   npm start"
echo ""
