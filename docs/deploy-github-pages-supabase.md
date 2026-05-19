# Deploy GitHub Pages + Backend API + Supabase

GitHub Pages poate hosta doar frontend static. Baza de date Supabase trebuie accesată prin backend-ul Express, nu direct din browser, ca să nu expui parole/chei și ca să păstrezi validările server-side.

Arhitectura recomandată:

```text
GitHub Pages frontend -> Backend API Node/Express -> Supabase Postgres
```

## 1. Supabase Postgres

1. Creează proiect pe Supabase.
2. Mergi la Project Settings -> Database.
3. Copiază connection string-ul PostgreSQL.
4. Înlocuiește parola în connection string.
5. Păstrează URL-ul doar în Environment Variables ale backend-ului, nu în GitHub.

Variabilă backend:

```env
DB_DIALECT=postgres
DATABASE_URL=postgresql://postgres:[PAROLA]@[HOST]:5432/postgres
```

După primul deploy backend, când Sequelize a creat tabelele, poți rula în Supabase SQL Editor:

```sql
-- copiaza continutul din backend/sql/postgres_rls.sql
```

Sau din backend, dacă ai `DATABASE_URL` configurat:

```bash
npm run db:rls --prefix backend
npm run production:check --prefix backend
```

Notă: scriptul activează RLS fără `FORCE`, ca backend-ul server-side să poată folosi autorizarea din API. Nu expune `DATABASE_URL` în frontend.

## 2. Backend API pe Render/Railway/Fly

Setări tipice:

- Root directory: `backend`
- Build command: `npm install`
- Start command: `npm start`
- Node version: 22 sau mai nou

Repo-ul include `render.yaml`, deci pe Render poți crea serviciul direct din repository. Variabilele sensibile sunt marcate `sync: false` și se completează în dashboard, nu în GitHub.

Environment Variables:

```env
NODE_ENV=production
PORT=4000
DB_DIALECT=postgres
DATABASE_URL=postgresql://...
APP_URL=https://username.github.io/nume-repo
CORS_ORIGIN=https://username.github.io
TRUST_PROXY=true
COOKIE_SAMESITE=none
COOKIE_SECURE=true
JWT_SECRET=genereaza-un-secret-lung
CNP_PEPPER=genereaza-un-pepper-lung
SEED_DEMO=false
BOOTSTRAP_ADMIN=true
ADMIN_EMAIL=admin@domeniul-tau.ro
ADMIN_PASSWORD=o-parola-puternica
OPENAI_API_KEY=
GEMINI_API_KEY=
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=UniTrack <no-reply@domeniul-tau.ro>
```

După ce primul admin a fost creat, setează:

```env
BOOTSTRAP_ADMIN=false
```

Endpoint-uri de verificat:

- `https://backendul-tau/api/health`
- `https://backendul-tau/api/ready`

## 3. GitHub Pages frontend

Repo-ul este pregătit pentru două variante:

- `gh-pages`: publicare statică manuală, folosită acum pentru că GitHub Actions este blocat pe cont.
- `GitHub Actions`: workflow-ul `.github/workflows/pages.yml`, util după ce Actions funcționează pe cont.

Pentru demo static:

```text
VITE_STATIC_MODE=true
```

Pentru frontend live legat la backend:

GitHub repo -> Settings -> Secrets and variables -> Actions -> Variables:

```text
VITE_STATIC_MODE=false
VITE_API_URL=https://backendul-tau/api
```

Workflow-ul `.github/workflows/pages.yml` folosește aceste variabile automat.

Pentru publicare manuală pe branch-ul `gh-pages`, refaci build-ul cu variabilele frontend potrivite și împingi conținutul din `frontend/dist` pe branch-ul `gh-pages`.

## 4. Ce nu pui în GitHub

Nu urca:

- `backend/data/*.sqlite`
- `.env`
- parole Supabase
- `JWT_SECRET`
- `CNP_PEPPER`
- chei AI/SMTP

Urcă doar fișierele `.env.example`.
