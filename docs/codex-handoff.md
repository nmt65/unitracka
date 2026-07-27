# Codex handoff pentru UniTrack

Ultima actualizare: 2026-05-21  
Repo local: `C:\Users\Neamtu\Documents\New project\unitracka`  
GitHub: `https://github.com/nmt65/unitracka`  
Frontend live: `https://unitrack.sbs`  
Backend live: `https://unitrack-api-79l5.onrender.com`

Acest document este pentru un alt cont Codex care trebuie sa continue lucrul la site fara sa refaca toata investigatia.

## Pe scurt

UniTrack este o platforma de admitere pentru studenti, universitati si admin:

- studentii isi fac cont cu CNP unic, trimit aplicatii, incarca documente si primesc sfaturi AI;
- universitatile primesc aplicatii, vad documentele exacte si pot schimba statusul aplicatiilor;
- adminul gestioneaza institutiile, conturile de universitate, auditul, catalogul si statusul sistemului;
- backend-ul tine securitatea: JWT httpOnly, CSRF, rate limiting, validare Zod, sanitizare XSS, CNP hashuit, RLS SQL pentru PostgreSQL;
- frontend-ul este React/Vite cu UI dark inspirat din screenshoturile de referinta trimise initial.

## Stack

- Frontend: React 18, Vite, lucide-react.
- Backend: Node.js, Express, Sequelize, Zod.
- DB local: SQLite in `backend/data/unitracka.sqlite`.
- DB productie: PostgreSQL/Supabase prin `DATABASE_URL`.
- Hosting frontend: Netlify, domeniu `unitrack.sbs`.
- Hosting backend: Render, service `unitrack-api-79l5`.
- AI documente/advisor: OpenAI daca exista `OPENAI_API_KEY`, altfel Gemini daca exista `GEMINI_API_KEY`, altfel fallback local strict.
- Email: Nodemailer/SMTP pentru resetare parola si notificari.

## Comenzi importante pe Windows

PowerShell poate bloca shim-urile `npm`/`npx`. Foloseste variantele `.cmd`:

```powershell
npm.cmd install
npm.cmd run dev
npm.cmd run check
netlify.cmd deploy --prod --dir frontend/dist
```

Pentru verificare rapida:

```powershell
npm.cmd run check
Invoke-WebRequest -UseBasicParsing https://unitrack.sbs/
Invoke-WebRequest -UseBasicParsing https://unitrack-api-79l5.onrender.com/api/health
```

`npm.cmd run check` ruleaza check-ul backend si build-ul frontend.

## Cum ruleaza local

Din root:

```powershell
cd "C:\Users\Neamtu\Documents\New project\unitracka"
npm.cmd install
npm.cmd run dev
```

URL-uri locale:

- frontend: `http://127.0.0.1:5173`
- backend API: `http://127.0.0.1:4000/api`
- health: `http://127.0.0.1:4000/api/health`

In development, daca `SEED_DEMO` nu este `false`, se creeaza date demo. In productie trebuie `SEED_DEMO=false`.

## Deploy

Frontend:

```powershell
npm.cmd run check
netlify.cmd deploy --prod --dir frontend/dist
```

Netlify foloseste `netlify.toml`:

- build command: `npm run build --prefix frontend`
- publish: `frontend/dist`
- proxy `/api/*` catre `https://unitrack-api-79l5.onrender.com/api/:splat`

Backend:

- push pe `main` in GitHub;
- Render are auto deploy;
- configuratia principala este in `render.yaml`;
- health check: `/api/health`.

Dupa push, verifica:

```powershell
Invoke-WebRequest -UseBasicParsing https://unitrack-api-79l5.onrender.com/api/health
Invoke-WebRequest -UseBasicParsing https://unitrack-api-79l5.onrender.com/api/ready
```

## Variabile de mediu

Nu pune valori secrete in GitHub. In Render trebuie setate in Environment:

```env
NODE_ENV=production
DB_DIALECT=postgres
DATABASE_URL=postgresql://...
APP_URL=https://unitrack.sbs
CORS_ORIGIN=https://unitrack.sbs,https://www.unitrack.sbs,https://unitrack-640.netlify.app
TRUST_PROXY=true
COOKIE_SAMESITE=none
COOKIE_SECURE=true
JWT_SECRET=secret-lung-generat
CNP_PEPPER=pepper-lung-generat
SEED_DEMO=false
SEED_CATALOG=true
BOOTSTRAP_ADMIN=false
ADMIN_EMAIL=...
ADMIN_PASSWORD=...
GEMINI_API_KEY=...
GEMINI_DOCUMENT_MODEL=gemini-3.5-flash
GEMINI_ADVISOR_MODEL=gemini-3.5-flash
OPENAI_API_KEY=
OPENAI_DOCUMENT_MODEL=gpt-4o-mini
OPENAI_ADVISOR_MODEL=gpt-4o-mini
SMTP_HOST=...
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
SMTP_FROM=UniTrack <no-reply@unitrack.sbs>
```

In Netlify trebuie:

```env
VITE_STATIC_MODE=false
VITE_API_URL=/api
VITE_BASE_PATH=/
```

Nota: cheia Gemini a fost introdusa de utilizator in conversatie, dar nu trebuie scrisa in fisiere sau commit-uri.

## Baza de date si RLS

Productia foloseste PostgreSQL prin `DATABASE_URL`. Scripturile relevante:

- `backend/src/scripts/syncDb.js` creeaza/actualizeaza tabelele prin Sequelize;
- `backend/src/scripts/applyRls.js` aplica politicile RLS;
- `backend/sql/postgres_rls.sql` contine politicile SQL;
- `docs/database.md` explica modelul.

Comenzi:

```powershell
npm.cmd run db:sync --prefix backend
npm.cmd run db:rls --prefix backend
npm.cmd run production:check --prefix backend
```

RLS este pentru protectie la nivel DB, dar aplicatia server-side foloseste in continuare autorizarea API din Express.

## Fisiere importante

Frontend:

- `frontend/src/App.jsx` - shell-ul aplicatiei, roluri si pagini active;
- `frontend/src/pages/AuthPage.jsx` - login, signup, reset parola;
- `frontend/src/pages/Admissions.jsx` - aplicatii student + verificare document AI;
- `frontend/src/pages/UniversityWorkspace.jsx` - workspace universitate pentru aplicatii si documente;
- `frontend/src/pages/AdminPanel.jsx` - admin, catalog, useri, audit, status sistem;
- `frontend/src/pages/StudentAdvisor.jsx` - consilier AI pentru studenti;
- `frontend/src/services/api.js` - client API live;
- `frontend/src/services/staticApi.js` - fallback pentru mod static/GitHub Pages;
- `frontend/src/i18n.js` - traduceri RO/EN.

Backend:

- `backend/src/app.js` - middleware, securitate, rute API;
- `backend/src/models/index.js` - modele Sequelize;
- `backend/src/controllers/*.controller.js` - logica API;
- `backend/src/services/documentAi.js` - verificare documente cu AI/fallback local;
- `backend/src/services/studentAdvisor.js` - consilier AI;
- `backend/src/services/mail.js` - email resetare/notificari;
- `backend/src/utils/cnp.js` - validare si hash CNP;
- `backend/src/utils/bootstrapAdmin.js` - creare/resetare admin initial;
- `backend/src/data/catalog.js` - catalog universitati;
- `backend/src/data/defaultDocuments.js` - documente cerute implicit.

Documentatie:

- `README.md` - prezentare pentru juriu;
- `docs/infoeducatie-2026-checklist.md` - checklist concurs;
- `docs/security-and-rls.md` - securitate;
- `docs/deploy-github-pages-supabase.md` - deploy;
- `docs/ai-document-verification.md` - comportament AI documente;
- acest fisier: `docs/codex-handoff.md`.

## Ultimele schimbari importante

Commit `cccdf8a` - `Harden AI document verification`

- a eliminat datele demo din formularul de verificare document;
- verificarea nu mai porneste fara fisier real atasat;
- `Tip asteptat` este blocat si sincronizat cu documentul selectat;
- rezultatul AI se curata cand schimbi documentul, fisierul sau textul;
- backend-ul respinge request-uri fara `fileDataUrl`;
- fallback-ul local nu mai accepta documente doar pe baza numelui fisierului;
- daca documentul pare alt tip decat cel cerut, ramane respins;
- static mode are aceeasi logica stricta.

Teste facute dupa commit:

- `npm.cmd run check` trece;
- live API `/api/health` raspunde OK;
- verificare fara fisier returneaza `422`;
- verificare cu text gresit si nume `diploma_bac.pdf` returneaza `accepted: false`.

Commit `1053318` - a reparat crash-ul de pe pagina Admitere cand selectia initiala era nula.

Commit `e8f456a` - a simplificat navigatia, a imbunatatit admin panel-ul si a importat catalog extins de universitati.

## Reguli de lucru pentru urmatorul Codex

- Nu comite secrete, `.env`, baze SQLite sau fisiere binare generate.
- Foloseste `npm.cmd`, `npx.cmd`, `netlify.cmd` pe Windows.
- Ruleaza `npm.cmd run check` inainte de commit/deploy.
- Dupa schimbari frontend, ruleaza deploy Netlify daca utilizatorul vrea live.
- Dupa schimbari backend, da `git push origin main` si verifica Render.
- Pentru UI, pastreaza stilul dark, dens, modular, fara landing page inutil.
- Pentru documente AI, nu relaxa regula cu fisier real si nu accepta nume de fisier ca dovada.
- Pentru resetare parola, SMTP trebuie configurat real pe Render; fara SMTP nu va ajunge Gmail in productie.
- Pentru admin bootstrap, foloseste temporar `BOOTSTRAP_ADMIN=true` sau `BOOTSTRAP_ADMIN_RESET_PASSWORD=true`, apoi revino la `false`.

## Probleme / imbunatatiri ramase

Prioritate mare:

- verifica in productie ca Render chiar are `GEMINI_API_KEY` si SMTP setate corect;
- testeaza resetarea parolei cu un email real;
- testeaza workspace universitate cu un cont universitate real si documente reale;
- verifica traducerile RO/EN in toate paginile, mai ales Admitere, Admin si Workspace;
- verifica flow complet: signup student -> aplicatie -> documente -> universitate vede documentul -> status aplicatie -> email/notificare.

Prioritate medie:

- adauga teste automate pentru `documentAi.js`;
- adauga extractie OCR client/server pentru PDF-uri text, ca fallback cand Gemini nu este setat;
- imbunatateste mesajele de eroare pentru fisiere PDF scanate fara AI extern;
- extinde admin panel cu actiuni mai clare pentru activare/dezactivare universitati;
- curata textele mixte RO/EN ramase dupa schimbarea limbii.

Prioritate design:

- rafineaza calendarul;
- uniformizeaza culorile pentru strength/status bars;
- verifica responsive mobile pentru formulare lungi si workspace universitate.

## Conturi

Nu pastra parole reale in documentatie. In development pot exista valori demo din `backend/src/config/env.js`, dar productia trebuie folosita cu credentiale reale din Render/Supabase.

Daca trebuie acces admin in productie:

1. seteaza temporar pe Render `BOOTSTRAP_ADMIN=true` si `ADMIN_EMAIL`/`ADMIN_PASSWORD`;
2. lasa deploy-ul sa porneasca si verifica login-ul;
3. schimba `BOOTSTRAP_ADMIN=false`;
4. redeploy.

Daca adminul exista dar parola trebuie schimbata:

1. seteaza `BOOTSTRAP_ADMIN_RESET_PASSWORD=true`;
2. seteaza `ADMIN_EMAIL` si noul `ADMIN_PASSWORD`;
3. redeploy;
4. dupa confirmare, pune `BOOTSTRAP_ADMIN_RESET_PASSWORD=false`.
