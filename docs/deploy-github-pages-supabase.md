# Deploy Netlify + Render + Supabase

Varianta live folosită pentru UniTrack este:

```text
Netlify frontend -> Render API Node/Express -> Supabase PostgreSQL
```

Baza de date Supabase trebuie accesată prin backend-ul Express, nu direct din browser, ca să nu expui parole/chei și ca să păstrezi validările server-side.

Deployment curent:

- Frontend temporar Netlify: `https://unitrack-640.netlify.app`
- Domeniu producție: `https://unitrack.sbs`
- Alias: `https://www.unitrack.sbs`
- Backend API Render: `https://unitrack-api-79l5.onrender.com`
- Bază de date: Supabase PostgreSQL

## 1. Netlify frontend

Repo-ul include `netlify.toml`, cu build din `frontend/` și proxy pentru API:

```text
npm run build --prefix frontend
publish: frontend/dist
/api/* -> https://unitrack-api-79l5.onrender.com/api/:splat
```

Site-ul Netlify este `unitrack-640`. Pentru deploy manual:

```bash
netlify deploy --prod --dir frontend/dist
```

În Hostinger DNS, domeniul trebuie să pointeze către Netlify:

```text
Type   Name   Value
A      @      75.2.60.5
CNAME  www    unitrack-640.netlify.app
```

Elimină recordurile A/CNAME vechi pentru `@` și `www` dacă intră în conflict. SSL-ul Netlify pornește după ce DNS-ul s-a propagat.

## 2. Supabase Postgres

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
npm run db:sync --prefix backend
npm run db:rls --prefix backend
npm run production:check --prefix backend
```

Notă: scriptul activează RLS fără `FORCE`, ca backend-ul server-side să poată folosi autorizarea din API. Nu expune `DATABASE_URL` în frontend.

## 3. Backend API pe Render

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
APP_URL=https://unitrack.sbs
CORS_ORIGIN=https://unitrack.sbs,https://www.unitrack.sbs,https://unitrack-640.netlify.app
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

Pentru proiectul Supabase configurat deja, adminul inițial există în baza de date, deci Render poate rula direct cu `BOOTSTRAP_ADMIN=false`.

Endpoint-uri de verificat:

- `https://backendul-tau/api/health`
- `https://backendul-tau/api/ready`

## 4. GitHub Pages frontend

GitHub Pages poate hosta doar frontend static. Repo-ul este pregătit pentru două variante:

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

## 5. Ce nu pui în GitHub

Nu urca:

- `backend/data/*.sqlite`
- `.env`
- parole Supabase
- `JWT_SECRET`
- `CNP_PEPPER`
- chei AI/SMTP

Urcă doar fișierele `.env.example`.
