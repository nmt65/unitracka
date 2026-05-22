# UniTrack export package

Acest pachet conține codul sursă, build-ul frontend, documentația, schema SQL, politicile RLS și fișierele de configurare necesare pentru rulare sau deploy.

## Ce nu este inclus

- `node_modules/`, pentru că se regenerează cu `npm run install:all`;
- `.git/`, pentru că arhiva este pentru predare/transfer;
- `.env` reale și chei API, pentru securitate;
- baze SQLite locale din `backend/data/`, deoarece pot conține hash-uri CNP, hash-uri de parole și date de test.

## Baza de date

Pentru producție folosește PostgreSQL/Supabase. Fișierele relevante sunt:

- `backend/sql/postgres_rls.sql`
- `supabase/migrations/`
- `docs/database.md`

Backend-ul creează tabelele prin Sequelize la pornire. Pentru RLS se rulează scriptul SQL după crearea tabelelor.

## Variabile importante în Render

```env
GEMINI_API_KEY=valoarea-ta
GEMINI_DOCUMENT_MODEL=gemini-1.5-flash
GEMINI_ADVISOR_MODEL=gemini-1.5-flash
APP_URL=https://unitrack.sbs
CORS_ORIGIN=https://unitrack.sbs,https://www.unitrack.sbs
SEED_DEMO=false
TRUST_PROXY=true
```

Pentru resetarea parolei prin email mai trebuie SMTP:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=adresa-ta@gmail.com
SMTP_PASS=parola-de-aplicatie-google
SMTP_FROM=UniTrack <adresa-ta@gmail.com>
```

Parola SMTP trebuie să fie App Password Google, nu parola normală de Gmail.
