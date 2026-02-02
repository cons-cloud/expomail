-- Créer la table contacts pour stocker les emails importés
CREATE TABLE IF NOT EXISTS contacts (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    organisation TEXT,
    sent BOOLEAN DEFAULT FALSE,
    sent_date TIMESTAMPTZ,
    date TIMESTAMPTZ DEFAULT NOW(),
    source VARCHAR(50) DEFAULT 'import',
    imported_at TIMESTAMPTZ DEFAULT NOW(),
    import_ip INET,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Créer un index sur l'email pour les performances
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);

-- Créer un index sur le statut d'envoi
CREATE INDEX IF NOT EXISTS idx_contacts_sent ON contacts(sent);

-- Créer un index sur la date d'importation
CREATE INDEX IF NOT EXISTS idx_contacts_imported_at ON contacts(imported_at);

-- Activer le Row Level Security (RLS)
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Créer une politique pour permettre toutes les opérations (pour le serveur)
CREATE POLICY "Enable all operations for service role" ON contacts
    FOR ALL USING (auth.role() = 'service_role');

-- Donner les permissions au service role
GRANT ALL ON contacts TO service_role;
GRANT SELECT ON contacts TO anon;
GRANT SELECT ON contacts TO authenticated;
