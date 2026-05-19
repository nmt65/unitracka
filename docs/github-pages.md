# GitHub si GitHub Pages

GitHub Pages poate gazdui doar frontend static. Backend-ul Express, baza SQL, RLS, autentificarea cu cookie si AI-ul server-side trebuie rulate separat pe un serviciu de backend.

Pentru prezentare pe GitHub Pages, proiectul are `VITE_STATIC_MODE=true`. In acest mod:

- toate ecranele principale raman functionale;
- datele se salveaza in `localStorage`;
- login/register/reset/export/documente/aplicatii/admin/workspace functioneaza local in browser;
- nu exista secrete sau conexiune reala la baza de date.

## Deploy automat

Workflow-ul `.github/workflows/pages.yml` construieste `frontend/dist` si il publica in Pages la fiecare push pe `main`.

In GitHub:

1. Deschide repo-ul.
2. Mergi la `Settings -> Pages`.
3. La `Build and deployment`, alege `GitHub Actions`.
4. Fa push pe branch-ul `main`.

## Comenzi locale

```bash
npm run install:all
npm run check
npm run build:pages
```

Pentru app live cu backend real:

```bash
npm run dev
```

Pentru deployment real, configureaza backend-ul cu `backend/.env.production.example`, PostgreSQL si `backend/sql/postgres_rls.sql`.

## Backend separat + GitHub Pages

Daca frontend-ul ramane pe `https://username.github.io/repo`, iar backend-ul este pe Render/Railway/Fly/etc., seteaza in backend:

```env
CORS_ORIGIN=https://username.github.io
APP_URL=https://username.github.io/repo
COOKIE_SAMESITE=none
COOKIE_SECURE=true
TRUST_PROXY=true
```

In frontend, la build live setezi `VITE_API_URL=https://backendul-tau.ro/api`. Pentru modul static GitHub Pages nu este nevoie.
