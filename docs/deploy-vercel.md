# Deploy frontend pe Vercel

UniTrack rulează frontendul pe Vercel și păstrează API-ul Express pe Render.

```text
Vercel frontend -> /api proxy -> Render API -> Supabase PostgreSQL
```

## Setări Vercel

Fișierul `vercel.json` configurează:

- build: `npm run build --prefix frontend`;
- output: `frontend/dist`;
- proxy `/api/*` către `https://unitrack-api-79l5.onrender.com/api/*`;
- fallback SPA către `index.html`;
- headere de securitate pentru frontend.

Comandă CLI:

```bash
npx vercel --prod
```

## Setări Render după mutare

În Render, `CORS_ORIGIN` și `APP_URL` trebuie să includă domeniul folosit pe Vercel:

```env
APP_URL=https://unitrack.sbs
CORS_ORIGIN=https://unitrack.sbs,https://www.unitrack.sbs,https://unitracka.vercel.app
```

Dacă domeniul Vercel generat este diferit, adaugă-l și pe acela în `CORS_ORIGIN`.

## DNS pentru domeniul custom

În Vercel, adaugă domeniul `unitrack.sbs`, apoi urmează valorile DNS afișate de Vercel. De obicei:

```text
A      @      76.76.21.21
CNAME  www    cname.vercel-dns.com
```

Folosește însă valorile exacte afișate în dashboard-ul Vercel pentru proiect.
