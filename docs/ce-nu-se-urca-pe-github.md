# Ce nu se urcă pe GitHub

## Fișiere SQLite

Fișierele `*.sqlite`, `*.db` și backup-urile lor sunt baze de date binare. Dacă le deschizi în VS Code ca text, apar caractere ciudate, `NUL`, pătrate roșii și fragmente de SQL. Nu sunt “criptate”; doar nu sunt fișiere text.

În proiectul local apar aici:

- `backend/data/unitracka.sqlite`
- `backend/data/unitracka.sqlite.backup-*`
- `data/unitracka.sqlite`

Acestea conțin date locale, hash-uri de parole, hash-uri CNP și seed demo. Nu le urca în repo. Backend-ul le regenerează local când pornește.

## Fișiere `.env`

Fișierul real `.env` conține secrete:

- `DATABASE_URL`
- `JWT_SECRET`
- `CNP_PEPPER`
- chei `OPENAI_API_KEY` / `GEMINI_API_KEY`
- SMTP user/parolă

Acestea nu se pun niciodată pe GitHub. În repo se pun doar exemple:

- `backend/.env.example`
- `backend/.env.production.example`

Pe Render/Railway/Fly/Supabase/Neon setezi valorile reale în panoul de Environment Variables, nu în cod.

## Ce se urcă

Urcă folderul proiectului fără:

- `node_modules`
- `frontend/dist`
- `backend/data`
- `data`
- fișiere `.env` reale
- loguri `*.log`, `*.err`

Dacă folosești `git add .`, `.gitignore` se ocupă de acestea.
