// Éditeur d'email avancé avec toutes les fonctionnalités Gmail

class EmailEditor {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.instanceId = containerId + '-' + Date.now(); // ID unique pour cette instance
        this.options = {
            enableAttachments: true,
            enableSignature: true,
            enableFormatting: true,
            maxFileSize: 25 * 1024 * 1024, // 25MB
            allowedFileTypes: ['image/*', 'application/pdf', 'text/*', 'application/msword', 'application/vnd.openxmlformats-officedocument.*'],
            ...options
        };
        
        this.attachments = [];
        this.signature = '';
        this.isDraft = false;
        
        // Stocker la référence à cette instance dans le conteneur
        this.container.emailEditor = this;
        
        this.init();
    }
    
    // Synchroniser les destinataires avec la liste manuelle du haut
    syncWithManualRecipients() {
        if (typeof manualEmails !== 'undefined' && manualEmails.length > 0) {
            const emails = manualEmails.map(contact => contact.email).filter(email => email);
            const toField = document.getElementById(`to-field-${this.instanceId}`);
            if (toField) {
                toField.value = emails.join(', ');
            }
        }
    }
    
    // Mettre à jour la liste manuelle depuis le champ destinataires
    updateManualRecipientsFromField() {
        const toField = document.getElementById(`to-field-${this.instanceId}`);
        if (toField && typeof manualEmails !== 'undefined') {
            const emails = toField.value.split(',').map(email => email.trim()).filter(email => email);
            
            // Vider et recréer la liste manuelle
            manualEmails.length = 0;
            emails.forEach(email => {
                manualEmails.push({ organisation: '', email: email });
            });
            
            // Mettre à jour l'affichage en haut
            if (typeof updateManualEmailsList === 'function') {
                updateManualEmailsList();
            }
        }
    }
    
    init() {
        this.render();
        // Attendre que le DOM soit prêt avant d'attacher les listeners
        setTimeout(() => {
            this.setupEventListeners();
            this.loadDraft();
        }, 50);
    }
    
    render() {
        this.container.innerHTML = `
            <div class="email-editor-container">
                <div class="editor-header">
                    <h3>📧 Rédiger un email professionnel</h3>
                </div>
                
                <div class="editor-body">
                    <!-- Champ Destinataires -->
                    <div class="editor-field">
                        <label>📨 Destinataires</label>
                        <div id="recipients-container-${this.instanceId}">
                            <input type="email" id="to-field-${this.instanceId}" placeholder="Ajouter des destinataires..." multiple>
                        </div>
                    </div>
                    
                    <!-- Champ CC -->
                    <div class="editor-field">
                        <label>📋 CC</label>
                        <input type="email" id="cc-field-${this.instanceId}" placeholder="Copie carbone (optionnel)">
                    </div>
                    
                    <!-- Champ BCC -->
                    <div class="editor-field">
                        <label>🔒 BCC</label>
                        <input type="email" id="bcc-field-${this.instanceId}" placeholder="Copie carbone cachée (optionnel)">
                    </div>
                    
                    <!-- Champ Sujet -->
                    <div class="editor-field">
                        <label>📝 Sujet</label>
                        <input type="text" id="subject-field-${this.instanceId}" placeholder="Objet de l'email...">
                    </div>
                    
                    <!-- Barre d'outils de formatage -->
                    ${this.options.enableFormatting ? this.renderToolbar() : ''}
                    
                    <!-- Éditeur de contenu -->
                    <div class="editor-field">
                        <label>✍️ Message</label>
                        ${this.options.enableFormatting ? 
                            `<div id="message-editor-${this.instanceId}" class="editor-content" contenteditable="true" placeholder="Rédigez votre message ici..."></div>` :
                            `<textarea id="message-editor-${this.instanceId}" placeholder="Rédigez votre message ici..." rows="10"></textarea>`
                        }
                    </div>
                    
                    <!-- Section pièces jointes -->
                    ${this.options.enableAttachments ? this.renderAttachments() : ''}
                    
                    <!-- Section signature -->
                    ${this.options.enableSignature ? this.renderSignature() : ''}
                    
                    <!-- Actions -->
                    <div class="editor-actions">
                        <div class="action-left">
                            <span id="char-count-${this.instanceId}" class="char-count">0 caractères</span>
                            <span id="save-status-${this.instanceId}" class="save-status"></span>
                        </div>
                        <div class="action-right">
                            <button type="button" class="btn-draft" onclick="document.getElementById('${this.container.id}').emailEditor.saveDraft()">
                                <span class="btn-icon">💾</span>
                                <span class="btn-text">Enregistrer brouillon</span>
                            </button>
                            <button type="button" class="btn-send" onclick="document.getElementById('${this.container.id}').emailEditor.sendEmail()">
                                <span class="btn-icon">📧</span>
                                <span class="btn-text">Envoyer l'email</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    renderToolbar() {
        return `
            <div class="editor-toolbar">
                <!-- Formatage de texte -->
                <button class="toolbar-btn" onclick="emailEditor.formatText('bold')" title="Gras">
                    <strong>B</strong>
                </button>
                <button class="toolbar-btn" onclick="emailEditor.formatText('italic')" title="Italique">
                    <em>I</em>
                </button>
                <button class="toolbar-btn" onclick="emailEditor.formatText('underline')" title="Souligné">
                    <u>U</u>
                </button>
                <button class="toolbar-btn" onclick="emailEditor.formatText('strikeThrough')" title="Barré">
                    <s>S</s>
                </button>
                
                <div class="toolbar-separator"></div>
                
                <!-- Alignement -->
                <button class="toolbar-btn" onclick="emailEditor.formatText('justifyLeft')" title="Aligner à gauche">
                    ⬅️
                </button>
                <button class="toolbar-btn" onclick="emailEditor.formatText('justifyCenter')" title="Centrer">
                    ⬌
                </button>
                <button class="toolbar-btn" onclick="emailEditor.formatText('justifyRight')" title="Aligner à droite">
                    ➡️
                </button>
                
                <div class="toolbar-separator"></div>
                
                <!-- Listes -->
                <button class="toolbar-btn" onclick="emailEditor.formatText('insertUnorderedList')" title="Liste à puces">
                    •
                </button>
                <button class="toolbar-btn" onclick="emailEditor.formatText('insertOrderedList')" title="Liste numérotée">
                    1.
                </button>
                
                <div class="toolbar-separator"></div>
                
                <!-- Couleurs -->
                <input type="color" id="text-color" onchange="emailEditor.changeColor('foreColor', this.value)" title="Couleur du texte" style="width: 30px; height: 30px; border: none; border-radius: 4px; cursor: pointer;">
                <input type="color" id="bg-color" onchange="emailEditor.changeColor('hiliteColor', this.value)" title="Couleur de fond" style="width: 30px; height: 30px; border: none; border-radius: 4px; cursor: pointer;">
                
                <div class="toolbar-separator"></div>
                
                <!-- Liens et images -->
                <button class="toolbar-btn" onclick="emailEditor.insertLink()" title="Insérer un lien">
                    🔗
                </button>
                <button class="toolbar-btn" onclick="emailEditor.insertImage()" title="Insérer une image">
                    🖼️
                </button>
                
                <div class="toolbar-separator"></div>
                
                <!-- Autres -->
                <button class="toolbar-btn" onclick="emailEditor.insertEmoji()" title="Insérer un emoji">
                    😊
                </button>
                <button class="toolbar-btn" onclick="emailEditor.insertTable()" title="Insérer un tableau">
                    📊
                </button>
                <button class="toolbar-btn" onclick="emailEditor.clearFormatting()" title="Effacer le formatage">
                    🧹
                </button>
            </div>
        `;
    }
    
    renderAttachments() {
        return `
            <div class="attachments-section">
                <div class="attachments-header">
                    <h4>📎 Pièces jointes</h4>
                    <div class="file-input-wrapper">
                        <input type="file" id="file-input-${this.instanceId}" multiple accept="${this.options.allowedFileTypes.join(',')}">
                        <label for="file-input-${this.instanceId}" class="file-input-label">
                            📎 Ajouter des fichiers
                        </label>
                    </div>
                </div>
                <div id="attachments-list-${this.instanceId}" class="attachments-list"></div>
            </div>
        `;
    }
    
    renderSignature() {
        return `
            <div class="signature-section">
                <div class="signature-toggle">
                    <input type="checkbox" id="signature-toggle-${this.instanceId}" checked>
                    <label for="signature-toggle-${this.instanceId}" style="color: #ffffff; font-weight: 500; cursor: pointer;">📝 Inclure la signature</label>
                </div>
                <div id="signature-content-${this.instanceId}" class="signature-content">
                    <div contenteditable="true" id="signature-editor-${this.instanceId}" placeholder="Votre signature...">
                        Cordialement,<br>
                        ${this.options.userName || 'Votre nom'}<br>
                        ${this.options.userTitle || 'Votre poste'}<br>
                        ${this.options.userCompany || 'Votre entreprise'}<br>
                        <br>
                        <a href="https://www.expobetonrdc.com/" target="_blank" style="color: #667eea; text-decoration: none; font-weight: 600;">
                            🌐 www.expobetonrdc.com
                        </a>
                    </div>
                </div>
            </div>
        `;
    }
    
    setupEventListeners() {
        const messageEditor = document.getElementById(`message-editor-${this.instanceId}`);
        const subjectField = document.getElementById(`subject-field-${this.instanceId}`);
        const fileInput = document.getElementById(`file-input-${this.instanceId}`);
        const toField = document.getElementById(`to-field-${this.instanceId}`);
        
        console.log(`Setup listeners for instance: ${this.instanceId}`);
        console.log('Message editor:', messageEditor);
        console.log('Subject field:', subjectField);
        console.log('File input:', fileInput);
        console.log('To field:', toField);
        
        // Synchronisation automatique des destinataires
        if (toField) {
            // Synchroniser depuis la liste manuelle au chargement
            setTimeout(() => this.syncWithManualRecipients(), 100);
            
            // Synchroniser vers la liste manuelle quand le champ change
            toField.addEventListener('input', () => {
                this.updateManualRecipientsFromField();
            });
            
            toField.addEventListener('blur', () => {
                this.updateManualRecipientsFromField();
            });
        }
        
        // Compteur de caractères et auto-sauvegarde
        if (messageEditor) {
            console.log('Adding input listener to message editor');
            messageEditor.addEventListener('input', () => {
                this.updateCharCount();
                this.autoSaveDraft();
            });
            
            // Rendre le contenteditable vraiment focusable
            messageEditor.addEventListener('focus', () => {
                console.log('Message editor focused');
            });
            
            messageEditor.addEventListener('click', () => {
                console.log('Message editor clicked');
                messageEditor.focus();
            });
        } else {
            console.error('Message editor not found!');
        }
        
        if (subjectField) {
            subjectField.addEventListener('input', () => this.autoSaveDraft());
        }
        
        // Gestion des pièces jointes
        if (fileInput) {
            fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        }
        
        // Signature toggle
        const signatureToggle = document.getElementById(`signature-toggle-${this.instanceId}`);
        const signatureContent = document.getElementById(`signature-content-${this.instanceId}`);
        console.log('Signature toggle:', signatureToggle);
        console.log('Signature content:', signatureContent);
        
        if (signatureToggle && signatureContent) {
            signatureToggle.addEventListener('change', (e) => {
                console.log('Signature toggle changed:', e.target.checked);
                signatureContent.style.display = e.target.checked ? 'block' : 'none';
            });
        } else {
            console.error('Signature elements not found!');
        }
        
        // Raccourcis clavier
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case 's':
                        e.preventDefault();
                        this.saveDraft();
                        break;
                    case 'Enter':
                        if (e.shiftKey) {
                            e.preventDefault();
                            this.sendEmail();
                        }
                        break;
                }
            }
        });
    }
    
    formatText(command, value = null) {
        document.execCommand(command, false, value);
        document.getElementById(`message-editor-${this.instanceId}`).focus();
    }
    
    changeColor(command, value) {
        document.execCommand(command, false, value);
        document.getElementById(`message-editor-${this.instanceId}`).focus();
    }
    
    insertLink() {
        const url = prompt('Entrez l\'URL du lien:');
        if (url) {
            const text = prompt('Entrez le texte du lien:', url);
            document.execCommand('createLink', false, url);
            if (text && text !== url) {
                const selection = window.getSelection();
                if (selection.rangeCount > 0) {
                    const range = selection.getRangeAt(0);
                    range.deleteContents();
                    range.insertNode(document.createTextNode(text));
                }
            }
        }
    }
    
    insertImage() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const img = `<img src="${e.target.result}" alt="${file.name}" style="max-width: 100%; height: auto; border-radius: 8px; margin: 10px 0;">`;
                    document.execCommand('insertHTML', false, img);
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
    }
    
    insertEmoji() {
        const emojis = ['😊', '👍', '❤️', '🎉', '🔥', '💯', '🚀', '✨', '💪', '🎯'];
        const emoji = prompt('Choisissez un emoji (ou écrivez le vôtre):', emojis.join(' '));
        if (emoji) {
            document.execCommand('insertText', false, emoji);
        }
    }
    
    insertTable() {
        const rows = prompt('Nombre de lignes:', '3');
        const cols = prompt('Nombre de colonnes:', '3');
        
        if (rows && cols) {
            let table = '<table style="border-collapse: collapse; margin: 10px 0; width: 100%;">';
            for (let i = 0; i < parseInt(rows); i++) {
                table += '<tr>';
                for (let j = 0; j < parseInt(cols); j++) {
                    table += `<td style="border: 1px solid #ddd; padding: 8px; text-align: left;">Cellule ${i+1}-${j+1}</td>`;
                }
                table += '</tr>';
            }
            table += '</table>';
            document.execCommand('insertHTML', false, table);
        }
    }
    
    clearFormatting() {
        document.execCommand('removeFormat', false, null);
        document.execCommand('unlink', false, null);
    }
    
    handleFileSelect(event) {
        const files = Array.from(event.target.files);
        
        files.forEach(file => {
            if (file.size > this.options.maxFileSize) {
                alert(`Le fichier ${file.name} est trop volumineux (max: ${this.options.maxFileSize / 1024 / 1024}MB)`);
                return;
            }
            
            const attachment = {
                id: Date.now() + Math.random(),
                name: file.name,
                size: file.size,
                type: file.type,
                file: file
            };
            
            this.attachments.push(attachment);
            this.renderAttachmentsList();
        });
        
        event.target.value = ''; // Reset input
    }
    
    renderAttachmentsList() {
        const container = document.getElementById(`attachments-list-${this.instanceId}`);
        
        if (this.attachments.length === 0) {
            container.innerHTML = '<p style="color: #999; text-align: center;">Aucune pièce jointe</p>';
            return;
        }
        
        container.innerHTML = this.attachments.map(att => `
            <div class="attachment-item">
                <span class="attachment-icon">${this.getFileIcon(att.type)}</span>
                <span class="attachment-name" title="${att.name}">${att.name}</span>
                <span class="attachment-size">${this.formatFileSize(att.size)}</span>
                <button class="attachment-remove" onclick="document.getElementById('${this.container.id}').emailEditor.removeAttachment('${att.id}')">×</button>
            </div>
        `).join('');
    }
    
    removeAttachment(id) {
        this.attachments = this.attachments.filter(att => att.id != id);
        this.renderAttachmentsList();
    }
    
    getFileIcon(type) {
        if (type.startsWith('image/')) return '🖼️';
        if (type.includes('pdf')) return '📄';
        if (type.includes('word')) return '📝';
        if (type.includes('excel') || type.includes('spreadsheet')) return '📊';
        if (type.includes('powerpoint') || type.includes('presentation')) return '📽️';
        if (type.includes('zip') || type.includes('rar')) return '📦';
        if (type.includes('text')) return '📄';
        return '📎';
    }
    
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    updateCharCount() {
        const editor = document.getElementById(`message-editor-${this.instanceId}`);
        const count = editor.textContent.length;
        document.getElementById(`char-count-${this.instanceId}`).textContent = `${count} caractères`;
    }
    
    autoSaveDraft() {
        clearTimeout(this.autoSaveTimeout);
        this.autoSaveTimeout = setTimeout(() => {
            this.saveDraft(true);
        }, 2000);
    }
    
    saveDraft(isAuto = false) {
        const draft = {
            to: document.getElementById(`to-field-${this.instanceId}`).value,
            cc: document.getElementById(`cc-field-${this.instanceId}`).value,
            bcc: document.getElementById(`bcc-field-${this.instanceId}`).value,
            subject: document.getElementById(`subject-field-${this.instanceId}`).value,
            message: document.getElementById(`message-editor-${this.instanceId}`).innerHTML,
            signature: document.getElementById(`signature-editor-${this.instanceId}`).innerHTML,
            timestamp: new Date().toISOString()
        };
        
        localStorage.setItem('emailDraft', JSON.stringify(draft));
        
        const status = document.getElementById(`save-status-${this.instanceId}`);
        status.textContent = isAuto ? 'Brouillon auto-sauvegardé' : 'Brouillon sauvegardé';
        status.style.color = '#2ed573';
        
        setTimeout(() => {
            status.style.color = '#666';
        }, 2000);
    }
    
    loadDraft() {
        const draft = localStorage.getItem('emailDraft');
        if (draft) {
            const data = JSON.parse(draft);
            document.getElementById(`to-field-${this.instanceId}`).value = data.to || '';
            document.getElementById(`cc-field-${this.instanceId}`).value = data.cc || '';
            document.getElementById(`bcc-field-${this.instanceId}`).value = data.bcc || '';
            document.getElementById(`subject-field-${this.instanceId}`).value = data.subject || '';
            document.getElementById(`message-editor-${this.instanceId}`).innerHTML = data.message || '';
            document.getElementById(`signature-editor-${this.instanceId}`).innerHTML = data.signature || '';
            
            this.updateCharCount();
        }
    }
    
    async sendEmail() {
        console.log(`sendEmail called for instance: ${this.instanceId}`);
        
        // Validation
        const toField = document.getElementById(`to-field-${this.instanceId}`);
        const subjectField = document.getElementById(`subject-field-${this.instanceId}`);
        const messageEditor = document.getElementById(`message-editor-${this.instanceId}`);
        
        console.log('Elements found:', {
            toField: !!toField,
            subjectField: !!subjectField,
            messageEditor: !!messageEditor,
            instanceId: this.instanceId
        });
        
        if (!toField || !subjectField || !messageEditor) {
            this.showError('Erreur: Éléments du formulaire non trouvés. Veuillez réessayer.');
            return;
        }
        
        const to = toField.value;
        const subject = subjectField.value;
        const message = messageEditor.innerHTML;
        
        console.log('Form values:', { to, subject, messageLength: message.length });
        
        if (!to) {
            this.showError('Veuillez ajouter au moins un destinataire');
            return;
        }
        
        if (!subject) {
            this.showError('Veuillez remplir le sujet');
            return;
        }
        
        if (!message || message.trim() === '') {
            this.showError('Veuillez rédiger un message');
            return;
        }
        
        // Ajouter la signature si activée
        let finalMessage = message;
        if (document.getElementById(`signature-toggle-${this.instanceId}`).checked) {
            const signature = document.getElementById(`signature-editor-${this.instanceId}`).innerHTML;
            if (signature) {
                finalMessage += '<br><br>' + signature;
            }
        }
        
        // Préparer les données pour l'envoi
        const ccField = document.getElementById(`cc-field-${this.instanceId}`);
        const bccField = document.getElementById(`bcc-field-${this.instanceId}`);
        
        const emailData = {
            to: to.split(',').map(email => email.trim()).filter(email => email),
            cc: ccField ? ccField.value.split(',').map(email => email.trim()).filter(email => email) : [],
            bcc: bccField ? bccField.value.split(',').map(email => email.trim()).filter(email => email) : [],
            subject: subject,
            message: finalMessage,
            attachments: this.attachments,
            isHtml: true
        };
        
        try {
            // Afficher l'indicateur de chargement
            this.showLoading(true);
            
            // Appel API pour envoyer l'email
            const response = await fetch('/api/send-advanced-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(emailData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showSuccess('Email envoyé avec succès !');
                this.clearForm();
                localStorage.removeItem('emailDraft');
            } else {
                this.showError(result.error || 'Erreur lors de l\'envoi');
            }
            
        } catch (error) {
            console.error('Erreur envoi email:', error);
            this.showError('Erreur: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }
    
    // Récupérer toutes les données de l'email
    getEmailData() {
        return {
            to: document.getElementById(`to-field-${this.instanceId}`).value,
            cc: document.getElementById(`cc-field-${this.instanceId}`).value,
            bcc: document.getElementById(`bcc-field-${this.instanceId}`).value,
            subject: document.getElementById(`subject-field-${this.instanceId}`).value,
            message: document.getElementById(`message-editor-${this.instanceId}`).innerHTML,
            attachments: this.attachments,
            isHtml: true
        };
    }
    
    clearForm() {
        document.getElementById(`to-field-${this.instanceId}`).value = '';
        document.getElementById(`cc-field-${this.instanceId}`).value = '';
        document.getElementById(`bcc-field-${this.instanceId}`).value = '';
        document.getElementById(`subject-field-${this.instanceId}`).value = '';
        document.getElementById(`message-editor-${this.instanceId}`).innerHTML = '';
        this.attachments = [];
        this.renderAttachmentsList();
        this.updateCharCount();
    }
    
    showError(message) {
        alert('❌ ' + message);
    }
    
    showSuccess(message) {
        alert('✅ ' + message);
    }
    
    showLoading(show) {
        const container = this.container;
        if (show) {
            container.classList.add('loading');
        } else {
            container.classList.remove('loading');
        }
    }
}

// Fonction utilitaire pour initialiser l'éditeur
function initEmailEditor(containerId, options = {}) {
    return new EmailEditor(containerId, options);
}
