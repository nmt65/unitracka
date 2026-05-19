# UniTrack

UniTrack este o platformă web pentru gestionarea procesului de admitere la universități. Aplicația centralizează opțiunile candidatului, documentele necesare, deadline-urile, statusul aplicațiilor și comunicarea dintre elevi, universități și administratori.

Proiectul este construit ca aplicație full-stack: frontend React/Vite, backend Node.js/Express și bază de date relațională prin Sequelize. În dezvoltare rulează cu SQLite local, iar pentru producție poate fi conectat la PostgreSQL.

## Obiectiv

Admiterea la facultate implică multe platforme diferite, documente repetate și termene limită greu de urmărit. UniTrack propune un spațiu unic în care elevul își poate organiza aplicațiile, iar instituțiile pot primi și administra dosarele într-un flux coerent.

Aplicația urmărește trei direcții principale:

- organizarea aplicațiilor pentru elevi;
- verificarea și urmărirea documentelor;
- administrarea universităților, conturilor instituționale și statusurilor de admitere.

## Funcționalități principale

- Autentificare cu email și parolă.
- Roluri separate pentru student, universitate și administrator.
- Cont unic per elev prin validarea CNP-ului, fără stocarea CNP-ului în clar.
- Resetare parolă cu token temporar.
- Deconectare, schimbare parolă și ștergere cont.
- Dashboard cu progresul aplicațiilor, deadline-uri și statistici.
- Administrare universități, programe, taxe, ratinguri și deadline-uri.
- Adăugare universități doar de către administrator.
- Workspace pentru universități, cu aplicații primite de la elevi.
- Trimitere aplicații de către studenți către universitățile active.
- Checklist documente pentru fiecare universitate.
- Documente predefinite și documente custom.
- Verificare documente cu AI prin OpenAI/Gemini, cu fallback local euristic.
- Notificări interne pentru aplicații noi și schimbări de status.
- Audit log pentru acțiuni sensibile.
- Comparare side-by-side pentru 2-4 universități.
- Calendar cu deadline-uri și export `.ics`.
- Exporturi CSV, JSON, PDF, ICS și XML.
- Profil student și link public read-only.

## Arhitectură

```text
frontend/   React + Vite
backend/    Node.js + Express + Sequelize
docs/       documentație tehnică și checklist de concurs
```

Backend-ul expune un API REST, iar frontend-ul consumă API-ul printr-un strat separat de servicii. Pentru prezentări statice, aplicația are și un mod frontend-only bazat pe `localStorage`, util pentru GitHub Pages.

### Tehnologii

- React, Vite, React Router
- Node.js, Express
- Sequelize ORM
- SQLite pentru dezvoltare locală
- PostgreSQL pentru producție
- Zod pentru validare
- JWT în cookie `httpOnly`
- Helmet, CORS, rate limiting și sanitizare XSS
- OpenAI/Gemini pentru verificarea asistată a documentelor

## Securitate și date personale

Proiectul include măsuri de securitate aplicate atât la nivel de API, cât și la nivel de bază de date:

- parole hash-uite cu bcrypt;
- JWT stocat în cookie `httpOnly`;
- protecție CSRF double-submit;
- rate limiting pentru autentificare și API;
- validare strictă a inputului cu Zod;
- sanitizare împotriva XSS;
- CNP hash-uit cu pepper, fără salvare în clar;
- roluri și permisiuni pe endpoint-uri;
- script SQL pentru Row Level Security în PostgreSQL;
- audit pentru acțiuni administrative și operații sensibile.

Scriptul pentru politicile PostgreSQL RLS se află în:

```text
backend/sql/postgres_rls.sql
```

## Rulare locală

```bash
npm run install:all
npm run dev
```

URL-uri locale:

- Frontend: `http://127.0.0.1:5173`
- API: `http://127.0.0.1:4000/api`
- Health check: `http://127.0.0.1:4000/api/health`
- Readiness DB check: `http://127.0.0.1:4000/api/ready`

Conturi de test pentru development:

```text
Student:       andrei@unitracker.ro / Demo1234!
Admin:         admin@unitracker.ro / Demo1234!
Universitate:  admitere@unibuc.ro / Demo1234!
```

Datele de test sunt generate doar în modul de dezvoltare. Pentru producție se setează `SEED_DEMO=false`.

## Configurare

Backend-ul citește variabilele din `.env`. Fișierele reale `.env` nu se urcă în repository; în Git se păstrează doar exemplele:

```text
backend/.env.example
backend/.env.production.example
frontend/.env.example
frontend/.env.pages.example
```

Exemplu minim pentru dezvoltare:

```env
NODE_ENV=development
PORT=4000
DB_DIALECT=sqlite
JWT_SECRET=schimba-acest-secret
CNP_PEPPER=schimba-acest-pepper
CORS_ORIGIN=http://127.0.0.1:5173
APP_URL=http://127.0.0.1:5173
```

Exemplu minim pentru PostgreSQL:

```env
DB_DIALECT=postgres
DATABASE_URL=postgresql://user:password@host:5432/database
```

Cheile pentru AI și SMTP sunt opționale:

```env
OPENAI_API_KEY=
GEMINI_API_KEY=
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=UniTrack <no-reply@example.ro>
```

Fără chei AI externe, verificarea documentelor folosește fallback local. Fără SMTP, tokenul de resetare este disponibil doar în development, pentru testare.

## Verificare

```bash
npm run check
npm run smoke
```

`npm run check` verifică sintaxa backend-ului și construiește frontend-ul. `npm run smoke` testează API-ul pornit: health, DB readiness, CSRF, autentificare și lista de universități.

Pentru PostgreSQL în producție:

```bash
npm run db:rls --prefix backend
npm run production:check --prefix backend
```

`db:rls` aplică politicile din `backend/sql/postgres_rls.sql`, iar `production:check` verifică variabilele critice, conexiunea la baza de date și existența tabelelor principale.

## Build și deploy

Pentru build frontend:

```bash
npm run build
```

Pentru build static compatibil cu GitHub Pages:

```bash
npm run build:pages
```

GitHub Pages poate rula doar frontend static. Varianta completă de producție necesită un backend Node.js separat și o bază de date PostgreSQL.

Configurația pentru deploy backend se află în:

```text
render.yaml
```

Flux recomandat pentru producție:

```text
GitHub Pages frontend -> Backend Express -> PostgreSQL
```

## Documentație

Documentația proiectului este în folderul `docs/`:

- `docs/infoeducatie-2026-checklist.md`
- `docs/arhitectura-tehnica.md`
- `docs/security-and-rls.md`
- `docs/ai-document-verification.md`
- `docs/deploy-github-pages-supabase.md`
- `docs/github-pages.md`
- `docs/public-launch-checklist.md`
- `docs/surse-externe.md`
- `docs/ce-nu-se-urca-pe-github.md`

## Conformitate InfoEducație 2026

Proiectul include cod sursă, documentație tehnică, descrierea arhitecturii, surse externe, explicații de securitate și checklist dedicat pentru categoria Aplicații Web.

Elemente relevante pentru evaluare:

- aplicație web funcțională, cu frontend și backend;
- roluri distincte și fluxuri pentru utilizatori diferiți;
- operații CRUD reale;
- bază de date relațională;
- protecție pentru date personale;
- validare server-side;
- documentație locală pentru instalare, rulare și deploy;
- exporturi și integrare opțională cu servicii externe.

## Structură repository

```text
unitracka/
├── backend/
│   ├── sql/postgres_rls.sql
│   └── src/
├── docs/
├── frontend/
│   ├── public/
│   └── src/
├── render.yaml
└── README.md
```
