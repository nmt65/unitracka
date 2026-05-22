# Surse externe și componente declarate

Acest fișier este pregătit pentru dosarul de prezentare InfoEducație. Completează-l dacă mai adaugi imagini, modele de analiză, texte sau servicii externe.

## Cod propriu

- Structura aplicației UniTrack, fluxurile student/universitate/admin, API-ul Express, modelele de date, validările, document workflow-ul, paginile React și stilizarea CSS sunt implementate în acest proiect.
- Designul este implementat manual în CSS/React, fără template/CMS importat.

## Biblioteci și framework-uri

- Frontend: React, Vite, lucide-react.
- Backend: Node.js, Express, Sequelize, Zod, Helmet, CORS, express-rate-limit, jsonwebtoken, bcryptjs, xss.
- Database: SQLite pentru development local; PostgreSQL recomandat în producție.

## Verificare asistată documente

- Verificarea documentelor poate folosi OpenAI sau Gemini doar dacă sunt configurate cheile API în backend.
- Fără chei externe, aplicația folosește clasificatorul local strict din `backend/src/services/documentAi.js`.
- Dacă se folosește un model extern în prezentare/producție, notează aici providerul, modelul și scopul: clasificare documente de admitere, nu decizie finală de admitere.

## Iconițe și asset-uri

- Iconițele UI sunt din `lucide-react`.
- Logo-ul local `frontend/public/unitracka-icon.svg` este asset de proiect.
- Capturile QA din `docs/` sunt generate local din aplicația UniTrack.

## Date demo

- Conturile demo și universitățile demo sunt seed local pentru prezentare/development.
- În producție se setează `SEED_DEMO=false` și se creează date reale prin Panou Admin.
