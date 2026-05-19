# UniTrack

UniTrack este o aplicație web pentru gestionarea admiterilor la universități. Proiectul local recreează interfața din prototipul Rocket: dashboard dark, sidebar fix, universități, documente, comparație, calendar, profil și modal de adăugare universitate.

## Funcționalități

- Autentificare email/parolă cu JWT în cookie `httpOnly`, CSRF double-submit, rate limiting, validare Zod și sanitizare XSS.
- Roluri separate: student, universitate și admin.
- Signup student cu validare CNP și blocare la un singur cont per CNP, fără salvarea CNP-ului în clar.
- Recuperare cont: parolă uitată și resetare parolă cu token temporar.
- Email real pentru resetare parolă și notificări de aplicații când SMTP este configurat.
- Lifecycle cont: deconectare, schimbare parolă și ștergere cont cu confirmare parolă.
- Dashboard cu statistici, deadline-uri, progres documente și listă de aplicații.
- Tabel universități cu filtre pe status/tip, export CSV și modal de adăugare/editare.
- Admin panel: doar adminul poate adăuga universități, conturi instituționale, vede statusul sistemului și auditul de securitate.
- Workspace universitate: aplicații primite de la elevi, sortare, filtrare și status acceptat/respins/review.
- Flux student de admitere: trimite aplicații către universitățile active și vede statusul.
- Checklist documente pe fiecare universitate, documente custom și documente predefinite.
- Verificare AI documente cu OpenAI/Gemini când există API key și fallback local euristic.
- Notificări interne pentru aplicații noi și actualizări de status.
- Audit log pentru acțiuni sensibile în panoul Admin.
- Comparare side-by-side pentru 2-4 universități.
- Calendar lunar cu export `.ics`.
- Profil student și link public read-only.
- DB local SQLite pentru development; suport Sequelize pentru PostgreSQL/MySQL.
- Export JSON/CSV/PDF/ICS/XML.
- Script SQL pentru PostgreSQL Row Level Security: `backend/sql/postgres_rls.sql`.

## Rulare locală

```bash
cd unitracka
npm run install:all
npm run dev
```

URL-uri:

- Frontend: `http://127.0.0.1:5173`
- API: `http://127.0.0.1:4000/api`
- Health check: `http://127.0.0.1:4000/api/health`
- Readiness DB check: `http://127.0.0.1:4000/api/ready`

Conturi demo:

```text
Student:       andrei@unitracker.ro / Demo1234!
Admin:         admin@unitracker.ro / Demo1234!
Universitate:  admitere@unibuc.ro / Demo1234!
```

Datele demo se creează automat în development și includ cele 6 universități din capturi: UB, UTCN, TU Delft, KU Leuven, UPB și University of Edinburgh.

## Verificare

```bash
npm run check
npm run smoke
```

`npm run check` rulează `node --check` pentru backend și `vite build` pentru frontend. `npm run smoke` verifică API-ul pornit: health, DB readiness, CSRF, login demo și lista de universități.

## VS Code

Deschide folderul `unitracka` direct în VS Code. Am adăugat:

- `.vscode/tasks.json`: install, run full app, check, build GitHub Pages;
- `.vscode/settings.json`: exclude `node_modules`, `dist`, SQLite local;
- `.vscode/extensions.json`: extensii recomandate pentru JS, GitHub Actions și SQL.

## GitHub Pages

GitHub Pages nu rulează backend Node/SQL. Pentru asta există un mod static de prezentare cu `localStorage`.

```bash
npm run build:pages
```

Workflow-ul `.github/workflows/pages.yml` publică automat frontend-ul pe Pages. Implicit build-ul este static (`VITE_STATIC_MODE=true`). Pentru varianta live reală, setezi în GitHub Actions Variables `VITE_STATIC_MODE=false` și `VITE_API_URL=https://backendul-tau/api`, apoi rulezi backend-ul separat cu PostgreSQL/Supabase.

## Configurare DB

Implicit, aplicația folosește SQLite în `backend/data/unitracka.sqlite`.

Pentru PostgreSQL:

```env
DB_DIALECT=postgres
DATABASE_URL=postgres://user:password@localhost:5432/unitrack
JWT_SECRET=schimba-acest-secret
CORS_ORIGIN=http://127.0.0.1:5173
TRUST_PROXY=false
APP_URL=http://127.0.0.1:5173
COOKIE_SAMESITE=lax
COOKIE_SECURE=false
```

După ce Sequelize creează tabelele în Postgres, poți aplica politicile RLS din `backend/sql/postgres_rls.sql`. În cod există deja filtrare pe `UserId` pentru toate resursele private.

Variabile utile:

```env
CNP_PEPPER=schimba-acest-pepper-pentru-cnp
OPENAI_API_KEY=
GEMINI_API_KEY=
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=UniTrack <no-reply@unitrack.example.ro>
```

Fără chei AI externe, verificarea documentelor folosește fallback local.
Fără SMTP configurat, resetarea parolei returnează tokenul doar în development pentru testare locală. În producție setează SMTP real.

Pentru mod live fără date demo:

```env
NODE_ENV=production
SEED_DEMO=false
BOOTSTRAP_ADMIN=true
ADMIN_EMAIL=admin@domeniul-tau.ro
ADMIN_PASSWORD=o-parola-puternica
COOKIE_SAMESITE=none
COOKIE_SECURE=true
```

Exemplu complet: `backend/.env.production.example`.

## InfoEducație 2026

Regulamentul 2026 include secțiunea „Aplicații Web”, proiectele pot fi individuale sau în echipe de maximum 2 elevi, iar proiectul trebuie să aibă documentație și cod sursă/materiale auxiliare disponibile pentru evaluare. Sursa folosită: regulamentul publicat pe `edu.ro`, nr. 24.683/05.02.2026. Am adăugat checklist-ul local în `docs/infoeducatie-2026-checklist.md`.

Documentație locală:

- `docs/infoeducatie-2026-checklist.md`
- `docs/arhitectura-tehnica.md`
- `docs/ce-nu-se-urca-pe-github.md`
- `docs/deploy-github-pages-supabase.md`
- `docs/surse-externe.md`
- `docs/security-and-rls.md`
- `docs/ai-document-verification.md`
- `docs/github-pages.md`
- `docs/public-launch-checklist.md`

## Structură

```text
unitracka/
├── backend/
│   ├── sql/postgres_rls.sql
│   └── src/
├── docs/
│   ├── ai-document-verification.md
│   ├── arhitectura-tehnica.md
│   ├── ce-nu-se-urca-pe-github.md
│   ├── deploy-github-pages-supabase.md
│   ├── github-pages.md
│   ├── infoeducatie-2026-checklist.md
│   ├── surse-externe.md
│   └── security-and-rls.md
├── frontend/
│   ├── public/
│   └── src/
└── README.md
```
