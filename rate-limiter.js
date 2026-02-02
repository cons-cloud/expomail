// Rate Limiter Intelligent pour les APIs
class APIRateLimiter {
    constructor() {
        this.limits = {
            'api-lannuaire.service-public.fr': {
                max: 1000,
                window: 60000, // 1 minute
                requests: []
            },
            'geo.api.gouv.fr': {
                max: 500,
                window: 60000,
                requests: []
            },
            'data.gouv.fr': {
                max: 10000,
                window: 3600000, // 1 heure
                requests: []
            }
        };
        
        // Limite pour le serveur local
        this.localLimit = {
            max: 1000,
            window: 60000, // 1 minute
            requests: new Map()
        };
    }

    getAPIKey(url) {
        for (const key of Object.keys(this.limits)) {
            if (url.includes(key)) {
                return key;
            }
        }
        return null;
    }

    async checkLimit(url) {
        const apiKey = this.getAPIKey(url);
        if (!apiKey) return true; // Pas de limite pour cette API

        const limit = this.limits[apiKey];
        const now = Date.now();

        // Nettoyer les anciennes requêtes
        limit.requests = limit.requests.filter(time => now - time < limit.window);

        // Vérifier si on peut faire une nouvelle requête
        if (limit.requests.length >= limit.max) {
            const oldestRequest = limit.requests[0];
            const waitTime = limit.window - (now - oldestRequest);
            
            console.log(`⏳ Rate limit atteint pour ${apiKey}, attente ${Math.ceil(waitTime / 1000)}s`);
            
            // Attendre
            await new Promise(resolve => setTimeout(resolve, waitTime + 1000));
            
            // Nettoyer à nouveau
            limit.requests = limit.requests.filter(time => Date.now() - time < limit.window);
        }

        // Ajouter la nouvelle requête
        limit.requests.push(now);
        return true;
    }

    getStats() {
        const stats = {};
        for (const [key, limit] of Object.entries(this.limits)) {
            const now = Date.now();
            const recent = limit.requests.filter(time => now - time < limit.window);
            stats[key] = {
                used: recent.length,
                max: limit.max,
                remaining: limit.max - recent.length,
                resetIn: recent.length > 0 ? Math.ceil((limit.window - (now - recent[0])) / 1000) : 0
            };
        }
        return stats;
    }

    reset() {
        for (const limit of Object.values(this.limits)) {
            limit.requests = [];
        }
    }
}

module.exports = new APIRateLimiter();
