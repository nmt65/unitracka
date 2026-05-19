# UniTrack - checklist lansare publică

## Înainte de deploy

- Rulează `npm run check` și `npm run smoke`.
- Setează `NODE_ENV=production`.
- Setează `SEED_DEMO=false`, ca datele demo să nu apară public.
- Setează `BOOTSTRAP_ADMIN=true` doar la prima pornire, cu `ADMIN_EMAIL` și `ADMIN_PASSWORD` puternice.
- Generează valori lungi pentru `JWT_SECRET` și `CNP_PEPPER`.
- Folosește PostgreSQL în producție: `DB_DIALECT=postgres` și `DATABASE_URL=...`.
- Aplică `backend/sql/postgres_rls.sql` după crearea tabelelor.
- Configurează `CORS_ORIGIN` cu domeniul frontendului, separat prin virgulă dacă ai și `www`.
- Setează `TRUST_PROXY=true` când backend-ul rulează în spatele unui reverse proxy.
- Configurează SMTP (`SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`) pentru resetare parolă și notificări reale.

## După deploy

- Verifică `/api/health`.
- Verifică `/api/ready`.
- Creează primul admin și dezactivează `BOOTSTRAP_ADMIN`.
- Creează instituțiile reale din Panou Admin.
- Creează conturile universităților doar după aprobarea instituțiilor.
- Intră în Panou Admin și verifică `Mediu`, `Bază date`, SMTP, AI, demo seed și bootstrap admin în statusul sistemului.
- Testează signup student cu CNP nou și blocarea unui CNP duplicat.
- Testează resetarea parolei cu SMTP real.
- Testează verificarea documentelor cu `OPENAI_API_KEY` sau `GEMINI_API_KEY`.
- Verifică în Panou Admin că apar evenimente în `Audit securitate`.

## Pentru GitHub Pages

GitHub Pages publică doar frontend static, fără backend SQL. Folosește:

```bash
npm run build:pages
```

Varianta statică este potrivită pentru prezentare/jurizare. Pentru utilizare publică reală, leagă frontendul la backend-ul Node + PostgreSQL prin `VITE_API_URL`.
