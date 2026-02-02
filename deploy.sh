#!/bin/bash

# Script de déploiement automatique HyperEmail
# Usage: ./deploy.sh

echo "╔════════════════════════════════════════════╗"
echo "║   🚀 DÉPLOIEMENT HYPEREMAIL PRODUCTION    ║"
echo "╚════════════════════════════════════════════╝"
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Vérifier si on est sur le serveur
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ Fichier .env non trouvé${NC}"
    echo "Créez le fichier .env à partir de env.production.example"
    exit 1
fi

echo "📦 Installation des dépendances..."
npm install --production

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erreur lors de l'installation des dépendances${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Dépendances installées${NC}"
echo ""

echo "🔍 Vérification de la configuration..."

fi

echo ""
echo "🔄 Redémarrage de l'application..."

# Vérifier si PM2 est installé
if ! command -v pm2 &> /dev/null; then
    echo -e "${RED}❌ PM2 n'est pas installé${NC}"
    echo "Installez PM2 avec: npm install -g pm2"
    exit 1
fi

# Arrêter l'ancienne version
pm2 stop hyperemail 2>/dev/null || true

# Démarrer la nouvelle version
pm2 start ecosystem.config.js --env production

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erreur lors du démarrage de l'application${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Application démarrée${NC}"
echo ""

# Sauvegarder la configuration PM2
pm2 save

echo "📊 Statut de l'application:"
pm2 status hyperemail

echo ""
echo "╔════════════════════════════════════════════╗"
echo "║        ✅ DÉPLOIEMENT TERMINÉ !           ║"
echo "╚════════════════════════════════════════════╝"
echo ""
echo "📝 Commandes utiles:"
echo "  • Voir les logs:     pm2 logs hyperemail"
echo "  • Redémarrer:        pm2 restart hyperemail"
echo "  • Monitoring:        pm2 monit"
echo "  • Arrêter:           pm2 stop hyperemail"
echo ""
