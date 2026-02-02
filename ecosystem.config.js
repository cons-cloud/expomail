// Configuration PM2 pour Production
module.exports = {
  apps: [{
    name: 'hyperemail',
    script: './gouvernement-scraper.js',
    instances: 1,
    exec_mode: 'fork',
    
    // Variables d'environnement
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    
    // Redémarrage automatique
    watch: false,
    max_memory_restart: '500M',
    
    // Logs
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // Redémarrage en cas d'erreur
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    
    // Cron restart (tous les jours à 3h du matin)
    cron_restart: '0 3 * * *',
    
    // Monitoring
    instance_var: 'INSTANCE_ID',
    
    // Graceful shutdown
    kill_timeout: 5000,
    listen_timeout: 3000,
    
    // Merge logs
    merge_logs: true,
    
    // Time zone
    time: true
  }]
};
