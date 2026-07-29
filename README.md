# UniTrack

UniTrack este o platformă web full-stack pentru organizarea și gestionarea admiterii la universitate. Elevii își construiesc dosarul, urmăresc termenele și trimit aplicații, iar instituțiile procesează candidaturile într-un workspace separat. Administratorul controlează catalogul public, programele și conturile instituționale.

Aplicația live este disponibilă la [unitrack.sbs](https://unitrack.sbs).

## Funcționalități

- autentificare cu email, parolă, verificarea adresei și recuperarea contului;
- autentificare fără parolă prin WebAuthn/passkey;
- roluri și interfețe distincte pentru student, universitate și administrator;
- unicitatea contului de student prin hash CNP cu pepper, fără stocarea CNP-ului în clar;
- catalog de universități și programe de studiu;
- dosar de admitere, checklist de documente și urmărirea progresului;
- încărcarea și clasificarea asistată a documentelor cu Gemini;
- trimiterea aplicațiilor și actualizarea statusului de către universitate;
- compararea universităților și calendarul termenelor limită;
- notificări, exporturi și jurnal de audit pentru operațiile sensibile;
- profil, fotografie de profil, schimbarea parolei și ștergerea contului;
- interfață responsive în română și engleză.

## Arhitectură

```text
Browser
  |
  v
Netlify: React + Vite
  |
  | /api/*
  v
Render: Node.js + Express
  |
  v
Supabase: PostgreSQL + RLS + storage privat
```

Frontendul comunică exclusiv cu API-ul. Cheile Gemini, credențialele bazei de date, secretele JWT și cheia Supabase `service_role` există numai pe server. Documentele sunt stocate într-un bucket privat și sunt livrate doar după verificarea sesiunii și a rolului.

## Tehnologii

### Frontend

- React 18;
- Vite 6;
- JavaScript ES modules;
- CSS modular pe straturi;
- Lucide React;
- SimpleWebAuthn Browser.

### Backend

- Node.js și Express;
- Sequelize ORM;
- PostgreSQL în producție și SQLite pentru dezvoltare;
- Zod pentru validarea payloadurilor;
- JWT în cookie `httpOnly`;
- bcrypt pentru parole;
- SimpleWebAuthn Server;
- Gemini pentru analiza documentelor;
- Resend sau SMTP pentru email.

### Securitate

- Helmet și politici HTTP restrictive;
- CORS cu allowlist;
- protecție CSRF double-submit;
- rate limiting pe autentificare și API;
- validare Zod și sanitizarea inputurilor;
- autorizare pe roluri la nivel de endpoint;
- parole hash-uite și CNP ireversibil hash-uit;
- Row Level Security în PostgreSQL;
- audit pentru acțiuni administrative;
- secrete exclusiv în variabile de mediu.

## Structura proiectului

```text
backend/             API, modele, validatoare și servicii
frontend/            aplicația React
supabase/migrations/ schema și migrări PostgreSQL
tests/e2e/           teste Playwright desktop și mobil
tools/               verificarea automată a mediului live
docs/                documentația și discursurile pentru prezentare
netlify.toml         build, headers și proxy pentru frontend
render.yaml          configurația API-ului
```

## Instalare locală

Cerințe: Node.js 20 sau mai nou și npm.

```bash
git clone https://github.com/nmt65/unitracka.git
cd unitracka
npm install
copy backend\.env.example backend\.env
npm run dev
```

Adrese locale:

- frontend: `http://localhost:5173`;
- API: `http://localhost:4000/api`;
- health check: `http://localhost:4000/api/health`;
- verificarea bazei de date: `http://localhost:4000/api/ready`.

Configurația implicită folosește SQLite. Pentru PostgreSQL:

```env
DB_DIALECT=postgres
DATABASE_URL=postgresql://user:password@host:5432/database
```

Fișierele `.env` reale nu se urcă în Git. Exemplele complete sunt în:

- `backend/.env.example`;
- `backend/.env.production.example`;
- `frontend/.env.example`.

## Verificare

```bash
npm run check
npm run test:e2e
npm run verify
```

`npm run verify` verifică sintaxa backendului, build-ul frontendului și fluxurile principale în Playwright pe desktop și mobil.

Pentru un raport JSON al mediului live:

```powershell
npm run verify:live
```

Raportul include starea frontendului, API-ului, bazei de date și rutelor publice, într-un format potrivit pentru demonstrație.

## Deploy

Frontendul este publicat exclusiv prin Netlify. Configurația din `netlify.toml` stabilește:

- baza buildului: `frontend`;
- comanda: `npm run build`;
- directorul publicat: `frontend/dist`;
- proxy-ul `/api/*` către API-ul Render;
- fallback SPA către `index.html`;
- politici de cache pentru HTML și assets.

Deploy manual:

```bash
netlify deploy --build --prod
```

Backendul este publicat pe Render folosind `render.yaml`, iar PostgreSQL și storage-ul privat sunt găzduite în Supabase. Variabilele de producție se configurează în Render, nu în frontend și nu în repository.

## Documentație

- [Documentație pentru prezentare](docs/DOCUMENTATIE-PREZENTARE.md)
- [Prezentare tehnică scurtă și traseu demo](docs/PREZENTARE-TEHNICA-SCURTA.md)


## Licență și date

Repository-ul este public pentru evaluarea proiectului. Datele personale și documentele încărcate rămân protejate de autentificare, autorizare și politicile bazei de date; acestea nu fac parte din codul sursă.
