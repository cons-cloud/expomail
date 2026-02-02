-- supabase-schema.sql
-- Script pour créer les tables utilisées par HyperEmail et insérer les seeds présents dans data/db.json
-- Collez ce fichier dans Supabase → SQL Editor → New query, puis exécutez.

BEGIN;

-- Table users
CREATE TABLE IF NOT EXISTS public.users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  quota_hour INTEGER NOT NULL DEFAULT 100,
  is_admin BOOLEAN NOT NULL DEFAULT false
);

-- Table send_logs
CREATE TABLE IF NOT EXISTS public.send_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
  recipient_email TEXT,
  success BOOLEAN,
  message_id TEXT,
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table templates
CREATE TABLE IF NOT EXISTS public.templates (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  from_email TEXT,
  sujet TEXT,
  message TEXT
);

-- Table pending_lists
CREATE TABLE IF NOT EXISTS public.pending_lists (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES public.users(id) ON DELETE CASCADE,
  mode TEXT,
  name TEXT,
  sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  sent_at TIMESTAMP WITH TIME ZONE
);

-- Table pending_recipients
CREATE TABLE IF NOT EXISTS public.pending_recipients (
  id SERIAL PRIMARY KEY,
  list_id INTEGER REFERENCES public.pending_lists(id) ON DELETE CASCADE,
  email TEXT,
  phone TEXT,
  address TEXT,
  source TEXT,
  name TEXT
);

-- Table revoked_tokens
CREATE TABLE IF NOT EXISTS public.revoked_tokens (
  id SERIAL PRIMARY KEY,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes utiles (optionnel)
CREATE INDEX IF NOT EXISTS idx_send_logs_user_id ON public.send_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_pending_recipients_list_id ON public.pending_recipients(list_id);
CREATE INDEX IF NOT EXISTS idx_pending_lists_user_id ON public.pending_lists(user_id);

COMMIT;

-- Seeds: insérer les trois users présents dans data/db.json (avec leurs hash bcrypt)
-- Attention: si vous préférez gérer les utilisateurs via Supabase Auth, utilisez l'API admin plutôt que d'insérer ici.

INSERT INTO public.users (id, email, password_hash, created_at, quota_hour, is_admin)
VALUES
  (1, 'api@local', '$2a$10$r5iBYfd6joDKGJnKa9QxVu5JmFC1elX.4tafEPGE6yIxIYZJVMaEe', '2025-10-07T21:24:13.584Z', 100, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.users (id, email, password_hash, created_at, quota_hour, is_admin)
VALUES
  (2, 'hyperemail@gmail.com', '$2b$10$NZ/SzdqCoEHuS3Hr6NAVkeJlbBzg8djC07JNI3F7vwrvPuaXNFgyO', '2025-10-27T11:54:11.953Z', 100, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.users (id, email, password_hash, created_at, quota_hour, is_admin)
VALUES
  (3, 'api@hyperemail.local', '$2b$10$QBvLR6lLPCssaAmtY9mp2O6BWjWoIbaGALMf.8GCdNonqn/qGMnFi', '2025-10-27T12:39:49.526Z', 100, true)
ON CONFLICT (id) DO NOTHING;

-- Fin du fichier
