Placement des variables d'environnement pour Supabase

1) Ne pas committer les clés secrètes
- Le `SUPABASE_SERVICE_ROLE_KEY` et la `DATABASE_URL` contiennent des secrets (accès admin). Ne les mettez jamais dans le dépôt git.
- Ajoutez ces valeurs dans un fichier `.env` local (ignoré par git) ou via le mécanisme de configuration de votre plateforme (Render, Railway, Heroku, etc.).

2) Variables attendues par le projet
- NEXT_PUBLIC_SUPABASE_URL=https://<votre-projet>.supabase.co
- NEXT_PUBLIC_SUPABASE_ANON_KEY=<votre_anon_key>
- SUPABASE_SERVICE_ROLE_KEY=<votre_service_role_key>   # Garder secret
- DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.<votre-projet>.supabase.co:5432/postgres  # optionnel

3) Exemple de `.env` (ne pas committer)

NEXT_PUBLIC_SUPABASE_URL=https://jlwnmsxpjbkbdtfgjusb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impsd25tc3hwamJrYmR0ZmdqdXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2NzIxODQsImV4cCI6MjA3NzI0ODE4NH0.S-jZAMVV14EEHISD0qxJYho2X11ZzpVUiG0Xfdv6CDE
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impsd25tc3hwamJrYmR0ZmdqdXNiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTY3MjE4NCwiZXhwIjoyMDc3MjQ4MTg0fQ.NJSz5JQEMQwAUbdWBO1j8TOhWavnpwhPbkrlMSM0Rus
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.jlwnmsxpjbkbdtfgjusb.supabase.co:5432/postgres

4) Vérifier la connexion (local)
- Créez un fichier `.env` contenant les valeurs ci-dessus (ou exportez-les dans votre shell).
- Puis lancez :

node test-supabase.js

5) Remarques de sécurité
- Ne partagez pas `SUPABASE_SERVICE_ROLE_KEY` en public.
- Pour la plupart des opérations côté serveur vous devriez utiliser `SUPABASE_SERVICE_ROLE_KEY` ; côté client, utilisez uniquement l'anon key.

6) Si vous préférez ne pas utiliser `DATABASE_URL` et vous appuyer uniquement sur l'API Supabase, laissez `DATABASE_URL` vide.

Node.js 20 (requise)
---------------------------------
Le projet requiert Node.js 20 (conforme à `package.json` `engines.node`).

Si vous utilisez nvm, placez-vous à la racine du projet et lancez :

```bash
nvm install 20
nvm use 20
```

Un fichier `.nvmrc` a été ajouté au dépôt pour faciliter cette opération (`.nvmrc` contient `20`).

Vérifiez la version active :

```bash
node -v
# doit afficher v20.x.x
```

Si vous ne pouvez pas changer la version Node sur votre machine, exécutez le projet dans un conteneur Docker ou sur une plateforme (Render, Railway) qui permet de configurer Node 20.
