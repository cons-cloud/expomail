// Widget de suivi des emails - à ajouter dans app.html
function createEmailTrackingWidget() {
    const widget = document.createElement('div');
    widget.id = 'emailTrackingWidget';
    widget.innerHTML = `
        <div class="tracking-widget" style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e9ecef;">
            <h3 style="margin-bottom: 15px; color: #333;">📊 Suivi des Emails Envoyés</h3>
            
            <div class="tracking-stats" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px;">
                <div class="stat-card" style="background: white; padding: 15px; border-radius: 6px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <div style="font-size: 24px; font-weight: bold; color: #667eea;" id="totalSent">0</div>
                    <div style="color: #666; font-size: 14px;">Emails Envoyés</div>
                </div>
                <div class="stat-card" style="background: white; padding: 15px; border-radius: 6px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <div style="font-size: 24px; font-weight: bold; color: #28a745;" id="totalOpened">0</div>
                    <div style="color: #666; font-size: 14px;">Emails Ouverts</div>
                </div>
                <div class="stat-card" style="background: white; padding: 15px; border-radius: 6px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <div style="font-size: 24px; font-weight: bold; color: #ffc107;" id="openRate">0%</div>
                    <div style="color: #666; font-size: 14px;">Taux d'Ouverture</div>
                </div>
            </div>
            
            <div class="tracking-list" style="background: white; border-radius: 6px; padding: 15px;">
                <h4 style="margin-bottom: 10px; color: #333;">📋 Liste des Emails Suivis</h4>
                <div id="trackingList" style="max-height: 300px; overflow-y: auto;">
                    <p style="color: #999; text-align: center;">Chargement...</p>
                </div>
            </div>
            
            <div style="margin-top: 15px; text-align: center;">
                <small style="color: #666;">Dernière mise à jour: <span id="lastUpdate">-</span></small>
            </div>
        </div>
    `;
    
    return widget;
}

// Charger et afficher les données de suivi
async function loadEmailTracking() {
    try {
        const res = await apiFetch('/api/dashboard-stats');
        const data = await res.json();
        
        if (data.success) {
            const stats = data.stats;
            
            // Mettre à jour les compteurs
            document.getElementById('totalSent').textContent = stats.totalSent || 0;
            document.getElementById('totalOpened').textContent = stats.totalOpened || 0;
            document.getElementById('openRate').textContent = stats.openRate + '%' || '0%';
            document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString();
            
            // Afficher la liste des emails
            const trackingList = document.getElementById('trackingList');
            if (stats.allTracking && stats.allTracking.length > 0) {
                trackingList.innerHTML = stats.allTracking.map(item => `
                    <div class="tracking-item" style="border-bottom: 1px solid #eee; padding: 10px 0; display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong>${item.email}</strong>
                            <br><small style="color: #666;">${item.organisation || 'Non spécifié'}</small>
                        </div>
                        <div style="text-align: right;">
                            <span style="padding: 2px 8px; border-radius: 4px; font-size: 12px; background: ${item.opened ? '#28a745' : '#ffc107'}; color: white;">
                                ${item.opened ? '✅ Ouvert' : '⏳ En attente'}
                            </span>
                            <br><small style="color: #999;">
                                Envoyé: ${new Date(item.sentAt).toLocaleDateString()}
                                ${item.openedAt ? `<br>Ouvert: ${new Date(item.openedAt).toLocaleDateString()}` : ''}
                            </small>
                        </div>
                    </div>
                `).join('');
            } else {
                trackingList.innerHTML = '<p style="color: #999; text-align: center;">Aucun email suivi pour le moment</p>';
            }
        }
    } catch (error) {
        console.error('Erreur chargement suivi:', error);
        document.getElementById('trackingList').innerHTML = '<p style="color: #ff4757; text-align: center;">Erreur de chargement</p>';
    }
}

// Initialiser le widget
document.addEventListener('DOMContentLoaded', () => {
    // Ajouter le widget après la section des contacts
    const contactsSection = document.querySelector('.email-list');
    if (contactsSection) {
        const widget = createEmailTrackingWidget();
        contactsSection.parentNode.insertBefore(widget, contactsSection.nextSibling);
        
        // Charger les données initiales
        loadEmailTracking();
        
        // Rafraîchir toutes les 30 secondes
        setInterval(loadEmailTracking, 30000);
    }
});
