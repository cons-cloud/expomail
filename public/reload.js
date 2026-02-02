// WebSocket pour le rechargement automatique
function init() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname;
    const port = window.location.port || (protocol === 'wss:' ? '443' : '80');
    const ws = new WebSocket(`${protocol}//${host}:${port}/ws`);
    
    ws.onopen = () => {
        console.log('WebSocket connecté');
    };
    
    ws.onclose = () => {
        console.log('WebSocket déconnecté');
        setTimeout(init, 2000); // Réessayer dans 2s
    };
    
    ws.onerror = (e) => {
        console.log('Erreur WebSocket:', e);
    };
    
    ws.onmessage = (e) => {
        if (e.data === 'reload') {
            window.location.reload();
        }
    };
}

init();